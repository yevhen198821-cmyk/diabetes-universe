/**
 * Diabetes Universe Platform Runtime Foundation contracts and runtime.
 *
 * This package aggregates already prepared platform service instances into a
 * single immutable `PlatformRuntime` surface. It is consumed by a future
 * environment-specific Composition Root and does not create adapters or
 * upstream platform services.
 */

export type {
  GlucoseDataStalenessDataQualityState,
  GlucoseDataStalenessEvaluationReferenceAudit,
  GlucoseDataStalenessEvaluationReferenceInput,
  GlucoseDataStalenessPolicy,
  GlucoseDataStalenessPolicyAuditMetadata,
  GlucoseDataStalenessPolicyConfigurationInput,
  GlucoseDataStalenessPolicyConfigurationState,
  GlucoseDataStalenessPolicyInput,
  GlucoseDataStalenessPolicyOutcome,
  GlucoseDataStalenessPolicyReason,
  GlucoseDataStalenessPolicyResult,
  GlucoseDataStalenessRecordInput,
  GlucoseDataStalenessRecordTimeInput,
  GlucoseDataStalenessSourceAudit,
  GlucoseDataStalenessSourceInput,
  GlucoseDataStalenessSourceSupport,
  GlucoseDataStalenessTimeSemanticsState,
  PlatformRuntime,
  PlatformRuntimeCreateInput,
  PlatformRuntimeFactory,
} from './contracts';

export {
  GLUCOSE_DATA_STALENESS_POLICY_ID,
  GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES,
  GLUCOSE_DATA_STALENESS_POLICY_VERSION,
} from './contracts';
export { createPlatformRuntime } from './runtime/create-platform-runtime';
export {
  evaluateGlucoseDataStalenessPolicy,
  glucoseDataStalenessPolicy,
} from './runtime/evaluate-glucose-data-staleness-policy';
