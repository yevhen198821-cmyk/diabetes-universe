/**
 * Diabetes Universe locale resource package.
 *
 * Canonical English resources and draft bundles for supported languages.
 * Runtime loading and formatting are not implemented in this sprint.
 */

export type {
  ApprovedTranslationMessages,
  CanonicalTranslationKey,
  DraftTranslationMessages,
  TranslationBundleStatus,
  TranslationMetadata,
  TranslationNamespace,
  TranslationResource,
} from './contracts';

export {
  CANONICAL_TRANSLATION_KEYS,
  defineApprovedMessages,
  defineDraftMessages,
} from './contracts';

export {
  CANONICAL_NAMESPACES,
  QUICK_ADD_NAMESPACE,
  type CanonicalNamespace,
} from './namespaces';

export {
  englishMetadata,
  germanMetadata,
  russianMetadata,
  ukrainianMetadata,
} from './metadata';

export {
  englishCanonicalMessages,
  englishTranslationResource,
} from './resources/en';
export { germanTranslationResource } from './resources/de';
export { russianTranslationResource } from './resources/ru';
export { ukrainianTranslationResource } from './resources/uk';
