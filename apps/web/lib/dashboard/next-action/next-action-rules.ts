import type { NextActionRule } from './next-action-types';

const CONTEXTUAL_NEXT_ACTION_RULES: readonly NextActionRule[] = [];

export function getContextualNextActionRules(): readonly NextActionRule[] {
  return CONTEXTUAL_NEXT_ACTION_RULES;
}
