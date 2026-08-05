import type {
  NextStepPriority,
  QuickAddCategory,
} from '@diabetes-universe/types';

import { isDashboardQuickAddCategory } from './next-action-availability';
import { createNeutralFallbackDecision } from './next-action-fallback';
import { mapEnginePriorityToNextStepPriority } from './next-action-priority-map';
import { isNextActionDecisionPresentable } from './next-action-presentation-safety';
import type {
  NextActionContext,
  NextActionDecision,
  NextActionIntent,
  NextActionNavigateIntent,
  NextActionNoneIntent,
  NextActionQuickAddIntent,
} from './next-action-types';

type NextActionMappedBase = Readonly<{
  descriptionKey?: string;
  messageKey: string;
  priority: NextStepPriority;
  source: NextActionDecision['source'];
}>;

export type NextActionMappedQuickAddPresentation = NextActionMappedBase &
  Readonly<{
    action: NextActionQuickAddIntent;
    actionLabelKey: string;
    category: QuickAddCategory;
    kind: 'quick-add';
  }>;

export type NextActionMappedNavigatePresentation = NextActionMappedBase &
  Readonly<{
    action: NextActionNavigateIntent;
    destination: NextActionNavigateIntent['destination'];
    kind: 'navigate';
  }>;

export type NextActionMappedNonePresentation = NextActionMappedBase &
  Readonly<{
    action: NextActionNoneIntent;
    kind: 'none';
  }>;

export type NextActionMappedPresentation =
  | NextActionMappedQuickAddPresentation
  | NextActionMappedNavigatePresentation
  | NextActionMappedNonePresentation;

function isSupportedActionIntent(
  context: NextActionContext,
  action: NextActionIntent,
): boolean {
  switch (action.kind) {
    case 'quick-add':
      return (
        isDashboardQuickAddCategory(action.category) &&
        context.quickAddAvailability.availableCategories.includes(
          action.category,
        )
      );
    case 'navigate':
      return action.destination === '/timeline';
    case 'none':
      return true;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

function mapPresentableDecision(
  decision: NextActionDecision,
): NextActionMappedPresentation {
  const base = {
    descriptionKey: decision.descriptionKey,
    messageKey: decision.messageKey,
    priority: mapEnginePriorityToNextStepPriority(decision.priority),
    source: decision.source,
  } as const;

  switch (decision.action.kind) {
    case 'quick-add':
      return {
        ...base,
        action: decision.action,
        actionLabelKey: decision.action.labelKey,
        category: decision.action.category,
        kind: 'quick-add',
      };
    case 'navigate':
      return {
        ...base,
        action: decision.action,
        destination: decision.action.destination,
        kind: 'navigate',
      };
    case 'none':
      return {
        ...base,
        action: decision.action,
        kind: 'none',
      };
    default: {
      const exhaustive: never = decision.action;
      return exhaustive;
    }
  }
}

export function mapNextActionDecision(
  context: NextActionContext,
  decision: NextActionDecision,
): NextActionMappedPresentation | null {
  if (
    !isNextActionDecisionPresentable(context, decision) ||
    !isSupportedActionIntent(context, decision.action)
  ) {
    return null;
  }

  return mapPresentableDecision(decision);
}

/**
 * Maps the governed neutral fallback decision without requiring evaluation context.
 */
export function mapNeutralFallbackPresentation(): NextActionMappedNonePresentation {
  const decision = createNeutralFallbackDecision();

  return {
    action: { kind: 'none' },
    descriptionKey: decision.descriptionKey,
    kind: 'none',
    messageKey: decision.messageKey,
    priority: mapEnginePriorityToNextStepPriority(decision.priority),
    source: decision.source,
  };
}
