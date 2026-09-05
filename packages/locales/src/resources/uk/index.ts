import type { TranslationResource } from '../../contracts';
import { ukrainianMetadata } from '../../metadata/uk';
import { ukrainianCanonicalMessages } from './messages';

export { ukrainianCanonicalMessages } from './messages';

export const ukrainianTranslationResource = {
  metadata: ukrainianMetadata,
  messages: ukrainianCanonicalMessages,
} satisfies TranslationResource<'approved'>;
