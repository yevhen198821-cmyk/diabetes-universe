import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GLUCOSE_DATA_STALENESS_POLICY_ID,
  GLUCOSE_DATA_STALENESS_POLICY_VERSION,
} from '@diabetes-universe/platform';

import {
  NEXT_ACTION_DEFAULT_MESSAGE_KEY,
  createCompatibilityDefaultDecision,
} from './next-action-default.ts';
import { evaluateNextAction } from './next-action-engine.ts';
import {
  createNa001GlucoseDataStalenessRule,
  NA001_GLUCOSE_STALENESS_ACTION_LABEL_ID,
  NA001_GLUCOSE_STALENESS_MESSAGE_ID,
  NA001_GLUCOSE_STALENESS_RULE_ID,
} from './na-001-glucose-data-staleness-rule.ts';

const FIXED_NOW = new Date('2026-08-07T12:00:00.000Z');

function createContext(overrides = {}) {
  return {
    latestGlucose: undefined,
    now: FIXED_NOW,
    quickAddAvailability: {
      availableCategories: ['glucose', 'insulin'],
    },
    recentTimelineEvents: [],
    ...overrides,
  };
}

function createPolicyResult(outcome, overrides = {}) {
  return {
    audit: {
      configurationState: 'parameters-unapproved',
      evaluatedRecordIdentity: 'record-1',
      reason: 'approved-parameters-missing',
      sourceIdentity: 'source-1',
    },
    evaluationReference: {
      identity: 'evaluation-1',
      normalizedTimeReference: 'normalized-reference-1',
    },
    explanationProvenanceIdentity: 'gp-001.attention-required.test',
    governedConclusion:
      outcome === 'attention-required' || outcome === 'no-attention-required',
    outcome,
    policyId: GLUCOSE_DATA_STALENESS_POLICY_ID,
    policyVersion: GLUCOSE_DATA_STALENESS_POLICY_VERSION,
    source: {
      identity: 'source-1',
      provenanceIdentity: 'provenance-1',
    },
    ...overrides,
  };
}

function evaluateWithPolicyResult(policyResult, context = createContext()) {
  return evaluateNextAction(context, {
    rules: [
      createNa001GlucoseDataStalenessRule({
        policyResult,
      }),
    ],
  });
}

test('NA-001 activates on GP-001 attention-required result', () => {
  const decision = evaluateWithPolicyResult(
    createPolicyResult('attention-required'),
  );

  assert.equal(decision.source, 'contextual-rule');
  assert.equal(decision.ruleId, NA001_GLUCOSE_STALENESS_RULE_ID);
  assert.equal(decision.priority, 'informational');
  assert.equal(decision.messageKey, NA001_GLUCOSE_STALENESS_MESSAGE_ID);
  assert.equal(decision.descriptionKey, 'gp-001.attention-required.test');
  assert.deepEqual(decision.action, {
    category: 'glucose',
    kind: 'quick-add',
    labelKey: NA001_GLUCOSE_STALENESS_ACTION_LABEL_ID,
  });
});

test('NA-001 suppresses on GP-001 no-attention-required result', () => {
  const decision = evaluateWithPolicyResult(
    createPolicyResult('no-attention-required'),
  );

  assert.equal(decision.source, 'compatibility-default');
  assert.equal(decision.messageKey, NEXT_ACTION_DEFAULT_MESSAGE_KEY);
});

test('NA-001 suppresses on GP-001 unavailable result', () => {
  const decision = evaluateWithPolicyResult(createPolicyResult('unavailable'));

  assert.equal(decision.source, 'compatibility-default');
});

test('NA-001 suppresses on GP-001 indeterminate result', () => {
  const decision = evaluateWithPolicyResult(
    createPolicyResult('indeterminate'),
  );

  assert.equal(decision.source, 'compatibility-default');
});

test('NA-001 evaluation is deterministic', () => {
  const policyResult = createPolicyResult('attention-required');
  const first = evaluateWithPolicyResult(policyResult);
  const second = evaluateWithPolicyResult(policyResult);

  assert.deepEqual(first, second);
});

test('NA-001 does not mutate policy result or engine context', () => {
  const policyResult = createPolicyResult('attention-required');
  const context = createContext();
  const policySnapshot = JSON.stringify(policyResult);
  const contextSnapshot = JSON.stringify(context);

  evaluateWithPolicyResult(policyResult, context);

  assert.equal(JSON.stringify(policyResult), policySnapshot);
  assert.equal(JSON.stringify(context), contextSnapshot);
});

test('NA-001 suppresses malformed Policy result without throwing', () => {
  const decision = evaluateWithPolicyResult(undefined);

  assert.equal(decision.source, 'compatibility-default');
});

test('NA-001 suppresses unsupported Policy result without throwing', () => {
  const decision = evaluateWithPolicyResult(
    createPolicyResult('attention-required', {
      outcome: 'unsupported-outcome',
    }),
  );

  assert.equal(decision.source, 'compatibility-default');
});

test('NA-001 does not consume raw timestamps or glucose values', () => {
  const context = createContext({
    latestGlucose: {
      get dateTime() {
        throw new Error('NA-001 must not read raw timestamps.');
      },
      get value() {
        throw new Error('NA-001 must not read glucose values.');
      },
    },
  });

  const decision = evaluateWithPolicyResult(
    createPolicyResult('attention-required'),
    context,
  );

  assert.equal(decision.source, 'contextual-rule');
});

test('NA-001 suppresses when glucose action is unavailable', () => {
  const decision = evaluateWithPolicyResult(
    createPolicyResult('attention-required'),
    createContext({
      quickAddAvailability: {
        availableCategories: ['insulin'],
      },
    }),
  );

  assert.deepEqual(decision, createCompatibilityDefaultDecision());
});
