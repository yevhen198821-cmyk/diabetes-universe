import {
  GLUCOSE_DATA_STALENESS_POLICY_ID,
  GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES,
  type GlucoseDataStalenessPolicyResult,
  type GlucoseDataStalenessPolicyOutcome,
} from '@diabetes-universe/platform';

import type {
  NextActionContext,
  NextActionRule,
  NextActionRulePayload,
} from './next-action-types';

export const NA001_GLUCOSE_STALENESS_RULE_ID = 'NA-001' as const;
export const NA001_GLUCOSE_STALENESS_MESSAGE_ID =
  'dashboard.nextAction.na001.glucoseDataStaleness.message' as const;
export const NA001_GLUCOSE_STALENESS_ACTION_LABEL_ID =
  'dashboard.nextAction.na001.glucoseDataStaleness.action' as const;

export type Na001GlucoseDataStalenessRuleContext = Readonly<{
  policyResult: unknown;
}>;

export function createNa001GlucoseDataStalenessRule(
  ruleContext: Na001GlucoseDataStalenessRuleContext,
): NextActionRule {
  return Object.freeze({
    evaluate: (context) => evaluateNa001Rule(context, ruleContext.policyResult),
    priority: 'informational',
    ruleId: NA001_GLUCOSE_STALENESS_RULE_ID,
    tieBreakRank: 1000,
  });
}

function evaluateNa001Rule(
  context: NextActionContext,
  policyResult: unknown,
): NextActionRulePayload | null {
  if (!isSupportedGp001PolicyResult(policyResult)) {
    return null;
  }

  if (policyResult.outcome !== 'attention-required') {
    return null;
  }

  if (!context.quickAddAvailability.availableCategories.includes('glucose')) {
    return null;
  }

  return {
    action: {
      category: 'glucose',
      kind: 'quick-add',
      labelKey: NA001_GLUCOSE_STALENESS_ACTION_LABEL_ID,
    },
    descriptionKey: policyResult.explanationProvenanceIdentity,
    messageKey: NA001_GLUCOSE_STALENESS_MESSAGE_ID,
  };
}

function isSupportedGp001PolicyResult(
  value: unknown,
): value is GlucoseDataStalenessPolicyResult {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.policyId === GLUCOSE_DATA_STALENESS_POLICY_ID &&
    typeof value.policyVersion === 'string' &&
    typeof value.explanationProvenanceIdentity === 'string' &&
    isGp001PolicyOutcome(value.outcome)
  );
}

function isGp001PolicyOutcome(
  value: unknown,
): value is GlucoseDataStalenessPolicyOutcome {
  return (
    typeof value === 'string' &&
    (GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES as readonly string[]).includes(
      value,
    )
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
