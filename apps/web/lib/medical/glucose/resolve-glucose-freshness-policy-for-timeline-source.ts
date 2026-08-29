import {
  normalizeGlucoseSourceCategory,
  resolveGlucoseFreshnessPolicyForSourceCategory,
  type GlucoseFreshnessPolicy,
  type GlucoseSourceCategory,
} from '@diabetes-universe/medical-domain';
import type {
  EventProvenance,
  TimelineEventSource,
} from '@diabetes-universe/types';

export function resolveGlucoseFreshnessPolicyForTimelineSource(
  source: TimelineEventSource,
  provenance?: EventProvenance,
  explicitCategory?: GlucoseSourceCategory,
): GlucoseFreshnessPolicy {
  const sourceCategory = normalizeGlucoseSourceCategory({
    explicitCategory,
    provenance,
    source,
  });

  return resolveGlucoseFreshnessPolicyForSourceCategory(sourceCategory);
}
