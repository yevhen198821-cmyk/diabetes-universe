import type { AdoptionItemInput } from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { MEDICAL_IDEMPOTENCY_KEY_PATTERN } from './constants';
import {
  MedicalApiValidationError,
  parseJsonBody,
  validateSemanticEvent,
} from './medical-api-validation';

const MAX_SOURCE_NAMESPACE_LENGTH = 128;
const MAX_LOCAL_EVENT_ID_LENGTH = 128;
const MAX_APP_VERSION_LENGTH = 64;
const MAX_PLATFORM_LENGTH = 16;

export function validateAdoptionSessionCreateBody(body: unknown): {
  clientAdoptionRunId: string;
  sourcePlatform: string;
  sourceAppVersion: string;
  sourceSchemaMin: number;
  sourceSchemaMax: number;
  eligibleCount?: number;
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;

  const clientAdoptionRunId = validateOpaqueId(
    record.clientAdoptionRunId,
    'clientAdoptionRunId',
  );
  const sourcePlatform = validateBoundedString(
    record.sourcePlatform,
    'sourcePlatform',
    MAX_PLATFORM_LENGTH,
  );
  const sourceAppVersion = validateBoundedString(
    record.sourceAppVersion,
    'sourceAppVersion',
    MAX_APP_VERSION_LENGTH,
  );
  const sourceSchemaMin = validateSchemaVersion(
    record.sourceSchemaMin,
    'sourceSchemaMin',
  );
  const sourceSchemaMax = validateSchemaVersion(
    record.sourceSchemaMax,
    'sourceSchemaMax',
  );

  if (sourceSchemaMin > sourceSchemaMax) {
    throw new MedicalApiValidationError(
      'sourceSchemaMin must be less than or equal to sourceSchemaMax.',
    );
  }

  let eligibleCount: number | undefined;
  if (record.eligibleCount !== undefined) {
    eligibleCount = validateNonNegativeInteger(
      record.eligibleCount,
      'eligibleCount',
    );
  }

  return {
    clientAdoptionRunId,
    sourcePlatform,
    sourceAppVersion,
    sourceSchemaMin,
    sourceSchemaMax,
    ...(eligibleCount !== undefined ? { eligibleCount } : {}),
  };
}

export function validateAdoptionBatchBody(
  body: unknown,
): readonly AdoptionItemInput[] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.items)) {
    throw new MedicalApiValidationError('items must be an array.');
  }

  return record.items.map((item, index) =>
    validateAdoptionItemInput(item, index),
  );
}

function validateAdoptionItemInput(
  value: unknown,
  index: number,
): AdoptionItemInput {
  const fieldPrefix = `items[${index}]`;

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MedicalApiValidationError(`${fieldPrefix} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  const sourceNamespace = validateOpaqueId(
    record.sourceNamespace,
    `${fieldPrefix}.sourceNamespace`,
    MAX_SOURCE_NAMESPACE_LENGTH,
  );
  const localEventId = validateOpaqueId(
    record.localEventId,
    `${fieldPrefix}.localEventId`,
    MAX_LOCAL_EVENT_ID_LENGTH,
  );
  const sourceSchemaVersion = validateSchemaVersion(
    record.sourceSchemaVersion,
    `${fieldPrefix}.sourceSchemaVersion`,
  );

  if (!('event' in record)) {
    throw new MedicalApiValidationError(`${fieldPrefix}.event is required.`);
  }

  const rawEvent = record.event;
  if (!rawEvent || typeof rawEvent !== 'object' || Array.isArray(rawEvent)) {
    throw new MedicalApiValidationError(
      `${fieldPrefix}.event must be an object.`,
    );
  }

  const eventRecord = rawEvent as Record<string, unknown>;
  if (eventRecord.id !== undefined && eventRecord.id !== localEventId) {
    throw new MedicalApiValidationError(
      `${fieldPrefix}.localEventId must match event envelope identity.`,
    );
  }

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...eventWithoutServerOwned
  } = eventRecord;
  void _id;
  void _createdAt;
  void _updatedAt;

  const event = validateSemanticEvent(
    eventWithoutServerOwned,
    `${fieldPrefix}.event`,
  );

  return {
    sourceNamespace,
    localEventId,
    sourceSchemaVersion,
    event,
  };
}

export function validateAdoptionSessionId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new MedicalApiValidationError('adoptionSessionId is required.');
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    throw new MedicalApiValidationError('adoptionSessionId must be a UUID.');
  }

  return trimmed;
}

function validateOpaqueId(
  value: unknown,
  fieldName: string,
  maxLength = 128,
): string {
  if (typeof value !== 'string') {
    throw new MedicalApiValidationError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new MedicalApiValidationError(
      `${fieldName} must be a non-empty string up to ${maxLength} characters.`,
    );
  }

  if (!MEDICAL_IDEMPOTENCY_KEY_PATTERN.test(trimmed)) {
    throw new MedicalApiValidationError(`${fieldName} has an invalid format.`);
  }

  return trimmed;
}

function validateBoundedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== 'string') {
    throw new MedicalApiValidationError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new MedicalApiValidationError(
      `${fieldName} must be a non-empty string up to ${maxLength} characters.`,
    );
  }

  return trimmed;
}

function validateSchemaVersion(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new MedicalApiValidationError(
      `${fieldName} must be a positive integer.`,
    );
  }

  return value;
}

function validateNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new MedicalApiValidationError(
      `${fieldName} must be a non-negative integer.`,
    );
  }

  return value;
}

export { parseJsonBody };
