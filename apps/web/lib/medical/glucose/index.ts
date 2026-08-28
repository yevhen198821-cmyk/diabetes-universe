export { adaptGlucosePresentationForDisplay } from './glucose-presentation-adapter';
export type { LocalizedGlucosePresentation } from './glucose-presentation-adapter';
export {
  createDashboardLegacyFreshnessPolicy,
  DASHBOARD_LEGACY_FRESHNESS_POLICY,
} from './dashboard-legacy-freshness-policy';
export { formatGlucoseDisplayValueFromTimelineEvent } from './format-glucose-display-value';
export { resolveGlucoseRangeStateLabel } from './glucose-range-state-labels';
export {
  presentGlucoseFromTimelineEvent,
  type PresentGlucoseFromTimelineEventInput,
  type TimelineGlucosePresentationResult,
} from './present-glucose-from-timeline-event';
export {
  useGlucosePresentationDependencies,
  type GlucosePresentationDependencies,
} from './use-glucose-presentation-dependencies';
