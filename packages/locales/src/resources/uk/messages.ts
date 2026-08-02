import { defineDraftMessages } from '../../contracts';
import { englishCanonicalMessages } from '../en/messages';

/**
 * Ukrainian draft bundle.
 *
 * English values are temporary placeholders until professional translation.
 */
export const ukrainianDraftMessages = defineDraftMessages({
  ...englishCanonicalMessages,
});
