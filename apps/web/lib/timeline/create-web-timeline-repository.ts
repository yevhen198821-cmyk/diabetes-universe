import type { TimelineRepository } from '@diabetes-universe/timeline';
import { createIndexedDbTimelineRepository } from '@diabetes-universe/timeline-web';

import { timelineEvents as demoTimelineEvents } from '../mocks/timeline';

export interface CreateWebTimelineRepositoryOptions {
  readonly repository?: TimelineRepository;
}

export function createWebTimelineRepository(
  options: CreateWebTimelineRepositoryOptions = {},
): TimelineRepository {
  if (options.repository) {
    return options.repository;
  }

  return createIndexedDbTimelineRepository({
    seedEvents: demoTimelineEvents,
  });
}
