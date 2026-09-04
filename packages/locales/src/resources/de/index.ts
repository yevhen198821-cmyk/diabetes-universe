import type { TranslationResource } from '../../contracts';
import { germanMetadata } from '../../metadata/de';
import { germanCanonicalMessages } from './messages';

export { germanCanonicalMessages } from './messages';

export const germanTranslationResource = {
  metadata: germanMetadata,
  messages: germanCanonicalMessages,
} satisfies TranslationResource<'approved'>;
