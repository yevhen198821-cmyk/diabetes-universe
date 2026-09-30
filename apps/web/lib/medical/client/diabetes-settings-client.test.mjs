import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DiabetesSettingsClientError,
  readMedicalApiErrorKind,
} from './diabetes-settings-client.test-helpers.ts';
import { fetchDiabetesSettings } from './diabetes-settings-client.ts';

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
  assert.equal(readMedicalApiErrorKind(503), 'unavailable');
  assert.equal(readMedicalApiErrorKind(500), 'server');
});

test('real settings fetch distinguishes a 503 from other server errors', async () => {
  const previousFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    await assert.rejects(fetchDiabetesSettings(), (error) => {
      assert.equal(error.kind, 'unavailable');
      return true;
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
