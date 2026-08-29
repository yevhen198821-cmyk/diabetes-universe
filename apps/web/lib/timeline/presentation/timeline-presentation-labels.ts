import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type {
  GlucoseMeasurementContext,
  NutritionMealType,
  TimelineEventKind,
} from '@diabetes-universe/types';

import type { TimelineFilterLabelKey } from './timeline-presentation-types';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

export interface TimelinePresentationLabels {
  readonly eventKinds: Readonly<Record<TimelineEventKind, string>>;
  readonly filters: Readonly<Record<TimelineEventKind | 'all', string>>;
  readonly glucoseContexts: Readonly<Record<GlucoseMeasurementContext, string>>;
  readonly glucoseRangeCurrentBasis: string;
  readonly groups: Readonly<{
    readonly earlier: string;
    readonly today: string;
    readonly yesterday: string;
  }>;
  readonly mealTypes: Readonly<Record<NutritionMealType, string>>;
  readonly noteFallbackTitle: string;
  readonly openEventAriaPrefix: string;
  readonly units: Readonly<{
    readonly activityMinutes: string;
    readonly glucoseMgPerDl: string;
    readonly glucoseMmolPerL: string;
    readonly insulinDose: string;
    readonly massG: string;
    readonly massMg: string;
    readonly nutritionCarbs: string;
    readonly volumeMl: string;
  }>;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveTimelinePresentationLabels(
  localization: LocalizationPlatform,
): TimelinePresentationLabels {
  const eventKindKeys = {
    activity: asTranslationKey('timeline.eventKind.activity'),
    glucose: asTranslationKey('timeline.eventKind.glucose'),
    insulin: asTranslationKey('timeline.eventKind.insulin'),
    medication: asTranslationKey('timeline.eventKind.medication'),
    note: asTranslationKey('timeline.eventKind.note'),
    nutrition: asTranslationKey('timeline.eventKind.nutrition'),
  } satisfies Record<TimelineEventKind, TranslationKey>;

  const filterKeys = {
    activity: 'timeline.filter.activity',
    all: 'timeline.filter.all',
    glucose: 'timeline.filter.glucose',
    insulin: 'timeline.filter.insulin',
    medication: 'timeline.filter.medication',
    note: 'timeline.filter.note',
    nutrition: 'timeline.filter.nutrition',
  } as const satisfies Record<
    TimelineEventKind | 'all',
    TimelineFilterLabelKey
  >;

  return {
    eventKinds: {
      activity: translate(localization, eventKindKeys.activity),
      glucose: translate(localization, eventKindKeys.glucose),
      insulin: translate(localization, eventKindKeys.insulin),
      medication: translate(localization, eventKindKeys.medication),
      note: translate(localization, eventKindKeys.note),
      nutrition: translate(localization, eventKindKeys.nutrition),
    },
    filters: {
      activity: translate(localization, asTranslationKey(filterKeys.activity)),
      all: translate(localization, asTranslationKey(filterKeys.all)),
      glucose: translate(localization, asTranslationKey(filterKeys.glucose)),
      insulin: translate(localization, asTranslationKey(filterKeys.insulin)),
      medication: translate(
        localization,
        asTranslationKey(filterKeys.medication),
      ),
      note: translate(localization, asTranslationKey(filterKeys.note)),
      nutrition: translate(
        localization,
        asTranslationKey(filterKeys.nutrition),
      ),
    },
    glucoseRangeCurrentBasis: translate(
      localization,
      asTranslationKey('timeline.glucose.range.currentBasis'),
    ),
    glucoseContexts: {
      after_meal: translate(
        localization,
        asTranslationKey('timeline.glucoseContext.after_meal'),
      ),
      before_meal: translate(
        localization,
        asTranslationKey('timeline.glucoseContext.before_meal'),
      ),
      bedtime: translate(
        localization,
        asTranslationKey('timeline.glucoseContext.bedtime'),
      ),
      fasting: translate(
        localization,
        asTranslationKey('timeline.glucoseContext.fasting'),
      ),
      other: translate(
        localization,
        asTranslationKey('timeline.glucoseContext.other'),
      ),
    },
    groups: {
      earlier: translate(
        localization,
        asTranslationKey('timeline.group.earlier'),
      ),
      today: translate(localization, asTranslationKey('timeline.group.today')),
      yesterday: translate(
        localization,
        asTranslationKey('timeline.group.yesterday'),
      ),
    },
    mealTypes: {
      breakfast: translate(
        localization,
        asTranslationKey('timeline.mealType.breakfast'),
      ),
      dinner: translate(
        localization,
        asTranslationKey('timeline.mealType.dinner'),
      ),
      lunch: translate(
        localization,
        asTranslationKey('timeline.mealType.lunch'),
      ),
      other: translate(
        localization,
        asTranslationKey('timeline.mealType.other'),
      ),
      snack: translate(
        localization,
        asTranslationKey('timeline.mealType.snack'),
      ),
    },
    noteFallbackTitle: translate(
      localization,
      asTranslationKey('timeline.note.fallbackTitle'),
    ),
    openEventAriaPrefix: translate(
      localization,
      asTranslationKey('timeline.eventCard.openAriaPrefix'),
    ),
    units: {
      activityMinutes: translate(
        localization,
        asTranslationKey('timeline.units.activityMinutes'),
      ),
      glucoseMgPerDl: translate(
        localization,
        asTranslationKey('timeline.units.glucoseMgPerDl'),
      ),
      glucoseMmolPerL: translate(
        localization,
        asTranslationKey('timeline.units.glucoseMmolPerL'),
      ),
      insulinDose: translate(
        localization,
        asTranslationKey('timeline.units.insulinDose'),
      ),
      massG: translate(localization, asTranslationKey('timeline.units.massG')),
      massMg: translate(
        localization,
        asTranslationKey('timeline.units.massMg'),
      ),
      nutritionCarbs: translate(
        localization,
        asTranslationKey('timeline.units.nutritionCarbs'),
      ),
      volumeMl: translate(
        localization,
        asTranslationKey('timeline.units.volumeMl'),
      ),
    },
  };
}
