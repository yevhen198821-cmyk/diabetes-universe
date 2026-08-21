export class MedicalResourceNotFoundError extends Error {
  readonly code = 'RESOURCE_NOT_FOUND' as const;
}

export class MedicalRevisionConflictError extends Error {
  readonly code = 'REVISION_CONFLICT' as const;
}

export class InvalidMedicalListCursorError extends Error {
  readonly code = 'INVALID_CURSOR' as const;
}

export class InvalidRevisionPreconditionError extends Error {
  readonly code = 'PRECONDITION_REQUIRED' as const;
}

export class InvalidRevisionTokenError extends Error {
  readonly code = 'VALIDATION_FAILED' as const;
}

export class MedicalServiceUnavailableError extends Error {
  readonly code = 'SERVICE_UNAVAILABLE' as const;
}
