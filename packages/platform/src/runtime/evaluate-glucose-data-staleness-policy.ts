import type {
  GlucoseDataStalenessEvaluationReferenceAudit,
  GlucoseDataStalenessPolicy,
  GlucoseDataStalenessPolicyAuditMetadata,
  GlucoseDataStalenessPolicyConfigurationState,
  GlucoseDataStalenessPolicyInput,
  GlucoseDataStalenessPolicyOutcome,
  GlucoseDataStalenessPolicyReason,
  GlucoseDataStalenessPolicyResult,
  GlucoseDataStalenessSourceAudit,
} from '../contracts/glucose-data-staleness-policy';
import {
  GLUCOSE_DATA_STALENESS_POLICY_ID,
  GLUCOSE_DATA_STALENESS_POLICY_VERSION,
} from '../contracts/glucose-data-staleness-policy';

const unavailableEvaluationReference: GlucoseDataStalenessEvaluationReferenceAudit =
  Object.freeze({
    identity: 'unavailable',
    normalizedTimeReference: 'unavailable',
  });

const unavailableSource: GlucoseDataStalenessSourceAudit = Object.freeze({
  identity: 'unavailable',
  provenanceIdentity: 'unavailable',
});

export const glucoseDataStalenessPolicy: GlucoseDataStalenessPolicy =
  Object.freeze({
    policyId: GLUCOSE_DATA_STALENESS_POLICY_ID,
    policyVersion: GLUCOSE_DATA_STALENESS_POLICY_VERSION,
    evaluate: evaluateGlucoseDataStalenessPolicy,
  });

export function evaluateGlucoseDataStalenessPolicy(
  input: GlucoseDataStalenessPolicyInput,
): GlucoseDataStalenessPolicyResult {
  const candidate: unknown = input;

  if (!isObject(candidate)) {
    return createResult({
      reason: 'malformed-input',
      outcome: 'unavailable',
    });
  }

  const record = candidate.record;
  const evaluationReference = readEvaluationReference(
    candidate.evaluationReference,
  );
  const configurationState = readConfigurationState(
    candidate.policyConfiguration,
  );

  if (record === null || record === undefined) {
    return createResult({
      reason: 'missing-record',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
    });
  }

  if (!isObject(record)) {
    return createResult({
      reason: 'malformed-input',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
    });
  }

  const recordIdentity = readString(record.identity);
  const source = readSource(record.source);
  const provenanceIdentity = readString(record.provenanceIdentity);
  const dataQuality = record.dataQuality;
  const occurrenceTime = readOccurrenceTimeState(record.occurrenceTime);

  if (
    recordIdentity === null ||
    source === null ||
    dataQuality !== 'eligible' ||
    occurrenceTime === null
  ) {
    return createResult({
      reason: 'malformed-input',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (source.support === 'unsupported') {
    return createResult({
      reason: 'unsupported-source',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (provenanceIdentity === null) {
    return createResult({
      reason: 'missing-provenance',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (occurrenceTime === 'unavailable') {
    return createResult({
      reason: 'unavailable-time-semantics',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (occurrenceTime === 'unreliable') {
    return createResult({
      reason: 'unreliable-time-semantics',
      outcome: 'indeterminate',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (occurrenceTime === 'future-dated') {
    return createResult({
      reason: 'future-dated-record',
      outcome: 'indeterminate',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (occurrenceTime === 'conflicting') {
    return createResult({
      reason: 'conflicting-source-metadata',
      outcome: 'indeterminate',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  if (configurationState === 'unavailable') {
    return createResult({
      reason: 'unavailable-policy-configuration',
      outcome: 'unavailable',
      evaluationReference,
      configurationState,
      recordIdentity,
      source,
      provenanceIdentity,
    });
  }

  return createResult({
    reason: 'approved-parameters-missing',
    outcome: 'unavailable',
    evaluationReference,
    configurationState,
    recordIdentity,
    source,
    provenanceIdentity,
  });
}

function createResult(input: {
  readonly reason: GlucoseDataStalenessPolicyReason;
  readonly outcome: Extract<
    GlucoseDataStalenessPolicyOutcome,
    'unavailable' | 'indeterminate'
  >;
  readonly evaluationReference?: GlucoseDataStalenessEvaluationReferenceAudit | null;
  readonly configurationState?: GlucoseDataStalenessPolicyConfigurationState | null;
  readonly recordIdentity?: string | null;
  readonly source?: Readonly<{ identity: string; support: string }> | null;
  readonly provenanceIdentity?: string | null;
}): GlucoseDataStalenessPolicyResult {
  const source = createSourceAudit(input.source, input.provenanceIdentity);
  const audit: GlucoseDataStalenessPolicyAuditMetadata = Object.freeze({
    reason: input.reason,
    evaluatedRecordIdentity: input.recordIdentity ?? null,
    sourceIdentity: input.source?.identity ?? null,
    configurationState: input.configurationState ?? null,
  });

  return Object.freeze({
    policyId: GLUCOSE_DATA_STALENESS_POLICY_ID,
    policyVersion: GLUCOSE_DATA_STALENESS_POLICY_VERSION,
    outcome: input.outcome,
    governedConclusion: false,
    evaluationReference:
      input.evaluationReference ?? unavailableEvaluationReference,
    source,
    explanationProvenanceIdentity: `gp-001.${input.outcome}.${input.reason}`,
    audit,
  });
}

function createSourceAudit(
  source: Readonly<{ identity: string; support: string }> | null | undefined,
  provenanceIdentity: string | null | undefined,
): GlucoseDataStalenessSourceAudit {
  if (
    source === null ||
    source === undefined ||
    provenanceIdentity === null ||
    provenanceIdentity === undefined
  ) {
    return unavailableSource;
  }

  return Object.freeze({
    identity: source.identity,
    provenanceIdentity,
  });
}

function readEvaluationReference(
  value: unknown,
): GlucoseDataStalenessEvaluationReferenceAudit | null {
  if (!isObject(value)) {
    return null;
  }

  const identity = readString(value.identity);
  const normalizedTimeReference = readString(value.normalizedTimeReference);

  if (identity === null || normalizedTimeReference === null) {
    return null;
  }

  return Object.freeze({
    identity,
    normalizedTimeReference,
  });
}

function readSource(
  value: unknown,
): Readonly<{ identity: string; support: 'supported' | 'unsupported' }> | null {
  if (!isObject(value)) {
    return null;
  }

  const identity = readString(value.identity);
  const support = value.support;

  if (
    identity === null ||
    (support !== 'supported' && support !== 'unsupported')
  ) {
    return null;
  }

  return { identity, support };
}

function readConfigurationState(
  value: unknown,
): GlucoseDataStalenessPolicyConfigurationState | null {
  if (!isObject(value)) {
    return null;
  }

  const state = value.state;

  if (state === 'unavailable' || state === 'parameters-unapproved') {
    return state;
  }

  return null;
}

function readOccurrenceTimeState(value: unknown) {
  if (!isObject(value)) {
    return null;
  }

  const state = value.state;

  if (
    state === 'normalized' ||
    state === 'unavailable' ||
    state === 'unreliable' ||
    state === 'future-dated' ||
    state === 'conflicting'
  ) {
    return state;
  }

  return null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
