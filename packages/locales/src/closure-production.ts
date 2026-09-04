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

/**
 * Keys that may legally equal the English source because they are brand,
 * unit symbols, product names, or shared medical/technical cognates.
 *
 * Do not add ordinary English UI sentences here.
 */
export const CLOSURE_PRODUCTION_COGNATE_KEYS = new Set<string>([
  'account.auth.signIn.emailLabel',
  'account.diabetesManagement.glucose.unitMg',
  'account.diabetesManagement.glucose.unitMmol',
  'account.profile.about.page.buildInfoLabel',
  'account.profile.about.versionLabel',
  'account.profile.userCard.emailLabel',
  'dashboard.daySummary.metrics.totalInsulin',
  'dashboard.header.brandLineAccent',
  'dashboard.header.brandLinePrimary',
  'dashboard.header.brandName',
  'dashboard.recentEvents.categories.insulin',
  'quick-add.glucose.unitMg',
  'quick-add.glucose.unitMmol',
  'quick-add.insulin.dosePlaceholder',
  'timeline.dayPeriod.timeRange.day',
  'timeline.dayPeriod.timeRange.evening',
  'timeline.dayPeriod.timeRange.morning',
  'timeline.dayPeriod.timeRange.night',
  'timeline.eventKind.insulin',
  'timeline.filter.insulin',
  'timeline.insulinContext.basal',
  'timeline.insulinPreparation.aspart_fiasp',
  'timeline.insulinPreparation.aspart_novorapid',
  'timeline.insulinPreparation.degludec_tresiba',
  'timeline.insulinPreparation.glargine_lantus',
  'timeline.insulinPreparation.glulisine_apidra',
  'timeline.insulinPreparation.lispro_humalog',
  'timeline.mealType.snack',
  'timeline.units.glucoseMgPerDl',
  'timeline.units.glucoseMmolPerL',
  'timeline.units.massG',
  'timeline.units.massMg',
  'timeline.units.volumeMl',
]);

export function isClosureProductionKey(key: string): boolean {
  return CLOSURE_PRODUCTION_NAMESPACE_PREFIXES.some((prefix) =>
    key.startsWith(prefix),
  );
}

export const CLOSURE_PRODUCTION_KEYS = CANONICAL_TRANSLATION_KEYS.filter(
  (key) => isClosureProductionKey(key),
);
