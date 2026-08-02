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
  'dashboard.header.addEvent': 'Add event',
  'dashboard.header.avatar.action': 'Open profile',
  'dashboard.header.avatar.label': 'User profile',
  'dashboard.header.date.label': 'Current date',
  'dashboard.header.date.unavailable': 'Date unavailable',
  'dashboard.header.error.default': 'Could not load header data.',
  'dashboard.header.loading': 'Loading header',
  'dashboard.header.title': 'Diabetes Universe',
  'dashboard.lastGlucose.eyebrow': 'Last measurement',
  'dashboard.lastGlucose.empty.default': 'No measurements yet.',
  'dashboard.lastGlucose.error.default': 'Could not load the last measurement.',
  'dashboard.lastGlucose.loading': 'Loading last glucose measurement',
  'dashboard.lastGlucose.stale': 'Measurement is outdated.',
  'dashboard.lastGlucose.title': 'Last glucose',
  'dashboard.lastGlucose.unavailable': 'Last measurement unavailable.',
  'dashboard.nextAction.action': 'Add',
  'dashboard.nextAction.description': 'Add insulin',
  'dashboard.nextAction.empty.description': 'New actions will appear here.',
  'dashboard.nextAction.empty.title': 'No actions available',
  'dashboard.nextAction.error.description': 'Please try again later.',
  'dashboard.nextAction.error.title': 'Action unavailable',
  'dashboard.nextAction.loading': 'Loading next action',
  'dashboard.nextAction.title': 'Next action',
  'timeline.header.title': 'Timeline',
  'quick-add.button.label': 'Add event',
  'validation.required': 'This field is required',
  'errors.generic': 'Something went wrong. Please try again.',
});
