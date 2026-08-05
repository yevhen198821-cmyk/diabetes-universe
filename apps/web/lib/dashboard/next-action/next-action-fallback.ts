import type { NextActionDecision } from './next-action-types';

export const NEXT_ACTION_FALLBACK_MESSAGE_KEY =
  'dashboard.nextAction.fallback.title' as const;

export const NEXT_ACTION_FALLBACK_DESCRIPTION_KEY =
  'dashboard.nextAction.fallback.description' as const;

export function createNeutralFallbackDecision(): NextActionDecision {
  return {
    action: {
      kind: 'none',
    },
    descriptionKey: NEXT_ACTION_FALLBACK_DESCRIPTION_KEY,
    messageKey: NEXT_ACTION_FALLBACK_MESSAGE_KEY,
    priority: 'informational',
    source: 'neutral-fallback',
  };
}
