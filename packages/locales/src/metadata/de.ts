import { CANONICAL_NAMESPACES } from '../namespaces';
import type { TranslationMetadata } from '../contracts';

export const germanMetadata = {
  language: 'de',
  locale: 'de-DE',
  version: '1.0.0',
  status: 'draft',
  namespaces: CANONICAL_NAMESPACES,
} as const satisfies TranslationMetadata;
