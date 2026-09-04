/**
 * Diabetes Universe locale resource package.
 *
 * Canonical approved resources for the four supported Web locales.
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
export {
  germanCanonicalMessages,
  germanTranslationResource,
} from './resources/de';
export {
  russianCanonicalMessages,
  russianTranslationResource,
} from './resources/ru';
export {
  ukrainianCanonicalMessages,
  ukrainianTranslationResource,
} from './resources/uk';
