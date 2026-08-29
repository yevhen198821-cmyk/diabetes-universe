import type { GlucoseFreshnessPolicy } from './glucose-freshness-policy';
import type { GlucoseSourceCategory } from './glucose-source-category';

/**
 * PRODUCT RECENCY POLICY
 *
 * These thresholds describe how Diabetes Universe communicates data recency in
 * the UI. They are not clinical thresholds and must not be used for diagnosis,
 * treatment, alarms, or therapy decisions.
 */
export const GLUCOSE_PRODUCT_RECENCY_POLICY_DISCLAIMER =
  'These thresholds describe how Diabetes Universe communicates data recency in the UI. They are not clinical thresholds and must not be used for diagnosis, treatment, alarms, or therapy decisions.';

const MANUAL_RECENCY_POLICY: GlucoseFreshnessPolicy = Object.freeze({
  currentWithinMs: 15 * 60 * 1000,
  recentWithinMs: 24 * 60 * 60 * 1000,
});

const CGM_RECENCY_POLICY: GlucoseFreshnessPolicy = Object.freeze({
  currentWithinMs: 5 * 60 * 1000,
  recentWithinMs: 3 * 60 * 60 * 1000,
});

const BLOOD_GLUCOSE_METER_RECENCY_POLICY: GlucoseFreshnessPolicy =
  Object.freeze({
    currentWithinMs: 15 * 60 * 1000,
    recentWithinMs: 12 * 60 * 60 * 1000,
  });

const HEALTH_PLATFORM_RECENCY_POLICY: GlucoseFreshnessPolicy = Object.freeze({
  currentWithinMs: 15 * 60 * 1000,
  recentWithinMs: 6 * 60 * 60 * 1000,
});

const IMPORT_RECENCY_POLICY: GlucoseFreshnessPolicy = Object.freeze({
  currentWithinMs: null,
  recentWithinMs: 24 * 60 * 60 * 1000,
});

const CONSERVATIVE_FALLBACK_RECENCY_POLICY: GlucoseFreshnessPolicy =
  Object.freeze({
    currentWithinMs: null,
    recentWithinMs: 12 * 60 * 60 * 1000,
  });

export const GLUCOSE_PRODUCT_RECENCY_POLICIES: Readonly<
  Record<GlucoseSourceCategory, GlucoseFreshnessPolicy>
> = Object.freeze({
  blood_glucose_meter: BLOOD_GLUCOSE_METER_RECENCY_POLICY,
  cgm: CGM_RECENCY_POLICY,
  health_platform: HEALTH_PLATFORM_RECENCY_POLICY,
  import: IMPORT_RECENCY_POLICY,
  manual: MANUAL_RECENCY_POLICY,
  other: CONSERVATIVE_FALLBACK_RECENCY_POLICY,
});

export function resolveGlucoseFreshnessPolicyForSourceCategory(
  sourceCategory: GlucoseSourceCategory,
): GlucoseFreshnessPolicy {
  return GLUCOSE_PRODUCT_RECENCY_POLICIES[sourceCategory];
}
