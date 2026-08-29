import {
  normalizeGlucoseSourceCategory,
  resolveGlucoseFreshnessPolicyForSourceCategory,
  type GlucoseFreshnessPolicy,
} from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export function resolveGlucoseFreshnessPolicyForTimelineEvent(
  event: Pick<SemanticTimelineEvent, 'provenance' | 'source'>,
): GlucoseFreshnessPolicy {
  const sourceCategory = normalizeGlucoseSourceCategory({
    provenance: event.provenance,
    source: event.source,
  });

  return resolveGlucoseFreshnessPolicyForSourceCategory(sourceCategory);
}
