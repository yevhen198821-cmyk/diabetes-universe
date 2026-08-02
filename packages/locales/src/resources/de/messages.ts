import { defineDraftMessages } from '../../contracts';
import { englishCanonicalMessages } from '../en/messages';

/**
 * German draft bundle.
 *
 * English values are temporary placeholders until professional translation.
 */
export const germanDraftMessages = defineDraftMessages({
  ...englishCanonicalMessages,
});
