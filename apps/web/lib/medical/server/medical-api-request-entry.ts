import {
  createCorrelationId,
  medicalApiErrorResponse,
} from './medical-api-error';
import { ensureMedicalApiRuntimeReady } from './ensure-medical-api-runtime';
import { resolveMedicalApiRuntimeCapability } from './medical-api-runtime-readiness';
import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds';
import { peekMedicalApiPrincipal } from './peek-medical-api-principal';

const CLIENT_REQUEST_ID_HEADER = 'x-request-id';

export interface MedicalApiRequestContext {
  readonly correlationId: string;
  readonly clientRequestId?: string;
}

export type BeginMedicalApiRequestResult =
  | { ok: true; value: MedicalApiRequestContext }
  | { ok: false; response: Response };

function parseOptionalClientRequestId(request: Request): string | undefined {
  const raw = request.headers.get(CLIENT_REQUEST_ID_HEADER);
  if (raw === null) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (
    trimmed.length > MEDICAL_VALIDATION_BOUNDS.MAX_CLIENT_REQUEST_ID_LENGTH ||
    !MEDICAL_VALIDATION_BOUNDS.MAX_CLIENT_REQUEST_ID_PATTERN.test(trimmed)
  ) {
    return undefined;
  }

  return trimmed;
}

export function beginMedicalApiRequest(
  request: Request,
): BeginMedicalApiRequestResult {
  ensureMedicalApiRuntimeReady();
  const correlationId = createCorrelationId();
  const clientRequestId = parseOptionalClientRequestId(request);

  if (
    resolveMedicalApiRuntimeCapability() === 'UNAVAILABLE_MISSING_RATE_LIMITER'
  ) {
    return {
      ok: false,
      response: medicalApiErrorResponse(
        503,
        'SERVICE_UNAVAILABLE',
        'The medical API is temporarily unavailable.',
        correlationId,
      ),
    };
  }

  return {
    ok: true,
    value: {
      correlationId,
      ...(clientRequestId ? { clientRequestId } : {}),
    },
  };
}

/**
 * Classifies an unavailable production gate for callers that have no session.
 *
 * Authenticated traffic still receives 503 when the medical runtime is not
 * production-ready. Unauthenticated first-run traffic receives 401 so local
 * Timeline/Quick Add can use the approved unconfigured/session-unit path
 * instead of a generic settings-load failure.
 */
export async function beginClassifiedMedicalApiRequest(
  request: Request,
): Promise<BeginMedicalApiRequestResult> {
  const begun = beginMedicalApiRequest(request);
  if (begun.ok) {
    return begun;
  }

  const principal = await peekMedicalApiPrincipal(request);
  if (principal) {
    return begun;
  }

  return {
    ok: false,
    response: medicalApiErrorResponse(
      401,
      'AUTH_REQUIRED',
      'Authentication is required.',
      createCorrelationId(),
    ),
  };
}

export { CLIENT_REQUEST_ID_HEADER };
