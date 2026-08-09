import type {
  ActivityTimelineEvent,
  GlucoseTimelineEvent,
  InsulinTimelineEvent,
  MedicationTimelineEvent,
  MigrationRecord,
  MigrationResult,
  NoteTimelineEvent,
  NutritionTimelineEvent,
  QuarantineRecord,
  SemanticTimelineEvent,
  TimelineEvent,
  TimelineEventKind,
  UnmappableLegacyField,
} from '@diabetes-universe/types';

import type { LiftLegacyMigrationContext } from './lift-legacy-migration-context';
import {
  mapLegacyGlucoseContext,
  mapLegacyNutritionMealType,
  mapLegacyNutritionMode,
} from './legacy-context-maps';
import { mapLegacyMedicationUnit } from './legacy-medication-unit-map';
import { parseLegacyLeadingNumber } from './parse-legacy-numeric';
import {
  appendUnmappableField,
  createPreservedLegacyRaw,
} from './preserve-legacy';

const APPROVED_LEGACY_KINDS: readonly TimelineEventKind[] = [
  'activity',
  'glucose',
  'insulin',
  'medication',
  'note',
  'nutrition',
];

function isApprovedKind(kind: string): kind is TimelineEventKind {
  return (APPROVED_LEGACY_KINDS as readonly string[]).includes(kind);
}

function isValidIsoTimestamp(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function resolveLifecycleTimestamps(
  raw: TimelineEvent,
  migratedAt: string,
): Pick<SemanticTimelineEvent, 'createdAt' | 'updatedAt'> {
  const createdAt = isValidIsoTimestamp(raw.createdAt)
    ? raw.createdAt
    : migratedAt;
  const updatedAt = isValidIsoTimestamp(raw.updatedAt)
    ? raw.updatedAt
    : createdAt;

  return { createdAt, updatedAt };
}

type SemanticEventEnvelope = Omit<SemanticTimelineEvent, 'kind'>;

function createBaseEnvelope(
  raw: TimelineEvent,
  context: LiftLegacyMigrationContext,
): SemanticEventEnvelope | null {
  const id = raw.id?.trim();
  const occurredAt = raw.dateTime?.trim();

  if (!id) {
    return null;
  }

  if (!occurredAt || !isValidIsoTimestamp(occurredAt)) {
    return null;
  }

  const lifecycle = resolveLifecycleTimestamps(raw, context.migratedAt);

  return {
    createdAt: lifecycle.createdAt,
    id,
    occurredAt,
    schemaVersion: 1,
    source: raw.source ?? 'manual',
    updatedAt: lifecycle.updatedAt,
  };
}

function createMigrationRecord(
  raw: TimelineEvent,
  context: LiftLegacyMigrationContext,
  unmappable?: readonly UnmappableLegacyField[],
): MigrationRecord {
  return {
    eventId: raw.id,
    migratedAt: context.migratedAt,
    migratedFrom: 'legacy_presentation',
    preservedLegacy: createPreservedLegacyRaw(raw),
    sourceSchemaVersion: 0,
    unmappable: unmappable && unmappable.length > 0 ? unmappable : undefined,
  };
}

function createQuarantineRecord(
  raw: TimelineEvent,
  context: LiftLegacyMigrationContext,
  reason: QuarantineRecord['reason'],
): QuarantineRecord {
  const quarantineId =
    context.createQuarantineId?.(raw) ??
    (raw.id?.trim()
      ? `quarantine-${raw.id.trim()}`
      : `quarantine-anonymous-${reason}`);

  return {
    quarantineId,
    preservedLegacy: createPreservedLegacyRaw(raw),
    quarantinedAt: context.migratedAt,
    raw,
    reason,
    recoverable: true,
  };
}

function liftGlucose(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const parsed = parseLegacyLeadingNumber(raw.value);

  if (!parsed) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  let unmappable: UnmappableLegacyField[] = [];
  const mappedContext = mapLegacyGlucoseContext(raw.context);

  if (raw.context?.trim() && mappedContext === null) {
    unmappable = appendUnmappableField(unmappable, {
      field: 'context',
      rawValue: raw.context,
      reason: 'ambiguous_context',
    });
  }

  const event: GlucoseTimelineEvent = {
    ...envelope,
    concentrationMmolPerL: parsed.value,
    context: mappedContext ?? undefined,
    kind: 'glucose',
  };

  return {
    event,
    migration: createMigrationRecord(raw, context, unmappable),
    status: 'ok',
  };
}

function liftInsulin(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const parsed = parseLegacyLeadingNumber(raw.value);

  if (!parsed) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const preparation = raw.title?.trim();

  if (!preparation) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const event: InsulinTimelineEvent = {
    ...envelope,
    context: raw.context?.trim() || undefined,
    doseUnits: parsed.value,
    kind: 'insulin',
    preparation,
  };

  return {
    event,
    migration: createMigrationRecord(raw, context),
    status: 'ok',
  };
}

function liftNutrition(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const parsed = parseLegacyLeadingNumber(raw.value);

  if (!parsed) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const mealTitle = raw.title?.trim();

  if (!mealTitle) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  let unmappable: UnmappableLegacyField[] = [];
  const mappedMealType = mapLegacyNutritionMealType(mealTitle);
  const mealType = mappedMealType ?? mealTitle;

  if (!mappedMealType) {
    unmappable = appendUnmappableField(unmappable, {
      field: 'mealType',
      rawValue: mealTitle,
      reason: 'unknown_meal_type',
    });
  }

  const mappedMode = mapLegacyNutritionMode(raw.context);
  const mode = mappedMode ?? 'manual';

  const event: NutritionTimelineEvent = {
    ...envelope,
    carbohydratesGrams: parsed.value,
    kind: 'nutrition',
    mealType,
    mode,
    note: raw.note?.trim() || undefined,
  };

  return {
    event,
    migration: createMigrationRecord(raw, context, unmappable),
    status: 'ok',
  };
}

function liftMedication(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const parsed = parseLegacyLeadingNumber(raw.value);

  if (!parsed) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const medicationName = raw.title?.trim();

  if (!medicationName) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const doseUnit = mapLegacyMedicationUnit(raw.unit);

  if (!doseUnit) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(
        raw,
        context,
        'unknown_medication_unit',
      ),
    };
  }

  const event: MedicationTimelineEvent = {
    ...envelope,
    context: raw.context?.trim() || undefined,
    dose: parsed.value,
    doseUnit,
    kind: 'medication',
    medicationName,
    note: raw.note?.trim() || undefined,
  };

  return {
    event,
    migration: createMigrationRecord(raw, context),
    status: 'ok',
  };
}

function liftActivity(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const parsed = parseLegacyLeadingNumber(raw.value);

  if (!parsed) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  if (parsed.value <= 0) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'invalid_numeric'),
    };
  }

  const activityType = raw.title?.trim();

  if (!activityType) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const event: ActivityTimelineEvent = {
    ...envelope,
    activityType,
    durationSeconds: parsed.value * 60,
    kind: 'activity',
    note: raw.note?.trim() || undefined,
  };

  return {
    event,
    migration: createMigrationRecord(raw, context),
    status: 'ok',
  };
}

function liftNote(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  const body = raw.value?.trim();

  if (!body) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  const event: NoteTimelineEvent = {
    ...envelope,
    body,
    kind: 'note',
    title: raw.title?.trim() || undefined,
  };

  return {
    event,
    migration: createMigrationRecord(raw, context),
    status: 'ok',
  };
}

function liftByKind(
  raw: TimelineEvent,
  envelope: SemanticEventEnvelope,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  switch (raw.kind) {
    case 'activity':
      return liftActivity(raw, envelope, context);
    case 'glucose':
      return liftGlucose(raw, envelope, context);
    case 'insulin':
      return liftInsulin(raw, envelope, context);
    case 'medication':
      return liftMedication(raw, envelope, context);
    case 'note':
      return liftNote(raw, envelope, context);
    case 'nutrition':
      return liftNutrition(raw, envelope, context);
    default:
      return {
        status: 'quarantined',
        quarantine: createQuarantineRecord(raw, context, 'unknown_kind'),
      };
  }
}

/**
 * Lifts a legacy presentation `TimelineEvent` into the semantic application model.
 *
 * Pure conversion only. Does not mutate the input record and does not generate
 * localized presentation strings.
 */
export function liftLegacyToSemantic(
  raw: TimelineEvent,
  context: LiftLegacyMigrationContext,
): MigrationResult {
  if (!isApprovedKind(raw.kind)) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unknown_kind'),
    };
  }

  const envelope = createBaseEnvelope(raw, context);

  if (!envelope) {
    return {
      status: 'quarantined',
      quarantine: createQuarantineRecord(raw, context, 'unparseable_value'),
    };
  }

  return liftByKind(raw, envelope, context);
}
