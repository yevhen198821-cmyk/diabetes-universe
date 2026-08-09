import type { SemanticTimelineEvent } from '@diabetes-universe/types';

/**
 * Temporary semantic field accessors for application consumers until P3d
 * presentation mappers are introduced. These helpers read canonical semantic
 * fields directly and must not reintroduce legacy presentation strings as
 * source-of-truth.
 */
export function getSemanticEventOccurredAt(
  event: SemanticTimelineEvent,
): string {
  return event.occurredAt;
}

function formatSemanticNumericDisplay(value: number): string {
  return String(value).replace('.', ',');
}

const nutritionMealTypeLabels: Readonly<Record<string, string>> = {
  breakfast: 'Завтрак',
  dinner: 'Ужин',
  lunch: 'Обед',
  other: 'Другое',
  snack: 'Перекус',
};

export function getSemanticEventSearchableFields(
  event: SemanticTimelineEvent,
): readonly string[] {
  switch (event.kind) {
    case 'activity':
      return [
        event.activityType,
        String(event.durationSeconds),
        event.note ?? '',
      ];
    case 'glucose':
      return [String(event.concentrationMmolPerL), event.context ?? ''];
    case 'insulin':
      return [event.preparation, String(event.doseUnits), event.context ?? ''];
    case 'medication':
      return [
        event.medicationName,
        String(event.dose),
        event.doseUnit,
        event.context ?? '',
        event.note ?? '',
      ];
    case 'note':
      return [event.title ?? '', event.body];
    case 'nutrition':
      return [
        String(event.carbohydratesGrams),
        String(event.mealType),
        event.note ?? '',
        event.mode,
      ];
  }
}

export function getSemanticEventCardTitle(
  event: SemanticTimelineEvent,
): string {
  switch (event.kind) {
    case 'activity':
      return event.activityType;
    case 'glucose':
      return 'Глюкоза';
    case 'insulin':
      return event.preparation;
    case 'medication':
      return event.medicationName;
    case 'note':
      return event.title ?? 'Заметка';
    case 'nutrition':
      return nutritionMealTypeLabels[event.mealType] ?? String(event.mealType);
  }
}

export function getSemanticEventCardValue(
  event: SemanticTimelineEvent,
): string {
  switch (event.kind) {
    case 'activity':
      return String(event.durationSeconds / 60);
    case 'glucose':
      return formatSemanticNumericDisplay(event.concentrationMmolPerL);
    case 'insulin':
      return String(event.doseUnits);
    case 'medication':
      return String(event.dose);
    case 'note':
      return event.body;
    case 'nutrition':
      return String(event.carbohydratesGrams);
  }
}

export function getSemanticEventCardUnit(
  event: SemanticTimelineEvent,
): string | undefined {
  switch (event.kind) {
    case 'activity':
      return 'мин';
    case 'glucose':
      return 'ммоль/л';
    case 'insulin':
      return 'ЕД';
    case 'medication':
      return event.doseUnit === 'mass.mg'
        ? 'мг'
        : event.doseUnit === 'mass.g'
          ? 'г'
          : event.doseUnit === 'volume.ml'
            ? 'мл'
            : '';
    case 'note':
      return undefined;
    case 'nutrition':
      return 'г углеводов';
  }
}

export function getSemanticEventCardContext(
  event: SemanticTimelineEvent,
): string | undefined {
  switch (event.kind) {
    case 'insulin':
    case 'medication':
      return event.context;
    case 'glucose':
      return event.context;
    case 'activity':
    case 'note':
    case 'nutrition':
      return undefined;
  }
}

export function formatSemanticGlucoseDisplayValue(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
): string {
  return `${formatSemanticNumericDisplay(event.concentrationMmolPerL)} ммоль/л`;
}
