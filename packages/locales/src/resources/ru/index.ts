import type { TranslationResource } from '../../contracts';
import { russianMetadata } from '../../metadata/ru';
import { russianCanonicalMessages } from './messages';

export { russianCanonicalMessages } from './messages';

export const russianTranslationResource = {
  metadata: russianMetadata,
  messages: russianCanonicalMessages,
} satisfies TranslationResource<'approved'>;
