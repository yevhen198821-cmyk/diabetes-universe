import { CANONICAL_NAMESPACES } from '../namespaces';
import type { TranslationMetadata } from '../contracts';

export const englishMetadata = {
  language: 'en',
  locale: 'en-GB',
  version: '1.0.0',
  status: 'approved',
  namespaces: CANONICAL_NAMESPACES,
} as const satisfies TranslationMetadata;
