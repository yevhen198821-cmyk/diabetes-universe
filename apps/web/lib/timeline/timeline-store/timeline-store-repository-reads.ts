import type {
  TimelineRepository,
  TimelineRepositoryQuery,
} from '@diabetes-universe/timeline';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export const TIMELINE_STORE_REPOSITORY_PAGE_SIZE = 100;

export interface TimelineRepositoryPageResult {
  readonly events: readonly SemanticTimelineEvent[];
  readonly hasMoreHistory: boolean;
  readonly nextCursor?: string;
}

function createDescendingPageQuery(
  limit: number,
  cursor?: string,
): TimelineRepositoryQuery {
  return {
    cursor,
    limit,
    order: 'occurredAt-desc',
  };
}

export async function loadTimelineRepositoryFirstPage(
  repository: TimelineRepository,
  pageSize: number = TIMELINE_STORE_REPOSITORY_PAGE_SIZE,
): Promise<TimelineRepositoryPageResult> {
  const snapshot = repository.getSnapshot();

  if (snapshot.events.length > 0) {
    return {
      events: snapshot.events,
      hasMoreHistory: false,
      nextCursor: undefined,
    };
  }

  const result = await repository.queryEvents(
    createDescendingPageQuery(pageSize),
  );

  return {
    events: result.events,
    hasMoreHistory: result.nextCursor !== undefined,
    nextCursor: result.nextCursor,
  };
}

export async function loadTimelineRepositoryNextPage(
  repository: TimelineRepository,
  cursor: string,
  pageSize: number = TIMELINE_STORE_REPOSITORY_PAGE_SIZE,
): Promise<TimelineRepositoryPageResult> {
  const result = await repository.queryEvents(
    createDescendingPageQuery(pageSize, cursor),
  );

  return {
    events: result.events,
    hasMoreHistory: result.nextCursor !== undefined,
    nextCursor: result.nextCursor,
  };
}

export function mergeTimelineRepositoryEvents(
  existingEvents: readonly SemanticTimelineEvent[],
  incomingEvents: readonly SemanticTimelineEvent[],
): SemanticTimelineEvent[] {
  const eventsById = new Map<string, SemanticTimelineEvent>();

  for (const event of existingEvents) {
    eventsById.set(event.id, event);
  }

  for (const event of incomingEvents) {
    eventsById.set(event.id, event);
  }

  return [...eventsById.values()];
}
