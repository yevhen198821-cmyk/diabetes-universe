import type { TranslationResource } from '../../contracts';
import { englishMetadata } from '../../metadata/en';
import { englishCanonicalMessages } from './messages';

export { englishCanonicalMessages } from './messages';

export const englishTranslationResource = {
  metadata: englishMetadata,
  messages: englishCanonicalMessages,
} satisfies TranslationResource<'approved'>;
