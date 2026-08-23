import {
  AdoptionBatchTooLargeError,
  AdoptionItemInvalidError,
  AdoptionNotEnabledError,
  AdoptionSessionClosedError,
  AdoptionSessionIncompleteError,
  AdoptionSessionNotFoundError,
  AdoptionSourceConflictError,
  InvalidMedicalListCursorError,
  InvalidRevisionPreconditionError,
  InvalidRevisionTokenError,
  MedicalResourceNotFoundError,
  MedicalRevisionConflictError,
  MedicalServiceUnavailableError,
  type MedicalAdoptionSession,
} from '@diabetes-universe/medical-domain';
import type { AuthorizationScope } from '@diabetes-universe/medical-service/server';

import { MEDICAL_API_VERSION } from './constants';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import { isTransientInfrastructureError } from './medical-api-infrastructure-errors';
import {
  medicalApiErrorResponse,
  medicalApiJsonResponse,
  type MedicalApiErrorCode,
} from './medical-api-error';
import { beginMedicalApiRequest } from './medical-api-request-entry';
import {
  getMedicalApiRateLimiter,
  type MedicalApiRateLimitInput,
} from './medical-api-rate-limit';
import { MedicalApiValidationError } from './medical-api-validation';
import {
  parseJsonBody as parseAdoptionJsonBody,
  validateAdoptionBatchBody,
  validateAdoptionSessionCreateBody,
  validateAdoptionSessionId,
} from './medical-adoption-validation';
import { resolveMedicalApiScope } from './resolve-medical-api-scope';
import { readBoundedRequestBody } from './read-bounded-request-body';

function operationFromMethod(method: string): 'read' | 'mutation' {
  return method === 'GET' || method === 'HEAD' ? 'read' : 'mutation';
}

function enforceRateLimit(
  scopeAccountId: string,
  request: Request,
  correlationId: string,
): Response | null {
  const limiter = getMedicalApiRateLimiter();
  const decision = limiter.check({
    accountId: scopeAccountId,
    operation: operationFromMethod(request.method),
    path: new URL(request.url).pathname,
  } satisfies MedicalApiRateLimitInput);

  if (decision.outcome === 'allowed') {
    return null;
  }

  if (decision.outcome === 'backend_unavailable') {
    return medicalApiErrorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'The medical API is temporarily unavailable.',
      correlationId,
    );
  }

  const retryAfterSeconds = decision.retryAfterSeconds ?? 60;
  return medicalApiErrorResponse(
    429,
    'RATE_LIMITED',
    'Too many requests. Retry later.',
    correlationId,
    null,
    {
      'Retry-After': String(retryAfterSeconds),
    },
  );
}

async function prepareMedicalAdoptionHandler(
  request: Request,
): Promise<
  | { ok: false; response: Response }
  | { ok: true; scope: AuthorizationScope; correlationId: string }
> {
  const begun = beginMedicalApiRequest(request);
  if (!begun.ok) {
    return begun;
  }

  const resolved = await resolveMedicalApiScope(request, begun.value);
  if (!resolved.ok) {
    return resolved;
  }

  const { scope } = resolved.value;

  const rateLimited = enforceRateLimit(
    scope.accountId,
    request,
    begun.value.correlationId,
  );
  if (rateLimited) {
    return { ok: false, response: rateLimited };
  }

  return {
    ok: true,
    scope,
    correlationId: begun.value.correlationId,
  };
}

function toPublicAdoptionSession(session: MedicalAdoptionSession) {
  return {
    adoptionSessionId: session.adoptionSessionId,
    clientAdoptionRunId: session.clientAdoptionRunId,
    sourcePlatform: session.sourcePlatform,
    sourceAppVersion: session.sourceAppVersion,
    sourceSchemaMin: session.sourceSchemaMin,
    sourceSchemaMax: session.sourceSchemaMax,
    lifecycleState: session.lifecycleState,
    eligibleCount: session.eligibleCount,
    adoptedCount: session.adoptedCount,
    skippedCount: session.skippedCount,
    failedCount: session.failedCount,
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    updatedAt: session.updatedAt.toISOString(),
  };
}

function mapAdoptionApiError(error: unknown, correlationId: string): Response {
  if (error instanceof MedicalApiValidationError) {
    const status = error.message === 'Request body is too large.' ? 413 : 422;
    const code: MedicalApiErrorCode =
      status === 413 ? 'REQUEST_TOO_LARGE' : 'VALIDATION_FAILED';

    return medicalApiErrorResponse(
      status,
      code,
      error.message,
      correlationId,
      Object.keys(error.details).length > 0 ? error.details : null,
    );
  }

  if (error instanceof AdoptionNotEnabledError) {
    return medicalApiErrorResponse(
      403,
      'VALIDATION_FAILED',
      'Medical data adoption is not enabled.',
      correlationId,
      { code: 'ADOPTION_NOT_ENABLED' },
    );
  }

  if (error instanceof AdoptionSessionNotFoundError) {
    return medicalApiErrorResponse(
      404,
      'RESOURCE_NOT_FOUND',
      'The requested adoption session was not found.',
      correlationId,
      { code: 'ADOPTION_SESSION_NOT_FOUND' },
    );
  }

  if (error instanceof AdoptionSessionClosedError) {
    return medicalApiErrorResponse(
      409,
      'VALIDATION_FAILED',
      error.message,
      correlationId,
      { code: 'ADOPTION_SESSION_CLOSED' },
    );
  }

  if (error instanceof AdoptionSessionIncompleteError) {
    return medicalApiErrorResponse(
      409,
      'VALIDATION_FAILED',
      'Adoption session has unresolved failed items.',
      correlationId,
      { code: 'ADOPTION_SESSION_INCOMPLETE' },
    );
  }

  if (error instanceof AdoptionBatchTooLargeError) {
    return medicalApiErrorResponse(
      413,
      'REQUEST_TOO_LARGE',
      'Adoption batch exceeds the maximum item count.',
      correlationId,
      { code: 'ADOPTION_BATCH_TOO_LARGE' },
    );
  }

  if (error instanceof AdoptionItemInvalidError) {
    return medicalApiErrorResponse(
      422,
      'VALIDATION_FAILED',
      error.message,
      correlationId,
      { code: 'ADOPTION_ITEM_INVALID' },
    );
  }

  if (error instanceof AdoptionSourceConflictError) {
    return medicalApiErrorResponse(
      409,
      'VALIDATION_FAILED',
      'Adoption source identity conflict.',
      correlationId,
      { code: 'ADOPTION_SOURCE_CONFLICT' },
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
      'If-Match header is required.',
      correlationId,
    );
  }

  if (error instanceof InvalidRevisionTokenError) {
    return medicalApiErrorResponse(
      400,
      'VALIDATION_FAILED',
      'If-Match revision token is invalid.',
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
    error instanceof MedicalServiceUnavailableError ||
    isTransientInfrastructureError(error)
  ) {
    return medicalApiErrorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'The medical API is temporarily unavailable.',
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

export async function handleCreateAdoptionSession(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalAdoptionHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const rawBody = await readBoundedRequestBody(request);
    const payload = validateAdoptionSessionCreateBody(
      parseAdoptionJsonBody(rawBody),
    );

    const bundle = await getMedicalServiceBundle();
    const session = await bundle.adoptionService.createOrResumeSession({
      scope,
      apiVersion: MEDICAL_API_VERSION,
      clientAdoptionRunId: payload.clientAdoptionRunId,
      sourcePlatform: payload.sourcePlatform,
      sourceAppVersion: payload.sourceAppVersion,
      sourceSchemaMin: payload.sourceSchemaMin,
      sourceSchemaMax: payload.sourceSchemaMax,
      ...(payload.eligibleCount !== undefined
        ? { eligibleCount: payload.eligibleCount }
        : {}),
    });

    return medicalApiJsonResponse(200, {
      session: toPublicAdoptionSession(session),
    });
  } catch (error) {
    return mapAdoptionApiError(error, correlationId);
  }
}

export async function handleGetAdoptionSession(
  request: Request,
  adoptionSessionId: string,
): Promise<Response> {
  const prepared = await prepareMedicalAdoptionHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const sessionId = validateAdoptionSessionId(adoptionSessionId);
    const bundle = await getMedicalServiceBundle();
    const session = await bundle.adoptionService.getSession(scope, sessionId);

    return medicalApiJsonResponse(200, {
      session: toPublicAdoptionSession(session),
    });
  } catch (error) {
    return mapAdoptionApiError(error, correlationId);
  }
}

export async function handleAdoptBatch(
  request: Request,
  adoptionSessionId: string,
): Promise<Response> {
  const prepared = await prepareMedicalAdoptionHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const sessionId = validateAdoptionSessionId(adoptionSessionId);
    const rawBody = await readBoundedRequestBody(request);
    const items = validateAdoptionBatchBody(parseAdoptionJsonBody(rawBody));

    const bundle = await getMedicalServiceBundle();
    const result = await bundle.adoptionService.adoptBatch({
      scope,
      apiVersion: MEDICAL_API_VERSION,
      adoptionSessionId: sessionId,
      items,
    });

    return medicalApiJsonResponse(200, result);
  } catch (error) {
    return mapAdoptionApiError(error, correlationId);
  }
}

export async function handleCompleteAdoptionSession(
  request: Request,
  adoptionSessionId: string,
): Promise<Response> {
  const prepared = await prepareMedicalAdoptionHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const sessionId = validateAdoptionSessionId(adoptionSessionId);
    const bundle = await getMedicalServiceBundle();
    const session = await bundle.adoptionService.completeSession(
      scope,
      sessionId,
    );

    return medicalApiJsonResponse(200, {
      session: toPublicAdoptionSession(session),
    });
  } catch (error) {
    return mapAdoptionApiError(error, correlationId);
  }
}

export async function handleCancelAdoptionSession(
  request: Request,
  adoptionSessionId: string,
): Promise<Response> {
  const prepared = await prepareMedicalAdoptionHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const sessionId = validateAdoptionSessionId(adoptionSessionId);
    const bundle = await getMedicalServiceBundle();
    const session = await bundle.adoptionService.cancelSession(
      scope,
      sessionId,
    );

    return medicalApiJsonResponse(200, {
      session: toPublicAdoptionSession(session),
    });
  } catch (error) {
    return mapAdoptionApiError(error, correlationId);
  }
}

export { setMedicalApiRateLimiterForTests } from './medical-api-rate-limit';
