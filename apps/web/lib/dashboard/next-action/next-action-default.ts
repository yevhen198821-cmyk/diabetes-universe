import type { NextActionDecision } from './next-action-types';

export const NEXT_ACTION_DEFAULT_MESSAGE_KEY =
  'dashboard.nextAction.title' as const;

export const NEXT_ACTION_DEFAULT_DESCRIPTION_KEY =
  'dashboard.nextAction.description' as const;

export const NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY =
  'dashboard.nextAction.action' as const;

export function createCompatibilityDefaultDecision(): NextActionDecision {
  return {
    action: {
      category: 'insulin',
      kind: 'quick-add',
      labelKey: NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY,
    },
    descriptionKey: NEXT_ACTION_DEFAULT_DESCRIPTION_KEY,
    messageKey: NEXT_ACTION_DEFAULT_MESSAGE_KEY,
    priority: 'recommended',
    source: 'compatibility-default',
  };
}
