import type { TranslationResource } from '../../contracts';
import { ukrainianMetadata } from '../../metadata/uk';
import { ukrainianDraftMessages } from './messages';

export const ukrainianTranslationResource = {
  metadata: ukrainianMetadata,
  messages: ukrainianDraftMessages,
} satisfies TranslationResource<'draft'>;
