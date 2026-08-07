export const GLUCOSE_DATA_STALENESS_POLICY_ID = 'GP-001' as const;

export const GLUCOSE_DATA_STALENESS_POLICY_VERSION =
  'gp-001.contract.v1' as const;

const glucoseDataStalenessPolicyOutcomes = [
  'attention-required',
  'no-attention-required',
  'unavailable',
  'indeterminate',
] as const;

export type GlucoseDataStalenessPolicyOutcome =
  (typeof glucoseDataStalenessPolicyOutcomes)[number];

export const GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES: readonly GlucoseDataStalenessPolicyOutcome[] =
  Object.freeze([...glucoseDataStalenessPolicyOutcomes]);

export type GlucoseDataStalenessSourceSupport = 'supported' | 'unsupported';

export type GlucoseDataStalenessDataQualityState = 'eligible' | 'malformed';

export type GlucoseDataStalenessTimeSemanticsState =
  'normalized' | 'unavailable' | 'unreliable' | 'future-dated' | 'conflicting';

export type GlucoseDataStalenessPolicyConfigurationState =
  'unavailable' | 'parameters-unapproved';

export type GlucoseDataStalenessPolicyReason =
  | 'approved-parameters-missing'
  | 'conflicting-source-metadata'
  | 'future-dated-record'
  | 'malformed-input'
  | 'missing-provenance'
  | 'missing-record'
  | 'unavailable-policy-configuration'
  | 'unavailable-time-semantics'
  | 'unreliable-time-semantics'
  | 'unsupported-source';

export interface GlucoseDataStalenessEvaluationReferenceInput {
  readonly identity: string;
  readonly normalizedTimeReference: string;
}

export interface GlucoseDataStalenessSourceInput {
  readonly identity: string;
  readonly support: GlucoseDataStalenessSourceSupport;
}

export interface GlucoseDataStalenessRecordTimeInput {
  readonly state: GlucoseDataStalenessTimeSemanticsState;
}

export interface GlucoseDataStalenessRecordInput {
  readonly identity: string;
  readonly source: GlucoseDataStalenessSourceInput;
  readonly provenanceIdentity: string;
  readonly dataQuality: GlucoseDataStalenessDataQualityState;
  readonly occurrenceTime: GlucoseDataStalenessRecordTimeInput;
}

export interface GlucoseDataStalenessPolicyConfigurationInput {
  readonly state: GlucoseDataStalenessPolicyConfigurationState;
}

export interface GlucoseDataStalenessPolicyInput {
  readonly record: GlucoseDataStalenessRecordInput | null;
  readonly evaluationReference: GlucoseDataStalenessEvaluationReferenceInput;
  readonly policyConfiguration: GlucoseDataStalenessPolicyConfigurationInput;
}

export interface GlucoseDataStalenessEvaluationReferenceAudit {
  readonly identity: string;
  readonly normalizedTimeReference: string;
}

export interface GlucoseDataStalenessSourceAudit {
  readonly identity: string;
  readonly provenanceIdentity: string;
}

export interface GlucoseDataStalenessPolicyAuditMetadata {
  readonly reason: GlucoseDataStalenessPolicyReason;
  readonly evaluatedRecordIdentity: string | null;
  readonly sourceIdentity: string | null;
  readonly configurationState: GlucoseDataStalenessPolicyConfigurationState | null;
}

export interface GlucoseDataStalenessPolicyResult {
  readonly policyId: typeof GLUCOSE_DATA_STALENESS_POLICY_ID;
  readonly policyVersion: typeof GLUCOSE_DATA_STALENESS_POLICY_VERSION;
  readonly outcome: GlucoseDataStalenessPolicyOutcome;
  readonly governedConclusion: boolean;
  readonly evaluationReference: GlucoseDataStalenessEvaluationReferenceAudit;
  readonly source: GlucoseDataStalenessSourceAudit;
  readonly explanationProvenanceIdentity: string;
  readonly audit: GlucoseDataStalenessPolicyAuditMetadata;
}

export interface GlucoseDataStalenessPolicy {
  readonly policyId: typeof GLUCOSE_DATA_STALENESS_POLICY_ID;
  readonly policyVersion: typeof GLUCOSE_DATA_STALENESS_POLICY_VERSION;
  readonly evaluate: (
    input: GlucoseDataStalenessPolicyInput,
  ) => GlucoseDataStalenessPolicyResult;
}
