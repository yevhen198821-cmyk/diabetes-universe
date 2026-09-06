import type { TimelineRepository } from '@diabetes-universe/timeline';
import { createIndexedDbTimelineRepository } from '@diabetes-universe/timeline-web';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { assertOwnedTimelineDatabaseName } from './timeline-local-ownership';
import { createWebTimelineSemanticEventValidator } from './validate-web-timeline-semantic-event';

export interface CreateWebTimelineRepositoryOptions {
  readonly databaseName?: string;
  readonly repository?: TimelineRepository;
  readonly seedEvents?: readonly SemanticTimelineEvent[];
}

export function createWebTimelineRepository(
  options: CreateWebTimelineRepositoryOptions = {},
): TimelineRepository {
  if (options.repository) {
    return options.repository;
  }

  if (!options.databaseName) {
    throw new Error(
      'createWebTimelineRepository requires an explicit owned databaseName.',
    );
  }

  return createIndexedDbTimelineRepository({
    databaseName: assertOwnedTimelineDatabaseName(options.databaseName),
    seedEvents: options.seedEvents ?? [],
    semanticEventValidator: createWebTimelineSemanticEventValidator(),
  });
}
