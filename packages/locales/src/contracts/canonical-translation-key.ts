/**
 * Canonical translation keys derived from the approved English resource set.
 */
export const CANONICAL_TRANSLATION_KEYS = [
  'common.actions.save',
  'common.actions.cancel',
  'common.actions.close',
  'dashboard.header.addEvent',
  'dashboard.header.avatar.action',
  'dashboard.header.avatar.label',
  'dashboard.header.date.label',
  'dashboard.header.date.unavailable',
  'dashboard.header.error.default',
  'dashboard.header.loading',
  'dashboard.header.title',
  'timeline.header.title',
  'quick-add.button.label',
  'validation.required',
  'errors.generic',
] as const;

export type CanonicalTranslationKey =
  (typeof CANONICAL_TRANSLATION_KEYS)[number];
