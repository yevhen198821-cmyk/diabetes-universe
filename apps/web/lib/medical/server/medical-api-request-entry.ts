import {
  createCorrelationId,
  medicalApiErrorResponse,
} from './medical-api-error';
import { ensureMedicalE2eRuntimeReady } from './ensure-medical-e2e-runtime';
import { resolveMedicalApiRuntimeCapability } from './medical-api-runtime-readiness';
import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds';

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
  ensureMedicalE2eRuntimeReady();
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

export { CLIENT_REQUEST_ID_HEADER };
