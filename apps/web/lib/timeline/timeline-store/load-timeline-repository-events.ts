import type { TimelineRepository } from '@diabetes-universe/timeline';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { loadTimelineRepositoryFirstPage } from './timeline-store-repository-reads';

export async function loadTimelineRepositoryEvents(
  repository: TimelineRepository,
): Promise<readonly SemanticTimelineEvent[]> {
  const page = await loadTimelineRepositoryFirstPage(repository);

  return page.events;
}
