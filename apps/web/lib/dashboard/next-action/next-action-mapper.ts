import type {
  NextStepPriority,
  QuickAddCategory,
} from '@diabetes-universe/types';

import { mapEnginePriorityToNextStepPriority } from './next-action-priority-map';
import { isNextActionDecisionPresentable } from './next-action-presentation-safety';
import type {
  NextActionContext,
  NextActionDecision,
  NextActionIntent,
} from './next-action-types';

const SUPPORTED_QUICK_ADD_CATEGORIES = new Set<QuickAddCategory>([
  'activity',
  'glucose',
  'insulin',
  'medication',
  'note',
  'nutrition',
]);

export type NextActionMappedPresentation = Readonly<{
  action: NextActionIntent;
  actionLabelKey?: string;
  descriptionKey?: string;
  messageKey: string;
  priority: NextStepPriority;
  source: NextActionDecision['source'];
}>;

function isSupportedQuickAddCategory(
  category: QuickAddCategory,
): category is QuickAddCategory {
  return SUPPORTED_QUICK_ADD_CATEGORIES.has(category);
}

function isSupportedActionIntent(
  context: NextActionContext,
  action: NextActionIntent,
): boolean {
  switch (action.kind) {
    case 'quick-add':
      return (
        isSupportedQuickAddCategory(action.category) &&
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

  return {
    action: decision.action,
    actionLabelKey:
      decision.action.kind === 'quick-add'
        ? decision.action.labelKey
        : undefined,
    descriptionKey: decision.descriptionKey,
    messageKey: decision.messageKey,
    priority: mapEnginePriorityToNextStepPriority(decision.priority),
    source: decision.source,
  };
}
