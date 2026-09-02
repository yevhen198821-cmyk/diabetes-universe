import type { SemanticTimelineEvent } from '@diabetes-universe/types';

/**
 * Optional supplemental semantic validation supplied by the composition root.
 *
 * Generic timeline-web persistence understands only this contract and never
 * imports medical-domain registries directly.
 */
export type TimelineSemanticEventValidator = (
  event: SemanticTimelineEvent,
) => boolean;
