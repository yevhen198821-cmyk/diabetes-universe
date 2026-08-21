import {
  InvalidMedicalListCursorError,
  InvalidRevisionPreconditionError,
  MedicalResourceNotFoundError,
  MedicalRevisionConflictError,
} from '@diabetes-universe/medical-domain';

import {
  MEDICAL_API_VERSION,
  MEDICAL_CREATE_OPERATION_SCOPE,
  MEDICAL_IDEMPOTENCY_HEADER,
  MEDICAL_MAX_REQUEST_BYTES,
} from './constants';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import {
  createCorrelationId,
  medicalApiErrorResponse,
  medicalApiJsonResponse,
} from './medical-api-error';
import { resolveMedicalApiScope } from './resolve-medical-api-scope';
import {
  MedicalApiValidationError,
  parseJsonBody,
  toPublicMedicalEventResource,
  validateCreateRequestBody,
  validateIdempotencyKey,
  validateListLimit,
  validateResourceId,
  validateUpdateRequestBody,
} from './medical-api-validation';

export async function handleListMedicalEvents(
  request: Request,
): Promise<Response> {
  const resolved = await resolveMedicalApiScope(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  const { scope } = resolved.value;
  const correlationId = scope.correlationId;
  const url = new URL(request.url);

  try {
    const limit = validateListLimit(url.searchParams.get('limit'));
    const cursor = url.searchParams.get('cursor')?.trim() || undefined;
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.eventService.listResources({
      scope,
      apiVersion: MEDICAL_API_VERSION,
      limit,
      cursor,
    });

    return medicalApiJsonResponse(200, {
      items: result.items.map((resource, index) =>
        toPublicMedicalEventResource(resource, result.etagTokens[index]!),
      ),
      page: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleCreateMedicalEvent(
  request: Request,
): Promise<Response> {
  const resolved = await resolveMedicalApiScope(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  const { scope } = resolved.value;
  const correlationId = scope.correlationId;

  try {
    const rawBody = await readRequestBody(request);
    const semanticEvent = validateCreateRequestBody(parseJsonBody(rawBody));
    const idempotencyKey = validateIdempotencyKey(
      request.headers.get(MEDICAL_IDEMPOTENCY_HEADER),
    );

    const bundle = await getMedicalServiceBundle();
    const result = await bundle.eventService.createWithIdempotency({
      scope,
      apiVersion: MEDICAL_API_VERSION,
      operationScope: MEDICAL_CREATE_OPERATION_SCOPE,
      idempotencyKey,
      semanticEvent,
    });

    return medicalApiJsonResponse(
      result.httpStatus,
      toPublicMedicalEventResource(result.resource, result.etagToken),
      {
        ETag: `"${result.etagToken}"`,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleGetMedicalEvent(
  request: Request,
  resourceId: string,
): Promise<Response> {
  const resolved = await resolveMedicalApiScope(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  const { scope } = resolved.value;
  const correlationId = scope.correlationId;

  try {
    validateResourceId(resourceId);
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.eventService.getResource(scope, resourceId);

    return medicalApiJsonResponse(
      200,
      toPublicMedicalEventResource(result.resource, result.etagToken),
      {
        ETag: `"${result.etagToken}"`,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleUpdateMedicalEvent(
  request: Request,
  resourceId: string,
): Promise<Response> {
  const resolved = await resolveMedicalApiScope(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  const { scope } = resolved.value;
  const correlationId = scope.correlationId;

  try {
    validateResourceId(resourceId);
    const ifMatch = parseIfMatchHeader(request.headers.get('if-match'));
    const rawBody = await readRequestBody(request);
    const semanticEvent = validateUpdateRequestBody(parseJsonBody(rawBody));

    const bundle = await getMedicalServiceBundle();
    const result = await bundle.eventService.updateWithRevision({
      scope,
      resourceId,
      ifMatch,
      semanticEvent,
    });

    return medicalApiJsonResponse(
      200,
      toPublicMedicalEventResource(result.resource, result.etagToken),
      {
        ETag: `"${result.etagToken}"`,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleDeleteMedicalEvent(
  request: Request,
  resourceId: string,
): Promise<Response> {
  const resolved = await resolveMedicalApiScope(request);
  if (!resolved.ok) {
    return resolved.response;
  }

  const { scope } = resolved.value;
  const correlationId = scope.correlationId;

  try {
    validateResourceId(resourceId);
    const ifMatch = parseIfMatchHeader(request.headers.get('if-match'));
    const bundle = await getMedicalServiceBundle();
    await bundle.eventService.deleteWithRevision({
      scope,
      resourceId,
      ifMatch,
    });

    return new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

function parseIfMatchHeader(value: string | null): string {
  if (!value?.trim()) {
    throw new InvalidRevisionPreconditionError('If-Match header is required.');
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

async function readRequestBody(request: Request): Promise<string> {
  const rawBody = await request.text();
  if (rawBody.length > MEDICAL_MAX_REQUEST_BYTES) {
    throw new MedicalApiValidationError('Request body is too large.');
  }
  return rawBody;
}

function mapMedicalApiError(error: unknown, correlationId: string): Response {
  if (error instanceof MedicalApiValidationError) {
    const status = error.message === 'Request body is too large.' ? 413 : 422;
    const code = status === 413 ? 'REQUEST_TOO_LARGE' : 'VALIDATION_FAILED';

    return medicalApiErrorResponse(
      status,
      code,
      error.message,
      correlationId,
      Object.keys(error.details).length > 0 ? error.details : null,
    );
  }

  if (error instanceof InvalidMedicalListCursorError) {
    return medicalApiErrorResponse(
      400,
      'INVALID_CURSOR',
      'The pagination cursor is invalid.',
      correlationId,
    );
  }

  if (error instanceof InvalidRevisionPreconditionError) {
    return medicalApiErrorResponse(
      428,
      'PRECONDITION_REQUIRED',
      error.message,
      correlationId,
    );
  }

  if (error instanceof MedicalRevisionConflictError) {
    return medicalApiErrorResponse(
      412,
      'REVISION_CONFLICT',
      'The resource revision is stale.',
      correlationId,
    );
  }

  if (error instanceof MedicalResourceNotFoundError) {
    return medicalApiErrorResponse(
      404,
      'RESOURCE_NOT_FOUND',
      'The requested medical resource was not found.',
      correlationId,
    );
  }

  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'IDEMPOTENCY_CONFLICT'
  ) {
    return medicalApiErrorResponse(
      409,
      'IDEMPOTENCY_CONFLICT',
      'The idempotency key was reused with a different request payload.',
      correlationId,
    );
  }

  return medicalApiErrorResponse(
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred.',
    correlationId,
  );
}

export { createCorrelationId };
