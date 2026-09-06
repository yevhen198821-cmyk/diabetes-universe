import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type { NutritionMealType } from '@diabetes-universe/types';

import type { NutritionDemoProductId } from '../../lib/quick-add/nutrition-demo-products';
import { NUTRITION_QUICK_ADD_MEAL_TYPES } from '../../lib/quick-add/nutrition-quick-add-submit';

export interface NutritionQuickAddLabels {
  readonly addItem: string;
  readonly cancel: string;
  readonly carbsError: string;
  readonly carbsLabel: string;
  readonly carbsPer100Label: string;
  readonly carbsPlaceholder: string;
  readonly carbsUnit: string;
  readonly categoryDescription: string;
  readonly categoryLabel: string;
  readonly demoProducts: Readonly<Record<NutritionDemoProductId, string>>;
  readonly itemAriaLabel: string;
  readonly itemCarbsLabel: string;
  readonly itemLabel: string;
  readonly itemPlaceholder: string;
  readonly itemSheetTitle: string;
  readonly itemsHeading: string;
  readonly itemsHelp: string;
  readonly mealTypeLabel: string;
  readonly mealTypePlaceholder: string;
  readonly mealTypes: Readonly<
    Record<(typeof NUTRITION_QUICK_ADD_MEAL_TYPES)[number], string>
  >;
  readonly mealTypeSheetTitle: string;
  readonly mealTypeUnspecified: string;
  readonly modeItems: string;
  readonly modeLegend: string;
  readonly modeManual: string;
  readonly noteLabel: string;
  readonly noteOptional: string;
  readonly notePlaceholder: string;
  readonly removeItem: string;
  readonly save: string;
  readonly timeLabel: string;
  readonly title: string;
  readonly totalCarbsLabel: string;
  readonly weightError: string;
  readonly weightLabel: string;
  readonly weightPlaceholder: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export const NUTRITION_QUICK_ADD_TRANSLATION_KEYS = {
  addItem: asTranslationKey('quick-add.nutrition.addItem'),
  cancel: asTranslationKey('quick-add.nutrition.cancel'),
  carbsError: asTranslationKey('quick-add.nutrition.carbsError'),
  carbsLabel: asTranslationKey('quick-add.nutrition.carbsLabel'),
  carbsPer100Label: asTranslationKey('quick-add.nutrition.carbsPer100Label'),
  carbsPlaceholder: asTranslationKey('quick-add.nutrition.carbsPlaceholder'),
  carbsUnit: asTranslationKey('quick-add.nutrition.carbsUnit'),
  categoryDescription: asTranslationKey(
    'quick-add.nutrition.categoryDescription',
  ),
  categoryLabel: asTranslationKey('quick-add.nutrition.categoryLabel'),
  itemAriaLabel: asTranslationKey('quick-add.nutrition.itemAriaLabel'),
  itemCarbsLabel: asTranslationKey('quick-add.nutrition.itemCarbsLabel'),
  itemLabel: asTranslationKey('quick-add.nutrition.itemLabel'),
  itemPlaceholder: asTranslationKey('quick-add.nutrition.itemPlaceholder'),
  itemSheetTitle: asTranslationKey('quick-add.nutrition.itemSheetTitle'),
  itemsHeading: asTranslationKey('quick-add.nutrition.itemsHeading'),
  itemsHelp: asTranslationKey('quick-add.nutrition.itemsHelp'),
  mealTypeLabel: asTranslationKey('quick-add.nutrition.mealTypeLabel'),
  mealTypePlaceholder: asTranslationKey(
    'quick-add.nutrition.mealTypePlaceholder',
  ),
  mealTypeSheetTitle: asTranslationKey(
    'quick-add.nutrition.mealTypeSheetTitle',
  ),
  modeItems: asTranslationKey('quick-add.nutrition.mode.items'),
  modeLegend: asTranslationKey('quick-add.nutrition.modeLegend'),
  modeManual: asTranslationKey('quick-add.nutrition.mode.manual'),
  noteLabel: asTranslationKey('quick-add.nutrition.noteLabel'),
  noteOptional: asTranslationKey('quick-add.nutrition.noteOptional'),
  notePlaceholder: asTranslationKey('quick-add.nutrition.notePlaceholder'),
  removeItem: asTranslationKey('quick-add.nutrition.removeItem'),
  save: asTranslationKey('quick-add.nutrition.save'),
  timeLabel: asTranslationKey('quick-add.nutrition.timeLabel'),
  title: asTranslationKey('quick-add.nutrition.title'),
  totalCarbsLabel: asTranslationKey('quick-add.nutrition.totalCarbsLabel'),
  weightError: asTranslationKey('quick-add.nutrition.weightError'),
  weightLabel: asTranslationKey('quick-add.nutrition.weightLabel'),
  weightPlaceholder: asTranslationKey('quick-add.nutrition.weightPlaceholder'),
} as const;

const DEMO_PRODUCT_KEYS = {
  apple: asTranslationKey('quick-add.nutrition.demoProduct.apple'),
  banana: asTranslationKey('quick-add.nutrition.demoProduct.banana'),
  milk: asTranslationKey('quick-add.nutrition.demoProduct.milk'),
  oatmealCooked: asTranslationKey(
    'quick-add.nutrition.demoProduct.oatmealCooked',
  ),
  plainYogurt: asTranslationKey('quick-add.nutrition.demoProduct.plainYogurt'),
  potatoBoiled: asTranslationKey(
    'quick-add.nutrition.demoProduct.potatoBoiled',
  ),
  riceBoiled: asTranslationKey('quick-add.nutrition.demoProduct.riceBoiled'),
  wholegrainBread: asTranslationKey(
    'quick-add.nutrition.demoProduct.wholegrainBread',
  ),
} as const;

const MEAL_TYPE_KEYS = {
  breakfast: asTranslationKey('timeline.mealType.breakfast'),
  dinner: asTranslationKey('timeline.mealType.dinner'),
  lunch: asTranslationKey('timeline.mealType.lunch'),
  other: asTranslationKey('timeline.mealType.other'),
  snack: asTranslationKey('timeline.mealType.snack'),
  unspecified: asTranslationKey('timeline.mealType.unspecified'),
} as const;

export function resolveNutritionMealTypeLabel(
  localization: LocalizationPlatform,
  mealType: NutritionMealType,
): string {
  return translate(localization, MEAL_TYPE_KEYS[mealType]);
}

export function resolveNutritionQuickAddLabels(
  localization: LocalizationPlatform,
): NutritionQuickAddLabels {
  const keys = NUTRITION_QUICK_ADD_TRANSLATION_KEYS;

  return {
    addItem: translate(localization, keys.addItem),
    cancel: translate(localization, keys.cancel),
    carbsError: translate(localization, keys.carbsError),
    carbsLabel: translate(localization, keys.carbsLabel),
    carbsPer100Label: translate(localization, keys.carbsPer100Label),
    carbsPlaceholder: translate(localization, keys.carbsPlaceholder),
    carbsUnit: translate(localization, keys.carbsUnit),
    categoryDescription: translate(localization, keys.categoryDescription),
    categoryLabel: translate(localization, keys.categoryLabel),
    demoProducts: {
      apple: translate(localization, DEMO_PRODUCT_KEYS.apple),
      banana: translate(localization, DEMO_PRODUCT_KEYS.banana),
      milk: translate(localization, DEMO_PRODUCT_KEYS.milk),
      oatmealCooked: translate(localization, DEMO_PRODUCT_KEYS.oatmealCooked),
      plainYogurt: translate(localization, DEMO_PRODUCT_KEYS.plainYogurt),
      potatoBoiled: translate(localization, DEMO_PRODUCT_KEYS.potatoBoiled),
      riceBoiled: translate(localization, DEMO_PRODUCT_KEYS.riceBoiled),
      wholegrainBread: translate(
        localization,
        DEMO_PRODUCT_KEYS.wholegrainBread,
      ),
    },
    itemAriaLabel: translate(localization, keys.itemAriaLabel),
    itemCarbsLabel: translate(localization, keys.itemCarbsLabel),
    itemLabel: translate(localization, keys.itemLabel),
    itemPlaceholder: translate(localization, keys.itemPlaceholder),
    itemSheetTitle: translate(localization, keys.itemSheetTitle),
    itemsHeading: translate(localization, keys.itemsHeading),
    itemsHelp: translate(localization, keys.itemsHelp),
    mealTypeLabel: translate(localization, keys.mealTypeLabel),
    mealTypePlaceholder: translate(localization, keys.mealTypePlaceholder),
    mealTypes: {
      breakfast: translate(localization, MEAL_TYPE_KEYS.breakfast),
      dinner: translate(localization, MEAL_TYPE_KEYS.dinner),
      lunch: translate(localization, MEAL_TYPE_KEYS.lunch),
      other: translate(localization, MEAL_TYPE_KEYS.other),
      snack: translate(localization, MEAL_TYPE_KEYS.snack),
    },
    mealTypeSheetTitle: translate(localization, keys.mealTypeSheetTitle),
    mealTypeUnspecified: translate(localization, MEAL_TYPE_KEYS.unspecified),
    modeItems: translate(localization, keys.modeItems),
    modeLegend: translate(localization, keys.modeLegend),
    modeManual: translate(localization, keys.modeManual),
    noteLabel: translate(localization, keys.noteLabel),
    noteOptional: translate(localization, keys.noteOptional),
    notePlaceholder: translate(localization, keys.notePlaceholder),
    removeItem: translate(localization, keys.removeItem),
    save: translate(localization, keys.save),
    timeLabel: translate(localization, keys.timeLabel),
    title: translate(localization, keys.title),
    totalCarbsLabel: translate(localization, keys.totalCarbsLabel),
    weightError: translate(localization, keys.weightError),
    weightLabel: translate(localization, keys.weightLabel),
    weightPlaceholder: translate(localization, keys.weightPlaceholder),
  };
}
