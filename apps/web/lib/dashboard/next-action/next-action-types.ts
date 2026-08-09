import type {
  QuickAddCategory,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

export type NextActionRuleId = string;

export type NextActionPriority =
  'critical' | 'important' | 'recommended' | 'informational';

export type NextActionDecisionSource =
  'contextual-rule' | 'compatibility-default' | 'neutral-fallback';

export type NextActionQuickAddIntent = Readonly<{
  kind: 'quick-add';
  category: QuickAddCategory;
  labelKey: string;
}>;

export type NextActionNavigateIntent = Readonly<{
  kind: 'navigate';
  destination: '/timeline';
}>;

export type NextActionNoneIntent = Readonly<{
  kind: 'none';
}>;

export type NextActionIntent =
  NextActionQuickAddIntent | NextActionNavigateIntent | NextActionNoneIntent;

/**
 * Applicable payload returned by a contextual rule evaluator.
 * Ranking metadata (priority, ruleId, source) is owned exclusively by NextActionRule
 * and assembled by the engine — never by the evaluator return value.
 */
export type NextActionRulePayload = Readonly<{
  action: NextActionIntent;
  descriptionKey?: string;
  messageKey: string;
}>;

export type NextActionDecision = Readonly<{
  action: NextActionIntent;
  descriptionKey?: string;
  messageKey: string;
  priority: NextActionPriority;
  ruleId?: NextActionRuleId;
  source: NextActionDecisionSource;
}>;

export type NextActionContext = Readonly<{
  latestGlucose?: Readonly<{ dateTime: string; value: string }>;
  now: Date;
  quickAddAvailability: Readonly<{
    availableCategories: readonly QuickAddCategory[];
  }>;
  recentTimelineEvents: readonly SemanticTimelineEvent[];
}>;

export type NextActionRule = Readonly<{
  evaluate: (context: NextActionContext) => NextActionRulePayload | null;
  priority: NextActionPriority;
  ruleId: NextActionRuleId;
  tieBreakRank: number;
}>;

export type NextActionEvaluationOptions = Readonly<{
  rules?: readonly NextActionRule[];
}>;
