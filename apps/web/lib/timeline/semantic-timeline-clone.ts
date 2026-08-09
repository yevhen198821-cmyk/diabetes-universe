import type { SemanticTimelineEvent } from '@diabetes-universe/types';

function cloneSemanticTimelineEvent(
  event: SemanticTimelineEvent,
): SemanticTimelineEvent {
  switch (event.kind) {
    case 'activity':
      return { ...event };
    case 'glucose':
      return { ...event };
    case 'insulin':
      return { ...event };
    case 'medication':
      return { ...event };
    case 'note':
      return { ...event };
    case 'nutrition':
      return {
        ...event,
        products: event.products
          ? event.products.map((product) => ({ ...product }))
          : undefined,
      };
  }
}

export function cloneSemanticTimelineEvents(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return events.map((event) => cloneSemanticTimelineEvent(event));
}
