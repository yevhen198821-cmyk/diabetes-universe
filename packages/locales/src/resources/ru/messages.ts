import { defineDraftMessages } from '../../contracts';
import { englishCanonicalMessages } from '../en/messages';

/**
 * Russian draft bundle.
 *
 * English values are temporary placeholders until professional translation.
 */
export const russianDraftMessages = defineDraftMessages({
  ...englishCanonicalMessages,
});
