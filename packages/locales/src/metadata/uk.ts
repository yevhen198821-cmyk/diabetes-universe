import { CANONICAL_NAMESPACES } from '../namespaces';
import type { TranslationMetadata } from '../contracts';

export const ukrainianMetadata = {
  language: 'uk',
  locale: 'uk-UA',
  version: '1.0.0',
  status: 'approved',
  namespaces: CANONICAL_NAMESPACES,
} as const satisfies TranslationMetadata;
