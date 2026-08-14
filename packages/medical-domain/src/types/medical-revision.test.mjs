import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertMedicalRevision,
  incrementMedicalRevision,
  MAX_MEDICAL_REVISION,
  medicalRevisionFromDb,
} from './medical-revision.ts';

test('medicalRevisionFromDb rejects zero and unsafe revisions', () => {
  assert.throws(() => medicalRevisionFromDb(0), /greater than zero/);
  assert.throws(
    () => medicalRevisionFromDb(MAX_MEDICAL_REVISION + 1n),
    /safe integer range/,
  );
});

test('incrementMedicalRevision stays within safe bigint range', () => {
  const next = incrementMedicalRevision(MAX_MEDICAL_REVISION - 1n);
  assert.equal(next, MAX_MEDICAL_REVISION);
  assert.throws(
    () => incrementMedicalRevision(MAX_MEDICAL_REVISION),
    /safe integer range/,
  );
});

test('assertMedicalRevision accepts canonical initial revision', () => {
  assert.equal(assertMedicalRevision(1n), 1n);
});
