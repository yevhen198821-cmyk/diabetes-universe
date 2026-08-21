export type MedicalApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_CURSOR'
  | 'PRECONDITION_REQUIRED'
  | 'REVISION_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'REQUEST_TOO_LARGE'
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
    headers: privateNoStoreHeaders(),
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
