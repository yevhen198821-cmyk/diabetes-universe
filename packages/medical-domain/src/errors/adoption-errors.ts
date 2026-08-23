export class AdoptionSourceConflictError extends Error {
  readonly code = 'ADOPTION_SOURCE_CONFLICT' as const;
}

export class AdoptionSessionNotFoundError extends Error {
  readonly code = 'ADOPTION_SESSION_NOT_FOUND' as const;
}

export class AdoptionSessionClosedError extends Error {
  readonly code = 'ADOPTION_SESSION_CLOSED' as const;
}

export class AdoptionNotEnabledError extends Error {
  readonly code = 'ADOPTION_NOT_ENABLED' as const;
}

export class AdoptionSchemaUnsupportedError extends Error {
  readonly code = 'ADOPTION_SCHEMA_UNSUPPORTED' as const;
}

export class AdoptionItemInvalidError extends Error {
  readonly code = 'ADOPTION_ITEM_INVALID' as const;

  constructor(message: string) {
    super(message);
    this.name = 'AdoptionItemInvalidError';
  }
}

export class AdoptionSessionIncompleteError extends Error {
  readonly code = 'ADOPTION_SESSION_INCOMPLETE' as const;

  constructor(message: string) {
    super(message);
    this.name = 'AdoptionSessionIncompleteError';
  }
}

export class AdoptionBatchTooLargeError extends Error {
  readonly code = 'ADOPTION_BATCH_TOO_LARGE' as const;
}
