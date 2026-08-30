import type {
  CanonicalUnitId,
  GlucoseMeasurementContext,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import {
  createInsulinEditSelection,
  resolveInsulinEditLegacyContextText,
  resolveInsulinEditTransition,
  resolveInsulinStoredContextWasAbsent,
  type InsulinEditSelection,
  type InsulinEditTransitionErrorCode,
  type InsulinPresentationLabels,
} from '../../lib/medical/insulin';
import {
  createIsoDateTimeFromLocalDateAndTime,
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';
import { mapQuickAddMedicationUnit } from '../../lib/timeline/semantic-creators/map-quick-add-medication-unit';
import { mapQuickAddNutritionMealType } from '../../lib/timeline/semantic-creators/map-quick-add-nutrition-meal-type';

interface TimelineEventEditDraftFields {
  readonly context: string;
  readonly date: string;
  readonly note: string;
  readonly time: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export interface TimelineGenericEventEditDraft extends TimelineEventEditDraftFields {
  readonly variant: 'generic';
}

/**
 * Insulin edit state (Wave 4B-II Option A).
 *
 * Preparation identity and its display snapshot are resolved together from
 * `insulin`, so no generic title string can desynchronize them.
 */
export interface TimelineInsulinEventEditDraft {
  readonly date: string;
  readonly insulin: InsulinEditSelection;
  /** Unmatched legacy `context` shown verbatim. Read-only edit chrome. */
  readonly legacyContextText: string | null;
  /** Stored `preparation` snapshot. Read-only edit chrome, never a write source. */
  readonly storedPreparation: string;
  readonly storedPreparationIsUnmatched: boolean;
  /**
   * `true` when the stored event originally omitted both context fields.
   * Immutable for the edit session.
   */
  readonly storedContextWasAbsent: boolean;
  readonly time: string;
  readonly variant: 'insulin';
}

export type TimelineEventEditDraft =
  TimelineGenericEventEditDraft | TimelineInsulinEventEditDraft;

export type TimelineEventEditErrorField =
  keyof TimelineEventEditDraftFields | 'dose' | 'otherName' | 'preparation';

export type TimelineEventEditErrors = Partial<
  Record<TimelineEventEditErrorField, string>
>;

export interface TimelineSemanticEditResult {
  readonly errors: TimelineEventEditErrors;
  readonly event: SemanticTimelineEvent | null;
}

/**
 * Localized copy the insulin edit save needs.
 *
 * Error copy is injected so no insulin edit string is hardcoded in this model.
 */
export interface TimelineInsulinEditCopy {
  readonly errors: Readonly<Record<InsulinEditTransitionErrorCode, string>>;
  readonly labels: InsulinPresentationLabels;
}

const glucoseContextFormLabels: Readonly<
  Record<GlucoseMeasurementContext, string>
> = {
  after_meal: 'После еды',
  before_meal: 'Перед едой',
  bedtime: 'Перед сном',
  fasting: 'Натощак',
  other: 'Другое',
};

const nutritionMealTypeFormLabels: Readonly<Record<string, string>> = {
  breakfast: 'Завтрак',
  dinner: 'Ужин',
  lunch: 'Обед',
  other: 'Другое',
  snack: 'Перекус',
};

const medicationUnitFormLabels: Readonly<
  Partial<Record<CanonicalUnitId, string>>
> = {
  'mass.g': 'г',
  'mass.mg': 'мг',
  'volume.ml': 'мл',
};

function parseEditableNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');

  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatEditableNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toString().replace('.', ',');
}

function resolveGlucoseContextLabel(
  context: GlucoseMeasurementContext | undefined,
): string {
  return context ? glucoseContextFormLabels[context] : '';
}

function resolveGlucoseContextFromEditDraft(
  contextLabel: string,
): GlucoseMeasurementContext | undefined {
  const normalized = contextLabel.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  const matchedEntry = Object.entries(glucoseContextFormLabels).find(
    ([, label]) => label === normalized,
  );

  return matchedEntry
    ? (matchedEntry[0] as GlucoseMeasurementContext)
    : undefined;
}

function resolveNutritionMealTypeLabel(mealType: string): string {
  return nutritionMealTypeFormLabels[mealType] ?? mealType;
}

function resolveMedicationUnitLabel(unit: CanonicalUnitId): string {
  return medicationUnitFormLabels[unit] ?? unit;
}

export function createTimelineSemanticEventEditDraft(
  event: SemanticTimelineEvent,
): TimelineEventEditDraft {
  const date = getTimelineCalendarDateKey(event.occurredAt) ?? '';
  const time = formatTimelineDisplayTime(event.occurredAt);

  switch (event.kind) {
    case 'activity':
      return {
        context: '',
        date,
        note: event.note ?? '',
        time,
        title: event.activityType,
        unit: 'мин',
        value: formatEditableNumber(event.durationSeconds / 60),
        variant: 'generic',
      };
    case 'glucose':
      return {
        context: resolveGlucoseContextLabel(event.context),
        date,
        note: '',
        time,
        title: '',
        unit: '',
        value: formatEditableNumber(event.concentrationMmolPerL),
        variant: 'generic',
      };
    case 'insulin': {
      const insulin = createInsulinEditSelection(event);

      return {
        date,
        insulin,
        legacyContextText: resolveInsulinEditLegacyContextText(event),
        storedContextWasAbsent: resolveInsulinStoredContextWasAbsent(event),
        storedPreparation: event.preparation,
        storedPreparationIsUnmatched: insulin.preparationId === null,
        time,
        variant: 'insulin',
      };
    }
    case 'medication':
      return {
        context: event.context ?? '',
        date,
        note: event.note ?? '',
        time,
        title: event.medicationName,
        unit: resolveMedicationUnitLabel(event.doseUnit),
        value: formatEditableNumber(event.dose),
        variant: 'generic',
      };
    case 'note':
      return {
        context: '',
        date,
        note: '',
        time,
        title: event.title ?? '',
        unit: '',
        value: event.body,
        variant: 'generic',
      };
    case 'nutrition':
      return {
        context: '',
        date,
        note: event.note ?? '',
        time,
        title: resolveNutritionMealTypeLabel(event.mealType),
        unit: '',
        value: formatEditableNumber(event.carbohydratesGrams),
        variant: 'generic',
      };
  }
}

function validateCommonDraft(
  draft: TimelineEventEditDraft,
): TimelineEventEditErrors {
  const errors: TimelineEventEditErrors = {};

  if (draft.date.trim().length === 0) {
    errors.date = 'Укажите дату.';
  }

  if (draft.time.trim().length === 0) {
    errors.time = 'Укажите время.';
  }

  return errors;
}

function validateNumber(
  draft: TimelineGenericEventEditDraft,
  max: number,
  label: string,
): { errors: TimelineEventEditErrors; parsed: number | null } {
  const parsed = parseEditableNumber(draft.value);

  if (parsed === null || parsed <= 0 || parsed > max) {
    return {
      errors: {
        value: `${label}: введите значение больше 0 и не более ${max}.`,
      },
      parsed: null,
    };
  }

  return { errors: {}, parsed };
}

function resolveOccurredAt(draft: TimelineEventEditDraft): string | null {
  try {
    return createIsoDateTimeFromLocalDateAndTime(draft.date, draft.time);
  } catch {
    return null;
  }
}

/** Semantic timeline events edited through the generic string draft. */
export type TimelineGenericSemanticEvent = Exclude<
  SemanticTimelineEvent,
  { kind: 'insulin' }
>;

export type TimelineInsulinSemanticEvent = Extract<
  SemanticTimelineEvent,
  { kind: 'insulin' }
>;

interface ResolvedEditTiming {
  readonly errors: TimelineEventEditErrors;
  readonly occurredAt: string | null;
}

function resolveEditTiming(draft: TimelineEventEditDraft): ResolvedEditTiming {
  const errors = validateCommonDraft(draft);
  const occurredAt = resolveOccurredAt(draft);

  if (!occurredAt) {
    errors.date = errors.date ?? 'Укажите корректную дату.';
    errors.time = errors.time ?? 'Укажите корректное время.';
  }

  return { errors, occurredAt };
}

/**
 * Applies one insulin edit save (Wave 4B-II Option A).
 *
 * Preparation identity and snapshot move together, and an explicit semantic
 * context replaces the legacy string instead of coexisting with it. The
 * envelope, `schemaVersion`, `source`, `createdAt`, and `provenance` are
 * preserved.
 */
export function updateInsulinTimelineEventFromDraft(input: {
  readonly copy: TimelineInsulinEditCopy;
  readonly draft: TimelineInsulinEventEditDraft;
  readonly event: TimelineInsulinSemanticEvent;
  readonly now?: Date;
}): TimelineSemanticEditResult {
  const { copy, draft, event } = input;
  const timing = resolveEditTiming(draft);

  if (Object.keys(timing.errors).length > 0) {
    return { errors: timing.errors, event: null };
  }

  const transitionResult = resolveInsulinEditTransition({
    event,
    labels: copy.labels,
    selection: draft.insulin,
  });

  if (!transitionResult.ok) {
    const errors: TimelineEventEditErrors = {};

    if (transitionResult.errors.dose) {
      errors.dose = copy.errors[transitionResult.errors.dose];
    }

    if (transitionResult.errors.otherName) {
      errors.otherName = copy.errors[transitionResult.errors.otherName];
    }

    return { errors, event: null };
  }

  const { transition } = transitionResult;
  const storedLegacyContext = event.context;
  const eventWithoutLegacyContextAndPreparationId = { ...event };
  delete eventWithoutLegacyContextAndPreparationId.context;
  delete eventWithoutLegacyContextAndPreparationId.preparationId;
  const base =
    transition.context.kind === 'semantic'
      ? {
          ...eventWithoutLegacyContextAndPreparationId,
          administrationContext: transition.context.administrationContext,
        }
      : {
          ...eventWithoutLegacyContextAndPreparationId,
          ...(storedLegacyContext === undefined
            ? {}
            : { context: storedLegacyContext }),
        };

  return {
    errors: {},
    event: {
      ...base,
      doseUnits: transition.doseUnits,
      occurredAt: timing.occurredAt ?? event.occurredAt,
      preparation: transition.preparation.preparation,
      ...(transition.preparation.preparationId === null
        ? {}
        : { preparationId: transition.preparation.preparationId }),
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  };
}

export function updateSemanticTimelineEventFromDraft(
  event: TimelineGenericSemanticEvent,
  draft: TimelineGenericEventEditDraft,
  now: Date = new Date(),
): TimelineSemanticEditResult {
  const timing = resolveEditTiming(draft);
  const errors = timing.errors;

  if (Object.keys(errors).length > 0) {
    return { errors, event: null };
  }

  const updatedAt = now.toISOString();
  const nextOccurredAt = timing.occurredAt ?? event.occurredAt;

  switch (event.kind) {
    case 'activity': {
      const durationMinutes = parseEditableNumber(draft.value);

      if (durationMinutes === null || durationMinutes <= 0) {
        return {
          errors: { value: 'Укажите значение активности.' },
          event: null,
        };
      }

      if (draft.title.trim().length === 0) {
        return { errors: { title: 'Укажите название.' }, event: null };
      }

      return {
        errors: {},
        event: {
          ...event,
          activityType: draft.title.trim(),
          durationSeconds: durationMinutes * 60,
          note: draft.note.trim() || undefined,
          occurredAt: nextOccurredAt,
          updatedAt,
        },
      };
    }
    case 'glucose': {
      const validation = validateNumber(draft, 40, 'Глюкоза');

      if (Object.keys(validation.errors).length > 0) {
        return { errors: validation.errors, event: null };
      }

      const context = resolveGlucoseContextFromEditDraft(draft.context);

      return {
        errors: {},
        event: {
          ...event,
          concentrationMmolPerL: validation.parsed as number,
          context,
          occurredAt: nextOccurredAt,
          updatedAt,
        },
      };
    }
    case 'medication': {
      const validation = validateNumber(draft, 100000, 'Лекарство');
      const doseUnit = mapQuickAddMedicationUnit(draft.unit);

      if (Object.keys(validation.errors).length > 0) {
        return { errors: validation.errors, event: null };
      }

      if (draft.title.trim().length === 0) {
        return { errors: { title: 'Укажите название.' }, event: null };
      }

      if (!doseUnit) {
        return { errors: { unit: 'Укажите единицу лекарства.' }, event: null };
      }

      return {
        errors: {},
        event: {
          ...event,
          context: draft.context.trim() || undefined,
          dose: validation.parsed as number,
          doseUnit,
          medicationName: draft.title.trim(),
          note: draft.note.trim() || undefined,
          occurredAt: nextOccurredAt,
          updatedAt,
        },
      };
    }
    case 'note': {
      const body = draft.value.trim();

      if (body.length === 0) {
        return { errors: { value: 'Введите текст заметки.' }, event: null };
      }

      if (body.length > 500) {
        return {
          errors: { value: 'Заметка должна быть не длиннее 500 символов.' },
          event: null,
        };
      }

      const title = draft.title.trim();

      return {
        errors: {},
        event: {
          ...event,
          body,
          occurredAt: nextOccurredAt,
          title: title.length > 0 ? title : undefined,
          updatedAt,
        },
      };
    }
    case 'nutrition': {
      const validation = validateNumber(draft, 500, 'Питание');

      if (Object.keys(validation.errors).length > 0) {
        return { errors: validation.errors, event: null };
      }

      if (draft.title.trim().length === 0) {
        return { errors: { title: 'Укажите название.' }, event: null };
      }

      return {
        errors: {},
        event: {
          ...event,
          carbohydratesGrams: validation.parsed as number,
          mealType: mapQuickAddNutritionMealType(draft.title),
          note: draft.note.trim() || undefined,
          occurredAt: nextOccurredAt,
          updatedAt,
        },
      };
    }
  }
}

/**
 * Saves any timeline event edit, routing insulin through its semantic model.
 */
export function updateTimelineEventFromDraft(input: {
  readonly copy: TimelineInsulinEditCopy;
  readonly draft: TimelineEventEditDraft;
  readonly event: SemanticTimelineEvent;
  readonly now?: Date;
}): TimelineSemanticEditResult {
  const { copy, draft, event } = input;

  if (event.kind === 'insulin') {
    if (draft.variant !== 'insulin') {
      return { errors: {}, event: null };
    }

    return updateInsulinTimelineEventFromDraft({
      copy,
      draft,
      event,
      now: input.now,
    });
  }

  if (draft.variant !== 'generic') {
    return { errors: {}, event: null };
  }

  return updateSemanticTimelineEventFromDraft(
    event,
    draft,
    input.now ?? new Date(),
  );
}
