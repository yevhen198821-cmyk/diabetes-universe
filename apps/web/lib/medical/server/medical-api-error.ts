export type MedicalApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INSUFFICIENT'
  | 'SUBJECT_ACCESS_DENIED'
  | 'VALIDATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_CURSOR'
  | 'PRECONDITION_REQUIRED'
  | 'REVISION_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'REQUEST_TOO_LARGE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface MedicalApiErrorBody {
  readonly error: {
    readonly code: MedicalApiErrorCode;
    readonly message: string;
    readonly correlationId: string;
    readonly details: Record<string, unknown> | null;
  };
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function medicalApiErrorResponse(
  status: number,
  code: MedicalApiErrorCode,
  message: string,
  correlationId: string,
  details: Record<string, unknown> | null = null,
  extraHeaders: Record<string, string> = {},
): Response {
  const body: MedicalApiErrorBody = {
    error: {
      code,
      message,
      correlationId,
      details,
    },
  };

  return Response.json(body, {
    status,
    headers: privateNoStoreHeaders(extraHeaders),
  });
}

export function privateNoStoreHeaders(
  extra: Record<string, string> = {},
): HeadersInit {
  return {
    'Cache-Control': 'private, no-store',
    ...extra,
  };
}

export function medicalApiJsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: privateNoStoreHeaders(headers),
  });
}
