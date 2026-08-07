import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateGlucoseDataStalenessPolicy,
  GLUCOSE_DATA_STALENESS_POLICY_ID,
  GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES,
  GLUCOSE_DATA_STALENESS_POLICY_VERSION,
  glucoseDataStalenessPolicy,
} from '../index.ts';

function createValidInput(overrides = {}) {
  return {
    record: {
      identity: 'record-1',
      source: {
        identity: 'source-1',
        support: 'supported',
      },
      provenanceIdentity: 'provenance-1',
      dataQuality: 'eligible',
      occurrenceTime: {
        state: 'normalized',
      },
      ...overrides.record,
    },
    evaluationReference: {
      identity: 'evaluation-1',
      normalizedTimeReference: 'normalized-reference-1',
      ...overrides.evaluationReference,
    },
    policyConfiguration: {
      state: 'parameters-unapproved',
      ...overrides.policyConfiguration,
    },
  };
}

test('GP-001 exposes immutable policy identity and version', () => {
  assert.equal(
    glucoseDataStalenessPolicy.policyId,
    GLUCOSE_DATA_STALENESS_POLICY_ID,
  );
  assert.equal(
    glucoseDataStalenessPolicy.policyVersion,
    GLUCOSE_DATA_STALENESS_POLICY_VERSION,
  );
  assert.equal(typeof glucoseDataStalenessPolicy.evaluate, 'function');
  assert.equal(Object.isFrozen(glucoseDataStalenessPolicy), true);
});

test('GP-001 exposes every semantic outcome without threshold values', () => {
  assert.deepEqual(
    [...GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES],
    [
      'attention-required',
      'no-attention-required',
      'unavailable',
      'indeterminate',
    ],
  );
  assert.equal(Object.isFrozen(GLUCOSE_DATA_STALENESS_POLICY_OUTCOMES), true);
});

test('evaluation is deterministic for identical input', () => {
  const input = createValidInput();

  assert.deepEqual(
    evaluateGlucoseDataStalenessPolicy(input),
    evaluateGlucoseDataStalenessPolicy(input),
  );
});

test('evaluation does not mutate input', () => {
  const input = createValidInput();
  const snapshot = JSON.stringify(input);

  evaluateGlucoseDataStalenessPolicy(input);

  assert.equal(JSON.stringify(input), snapshot);
});

test('evaluation returns unavailable when approved parameters are missing', () => {
  const result = evaluateGlucoseDataStalenessPolicy(createValidInput());

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.governedConclusion, false);
  assert.equal(result.audit.reason, 'approved-parameters-missing');
});

test('evaluation returns unavailable for unsupported source', () => {
  const result = evaluateGlucoseDataStalenessPolicy(
    createValidInput({
      record: {
        source: {
          identity: 'source-1',
          support: 'unsupported',
        },
      },
    }),
  );

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.audit.reason, 'unsupported-source');
});

test('evaluation returns unavailable for unavailable configuration', () => {
  const result = evaluateGlucoseDataStalenessPolicy(
    createValidInput({
      policyConfiguration: {
        state: 'unavailable',
      },
    }),
  );

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.audit.reason, 'unavailable-policy-configuration');
});

test('evaluation returns unavailable for malformed configuration', () => {
  const result = evaluateGlucoseDataStalenessPolicy(
    createValidInput({
      policyConfiguration: {
        state: 'unknown',
      },
    }),
  );

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.audit.reason, 'unavailable-policy-configuration');
});

test('evaluation returns unavailable for malformed evaluation reference', () => {
  const result = evaluateGlucoseDataStalenessPolicy(
    createValidInput({
      evaluationReference: {
        identity: '',
      },
    }),
  );

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.audit.reason, 'malformed-input');
  assert.equal(result.evaluationReference.identity, 'unavailable');
});

test('evaluation returns unavailable for malformed input', () => {
  const result = evaluateGlucoseDataStalenessPolicy(undefined);

  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.audit.reason, 'malformed-input');
});

test('evaluation returns indeterminate for future-dated records', () => {
  const result = evaluateGlucoseDataStalenessPolicy(
    createValidInput({
      record: {
        occurrenceTime: {
          state: 'future-dated',
        },
      },
    }),
  );

  assert.equal(result.outcome, 'indeterminate');
  assert.equal(result.audit.reason, 'future-dated-record');
});

test('evaluation includes audit metadata and freezes result objects', () => {
  const result = evaluateGlucoseDataStalenessPolicy(createValidInput());

  assert.equal(result.policyId, GLUCOSE_DATA_STALENESS_POLICY_ID);
  assert.equal(result.policyVersion, GLUCOSE_DATA_STALENESS_POLICY_VERSION);
  assert.equal(result.evaluationReference.identity, 'evaluation-1');
  assert.equal(result.source.identity, 'source-1');
  assert.equal(result.source.provenanceIdentity, 'provenance-1');
  assert.equal(
    result.explanationProvenanceIdentity,
    'gp-001.unavailable.approved-parameters-missing',
  );
  assert.equal(result.audit.evaluatedRecordIdentity, 'record-1');
  assert.equal(result.audit.sourceIdentity, 'source-1');
  assert.equal(result.audit.configurationState, 'parameters-unapproved');
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.evaluationReference), true);
  assert.equal(Object.isFrozen(result.source), true);
  assert.equal(Object.isFrozen(result.audit), true);
});
