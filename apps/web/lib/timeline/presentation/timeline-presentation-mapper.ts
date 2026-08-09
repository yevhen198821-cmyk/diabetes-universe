import type {
  CanonicalUnitId,
  GlucoseMeasurementContext,
  NutritionMealType,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';
import type { EventCardType } from '@diabetes-universe/ui';

import type { TimelinePresentationDependencies } from './timeline-presentation-dependencies';
import type {
  TimelineEventCardPresentation,
  TimelineEventDetailPresentation,
  TimelineKindPresentation,
  TimelineMeasurementPresentation,
  TimelineSearchPresentation,
} from './timeline-presentation-types';

const GLUCOSE_FRACTION_DIGITS = {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
} as const;

const INSULIN_FRACTION_DIGITS = {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
} as const;

const CARD_TYPE_BY_KIND = {
  activity: 'activity',
  glucose: 'glucose',
  insulin: 'insulin',
  medication: 'medication',
  note: 'note',
  nutrition: 'nutrition',
} as const satisfies Record<SemanticTimelineEvent['kind'], EventCardType>;

function formatMedicalNumber(
  dependencies: TimelinePresentationDependencies,
  value: number,
  fractionDigits: {
    readonly maximumFractionDigits: number;
    readonly minimumFractionDigits: number;
  },
): string {
  return dependencies.formatter.formatNumber(value, fractionDigits);
}

function formatMeasurementPresentation(
  dependencies: TimelinePresentationDependencies,
  value: string,
  unit: string,
): TimelineMeasurementPresentation {
  return {
    display: unit.length > 0 ? `${value} ${unit}` : value,
    unit,
    value,
  };
}

function resolveMedicationUnitLabel(
  dependencies: TimelinePresentationDependencies,
  doseUnit: CanonicalUnitId,
): string {
  switch (doseUnit) {
    case 'mass.mg':
      return dependencies.labels.units.massMg;
    case 'mass.g':
      return dependencies.labels.units.massG;
    case 'volume.ml':
      return dependencies.labels.units.volumeMl;
    case 'duration.second':
    case 'glucose.mmol_per_l':
    case 'insulin.international_unit':
      return '';
    default: {
      const exhaustive: never = doseUnit;
      return exhaustive;
    }
  }
}

function resolveGlucoseContextLabel(
  dependencies: TimelinePresentationDependencies,
  context: GlucoseMeasurementContext | undefined,
): string | undefined {
  if (!context) {
    return undefined;
  }

  return dependencies.labels.glucoseContexts[context];
}

function resolveMealTypeTitle(
  dependencies: TimelinePresentationDependencies,
  mealType: NutritionMealType | string,
): string {
  if (
    mealType === 'breakfast' ||
    mealType === 'lunch' ||
    mealType === 'dinner' ||
    mealType === 'snack' ||
    mealType === 'other'
  ) {
    return dependencies.labels.mealTypes[mealType];
  }

  return mealType;
}

function mapGlucosePresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const value = formatMedicalNumber(
    dependencies,
    event.concentrationMmolPerL,
    GLUCOSE_FRACTION_DIGITS,
  );
  const unit = dependencies.labels.units.glucoseMmolPerL;
  const measurement = formatMeasurementPresentation(dependencies, value, unit);

  return {
    cardType: CARD_TYPE_BY_KIND.glucose,
    context: resolveGlucoseContextLabel(dependencies, event.context),
    kindLabel: dependencies.labels.eventKinds.glucose,
    measurement,
    search: {
      localizedLabels: [
        dependencies.labels.eventKinds.glucose,
        unit,
        ...(event.context
          ? [dependencies.labels.glucoseContexts[event.context]]
          : []),
      ],
      userContent: [String(event.concentrationMmolPerL)],
    },
    title: dependencies.labels.eventKinds.glucose,
  };
}

function mapInsulinPresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'insulin' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const value = formatMedicalNumber(
    dependencies,
    event.doseUnits,
    INSULIN_FRACTION_DIGITS,
  );
  const unit = dependencies.labels.units.insulinDose;
  const measurement = formatMeasurementPresentation(dependencies, value, unit);

  return {
    cardType: CARD_TYPE_BY_KIND.insulin,
    context: event.context,
    kindLabel: dependencies.labels.eventKinds.insulin,
    measurement,
    search: {
      localizedLabels: [dependencies.labels.eventKinds.insulin, unit],
      userContent: [
        event.preparation,
        String(event.doseUnits),
        event.context ?? '',
      ],
    },
    title: event.preparation,
  };
}

function mapNutritionPresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'nutrition' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const value = formatMedicalNumber(dependencies, event.carbohydratesGrams, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const unit = dependencies.labels.units.nutritionCarbs;
  const measurement = formatMeasurementPresentation(dependencies, value, unit);
  const title = resolveMealTypeTitle(dependencies, event.mealType);

  return {
    cardType: CARD_TYPE_BY_KIND.nutrition,
    context: undefined,
    kindLabel: dependencies.labels.eventKinds.nutrition,
    measurement,
    note: event.note ?? null,
    search: {
      localizedLabels: [dependencies.labels.eventKinds.nutrition, unit],
      userContent: [
        title,
        String(event.carbohydratesGrams),
        event.note ?? '',
        event.mode,
      ],
    },
    title,
  };
}

function mapMedicationPresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'medication' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const value = formatMedicalNumber(dependencies, event.dose, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const unit = resolveMedicationUnitLabel(dependencies, event.doseUnit);
  const measurement = formatMeasurementPresentation(dependencies, value, unit);

  return {
    cardType: CARD_TYPE_BY_KIND.medication,
    context: event.context,
    kindLabel: dependencies.labels.eventKinds.medication,
    measurement,
    note: event.note ?? null,
    search: {
      localizedLabels: [dependencies.labels.eventKinds.medication, unit],
      userContent: [
        event.medicationName,
        String(event.dose),
        event.context ?? '',
        event.note ?? '',
      ],
    },
    title: event.medicationName,
  };
}

function mapActivityPresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'activity' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const minutes = event.durationSeconds / 60;
  const value = formatMedicalNumber(dependencies, minutes, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const unit = dependencies.labels.units.activityMinutes;
  const measurement = formatMeasurementPresentation(dependencies, value, unit);

  return {
    cardType: CARD_TYPE_BY_KIND.activity,
    context: undefined,
    kindLabel: dependencies.labels.eventKinds.activity,
    measurement,
    note: event.note ?? null,
    search: {
      localizedLabels: [dependencies.labels.eventKinds.activity, unit],
      userContent: [
        event.activityType,
        String(event.durationSeconds),
        event.note ?? '',
      ],
    },
    title: event.activityType,
  };
}

function mapNotePresentation(
  event: Extract<SemanticTimelineEvent, { kind: 'note' }>,
  dependencies: TimelinePresentationDependencies,
) {
  const title = event.title?.trim() || dependencies.labels.noteFallbackTitle;

  return {
    cardType: CARD_TYPE_BY_KIND.note,
    context: undefined,
    kindLabel: dependencies.labels.eventKinds.note,
    measurement: formatMeasurementPresentation(dependencies, event.body, ''),
    note: null,
    search: {
      localizedLabels: [
        dependencies.labels.eventKinds.note,
        dependencies.labels.noteFallbackTitle,
      ],
      userContent: [title, event.body],
    },
    title,
  };
}

type TimelineKindPresentationResult = TimelineKindPresentation;

function mapTimelineKindPresentation(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): TimelineKindPresentationResult {
  switch (event.kind) {
    case 'activity':
      return mapActivityPresentation(event, dependencies);
    case 'glucose':
      return mapGlucosePresentation(event, dependencies);
    case 'insulin':
      return mapInsulinPresentation(event, dependencies);
    case 'medication':
      return mapMedicationPresentation(event, dependencies);
    case 'note':
      return mapNotePresentation(event, dependencies);
    case 'nutrition':
      return mapNutritionPresentation(event, dependencies);
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

export function formatTimelineGlucoseDisplayValue(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
  dependencies: TimelinePresentationDependencies,
): string {
  return mapGlucosePresentation(event, dependencies).measurement.display;
}

export function mapTimelineEventCardPresentation(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
  time: string,
): TimelineEventCardPresentation {
  const presentation = mapTimelineKindPresentation(event, dependencies);

  return {
    cardType: presentation.cardType,
    context: presentation.context,
    time,
    title: presentation.title,
    unit: presentation.measurement.unit,
    value: presentation.measurement.value,
  };
}

export function mapTimelineEventDetailPresentation(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): TimelineEventDetailPresentation {
  const presentation = mapTimelineKindPresentation(event, dependencies);

  return {
    context: presentation.context ?? null,
    kindLabel: presentation.kindLabel,
    note:
      event.kind === 'nutrition' ||
      event.kind === 'medication' ||
      event.kind === 'activity'
        ? (presentation.note ?? null)
        : null,
    primaryText: presentation.measurement.display,
    title: presentation.title,
  };
}

export function mapTimelineSearchPresentation(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): TimelineSearchPresentation {
  const presentation = mapTimelineKindPresentation(event, dependencies);

  return {
    localizedLabels: [
      ...presentation.search.localizedLabels,
      dependencies.labels.eventKinds[event.kind],
      event.kind,
    ],
    userContent: presentation.search.userContent,
  };
}

export function mapTimelineLegacyRepositoryProjection(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): {
  readonly context: string | undefined;
  readonly note: string | undefined;
  readonly title: string;
  readonly unit: string | undefined;
  readonly value: string;
} {
  const presentation = mapTimelineKindPresentation(event, dependencies);

  return {
    context: presentation.context,
    note:
      event.kind === 'nutrition' ||
      event.kind === 'medication' ||
      event.kind === 'activity'
        ? (presentation.note ?? undefined)
        : undefined,
    title: presentation.title,
    unit: presentation.measurement.unit || undefined,
    value:
      event.kind === 'note'
        ? event.body
        : event.kind === 'activity'
          ? presentation.measurement.value
          : presentation.measurement.display,
  };
}

export const timelinePresentationKindMappers = {
  activity: mapActivityPresentation,
  glucose: mapGlucosePresentation,
  insulin: mapInsulinPresentation,
  medication: mapMedicationPresentation,
  note: mapNotePresentation,
  nutrition: mapNutritionPresentation,
} as const;
