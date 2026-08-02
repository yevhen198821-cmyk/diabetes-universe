import { CANONICAL_NAMESPACES } from '../namespaces';
import type { TranslationMetadata } from '../contracts';

export const russianMetadata = {
  language: 'ru',
  locale: 'ru-RU',
  version: '1.0.0',
  status: 'draft',
  namespaces: CANONICAL_NAMESPACES,
} as const satisfies TranslationMetadata;
