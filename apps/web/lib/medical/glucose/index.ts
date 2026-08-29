export { adaptGlucosePresentationForDisplay } from './glucose-presentation-adapter';
export type { LocalizedGlucosePresentation } from './glucose-presentation-adapter';
export {
  createDashboardLegacyFreshnessPolicy,
  DASHBOARD_LEGACY_FRESHNESS_POLICY,
} from './dashboard-legacy-freshness-policy';
export { formatGlucoseDisplayValueFromTimelineEvent } from './format-glucose-display-value';
export { resolveGlucoseRangeStateLabel } from './glucose-range-state-labels';
export { resolveGlucoseTimestampUncertaintyLabel } from './glucose-timestamp-uncertainty-label';
export {
  presentGlucoseFromTimelineEvent,
  type PresentGlucoseFromTimelineEventInput,
  type TimelineGlucosePresentationResult,
} from './present-glucose-from-timeline-event';
export { resolveGlucoseFreshnessPolicyForTimelineEvent } from './resolve-glucose-freshness-policy-for-timeline-event';
export { resolveGlucoseFreshnessPolicyForTimelineSource } from './resolve-glucose-freshness-policy-for-timeline-source';
export { selectLatestEligibleGlucoseTimelineEvent } from './select-latest-eligible-glucose-timeline-event';
export {
  useGlucosePresentationDependencies,
  type GlucosePresentationDependencies,
} from './use-glucose-presentation-dependencies';
