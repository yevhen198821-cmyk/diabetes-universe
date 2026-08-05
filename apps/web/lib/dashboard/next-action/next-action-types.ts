import type { QuickAddCategory, TimelineEvent } from '@diabetes-universe/types';

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
  recentTimelineEvents: readonly TimelineEvent[];
}>;

export type NextActionRule = Readonly<{
  evaluate: (context: NextActionContext) => NextActionDecision | null;
  priority: NextActionPriority;
  ruleId: NextActionRuleId;
  tieBreakRank: number;
}>;

export type NextActionEvaluationOptions = Readonly<{
  rules?: readonly NextActionRule[];
}>;
