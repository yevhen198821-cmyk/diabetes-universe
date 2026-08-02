import type { TranslationResource } from '../../contracts';
import { germanMetadata } from '../../metadata/de';
import { germanDraftMessages } from './messages';

export const germanTranslationResource = {
  metadata: germanMetadata,
  messages: germanDraftMessages,
} satisfies TranslationResource<'draft'>;
