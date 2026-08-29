import type { GlucoseFreshnessPolicy } from '@diabetes-universe/medical-domain';
import { resolveGlucoseFreshnessPolicyForSourceCategory } from '@diabetes-universe/medical-domain';

/**
 * @deprecated Wave 3A-III replaced Dashboard legacy freshness with source-aware
 * product recency policies. Retained only for historical test compatibility.
 */
export const DASHBOARD_LEGACY_FRESHNESS_POLICY: GlucoseFreshnessPolicy =
  resolveGlucoseFreshnessPolicyForSourceCategory('manual');

/**
 * @deprecated Use source-aware `resolveGlucoseFreshnessPolicyForTimelineEvent`.
 */
export function createDashboardLegacyFreshnessPolicy(
  recentWithinMs: number,
): GlucoseFreshnessPolicy {
  return {
    currentWithinMs: null,
    recentWithinMs,
  };
}
