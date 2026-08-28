import type { GlucoseFreshnessPolicy } from '@diabetes-universe/medical-domain';

/**
 * Dashboard-only legacy freshness policy preserving the pre-3A-II 24h stale UX.
 *
 * Deferred to Wave 3A-III for source-aware GP-001 wiring.
 */
export const DASHBOARD_LEGACY_FRESHNESS_POLICY: GlucoseFreshnessPolicy = {
  currentWithinMs: null,
  recentWithinMs: 24 * 60 * 60 * 1000,
};

export function createDashboardLegacyFreshnessPolicy(
  recentWithinMs: number,
): GlucoseFreshnessPolicy {
  return {
    currentWithinMs: null,
    recentWithinMs,
  };
}
