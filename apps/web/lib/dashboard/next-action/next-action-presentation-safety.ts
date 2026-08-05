import type { QuickAddCategory } from '@diabetes-universe/types';

import type {
  NextActionContext,
  NextActionDecision,
} from './next-action-types';

export function isQuickAddCategoryAvailable(
  context: NextActionContext,
  category: QuickAddCategory,
): boolean {
  return context.quickAddAvailability.availableCategories.includes(category);
}

export function isNextActionDecisionPresentable(
  context: NextActionContext,
  decision: NextActionDecision,
): boolean {
  switch (decision.action.kind) {
    case 'quick-add':
      return isQuickAddCategoryAvailable(context, decision.action.category);
    case 'navigate':
      return decision.action.destination === '/timeline';
    case 'none':
      return true;
    default: {
      const exhaustive: never = decision.action;
      return exhaustive;
    }
  }
}
