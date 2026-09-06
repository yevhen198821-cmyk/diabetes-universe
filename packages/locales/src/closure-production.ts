import { CANONICAL_TRANSLATION_KEYS } from './contracts/canonical-translation-key';

/**
 * Reachable Localization Platform closure namespaces.
 *
 * Nutrition/Activity architecture remains out of scope, but Timeline and
 * Dashboard chrome that already names those categories is in this wave.
 */
export const CLOSURE_PRODUCTION_NAMESPACE_PREFIXES = [
  'account.',
  'common.',
  'dashboard.',
  'errors.',
  'quick-add.',
  'timeline.',
  'validation.',
] as const;

export type ClosureProductionLocale = 'de-DE' | 'ru-RU' | 'uk-UA';

/**
 * Keys that may legally equal English in every approved locale because they
 * are brand, SI/clinical unit symbols, product names, or time-range literals.
 *
 * Do not add ordinary English UI sentences here.
 */
export const CLOSURE_PRODUCTION_SHARED_COGNATE_KEYS = new Set<string>([
  'account.auth.signIn.emailLabel',
  'account.diabetesManagement.glucose.unitMg',
  'account.diabetesManagement.glucose.unitMmol',
  'dashboard.header.brandLineAccent',
  'dashboard.header.brandLinePrimary',
  'dashboard.header.brandName',
  'quick-add.insulin.dosePlaceholder',
  'quick-add.nutrition.carbsPlaceholder',
  'quick-add.nutrition.weightPlaceholder',
  'timeline.dayPeriod.timeRange.day',
  'timeline.dayPeriod.timeRange.evening',
  'timeline.dayPeriod.timeRange.morning',
  'timeline.dayPeriod.timeRange.night',
  'timeline.insulinPreparation.aspart_fiasp',
  'timeline.insulinPreparation.aspart_novorapid',
  'timeline.insulinPreparation.degludec_tresiba',
  'timeline.insulinPreparation.glargine_lantus',
  'timeline.insulinPreparation.glulisine_apidra',
  'timeline.insulinPreparation.lispro_humalog',
]);

/**
 * Keys that may legally equal English only in the listed locale.
 *
 * German keeps medical/technical cognates such as `Insulin` and `Basal`.
 * Ukrainian and Russian translate those labels and only keep `Email`.
 */
export const CLOSURE_PRODUCTION_LOCALE_COGNATE_KEYS: Readonly<
  Record<ClosureProductionLocale, ReadonlySet<string>>
> = {
  'de-DE': new Set([
    'account.profile.about.page.buildInfoLabel',
    'account.profile.about.versionLabel',
    'dashboard.daySummary.metrics.totalInsulin',
    'dashboard.recentEvents.categories.insulin',
    'quick-add.glucose.unitMg',
    'quick-add.glucose.unitMmol',
    'timeline.eventKind.insulin',
    'timeline.filter.insulin',
    'timeline.insulinContext.basal',
    'quick-add.nutrition.carbsUnit',
    'timeline.mealType.snack',
    'timeline.units.glucoseMgPerDl',
    'timeline.units.glucoseMmolPerL',
    'timeline.units.massG',
    'timeline.units.massMg',
    'timeline.units.volumeMl',
  ]),
  'ru-RU': new Set(['account.profile.userCard.emailLabel']),
  'uk-UA': new Set(['account.profile.userCard.emailLabel']),
};

export function isClosureProductionCognateKey(
  locale: ClosureProductionLocale,
  key: string,
): boolean {
  return (
    CLOSURE_PRODUCTION_SHARED_COGNATE_KEYS.has(key) ||
    CLOSURE_PRODUCTION_LOCALE_COGNATE_KEYS[locale].has(key)
  );
}

export const CLOSURE_PRODUCTION_COGNATE_KEYS = new Set<string>([
  ...CLOSURE_PRODUCTION_SHARED_COGNATE_KEYS,
  ...CLOSURE_PRODUCTION_LOCALE_COGNATE_KEYS['de-DE'],
  ...CLOSURE_PRODUCTION_LOCALE_COGNATE_KEYS['ru-RU'],
  ...CLOSURE_PRODUCTION_LOCALE_COGNATE_KEYS['uk-UA'],
]);

export function isClosureProductionKey(key: string): boolean {
  return CLOSURE_PRODUCTION_NAMESPACE_PREFIXES.some((prefix) =>
    key.startsWith(prefix),
  );
}

export const CLOSURE_PRODUCTION_KEYS = CANONICAL_TRANSLATION_KEYS.filter(
  (key) => isClosureProductionKey(key),
);
