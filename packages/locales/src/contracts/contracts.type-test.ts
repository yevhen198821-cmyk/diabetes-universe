import type { DraftTranslationMessages } from '../contracts';
import { defineDraftMessages } from '../contracts';

const validDraft = defineDraftMessages({
  'common.actions.save': 'Save',
});

void validDraft;

const invalidDraft: DraftTranslationMessages = {
  'common.actions.save': 'Save',
  // @ts-expect-error unknown translation keys are not allowed
  'unknown.key': 'Invalid',
};

void invalidDraft;
