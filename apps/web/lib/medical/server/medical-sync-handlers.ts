import type { SyncMutation } from '@diabetes-universe/medical-service/server';
import {
  prepareMedicalApiHandler,
  mapMedicalApiError,
} from './medical-events-handlers';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import {
  medicalApiErrorResponse,
  medicalApiJsonResponse,
} from './medical-api-error';
import { readBoundedRequestBody } from './read-bounded-request-body';
import {
  MedicalApiValidationError,
  parseJsonBody,
  validateCreateRequestBody,
  validateIdempotencyKey,
  validateResourceId,
  validateListLimit,
  toPublicMedicalEventResource,
} from './medical-api-validation';

function validateMutation(input: unknown): SyncMutation {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new MedicalApiValidationError('Invalid sync mutation.');
  const item = input as Record<string, unknown>;
  const mutationId = validateIdempotencyKey(
    typeof item.mutationId === 'string' ? item.mutationId : null,
  );
  const allowed =
    item.operation === 'create'
      ? ['mutationId', 'operation', 'event']
      : [
          'mutationId',
          'operation',
          'resourceId',
          'baseRevision',
          ...(item.operation === 'update' ? ['event'] : []),
        ];
  if (Object.keys(item).some((key) => !allowed.includes(key)))
    throw new MedicalApiValidationError('Unknown sync field.');
  if (item.operation === 'create')
    return {
      mutationId,
      operation: 'create',
      event: validateCreateRequestBody({ event: item.event }),
    };
  if (item.operation !== 'update' && item.operation !== 'delete')
    throw new MedicalApiValidationError('Invalid sync operation.');
  if (typeof item.resourceId !== 'string')
    throw new MedicalApiValidationError('Resource ID is required.');
  validateResourceId(item.resourceId);
  if (
    typeof item.baseRevision !== 'string' ||
    item.baseRevision.length > 1024 ||
    !item.baseRevision
  )
    throw new MedicalApiValidationError('Base revision is required.');
  const base = {
    mutationId,
    resourceId: item.resourceId,
    baseRevision: item.baseRevision,
  };
  return item.operation === 'update'
    ? {
        ...base,
        operation: 'update',
        event: validateCreateRequestBody({ event: item.event }),
      }
    : { ...base, operation: 'delete' };
}

export async function handleSync(request: Request, operation: 'push' | 'pull') {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) return prepared.response;
  const { scope, correlationId } = prepared;
  if (process.env.MEDICAL_SYNC_ENABLED !== 'true')
    return medicalApiErrorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Synchronization is not enabled.',
      correlationId,
    );
  try {
    const bundle = await getMedicalServiceBundle();
    if (operation === 'pull') {
      const url = new URL(request.url);
      const result = await bundle.syncService.pull(
        scope,
        url.searchParams.get('cursor') ?? undefined,
        validateListLimit(url.searchParams.get('limit')),
      );
      return medicalApiJsonResponse(200, {
        ...result,
        changes: result.changes.map((change) => ({
          ...toPublicMedicalEventResource(change.resource, change.revision),
          lifecycleState: change.resource.lifecycleState,
        })),
      });
    }
    const body = parseJsonBody(await readBoundedRequestBody(request)) as Record<
      string,
      unknown
    >;
    if (
      !body ||
      Object.keys(body).some(
        (key) => !['protocolVersion', 'mutations'].includes(key),
      ) ||
      body.protocolVersion !== 1 ||
      !Array.isArray(body.mutations) ||
      body.mutations.length < 1 ||
      body.mutations.length > 25
    )
      throw new MedicalApiValidationError('Invalid sync batch.');
    const mutations = body.mutations.map(validateMutation);
    const results = [];
    for (const mutation of mutations) {
      try {
        results.push({
          mutationId: mutation.mutationId,
          status: 'acknowledged',
          ...(await bundle.syncService.push(scope, mutation)),
        });
      } catch (error) {
        const response = mapMedicalApiError(error, correlationId);
        const envelope = await response.json();
        results.push({
          mutationId: mutation.mutationId,
          status:
            response.status === 409 || response.status === 412
              ? 'conflict'
              : response.status >= 500 || response.status === 429
                ? 'retryable'
                : 'blocked',
          code: envelope.error.code,
        });
      }
    }
    return medicalApiJsonResponse(200, { results });
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}
