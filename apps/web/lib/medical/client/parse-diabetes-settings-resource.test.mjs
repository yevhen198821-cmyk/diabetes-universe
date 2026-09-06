import assert from 'node:assert/strict';
import test from 'node:test';

import { DiabetesSettingsClientError } from './diabetes-settings-types.ts';
import {
  interpretDiabetesSettingsLoadFailure,
  parseDiabetesSettingsResource,
} from './parse-diabetes-settings-resource.ts';

function validSettings(overrides = {}) {
  return {
    configured: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    diabetesType: {
      category: 'unknown',
      source: 'self_reported',
    },
    glucoseDisplayUnit: 'mmol_per_l',
    revision: '1',
    settingsId: '00000000-0000-4000-8000-000000000001',
    subjectId: '00000000-0000-4000-8000-000000000002',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

test('parseDiabetesSettingsResource accepts a valid settings payload', () => {
  const parsed = parseDiabetesSettingsResource(validSettings());
  assert.equal(parsed.glucoseDisplayUnit, 'mmol_per_l');
  assert.equal(parsed.configured, true);
});

test('parseDiabetesSettingsResource accepts a first-run unconfigured payload', () => {
  const parsed = parseDiabetesSettingsResource(
    validSettings({
      configured: false,
      createdAt: null,
      glucoseDisplayUnit: null,
      settingsId: null,
      updatedAt: null,
    }),
  );

  assert.equal(parsed.configured, false);
  assert.equal(parsed.glucoseDisplayUnit, null);
});

test('parseDiabetesSettingsResource rejects malformed settings', () => {
  for (const payload of [
    { revision: '1' },
    validSettings({ glucoseDisplayUnit: 'mmol' }),
    'not-json-object',
  ]) {
    try {
      parseDiabetesSettingsResource(payload);
      assert.fail('expected malformed settings to throw');
    } catch (error) {
      assert.equal(error.name, 'DiabetesSettingsClientError');
      assert.equal(error.kind, 'validation');
    }
  }
});

test('unauthorized settings failure is classified as unconfigured first-run', () => {
  const interpreted = interpretDiabetesSettingsLoadFailure(
    new DiabetesSettingsClientError(
      'unauthorized',
      'Authentication is required.',
    ),
  );

  assert.equal(interpreted.type, 'unconfigured');
});

test('server and network failures remain blocked errors', () => {
  assert.equal(
    interpretDiabetesSettingsLoadFailure(
      new DiabetesSettingsClientError(
        'server',
        'The medical API is temporarily unavailable.',
      ),
    ).type,
    'error',
  );
  assert.equal(
    interpretDiabetesSettingsLoadFailure(
      new DiabetesSettingsClientError('network', 'Network request failed.'),
    ).type,
    'error',
  );
});
