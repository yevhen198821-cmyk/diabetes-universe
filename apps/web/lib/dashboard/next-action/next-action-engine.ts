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
  left: Readonly<{ decision: NextActionDecision; rule: NextActionRule }>,
  right: Readonly<{ decision: NextActionDecision; rule: NextActionRule }>,
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

function evaluateContextualRules(
  context: NextActionContext,
  rules: readonly NextActionRule[],
): NextActionDecision | null {
  const matches = rules.flatMap((rule) => {
    const decision = rule.evaluate(context);

    if (!decision) {
      return [];
    }

    return [{ decision, rule }];
  });

  if (matches.length === 0) {
    return null;
  }

  const winner = [...matches].sort(compareContextualRuleMatches)[0];

  return {
    ...winner.decision,
    ruleId: winner.rule.ruleId,
    source: 'contextual-rule',
  };
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
