import {
  InvalidRevisionPreconditionError,
  InvalidRevisionTokenError,
  MedicalRevisionConflictError,
  MedicalServiceUnavailableError,
} from '@diabetes-universe/medical-domain';
import type { AuthorizationScope } from '@diabetes-universe/medical-service/server';

import {
  MEDICAL_DIABETES_SETTINGS_BASE_PATH,
  MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH,
  MEDICAL_MAX_REQUEST_BYTES,
} from './constants';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import { isTransientInfrastructureError } from './medical-api-infrastructure-errors';
import {
  medicalApiErrorResponse,
  medicalApiJsonResponse,
} from './medical-api-error';
import { beginMedicalApiRequest } from './medical-api-request-entry';
import {
  getMedicalApiRateLimiter,
  setMedicalApiRateLimiterForTests,
  type MedicalApiRateLimitInput,
  type MedicalApiRateLimiter,
} from './medical-api-rate-limit';
import {
  MedicalApiValidationError,
  parseJsonBody,
} from './medical-api-validation';
import {
  toPublicDiabetesSettingsResponse,
  toPublicGlucoseTargetProfileResponse,
  validateDiabetesSettingsPatchBody,
  validateGlucoseTargetProfilePutBody,
} from './medical-diabetes-settings-validation';
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

async function prepareMedicalApiHandler(
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
  const correlationId = scope.correlationId;
  const rateLimitResponse = enforceRateLimit(
    scope.accountId,
    request,
    correlationId,
  );
  if (rateLimitResponse) {
    return { ok: false, response: rateLimitResponse };
  }

  return { ok: true, scope, correlationId };
}

function parseIfMatchHeader(value: string | null): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
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

export async function handleGetDiabetesSettings(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.diabetesSettingsService.getSettings(scope);

    return medicalApiJsonResponse(
      200,
      toPublicDiabetesSettingsResponse(
        result.configured,
        result.settings,
        result.etagToken,
      ),
      {
        ETag: result.etagToken,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handlePatchDiabetesSettings(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const rawBody = await readBoundedRequestBody(
      request,
      MEDICAL_MAX_REQUEST_BYTES,
    );
    const body = parseJsonBody(rawBody);
    const patch = validateDiabetesSettingsPatchBody(body);
    const ifMatch = parseIfMatchHeader(request.headers.get('if-match'));
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.diabetesSettingsService.patchSettings({
      scope,
      ifMatch,
      patch,
    });

    return medicalApiJsonResponse(
      200,
      toPublicDiabetesSettingsResponse(
        result.configured,
        result.settings,
        result.etagToken,
      ),
      {
        ETag: result.etagToken,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleGetGlucoseTargetProfile(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.diabetesSettingsService.getTargetProfile(scope);

    return medicalApiJsonResponse(
      200,
      toPublicGlucoseTargetProfileResponse(
        result.configured,
        result.profile,
        result.etagToken,
      ),
      {
        ETag: result.etagToken,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handlePutGlucoseTargetProfile(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const rawBody = await readBoundedRequestBody(
      request,
      MEDICAL_MAX_REQUEST_BYTES,
    );
    const body = parseJsonBody(rawBody);
    const putBody = validateGlucoseTargetProfilePutBody(body);
    const ifMatch = parseIfMatchHeader(request.headers.get('if-match'));
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.diabetesSettingsService.putTargetProfile({
      scope,
      ifMatch,
      range: putBody.defaultRange,
    });

    return medicalApiJsonResponse(
      200,
      toPublicGlucoseTargetProfileResponse(
        result.configured,
        result.profile,
        result.etagToken,
      ),
      {
        ETag: result.etagToken,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export async function handleDeleteGlucoseTargetProfile(
  request: Request,
): Promise<Response> {
  const prepared = await prepareMedicalApiHandler(request);
  if (!prepared.ok) {
    return prepared.response;
  }

  const { scope, correlationId } = prepared;

  try {
    const ifMatch = parseIfMatchHeader(request.headers.get('if-match'));
    const bundle = await getMedicalServiceBundle();
    const result = await bundle.diabetesSettingsService.clearTargetProfile({
      scope,
      ifMatch,
    });

    return medicalApiJsonResponse(
      200,
      toPublicGlucoseTargetProfileResponse(
        result.configured,
        result.profile,
        result.etagToken,
      ),
      {
        ETag: result.etagToken,
      },
    );
  } catch (error) {
    return mapMedicalApiError(error, correlationId);
  }
}

export {
  MEDICAL_DIABETES_SETTINGS_BASE_PATH,
  MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH,
  setMedicalApiRateLimiterForTests,
};
export type { MedicalApiRateLimiter };
