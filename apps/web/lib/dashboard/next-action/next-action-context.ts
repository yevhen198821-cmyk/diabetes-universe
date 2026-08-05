import type { QuickAddCategory, TimelineEvent } from '@diabetes-universe/types';

import { getLatestGlucoseEvent } from '../../timeline/timeline-selectors';
import type { NextActionContext } from './next-action-types';

export type CreateNextActionContextInput = Readonly<{
  events: readonly TimelineEvent[];
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
          dateTime: latestGlucoseEvent.dateTime,
          value: latestGlucoseEvent.value,
        }
      : undefined,
    now: input.now,
    quickAddAvailability: {
      availableCategories: [...input.quickAddAvailability.availableCategories],
    },
    recentTimelineEvents: [...input.events],
  };
}
