import {
  serverOwnedSemanticFieldNames,
  type MedicalEventResource,
} from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

const ALLOWED_EVENT_KINDS = new Set([
  'glucose',
  'insulin',
  'nutrition',
  'medication',
  'activity',
  'note',
]);

export class MedicalApiValidationError extends Error {
  readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.details = details;
  }
}

export function parseJsonBody(rawBody: string): unknown {
  if (!rawBody.trim()) {
    throw new MedicalApiValidationError('Request body is required.');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new MedicalApiValidationError('Request body must be valid JSON.');
  }
}

export function validateCreateRequestBody(
  body: unknown,
): SemanticTimelineEvent {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;
  rejectUnknownTopLevelFields(record, ['event']);

  if (!('event' in record)) {
    throw new MedicalApiValidationError('event is required.');
  }

  return validateSemanticEvent(record.event, 'event');
}

export function validateUpdateRequestBody(
  body: unknown,
): SemanticTimelineEvent {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;
  rejectUnknownTopLevelFields(record, ['event']);

  if (!('event' in record)) {
    throw new MedicalApiValidationError('event is required.');
  }

  return validateSemanticEvent(record.event, 'event');
}

export function validateSemanticEvent(
  value: unknown,
  fieldPath: string,
): SemanticTimelineEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MedicalApiValidationError(`${fieldPath} must be an object.`);
  }

  const event = value as Record<string, unknown>;

  for (const forbidden of serverOwnedSemanticFieldNames) {
    if (forbidden in event) {
      throw new MedicalApiValidationError(
        `${fieldPath}.${forbidden} is server-owned and must not be supplied.`,
      );
    }
  }

  rejectUnknownTopLevelFields(event, [
    'occurredAt',
    'schemaVersion',
    'source',
    'provenance',
    'kind',
    'concentrationMmolPerL',
    'context',
    'preparation',
    'doseUnits',
    'mode',
    'mealType',
    'carbohydratesGrams',
    'products',
    'note',
    'medicationId',
    'medicationName',
    'dose',
    'doseUnit',
    'activityType',
    'durationSeconds',
    'title',
    'body',
  ]);

  if (
    typeof event.occurredAt !== 'string' ||
    Number.isNaN(Date.parse(event.occurredAt))
  ) {
    throw new MedicalApiValidationError(
      `${fieldPath}.occurredAt must be a valid ISO-8601 timestamp.`,
    );
  }

  if (event.schemaVersion !== 1) {
    throw new MedicalApiValidationError(
      `${fieldPath}.schemaVersion must be 1.`,
    );
  }

  if (
    event.source !== 'manual' &&
    event.source !== 'device' &&
    event.source !== 'import'
  ) {
    throw new MedicalApiValidationError(`${fieldPath}.source is invalid.`);
  }

  if (typeof event.kind !== 'string' || !ALLOWED_EVENT_KINDS.has(event.kind)) {
    throw new MedicalApiValidationError(`${fieldPath}.kind is unsupported.`);
  }

  validateKindSpecificFields(event, fieldPath);

  return event as unknown as SemanticTimelineEvent;
}

function validateKindSpecificFields(
  event: Record<string, unknown>,
  fieldPath: string,
): void {
  switch (event.kind) {
    case 'glucose':
      requireNumber(
        event,
        'concentrationMmolPerL',
        `${fieldPath}.concentrationMmolPerL`,
      );
      return;
    case 'insulin':
      requireString(event, 'preparation', `${fieldPath}.preparation`);
      requireNumber(event, 'doseUnits', `${fieldPath}.doseUnits`);
      return;
    case 'nutrition':
      requireString(event, 'mode', `${fieldPath}.mode`);
      requireString(event, 'mealType', `${fieldPath}.mealType`);
      requireNumber(
        event,
        'carbohydratesGrams',
        `${fieldPath}.carbohydratesGrams`,
      );
      return;
    case 'medication':
      requireString(event, 'medicationName', `${fieldPath}.medicationName`);
      requireNumber(event, 'dose', `${fieldPath}.dose`);
      requireString(event, 'doseUnit', `${fieldPath}.doseUnit`);
      return;
    case 'activity':
      requireString(event, 'activityType', `${fieldPath}.activityType`);
      requireNumber(event, 'durationSeconds', `${fieldPath}.durationSeconds`);
      return;
    case 'note':
      requireString(event, 'body', `${fieldPath}.body`);
      return;
    default:
      throw new MedicalApiValidationError(`${fieldPath}.kind is unsupported.`);
  }
}

export function validateListLimit(rawLimit: string | null): number | undefined {
  if (rawLimit === null || rawLimit.trim() === '') {
    return undefined;
  }

  const parsed = Number(rawLimit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new MedicalApiValidationError('limit must be a positive integer.');
  }

  return parsed;
}

export function validateIdempotencyKey(rawKey: string | null): string {
  if (!rawKey?.trim()) {
    throw new MedicalApiValidationError('Idempotency-Key header is required.');
  }

  const trimmed = rawKey.trim();
  if (trimmed.length > 128 || !/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    throw new MedicalApiValidationError('Idempotency-Key header is invalid.');
  }

  return trimmed;
}

export function validateResourceId(resourceId: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      resourceId,
    )
  ) {
    throw new MedicalApiValidationError('resourceId is invalid.');
  }
}

function rejectUnknownTopLevelFields(
  record: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) {
      throw new MedicalApiValidationError(`Unknown field: ${key}.`);
    }
  }
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
): void {
  if (typeof record[key] !== 'string' || record[key] === '') {
    throw new MedicalApiValidationError(
      `${fieldPath} must be a non-empty string.`,
    );
  }
}

function requireNumber(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
): void {
  if (
    typeof record[key] !== 'number' ||
    !Number.isFinite(record[key] as number)
  ) {
    throw new MedicalApiValidationError(
      `${fieldPath} must be a finite number.`,
    );
  }
}

export function toPublicMedicalEventResource(
  resource: MedicalEventResource,
  revisionToken: string,
) {
  return {
    resourceId: resource.resourceId,
    revision: revisionToken,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    deletedAt: resource.deletedAt,
    event: resource.semanticEvent,
  };
}
