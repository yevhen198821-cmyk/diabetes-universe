import type {
  CanonicalUnitId,
  GlucoseMeasurementContext,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import {
  createIsoDateTimeFromLocalDateAndTime,
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';
import { mapQuickAddMedicationUnit } from '../../lib/timeline/semantic-creators/map-quick-add-medication-unit';
import { mapQuickAddNutritionMealType } from '../../lib/timeline/semantic-creators/map-quick-add-nutrition-meal-type';

export interface TimelineEventEditDraft {
  readonly context: string;
  readonly date: string;
  readonly note: string;
  readonly time: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export type TimelineEventEditErrors = Partial<
  Record<keyof TimelineEventEditDraft, string>
>;

export interface TimelineSemanticEditResult {
  readonly errors: TimelineEventEditErrors;
  readonly event: SemanticTimelineEvent | null;
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
      };
    case 'insulin':
      return {
        context: event.context ?? '',
        date,
        note: '',
        time,
        title: event.preparation,
        unit: '',
        value: formatEditableNumber(event.doseUnits),
      };
    case 'medication':
      return {
        context: event.context ?? '',
        date,
        note: event.note ?? '',
        time,
        title: event.medicationName,
        unit: resolveMedicationUnitLabel(event.doseUnit),
        value: formatEditableNumber(event.dose),
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
  draft: TimelineEventEditDraft,
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

export function updateSemanticTimelineEventFromDraft(
  event: SemanticTimelineEvent,
  draft: TimelineEventEditDraft,
  now: Date = new Date(),
): TimelineSemanticEditResult {
  const errors = validateCommonDraft(draft);
  const occurredAt = resolveOccurredAt(draft);

  if (!occurredAt) {
    errors.date = errors.date ?? 'Укажите корректную дату.';
    errors.time = errors.time ?? 'Укажите корректное время.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, event: null };
  }

  const updatedAt = now.toISOString();
  const nextOccurredAt = occurredAt ?? event.occurredAt;

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
    case 'insulin': {
      const validation = validateNumber(draft, 100, 'Инсулин');

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
          context: draft.context.trim() || undefined,
          doseUnits: validation.parsed as number,
          occurredAt: nextOccurredAt,
          preparation: draft.title.trim(),
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
