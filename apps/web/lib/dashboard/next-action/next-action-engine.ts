import { createCompatibilityDefaultDecision } from './next-action-default';
import { createNeutralFallbackDecision } from './next-action-fallback';
import { isNextActionDecisionPresentable } from './next-action-presentation-safety';
import { getContextualNextActionRules } from './next-action-rules';
import type {
  NextActionContext,
  NextActionDecision,
  NextActionEvaluationOptions,
  NextActionPriority,
  NextActionRule,
  NextActionRuleId,
  NextActionRulePayload,
} from './next-action-types';

const NEXT_ACTION_PRIORITY_ORDER: readonly NextActionPriority[] = [
  'critical',
  'important',
  'recommended',
  'informational',
];

function compareNextActionPriority(
  left: NextActionPriority,
  right: NextActionPriority,
): number {
  return (
    NEXT_ACTION_PRIORITY_ORDER.indexOf(left) -
    NEXT_ACTION_PRIORITY_ORDER.indexOf(right)
  );
}

function compareContextualRuleMatches(
  left: Readonly<{ payload: NextActionRulePayload; rule: NextActionRule }>,
  right: Readonly<{ payload: NextActionRulePayload; rule: NextActionRule }>,
): number {
  const priorityComparison = compareNextActionPriority(
    left.rule.priority,
    right.rule.priority,
  );

  if (priorityComparison !== 0) {
    return priorityComparison;
  }

  if (left.rule.tieBreakRank !== right.rule.tieBreakRank) {
    return left.rule.tieBreakRank - right.rule.tieBreakRank;
  }

  return left.rule.ruleId.localeCompare(right.rule.ruleId);
}

function createContextualRuleDecision(
  rule: NextActionRule,
  payload: NextActionRulePayload,
): NextActionDecision {
  return {
    action: payload.action,
    descriptionKey: payload.descriptionKey,
    messageKey: payload.messageKey,
    priority: rule.priority,
    ruleId: rule.ruleId,
    source: 'contextual-rule',
  };
}

function evaluateContextualRules(
  context: NextActionContext,
  rules: readonly NextActionRule[],
): NextActionDecision | null {
  const matches = rules.flatMap((rule) => {
    const payload = rule.evaluate(context);

    if (!payload) {
      return [];
    }

    return [{ payload, rule }];
  });

  if (matches.length === 0) {
    return null;
  }

  const winner = [...matches].sort(compareContextualRuleMatches)[0];

  return createContextualRuleDecision(winner.rule, winner.payload);
}

export function evaluateNextAction(
  context: NextActionContext,
  options: NextActionEvaluationOptions = {},
): NextActionDecision {
  const rules = options.rules ?? getContextualNextActionRules();
  const contextualDecision = evaluateContextualRules(context, rules);

  if (contextualDecision) {
    if (isNextActionDecisionPresentable(context, contextualDecision)) {
      return contextualDecision;
    }

    return createNeutralFallbackDecision();
  }

  const defaultDecision = createCompatibilityDefaultDecision();

  if (isNextActionDecisionPresentable(context, defaultDecision)) {
    return defaultDecision;
  }

  return createNeutralFallbackDecision();
}

export function assertValidNextActionRuleId(ruleId: NextActionRuleId): void {
  if (ruleId.trim().length === 0) {
    throw new Error('NextActionRuleId must be a non-empty string.');
  }
}
