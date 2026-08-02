import { defineApprovedMessages } from '../../contracts/translation-resource';

/**
 * English canonical translation messages.
 *
 * This object is the source of truth for approved translation keys.
 */
export const englishCanonicalMessages = defineApprovedMessages({
  'common.actions.save': 'Save',
  'common.actions.cancel': 'Cancel',
  'common.actions.close': 'Close',
  'dashboard.header.title': 'Diabetes Universe',
  'timeline.header.title': 'Timeline',
  'quick-add.button.label': 'Add event',
  'validation.required': 'This field is required',
  'errors.generic': 'Something went wrong. Please try again.',
});
