import type { NextStepPriority } from '@diabetes-universe/types';

import type { NextActionPriority } from './next-action-types';

export function mapEnginePriorityToNextStepPriority(
  priority: NextActionPriority,
): NextStepPriority {
  switch (priority) {
    case 'critical':
    case 'important':
      return 'high';
    case 'recommended':
    case 'informational':
      return 'normal';
    default: {
      const exhaustive: never = priority;
      throw new Error(`Unhandled NextActionPriority: ${String(exhaustive)}`);
    }
  }
}
