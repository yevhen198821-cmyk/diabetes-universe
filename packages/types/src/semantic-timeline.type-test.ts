import type {
  ActivityTimelineEvent,
  CanonicalUnitId,
  GlucoseTimelineEvent,
  InsulinAdministrationContext,
  InsulinPreparationId,
  InsulinTimelineEvent,
  MedicationTimelineEvent,
  NoteTimelineEvent,
  NutritionTimelineEvent,
  SemanticTimelineEvent,
} from './semantic-timeline';
import type { InsulinQuickAddEntry } from './quick-add';
import type { MigrationRecord, MigrationResult } from './timeline-migration';
import type { TimelineEvent } from './timeline';

const baseEnvelope = {
  id: 'event-1',
  occurredAt: '2026-08-09T08:30:00.000Z',
  createdAt: '2026-08-09T08:31:00.000Z',
  updatedAt: '2026-08-09T08:31:00.000Z',
  schemaVersion: 1 as const,
  source: 'manual' as const,
};

const glucoseEvent: GlucoseTimelineEvent = {
  ...baseEnvelope,
  kind: 'glucose',
  concentrationMmolPerL: 6.4,
  context: 'before_meal',
};

const insulinEvent: InsulinTimelineEvent = {
  ...baseEnvelope,
  kind: 'insulin',
  preparation: 'NovoRapid',
  doseUnits: 4,
};

const semanticInsulinEvent: InsulinTimelineEvent = {
  ...insulinEvent,
  preparationId: 'insulin.prep.aspart_novorapid',
  administrationContext: 'before_meal',
};

void semanticInsulinEvent;

const validPreparationId: InsulinPreparationId = 'insulin.prep.other';
void validPreparationId;

const validAdministrationContext: InsulinAdministrationContext = 'unspecified';
void validAdministrationContext;

// @ts-expect-error catalogue identity does not include arbitrary strings
const invalidPreparationId: InsulinPreparationId = 'insulin.prep.unknown';

void invalidPreparationId;

// @ts-expect-error unmatched history omits preparationId; unmapped is not an ID
const unmappedPreparationId: InsulinPreparationId = 'insulin.prep.unmapped';

void unmappedPreparationId;

// @ts-expect-error administration context is a closed semantic union
const invalidAdministrationContext: InsulinAdministrationContext = 'meal';

void invalidAdministrationContext;

const insulinMissingPreparation = {
  ...baseEnvelope,
  kind: 'insulin' as const,
  doseUnits: 4,
};

// @ts-expect-error preparation remains required
const insulinWithoutPreparation: InsulinTimelineEvent =
  insulinMissingPreparation;

void insulinWithoutPreparation;

const insulinMissingDose = {
  ...baseEnvelope,
  kind: 'insulin' as const,
  preparation: 'NovoRapid',
};

// @ts-expect-error doseUnits remains required
const insulinWithoutDose: InsulinTimelineEvent = insulinMissingDose;

void insulinWithoutDose;

function rejectPersistedPreparationCategory(event: InsulinTimelineEvent): void {
  // @ts-expect-error preparationCategory is not part of InsulinTimelineEvent
  void event.preparationCategory;
}

void rejectPersistedPreparationCategory;

const unchangedInsulinQuickAdd: InsulinQuickAddEntry = {
  preparation: 'NovoRapid',
  doseUnits: 4,
  time: '08:00',
};

void unchangedInsulinQuickAdd;

const migratedInsulinQuickAdd: InsulinQuickAddEntry = {
  preparation: 'NovoRapid',
  doseUnits: 4,
  time: '08:00',
  // @ts-expect-error Wave 4C owns InsulinQuickAddEntry semantic migration
  preparationId: 'insulin.prep.aspart_novorapid',
};

void migratedInsulinQuickAdd;

const nutritionEvent: NutritionTimelineEvent = {
  ...baseEnvelope,
  kind: 'nutrition',
  mode: 'manual',
  mealType: 'breakfast',
  carbohydratesGrams: 42,
};

const medicationEvent: MedicationTimelineEvent = {
  ...baseEnvelope,
  kind: 'medication',
  medicationName: 'Metformin',
  dose: 500,
  doseUnit: 'mass.mg',
};

const activityEvent: ActivityTimelineEvent = {
  ...baseEnvelope,
  kind: 'activity',
  activityType: 'walk',
  durationSeconds: 1800,
};

const noteEvent: NoteTimelineEvent = {
  ...baseEnvelope,
  kind: 'note',
  body: 'Felt fine after lunch.',
};

const semanticEvents: readonly SemanticTimelineEvent[] = [
  glucoseEvent,
  insulinEvent,
  nutritionEvent,
  medicationEvent,
  activityEvent,
  noteEvent,
];

void semanticEvents;

function narrowGlucose(event: SemanticTimelineEvent): number {
  if (event.kind === 'glucose') {
    // @ts-expect-error insulin-only field must not exist on glucose events
    void event.doseUnits;
    return event.concentrationMmolPerL;
  }

  return 0;
}

function narrowInsulin(event: SemanticTimelineEvent): number {
  if (event.kind === 'insulin') {
    // @ts-expect-error glucose-only field must not exist on insulin events
    void event.concentrationMmolPerL;
    return event.doseUnits;
  }

  return 0;
}

function narrowNutrition(event: SemanticTimelineEvent): number {
  if (event.kind === 'nutrition') {
    // @ts-expect-error medication-only field must not exist on nutrition events
    void event.doseUnit;
    return event.carbohydratesGrams;
  }

  return 0;
}

function narrowMedication(event: SemanticTimelineEvent): CanonicalUnitId {
  if (event.kind === 'medication') {
    // @ts-expect-error glucose-only field must not exist on medication events
    void event.concentrationMmolPerL;
    return event.doseUnit;
  }

  return 'mass.mg';
}

function narrowActivity(event: SemanticTimelineEvent): number {
  if (event.kind === 'activity') {
    // @ts-expect-error note body must not exist on activity events
    void event.body;
    return event.durationSeconds;
  }

  return 0;
}

function narrowNote(event: SemanticTimelineEvent): string {
  if (event.kind === 'note') {
    // @ts-expect-error note events must not expose medication dose units
    void event.doseUnit;
    return event.body;
  }

  return '';
}

void narrowGlucose;
void narrowInsulin;
void narrowNutrition;
void narrowMedication;
void narrowActivity;
void narrowNote;

const invalidGlucoseCombination: GlucoseTimelineEvent = {
  ...baseEnvelope,
  kind: 'glucose',
  concentrationMmolPerL: 6.4,
  // @ts-expect-error glucose events must not include insulin-only fields
  doseUnits: 4,
};

void invalidGlucoseCombination;

const invalidMedicationWithoutUnit = {
  ...baseEnvelope,
  kind: 'medication' as const,
  medicationName: 'Metformin',
  dose: 500,
};

// @ts-expect-error medication events require doseUnit
const medicationMissingUnit: MedicationTimelineEvent =
  invalidMedicationWithoutUnit;

void medicationMissingUnit;

const validUnit: CanonicalUnitId = 'mass.mg';
void validUnit;

// @ts-expect-error P3 unit registry does not include future extensibility units yet
const invalidUnit: CanonicalUnitId = 'ext.pressure.mmhg';

void invalidUnit;

// @ts-expect-error readonly semantic envelope fields must remain immutable
glucoseEvent.occurredAt = '2026-08-09T09:00:00.000Z';

const invalidSchemaVersion: GlucoseTimelineEvent = {
  ...baseEnvelope,
  // @ts-expect-error schemaVersion is fixed to 1 for P3
  schemaVersion: 2,
  kind: 'glucose',
  concentrationMmolPerL: 6.4,
};

void invalidSchemaVersion;

const migrationRecord: MigrationRecord = {
  eventId: glucoseEvent.id,
  migratedAt: '2026-08-09T08:32:00.000Z',
  migratedFrom: 'legacy_presentation',
  sourceSchemaVersion: 0,
  preservedLegacy: {
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
  },
};

const migrationResult: MigrationResult = {
  status: 'ok',
  event: glucoseEvent,
  migration: migrationRecord,
};

void migrationResult;

const semanticEventWithMigrationMetadata: SemanticTimelineEvent = {
  ...glucoseEvent,
  // @ts-expect-error migration evidence must not be embedded on semantic events
  migration: migrationRecord,
};

void semanticEventWithMigrationMetadata;

const legacyEvent: TimelineEvent = {
  id: 'legacy-1',
  kind: 'glucose',
  dateTime: '2026-08-09T08:30:00.000Z',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
  source: 'demo',
};

void legacyEvent;

type LegacyRepositoryEvent = TimelineEvent;
const repositoryEvent: LegacyRepositoryEvent = legacyEvent;

void repositoryEvent;
