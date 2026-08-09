import type {
  ActivityTimelineEvent,
  CanonicalUnitId,
  GlucoseTimelineEvent,
  InsulinTimelineEvent,
  MedicationTimelineEvent,
  NoteTimelineEvent,
  NutritionProductSnapshot,
  NutritionTimelineEvent,
  SemanticTimelineEvent,
  TimelineEventKind,
  TimelineEventSource,
} from '@diabetes-universe/types';

import {
  TIMELINE_BOOTSTRAP_VERSION,
  TIMELINE_SEED_VERSION,
  TIMELINE_STORAGE_SCHEMA_VERSION,
  type IndexedDbTimelineEventRecord,
  type TimelineBootstrapMetadata,
  type TimelineStorageQuarantineReason,
} from './timeline-indexeddb-schema';

export type TimelineIndexedDbRecordValidationResult =
  | {
      readonly status: 'ok';
      readonly record: IndexedDbTimelineEventRecord;
    }
  | {
      readonly status: 'quarantine';
      readonly reason: TimelineStorageQuarantineReason;
      readonly sourceRecordId?: string;
      readonly storageSchemaVersion?: number;
    };

const TIMELINE_EVENT_KINDS = new Set<TimelineEventKind>([
  'glucose',
  'insulin',
  'nutrition',
  'medication',
  'activity',
  'note',
]);

const TIMELINE_EVENT_SOURCES = new Set<TimelineEventSource>([
  'demo',
  'device',
  'manual',
]);

const CANONICAL_UNIT_IDS = new Set<CanonicalUnitId>([
  'glucose.mmol_per_l',
  'insulin.international_unit',
  'mass.g',
  'mass.mg',
  'volume.ml',
  'duration.second',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTimelineEventKind(value: unknown): value is TimelineEventKind {
  return typeof value === 'string' && TIMELINE_EVENT_KINDS.has(value as TimelineEventKind);
}

function isTimelineEventSource(value: unknown): value is TimelineEventSource {
  return typeof value === 'string' && TIMELINE_EVENT_SOURCES.has(value as TimelineEventSource);
}

function hasValidEnvelope(value: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(value.id) &&
    isTimelineEventKind(value.kind) &&
    isIsoTimestamp(value.occurredAt) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    value.schemaVersion === 1 &&
    isTimelineEventSource(value.source)
  );
}

function isGlucoseEvent(value: Record<string, unknown>): value is unknown & GlucoseTimelineEvent {
  return value.kind === 'glucose' && isFiniteNumber(value.concentrationMmolPerL);
}

function isInsulinEvent(value: Record<string, unknown>): value is unknown & InsulinTimelineEvent {
  return (
    value.kind === 'insulin' &&
    isNonEmptyString(value.preparation) &&
    isFiniteNumber(value.doseUnits)
  );
}

function isNutritionProduct(value: unknown): value is NutritionProductSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.productId) &&
    isNonEmptyString(value.productName) &&
    isFiniteNumber(value.weightGrams) &&
    isFiniteNumber(value.carbsPer100Grams) &&
    isFiniteNumber(value.calculatedCarbsGrams)
  );
}

function isNutritionEvent(value: Record<string, unknown>): value is unknown & NutritionTimelineEvent {
  const products = value.products;
  return (
    value.kind === 'nutrition' &&
    (value.mode === 'manual' || value.mode === 'products') &&
    isNonEmptyString(value.mealType) &&
    isFiniteNumber(value.carbohydratesGrams) &&
    (products === undefined ||
      (Array.isArray(products) && products.every(isNutritionProduct))) &&
    isOptionalString(value.note)
  );
}

function isMedicationEvent(value: Record<string, unknown>): value is unknown & MedicationTimelineEvent {
  return (
    value.kind === 'medication' &&
    isOptionalString(value.medicationId) &&
    isNonEmptyString(value.medicationName) &&
    isFiniteNumber(value.dose) &&
    typeof value.doseUnit === 'string' &&
    CANONICAL_UNIT_IDS.has(value.doseUnit as CanonicalUnitId) &&
    isOptionalString(value.context) &&
    isOptionalString(value.note)
  );
}

function isActivityEvent(value: Record<string, unknown>): value is unknown & ActivityTimelineEvent {
  return (
    value.kind === 'activity' &&
    isNonEmptyString(value.activityType) &&
    isFiniteNumber(value.durationSeconds) &&
    isOptionalString(value.note)
  );
}

function isNoteEvent(value: Record<string, unknown>): value is unknown & NoteTimelineEvent {
  return (
    value.kind === 'note' &&
    isOptionalString(value.title) &&
    isNonEmptyString(value.body)
  );
}

function isSemanticTimelineEvent(value: unknown): value is SemanticTimelineEvent {
  if (!isRecord(value) || !hasValidEnvelope(value)) {
    return false;
  }

  switch (value.kind) {
    case 'glucose':
      return isGlucoseEvent(value);
    case 'insulin':
      return isInsulinEvent(value);
    case 'nutrition':
      return isNutritionEvent(value);
    case 'medication':
      return isMedicationEvent(value);
    case 'activity':
      return isActivityEvent(value);
    case 'note':
      return isNoteEvent(value);
    default:
      return false;
  }
}

function readOptionalStorageSchemaVersion(value: Record<string, unknown>): number | undefined {
  return typeof value.storageSchemaVersion === 'number'
    ? value.storageSchemaVersion
    : undefined;
}

function readOptionalRecordId(value: Record<string, unknown>): string | undefined {
  return typeof value.id === 'string' ? value.id : undefined;
}

export function validateIndexedDbTimelineEventRecord(
  raw: unknown,
): TimelineIndexedDbRecordValidationResult {
  if (!isRecord(raw)) {
    return { status: 'quarantine', reason: 'invalid_record_shape' };
  }

  const sourceRecordId = readOptionalRecordId(raw);
  const storageSchemaVersion = readOptionalStorageSchemaVersion(raw);

  if (raw.storageSchemaVersion !== TIMELINE_STORAGE_SCHEMA_VERSION) {
    return {
      status: 'quarantine',
      reason: 'unsupported_storage_schema',
      sourceRecordId,
      storageSchemaVersion,
    };
  }

  if (
    !isNonEmptyString(raw.id) ||
    !isIsoTimestamp(raw.occurredAt) ||
    !isTimelineEventKind(raw.kind) ||
    !isIsoTimestamp(raw.persistedAt) ||
    !isSemanticTimelineEvent(raw.event)
  ) {
    return {
      status: 'quarantine',
      reason: 'invalid_record_shape',
      sourceRecordId,
      storageSchemaVersion,
    };
  }

  if (
    raw.id !== raw.event.id ||
    raw.occurredAt !== raw.event.occurredAt ||
    raw.kind !== raw.event.kind
  ) {
    return {
      status: 'quarantine',
      reason: 'semantic_identity_mismatch',
      sourceRecordId: raw.id,
      storageSchemaVersion,
    };
  }

  return {
    status: 'ok',
    record: raw as unknown as IndexedDbTimelineEventRecord,
  };
}

export function isTimelineBootstrapMetadata(
  raw: unknown,
): raw is TimelineBootstrapMetadata {
  if (!isRecord(raw)) {
    return false;
  }

  return (
    raw.key === 'bootstrap' &&
    raw.bootstrapVersion === TIMELINE_BOOTSTRAP_VERSION &&
    raw.seedVersion === TIMELINE_SEED_VERSION &&
    isIsoTimestamp(raw.completedAt)
  );
}
