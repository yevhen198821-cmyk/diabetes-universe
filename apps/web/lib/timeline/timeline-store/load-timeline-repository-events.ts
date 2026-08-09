import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  type TimelineRepository,
} from '@diabetes-universe/timeline';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export async function loadTimelineRepositoryEvents(
  repository: TimelineRepository,
): Promise<readonly SemanticTimelineEvent[]> {
  const snapshot = repository.getSnapshot();

  if (snapshot.events.length > 0) {
    return snapshot.events;
  }

  const result = await repository.queryEvents({
    limit: IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
    order: 'occurredAt-asc',
  });

  return result.events;
}
