import type { MedicalRevision } from './medical-revision';

export interface IdempotencyScope {
  readonly accountId: string;
  readonly subjectId: string;
  readonly apiVersion: string;
  readonly operationScope: string;
  readonly idempotencyKey: string;
}

export interface IdempotencyOutcomeReference {
  readonly resultResourceId: string;
  readonly resultRevision: MedicalRevision;
  readonly resultEtagToken: string;
  readonly storedHttpStatus: number;
}

export interface IdempotencyConflictError extends Error {
  readonly code: 'IDEMPOTENCY_CONFLICT';
}

export function createIdempotencyConflictError(): IdempotencyConflictError {
  const error = new Error(
    'Idempotency key reused with different request payload',
  ) as IdempotencyConflictError & { code: 'IDEMPOTENCY_CONFLICT' };
  error.code = 'IDEMPOTENCY_CONFLICT';
  return error;
}
