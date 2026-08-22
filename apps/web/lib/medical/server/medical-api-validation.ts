import {
  serverOwnedSemanticFieldNames,
  type MedicalEventResource,
} from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds';

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

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new MedicalApiValidationError('Request body must be valid JSON.');
  }

  assertObjectDepthWithinLimit(
    parsed,
    MEDICAL_VALIDATION_BOUNDS.MAX_OBJECT_DEPTH,
  );
  return parsed;
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
    !isValidIso8601Timestamp(event.occurredAt)
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

  if (event.provenance !== undefined) {
    validateProvenance(event.provenance, `${fieldPath}.provenance`);
  }

  validateKindSpecificFields(event, fieldPath);

  return event as unknown as SemanticTimelineEvent;
}

function validateProvenance(value: unknown, fieldPath: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MedicalApiValidationError(`${fieldPath} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  rejectUnknownTopLevelFields(record, ['label', 'externalRef']);

  if (record.label !== undefined) {
    requireBoundedString(record, 'label', `${fieldPath}.label`);
  }

  if (record.externalRef !== undefined) {
    requireBoundedString(record, 'externalRef', `${fieldPath}.externalRef`);
  }
}

function validateKindSpecificFields(
  event: Record<string, unknown>,
  fieldPath: string,
): void {
  switch (event.kind) {
    case 'glucose':
      requireNumberInRange(
        event,
        'concentrationMmolPerL',
        `${fieldPath}.concentrationMmolPerL`,
        MEDICAL_VALIDATION_BOUNDS.GLUCOSE_MMOL_MIN,
        MEDICAL_VALIDATION_BOUNDS.GLUCOSE_MMOL_MAX,
        { positive: true },
      );
      if (event.context !== undefined) {
        requireBoundedString(event, 'context', `${fieldPath}.context`);
      }
      return;
    case 'insulin':
      requireBoundedString(event, 'preparation', `${fieldPath}.preparation`);
      requireNumberInRange(
        event,
        'doseUnits',
        `${fieldPath}.doseUnits`,
        MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MIN,
        MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MAX,
      );
      if (event.context !== undefined) {
        requireBoundedString(event, 'context', `${fieldPath}.context`);
      }
      return;
    case 'nutrition':
      requireBoundedString(event, 'mode', `${fieldPath}.mode`);
      requireBoundedString(event, 'mealType', `${fieldPath}.mealType`);
      requireNumberInRange(
        event,
        'carbohydratesGrams',
        `${fieldPath}.carbohydratesGrams`,
        MEDICAL_VALIDATION_BOUNDS.CARBS_GRAMS_MIN,
        MEDICAL_VALIDATION_BOUNDS.CARBS_GRAMS_MAX,
      );
      if (event.note !== undefined) {
        requireBoundedString(event, 'note', `${fieldPath}.note`);
      }
      if (event.products !== undefined) {
        validateProductsArray(event.products, `${fieldPath}.products`);
      }
      return;
    case 'medication':
      if (event.medicationId !== undefined) {
        requireBoundedString(
          event,
          'medicationId',
          `${fieldPath}.medicationId`,
        );
      }
      requireBoundedString(
        event,
        'medicationName',
        `${fieldPath}.medicationName`,
      );
      requireNumberInRange(
        event,
        'dose',
        `${fieldPath}.dose`,
        MEDICAL_VALIDATION_BOUNDS.MEDICATION_DOSE_MIN,
        MEDICAL_VALIDATION_BOUNDS.MEDICATION_DOSE_MAX,
      );
      requireBoundedString(event, 'doseUnit', `${fieldPath}.doseUnit`);
      if (event.context !== undefined) {
        requireBoundedString(event, 'context', `${fieldPath}.context`);
      }
      if (event.note !== undefined) {
        requireBoundedString(event, 'note', `${fieldPath}.note`);
      }
      return;
    case 'activity':
      requireBoundedString(event, 'activityType', `${fieldPath}.activityType`);
      requireNumberInRange(
        event,
        'durationSeconds',
        `${fieldPath}.durationSeconds`,
        MEDICAL_VALIDATION_BOUNDS.ACTIVITY_DURATION_MIN,
        MEDICAL_VALIDATION_BOUNDS.ACTIVITY_DURATION_MAX,
        { positive: true },
      );
      if (event.note !== undefined) {
        requireBoundedString(event, 'note', `${fieldPath}.note`);
      }
      return;
    case 'note':
      if (event.title !== undefined) {
        requireBoundedString(event, 'title', `${fieldPath}.title`);
      }
      requireBoundedString(event, 'body', `${fieldPath}.body`);
      return;
    default:
      throw new MedicalApiValidationError(`${fieldPath}.kind is unsupported.`);
  }
}

function validateProductsArray(value: unknown, fieldPath: string): void {
  if (!Array.isArray(value)) {
    throw new MedicalApiValidationError(`${fieldPath} must be an array.`);
  }

  if (value.length > MEDICAL_VALIDATION_BOUNDS.MAX_PRODUCTS_ARRAY) {
    throw new MedicalApiValidationError(`${fieldPath} exceeds maximum length.`);
  }

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new MedicalApiValidationError(
        `${fieldPath}[${index}] must be an object.`,
      );
    }

    const record = item as Record<string, unknown>;
    rejectUnknownTopLevelFields(record, [
      'productId',
      'productName',
      'weightGrams',
      'carbsPer100Grams',
      'calculatedCarbsGrams',
    ]);

    requireBoundedString(
      record,
      'productId',
      `${fieldPath}[${index}].productId`,
    );
    requireBoundedString(
      record,
      'productName',
      `${fieldPath}[${index}].productName`,
    );
    requireNumberInRange(
      record,
      'weightGrams',
      `${fieldPath}[${index}].weightGrams`,
      0,
      MEDICAL_VALIDATION_BOUNDS.CARBS_GRAMS_MAX,
    );
    requireNumberInRange(
      record,
      'carbsPer100Grams',
      `${fieldPath}[${index}].carbsPer100Grams`,
      0,
      MEDICAL_VALIDATION_BOUNDS.CARBS_GRAMS_MAX,
    );
    requireNumberInRange(
      record,
      'calculatedCarbsGrams',
      `${fieldPath}[${index}].calculatedCarbsGrams`,
      0,
      MEDICAL_VALIDATION_BOUNDS.CARBS_GRAMS_MAX,
    );
  }
}

export function validateListLimit(rawLimit: string | null): number | undefined {
  if (rawLimit === null || rawLimit.trim() === '') {
    return undefined;
  }

  const parsed = Number(rawLimit);
  if (
    !Number.isInteger(parsed) ||
    parsed <= 0 ||
    parsed > MEDICAL_VALIDATION_BOUNDS.MAX_LIST_LIMIT
  ) {
    throw new MedicalApiValidationError(
      `limit must be a positive integer up to ${MEDICAL_VALIDATION_BOUNDS.MAX_LIST_LIMIT}.`,
    );
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

function requireBoundedString(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
): void {
  if (typeof record[key] !== 'string' || record[key] === '') {
    throw new MedicalApiValidationError(
      `${fieldPath} must be a non-empty string.`,
    );
  }

  if (
    (record[key] as string).length > MEDICAL_VALIDATION_BOUNDS.MAX_STRING_LENGTH
  ) {
    throw new MedicalApiValidationError(`${fieldPath} exceeds maximum length.`);
  }
}

function requireNumberInRange(
  record: Record<string, unknown>,
  key: string,
  fieldPath: string,
  min: number,
  max: number,
  options: { positive?: boolean } = {},
): void {
  if (
    typeof record[key] !== 'number' ||
    !Number.isFinite(record[key] as number)
  ) {
    throw new MedicalApiValidationError(
      `${fieldPath} must be a finite number.`,
    );
  }

  const value = record[key] as number;
  if (options.positive && value <= 0) {
    throw new MedicalApiValidationError(`${fieldPath} must be positive.`);
  }

  if (value < min || value > max) {
    throw new MedicalApiValidationError(
      `${fieldPath} is out of allowed range.`,
    );
  }
}

function isValidIso8601Timestamp(value: string): boolean {
  if (value.length > MEDICAL_VALIDATION_BOUNDS.MAX_STRING_LENGTH) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function assertObjectDepthWithinLimit(value: unknown, maxDepth: number): void {
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.value === null || typeof current.value !== 'object') {
      continue;
    }

    if (current.depth > maxDepth) {
      throw new MedicalApiValidationError(
        'Request body exceeds maximum depth.',
      );
    }

    if (Array.isArray(current.value)) {
      if (current.value.length > MEDICAL_VALIDATION_BOUNDS.MAX_ARRAY_LENGTH) {
        throw new MedicalApiValidationError(
          'Request body array exceeds maximum length.',
        );
      }

      for (const item of current.value) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
      continue;
    }

    for (const nested of Object.values(current.value)) {
      stack.push({ value: nested, depth: current.depth + 1 });
    }
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
