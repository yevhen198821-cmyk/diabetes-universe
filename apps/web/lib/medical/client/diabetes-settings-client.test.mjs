import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DiabetesSettingsClientError,
  readMedicalApiErrorKind,
} from './diabetes-settings-client.test-helpers.ts';

test('DiabetesSettingsClientError exposes revision conflict kind', () => {
  const error = new DiabetesSettingsClientError('revision_conflict', 'stale');
  assert.equal(error.kind, 'revision_conflict');
});

test('readMedicalApiErrorKind maps HTTP statuses to client kinds', () => {
  assert.equal(readMedicalApiErrorKind(401), 'unauthorized');
  assert.equal(readMedicalApiErrorKind(412), 'revision_conflict');
  assert.equal(readMedicalApiErrorKind(428), 'precondition_required');
  assert.equal(readMedicalApiErrorKind(429), 'rate_limited');
  assert.equal(readMedicalApiErrorKind(422), 'validation');
  assert.equal(readMedicalApiErrorKind(503), 'server');
});
