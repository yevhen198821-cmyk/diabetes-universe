import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import type { TimelinePresentationDependencies } from './presentation';
import { projectSemanticToLegacyRepositoryEvent } from './temporary-semantic-repository-bridge';

/**
 * Temporary P2 repository write projection boundary.
 *
 * Converts semantic application events into legacy repository records until
 * P3h repository cutover. Must not be called from UI components directly.
 */
export function projectSemanticEventForRepositoryWrite(
  event: SemanticTimelineEvent,
  presentationDependencies: TimelinePresentationDependencies,
) {
  return projectSemanticToLegacyRepositoryEvent(
    event,
    presentationDependencies,
  );
}
