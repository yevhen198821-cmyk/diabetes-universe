import type { PlatformFormatter } from '@diabetes-universe/formatting';
import {
  classifyNutritionTimelineEvent,
  isNutritionMealType,
} from '@diabetes-universe/medical-domain';
import type {
  NutritionItemSnapshot,
  NutritionMealType,
  NutritionProductSnapshot,
  NutritionTimelineEvent,
} from '@diabetes-universe/types';

export const NUTRITION_PRESENTATION_CARBS_FORMAT_OPTIONS = {
  maximumFractionDigits: 20,
  minimumFractionDigits: 0,
} as const;

export interface NutritionPresentationLabels {
  readonly carbsPer100: string;
  readonly carbohydrates: string;
  readonly items: string;
  readonly itemCarbs: string;
  readonly itemWeight: string;
  readonly mealTypes: Readonly<Record<NutritionMealType, string>>;
  readonly mealType: string;
}

export interface NutritionDetailItemPresentation {
  readonly carbohydratesDisplay: string;
  readonly carbsPer100Display: string | null;
  readonly name: string;
  readonly weightDisplay: string | null;
}

export interface NutritionTimelineDetailPresentation {
  readonly carbohydratesDisplay: string;
  readonly items: readonly NutritionDetailItemPresentation[];
  readonly mealTypeDisplay: string;
  readonly mealTypeIsCanonical: boolean;
  readonly note: string | null;
  readonly origin: 'canonical_v2' | 'legacy_v1' | 'invalid';
}

function formatCarbs(formatter: PlatformFormatter, value: number): string {
  return formatter.formatNumber(
    value,
    NUTRITION_PRESENTATION_CARBS_FORMAT_OPTIONS,
  );
}

function presentItem(
  formatter: PlatformFormatter,
  item: NutritionItemSnapshot,
): NutritionDetailItemPresentation {
  return {
    carbohydratesDisplay: formatCarbs(formatter, item.carbohydratesGrams),
    carbsPer100Display:
      item.carbsPer100Grams === undefined
        ? null
        : formatCarbs(formatter, item.carbsPer100Grams),
    name: item.name,
    weightDisplay:
      item.weightGrams === undefined
        ? null
        : formatCarbs(formatter, item.weightGrams),
  };
}

function presentLegacyProduct(
  formatter: PlatformFormatter,
  product: NutritionProductSnapshot,
): NutritionDetailItemPresentation {
  return {
    carbohydratesDisplay: formatCarbs(formatter, product.calculatedCarbsGrams),
    carbsPer100Display: formatCarbs(formatter, product.carbsPer100Grams),
    name: product.productName,
    weightDisplay: formatCarbs(formatter, product.weightGrams),
  };
}

export function presentNutritionFromTimelineEvent(input: {
  readonly event: NutritionTimelineEvent;
  readonly formatter: PlatformFormatter;
  readonly labels: NutritionPresentationLabels;
}): NutritionTimelineDetailPresentation {
  const { event, formatter, labels } = input;
  const classification = classifyNutritionTimelineEvent(event);
  const mealTypeIsCanonical = isNutritionMealType(event.mealType);
  const mealTypeDisplay = mealTypeIsCanonical
    ? labels.mealTypes[event.mealType]
    : String(event.mealType);
  const carbohydratesDisplay = formatCarbs(formatter, event.carbohydratesGrams);
  const note = event.note?.trim() ? event.note : null;

  if (classification.status === 'canonical_v2') {
    return {
      carbohydratesDisplay,
      items: (classification.value.items ?? []).map((item) =>
        presentItem(formatter, item),
      ),
      mealTypeDisplay,
      mealTypeIsCanonical,
      note,
      origin: 'canonical_v2',
    };
  }

  if (classification.status === 'legacy_v1' && event.schemaVersion === 1) {
    return {
      carbohydratesDisplay,
      items: (event.products ?? []).map((product) =>
        presentLegacyProduct(formatter, product),
      ),
      mealTypeDisplay,
      mealTypeIsCanonical,
      note,
      origin: 'legacy_v1',
    };
  }

  return {
    carbohydratesDisplay,
    items: [],
    mealTypeDisplay,
    mealTypeIsCanonical,
    note,
    origin: 'invalid',
  };
}
