import type { TranslationResource } from '../../contracts';
import { russianMetadata } from '../../metadata/ru';
import { russianDraftMessages } from './messages';

export const russianTranslationResource = {
  metadata: russianMetadata,
  messages: russianDraftMessages,
} satisfies TranslationResource<'draft'>;
