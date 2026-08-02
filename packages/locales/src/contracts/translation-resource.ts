import type { CanonicalTranslationKey } from './canonical-translation-key';
import type { TranslationMetadata } from './translation-metadata';

export type { CanonicalTranslationKey } from './canonical-translation-key';

export type ApprovedTranslationMessages = Readonly<
  Record<CanonicalTranslationKey, string>
>;

export type DraftTranslationMessages = Readonly<
  Partial<Record<CanonicalTranslationKey, string>>
>;

/**
 * Immutable translation resource bundle for one language/locale.
 */
export interface TranslationResource<
  TStatus extends TranslationMetadata['status'] = TranslationMetadata['status'],
> {
  readonly metadata: TranslationMetadata & { readonly status: TStatus };
  readonly messages: TStatus extends 'draft'
    ? DraftTranslationMessages
    : ApprovedTranslationMessages;
}

export function defineApprovedMessages(
  messages: Record<CanonicalTranslationKey, string>,
): ApprovedTranslationMessages {
  return messages;
}

export function defineDraftMessages(
  messages: DraftTranslationMessages,
): DraftTranslationMessages {
  return messages;
}
