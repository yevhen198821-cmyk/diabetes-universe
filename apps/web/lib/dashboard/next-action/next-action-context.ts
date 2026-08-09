import type {
  QuickAddCategory,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import { getLatestGlucoseEvent } from '../../timeline/timeline-selectors';
import type { NextActionContext } from './next-action-types';

export type CreateNextActionContextInput = Readonly<{
  events: readonly SemanticTimelineEvent[];
  now: Date;
  quickAddAvailability: Readonly<{
    availableCategories: readonly QuickAddCategory[];
  }>;
}>;

export function createNextActionContext(
  input: CreateNextActionContextInput,
): NextActionContext {
  const latestGlucoseEvent = getLatestGlucoseEvent(input.events);

  return {
    latestGlucose: latestGlucoseEvent
      ? {
          concentrationMmolPerL: latestGlucoseEvent.concentrationMmolPerL,
          occurredAt: latestGlucoseEvent.occurredAt,
        }
      : undefined,
    now: input.now,
    quickAddAvailability: {
      availableCategories: [...input.quickAddAvailability.availableCategories],
    },
    recentTimelineEvents: [...input.events],
  };
}
