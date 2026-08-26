import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleDeleteGlucoseTargetProfile,
  handleGetDiabetesSettings,
  handleGetGlucoseTargetProfile,
  handlePatchDiabetesSettings,
  handlePutGlucoseTargetProfile,
  setMedicalApiRateLimiterForTests,
} from './medical-diabetes-settings-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import {
  MEDICAL_DIABETES_SETTINGS_BASE_PATH,
  MEDICAL_EVENTS_BASE_PATH,
  MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH,
  MEDICAL_IDEMPOTENCY_HEADER,
} from './constants.ts';
import {
  handleCreateMedicalEvent,
  handleGetMedicalEvent,
} from './medical-events-handlers.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';
process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';

const BASE_URL = 'http://localhost:3000';

function url(path) {
  return `${BASE_URL}${path}`;
}

function authHeaders(accountId, extra = {}) {
  return {
    [TEST_ACCOUNT_HEADER]: accountId,
    ...extra,
  };
}

function request(path, init = {}) {
  return new Request(url(path), init);
}

test.beforeEach(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';
  delete process.env.MEDICAL_API_PRODUCTION_GATE;
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
});

test('unauthenticated diabetes settings GET returns AUTH_REQUIRED', async () => {
  const response = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders('anonymous'),
    }),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
});

test('unauthenticated diabetes settings PATCH returns AUTH_REQUIRED', async () => {
  const response = await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders('anonymous'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ glucoseDisplayUnit: 'mmol_per_l' }),
    }),
  );

  assert.equal(response.status, 401);
});

test('authorized self GET returns unconfigured settings without DB mutation', async () => {
  const accountId = 'acct-settings-get';
  const first = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );

  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.configured, false);
  assert.equal(firstBody.settingsId, null);
  assert.equal(firstBody.glucoseDisplayUnit, null);

  const second = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const secondBody = await second.json();
  assert.deepEqual(secondBody, firstBody);
});

test('settings PATCH validates diabetes type and rejects unknown fields', async () => {
  const accountId = 'acct-settings-validate';
  const initial = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const initialBody = await initial.json();

  const invalidType = await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({
        diabetesType: {
          category: 'not-a-type',
          source: 'self_reported',
        },
      }),
    }),
  );
  assert.equal(invalidType.status, 422);

  const unknownField = await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({ devices: [] }),
    }),
  );
  assert.equal(unknownField.status, 422);
});

test('settings PATCH updates display unit and diabetes type with revision semantics', async () => {
  const accountId = 'acct-settings-patch';
  const initial = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const initialBody = await initial.json();

  const updated = await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({
        glucoseDisplayUnit: 'mg_per_dl',
        diabetesType: {
          category: 'type_2',
          source: 'self_reported',
        },
      }),
    }),
  );

  assert.equal(updated.status, 200);
  const updatedBody = await updated.json();
  assert.equal(updatedBody.configured, true);
  assert.equal(updatedBody.glucoseDisplayUnit, 'mg_per_dl');
  assert.notEqual(updatedBody.revision, initialBody.revision);

  await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': updatedBody.revision,
      },
      body: JSON.stringify({ glucoseDisplayUnit: 'mmol_per_l' }),
    }),
  );

  const stale = await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': updatedBody.revision,
      },
      body: JSON.stringify({ glucoseDisplayUnit: 'mg_per_dl' }),
    }),
  );

  assert.equal(stale.status, 412);
  const staleBody = await stale.json();
  assert.equal(staleBody.error.code, 'REVISION_CONFLICT');
});

test('display unit change does not mutate existing medical events', async () => {
  const accountId = 'acct-settings-events';
  const eventBody = JSON.stringify({
    event: {
      occurredAt: '2026-08-14T10:00:00.000Z',
      schemaVersion: 1,
      source: 'manual',
      kind: 'glucose',
      concentrationMmolPerL: 5.4,
      context: 'fasting',
    },
  });

  const created = await handleCreateMedicalEvent(
    request(MEDICAL_EVENTS_BASE_PATH, {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'settings-event-key',
        'content-type': 'application/json',
      },
      body: eventBody,
    }),
  );
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const initial = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const initialBody = await initial.json();

  await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({ glucoseDisplayUnit: 'mg_per_dl' }),
    }),
  );

  const fetched = await handleGetMedicalEvent(
    request(`${MEDICAL_EVENTS_BASE_PATH}/${createdBody.resourceId}`, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
    createdBody.resourceId,
  );

  assert.equal(fetched.status, 200);
  const fetchedBody = await fetched.json();
  assert.equal(fetchedBody.event.concentrationMmolPerL, 5.4);
});

test('target profile rejects forged provenance and invalid ranges', async () => {
  const accountId = 'acct-target-validate';
  const initial = await handleGetGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const initialBody = await initial.json();
  assert.equal(initialBody.configured, false);

  for (const source of ['clinician_defined', 'imported', 'system_reference']) {
    const forged = await handlePutGlucoseTargetProfile(
      request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
        method: 'PUT',
        headers: {
          ...authHeaders(accountId),
          'content-type': 'application/json',
          'if-match': initialBody.revision,
        },
        body: JSON.stringify({
          defaultRange: {
            lowMmolPerL: 4,
            highMmolPerL: 7,
            source,
          },
        }),
      }),
    );
    assert.equal(forged.status, 422, `expected 422 for ${source}`);
  }

  const equalBounds = await handlePutGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'PUT',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({
        defaultRange: {
          lowMmolPerL: 5,
          highMmolPerL: 5,
        },
      }),
    }),
  );
  assert.equal(equalBounds.status, 422);

  const nanBounds = await handlePutGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'PUT',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({
        defaultRange: {
          lowMmolPerL: Number.NaN,
          highMmolPerL: 7,
        },
      }),
    }),
  );
  assert.equal(nanBounds.status, 422);
});

test('target profile create update clear lifecycle', async () => {
  const accountId = 'acct-target-lifecycle';
  const initial = await handleGetGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(accountId),
    }),
  );
  const initialBody = await initial.json();

  const created = await handlePutGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'PUT',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
        'if-match': initialBody.revision,
      },
      body: JSON.stringify({
        defaultRange: {
          lowMmolPerL: 4,
          highMmolPerL: 7,
        },
      }),
    }),
  );
  assert.equal(created.status, 200);
  const createdBody = await created.json();
  assert.equal(createdBody.configured, true);
  assert.equal(createdBody.defaultRange.source, 'user_defined');

  const cleared = await handleDeleteGlucoseTargetProfile(
    request(MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH, {
      method: 'DELETE',
      headers: {
        ...authHeaders(accountId),
        'if-match': createdBody.revision,
      },
    }),
  );
  assert.equal(cleared.status, 200);
  const clearedBody = await cleared.json();
  assert.equal(clearedBody.configured, false);
  assert.equal(clearedBody.defaultRange, null);
});

test('subject isolation prevents cross-account settings reads from sharing state', async () => {
  const owner = 'acct-settings-owner';
  const other = 'acct-settings-other';

  const ownerInitial = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(owner),
    }),
  );
  const ownerBody = await ownerInitial.json();

  await handlePatchDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'PATCH',
      headers: {
        ...authHeaders(owner),
        'content-type': 'application/json',
        'if-match': ownerBody.revision,
      },
      body: JSON.stringify({ glucoseDisplayUnit: 'mmol_per_l' }),
    }),
  );

  const otherInitial = await handleGetDiabetesSettings(
    request(MEDICAL_DIABETES_SETTINGS_BASE_PATH, {
      method: 'GET',
      headers: authHeaders(other),
    }),
  );
  const otherBody = await otherInitial.json();
  assert.equal(otherBody.configured, false);
  assert.equal(otherBody.glucoseDisplayUnit, null);
});
