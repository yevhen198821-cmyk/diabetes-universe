import assert from 'node:assert/strict';
import test from 'node:test';

import { eq } from 'drizzle-orm';

import {
  DIABETES_SETTINGS_AUDIT_ACTIONS,
  DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES,
} from '@diabetes-universe/medical-domain';
import { resolveMedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import { medicalSchema } from '@diabetes-universe/medical-persistence/server';
import {
  closeMedicalServiceBundle,
  createMedicalServiceBundle,
} from '../create-medical-service-bundle.ts';

const TEST_ENV = {
  NODE_ENV: 'test',
  MEDICAL_REVISION_TOKEN_SECRET: 'test-medical-revision-token-secret',
  MEDICAL_LIST_CURSOR_SECRET: 'test-medical-list-cursor-secret',
};

const VALID_RANGE = {
  lowMmolPerL: 4.0,
  highMmolPerL: 7.0,
  source: 'user_defined',
};

function assertRevisionConflict(error) {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'REVISION_CONFLICT'
  );
}

function assertInvalidRevisionToken(error) {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'VALIDATION_FAILED'
  );
}

test('getSettings returns unconfigured view without persisting', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-unconfigured');
  const scope = {
    accountId: 'acct-unconfigured',
    subjectId: relationship.subjectId,
    correlationId: 'corr-unconfigured',
  };

  const before = await bundle.diabetesSettingsService.getSettings(scope);
  assert.equal(before.configured, false);
  assert.equal(
    before.settings.settingsId,
    '00000000-0000-0000-0000-000000000000',
  );
  assert.equal(before.settings.glucoseDisplayUnit, null);

  const after = await bundle.diabetesSettingsService.getSettings(scope);
  assert.deepEqual(after.settings, before.settings);

  await closeMedicalServiceBundle(bundle);
});

test('patchSettings creates settings and audits field changes', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-create');
  const scope = {
    accountId: 'acct-create',
    subjectId: relationship.subjectId,
    correlationId: 'corr-create',
  };

  const initial = await bundle.diabetesSettingsService.getSettings(scope);
  const updated = await bundle.diabetesSettingsService.patchSettings({
    scope,
    ifMatch: initial.etagToken,
    patch: {
      glucoseDisplayUnit: 'mmol_per_l',
      diabetesType: {
        category: 'type_1',
        otherDescriptor: null,
        source: 'self_reported',
      },
    },
  });

  assert.equal(updated.configured, true);
  assert.equal(updated.settings.glucoseDisplayUnit, 'mmol_per_l');
  assert.equal(updated.settings.diabetesType.category, 'type_1');

  const auditRows = await bundle.database
    .select()
    .from(medicalSchema.medicalAuditEvents)
    .where(eq(medicalSchema.medicalAuditEvents.subjectId, scope.subjectId));

  assert.ok(auditRows.length >= 2);
  assert.ok(
    auditRows.some(
      (row) =>
        row.action === DIABETES_SETTINGS_AUDIT_ACTIONS.settingsUpdated &&
        row.resourceType ===
          DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES.diabetesSettings,
    ),
  );

  await closeMedicalServiceBundle(bundle);
});

test('patchSettings rejects stale revision', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-stale-settings',
  );
  const scope = {
    accountId: 'acct-stale-settings',
    subjectId: relationship.subjectId,
    correlationId: 'corr-stale-settings',
  };

  const initial = await bundle.diabetesSettingsService.getSettings(scope);
  const created = await bundle.diabetesSettingsService.patchSettings({
    scope,
    ifMatch: initial.etagToken,
    patch: { glucoseDisplayUnit: 'mg_per_dl' },
  });

  const updated = await bundle.diabetesSettingsService.patchSettings({
    scope,
    ifMatch: created.etagToken,
    patch: { glucoseDisplayUnit: 'mmol_per_l' },
  });

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope,
        ifMatch: created.etagToken,
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertRevisionConflict,
  );

  assert.equal(updated.settings.glucoseDisplayUnit, 'mmol_per_l');

  await closeMedicalServiceBundle(bundle);
});

test('concurrent initial settings creates do not duplicate rows', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-race-settings');
  const scope = {
    accountId: 'acct-race-settings',
    subjectId: relationship.subjectId,
    correlationId: 'corr-race-settings',
  };

  const initial = await bundle.diabetesSettingsService.getSettings(scope);

  const [first, second] = await Promise.allSettled([
    bundle.diabetesSettingsService.patchSettings({
      scope,
      ifMatch: initial.etagToken,
      patch: { glucoseDisplayUnit: 'mmol_per_l' },
    }),
    bundle.diabetesSettingsService.patchSettings({
      scope,
      ifMatch: initial.etagToken,
      patch: { glucoseDisplayUnit: 'mg_per_dl' },
    }),
  ]);

  const fulfilled = [first, second].filter(
    (result) => result.status === 'fulfilled',
  );
  const rejected = [first, second].filter(
    (result) => result.status === 'rejected',
  );

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.ok(rejected.every((result) => assertRevisionConflict(result.reason)));

  const persisted = await bundle.diabetesSettingsService.getSettings(scope);
  assert.equal(persisted.configured, true);

  await closeMedicalServiceBundle(bundle);
});

test('settings bootstrap token creates resource on first write', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-bootstrap-create',
  );
  const scope = {
    accountId: 'acct-bootstrap-create',
    subjectId: relationship.subjectId,
    correlationId: 'corr-bootstrap-create',
  };

  const initial = await bundle.diabetesSettingsService.getSettings(scope);
  assert.equal(initial.configured, false);

  const created = await bundle.diabetesSettingsService.patchSettings({
    scope,
    ifMatch: initial.etagToken,
    patch: { glucoseDisplayUnit: 'mmol_per_l' },
  });

  assert.equal(created.configured, true);
  assert.equal(created.settings.glucoseDisplayUnit, 'mmol_per_l');

  await closeMedicalServiceBundle(bundle);
});

test('stale settings bootstrap token returns REVISION_CONFLICT after creation', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-stale-bootstrap-settings',
  );
  const scope = {
    accountId: 'acct-stale-bootstrap-settings',
    subjectId: relationship.subjectId,
    correlationId: 'corr-stale-bootstrap-settings',
  };

  const bootstrapView = await bundle.diabetesSettingsService.getSettings(scope);
  const bootstrapToken = bootstrapView.etagToken;

  const winner = await bundle.diabetesSettingsService.patchSettings({
    scope: {
      ...scope,
      correlationId: 'corr-winner-settings',
    },
    ifMatch: bootstrapToken,
    patch: { glucoseDisplayUnit: 'mmol_per_l' },
  });

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope: {
          ...scope,
          correlationId: 'corr-loser-settings',
        },
        ifMatch: bootstrapToken,
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertRevisionConflict,
  );

  const persisted = await bundle.diabetesSettingsService.getSettings(scope);
  assert.equal(persisted.settings.glucoseDisplayUnit, 'mmol_per_l');
  assert.equal(persisted.settings.settingsId, winner.settings.settingsId);

  await closeMedicalServiceBundle(bundle);
});

test('target bootstrap token creates profile on first write', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-bootstrap-target',
  );
  const scope = {
    accountId: 'acct-bootstrap-target',
    subjectId: relationship.subjectId,
    correlationId: 'corr-bootstrap-target',
  };

  const initial = await bundle.diabetesSettingsService.getTargetProfile(scope);
  assert.equal(initial.configured, false);

  const created = await bundle.diabetesSettingsService.putTargetProfile({
    scope,
    ifMatch: initial.etagToken,
    range: VALID_RANGE,
  });

  assert.equal(created.configured, true);
  assert.equal(
    created.profile.defaultRange?.lowMmolPerL,
    VALID_RANGE.lowMmolPerL,
  );

  await closeMedicalServiceBundle(bundle);
});

test('stale target bootstrap token returns REVISION_CONFLICT after creation', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-stale-bootstrap-target',
  );
  const scope = {
    accountId: 'acct-stale-bootstrap-target',
    subjectId: relationship.subjectId,
    correlationId: 'corr-stale-bootstrap-target',
  };

  const bootstrapView =
    await bundle.diabetesSettingsService.getTargetProfile(scope);
  const bootstrapToken = bootstrapView.etagToken;

  const winner = await bundle.diabetesSettingsService.putTargetProfile({
    scope: {
      ...scope,
      correlationId: 'corr-winner-target',
    },
    ifMatch: bootstrapToken,
    range: VALID_RANGE,
  });

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.putTargetProfile({
        scope: {
          ...scope,
          correlationId: 'corr-loser-target',
        },
        ifMatch: bootstrapToken,
        range: {
          lowMmolPerL: 5.5,
          highMmolPerL: 8.8,
          source: 'user_defined',
        },
      }),
    assertRevisionConflict,
  );

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.clearTargetProfile({
        scope: {
          ...scope,
          correlationId: 'corr-loser-clear',
        },
        ifMatch: bootstrapToken,
      }),
    assertRevisionConflict,
  );

  const persisted =
    await bundle.diabetesSettingsService.getTargetProfile(scope);
  assert.equal(
    persisted.profile.defaultRange?.lowMmolPerL,
    winner.profile.defaultRange?.lowMmolPerL,
  );

  await closeMedicalServiceBundle(bundle);
});

test('malformed and cross-boundary revision tokens remain invalid', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const owner =
    await bundle.subjectService.provisionSelfSubject('acct-token-owner');
  const other =
    await bundle.subjectService.provisionSelfSubject('acct-token-other');

  const ownerScope = {
    accountId: 'acct-token-owner',
    subjectId: owner.subjectId,
    correlationId: 'corr-token-owner',
  };
  const otherScope = {
    accountId: 'acct-token-other',
    subjectId: other.subjectId,
    correlationId: 'corr-token-other',
  };

  const ownerBootstrap =
    await bundle.diabetesSettingsService.getSettings(ownerScope);
  const ownerTargetBootstrap =
    await bundle.diabetesSettingsService.getTargetProfile(ownerScope);

  await bundle.diabetesSettingsService.patchSettings({
    scope: ownerScope,
    ifMatch: ownerBootstrap.etagToken,
    patch: { glucoseDisplayUnit: 'mmol_per_l' },
  });

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope: ownerScope,
        ifMatch: 'not-a-valid-revision-token',
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertInvalidRevisionToken,
  );

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope: otherScope,
        ifMatch: ownerBootstrap.etagToken,
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertInvalidRevisionToken,
  );

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope: ownerScope,
        ifMatch: ownerTargetBootstrap.etagToken,
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertInvalidRevisionToken,
  );

  await closeMedicalServiceBundle(bundle);
});

test('stale bootstrap write does not mutate persisted state or add audit rows', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-stale-no-audit',
  );
  const scope = {
    accountId: 'acct-stale-no-audit',
    subjectId: relationship.subjectId,
    correlationId: 'corr-stale-no-audit',
  };

  const bootstrapView = await bundle.diabetesSettingsService.getSettings(scope);
  const bootstrapToken = bootstrapView.etagToken;

  await bundle.diabetesSettingsService.patchSettings({
    scope: {
      ...scope,
      correlationId: 'corr-stale-no-audit-winner',
    },
    ifMatch: bootstrapToken,
    patch: {
      glucoseDisplayUnit: 'mmol_per_l',
      diabetesType: {
        category: 'type_1',
        otherDescriptor: null,
        source: 'self_reported',
      },
    },
  });

  const auditBefore = await bundle.database
    .select()
    .from(medicalSchema.medicalAuditEvents)
    .where(eq(medicalSchema.medicalAuditEvents.subjectId, scope.subjectId));

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.patchSettings({
        scope: {
          ...scope,
          correlationId: 'corr-stale-no-audit-loser',
        },
        ifMatch: bootstrapToken,
        patch: { glucoseDisplayUnit: 'mg_per_dl' },
      }),
    assertRevisionConflict,
  );

  const auditAfter = await bundle.database
    .select()
    .from(medicalSchema.medicalAuditEvents)
    .where(eq(medicalSchema.medicalAuditEvents.subjectId, scope.subjectId));

  assert.equal(auditAfter.length, auditBefore.length);

  const persisted = await bundle.diabetesSettingsService.getSettings(scope);
  assert.equal(persisted.settings.glucoseDisplayUnit, 'mmol_per_l');
  assert.equal(persisted.settings.diabetesType.category, 'type_1');

  await closeMedicalServiceBundle(bundle);
});

test('putTargetProfile forces user_defined provenance and audits create/update/clear', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-target');
  const scope = {
    accountId: 'acct-target',
    subjectId: relationship.subjectId,
    correlationId: 'corr-target',
  };

  const initial = await bundle.diabetesSettingsService.getTargetProfile(scope);
  assert.equal(initial.configured, false);

  const created = await bundle.diabetesSettingsService.putTargetProfile({
    scope,
    ifMatch: initial.etagToken,
    range: {
      ...VALID_RANGE,
      source: 'clinician_defined',
    },
  });

  assert.equal(created.profile.defaultRange?.source, 'user_defined');

  const updated = await bundle.diabetesSettingsService.putTargetProfile({
    scope,
    ifMatch: created.etagToken,
    range: {
      lowMmolPerL: 3.9,
      highMmolPerL: 10.0,
      source: 'user_defined',
    },
  });

  assert.equal(updated.profile.defaultRange?.highMmolPerL, 10.0);

  const cleared = await bundle.diabetesSettingsService.clearTargetProfile({
    scope,
    ifMatch: updated.etagToken,
  });

  assert.equal(cleared.configured, false);
  assert.equal(cleared.profile.defaultRange, null);

  const auditRows = await bundle.database
    .select()
    .from(medicalSchema.medicalAuditEvents)
    .where(eq(medicalSchema.medicalAuditEvents.subjectId, scope.subjectId));

  assert.ok(
    auditRows.some(
      (row) =>
        row.action === DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeUpdated,
    ),
  );
  assert.ok(
    auditRows.some(
      (row) =>
        row.action === DIABETES_SETTINGS_AUDIT_ACTIONS.targetRangeCleared,
    ),
  );
  assert.ok(auditRows.every((row) => row.actorAccountId === scope.accountId));

  await closeMedicalServiceBundle(bundle);
});

test('target mutation rolls back when audit insert fails', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-audit-rollback',
  );
  const scope = {
    accountId: 'acct-audit-rollback',
    subjectId: relationship.subjectId,
    correlationId: 'block-audit',
  };

  await bundle.database.execute(
    `ALTER TABLE medical.medical_audit_events
     DROP CONSTRAINT IF EXISTS medical_audit_events_block_test`,
  );
  await bundle.database.execute(
    `ALTER TABLE medical.medical_audit_events
     ADD CONSTRAINT medical_audit_events_block_test
     CHECK (correlation_id <> 'block-audit')`,
  );

  const initial = await bundle.diabetesSettingsService.getTargetProfile(scope);

  await assert.rejects(
    () =>
      bundle.diabetesSettingsService.putTargetProfile({
        scope,
        ifMatch: initial.etagToken,
        range: VALID_RANGE,
      }),
    (error) => error instanceof Error,
  );

  const after = await bundle.diabetesSettingsService.getTargetProfile(scope);
  assert.equal(after.configured, false);

  await closeMedicalServiceBundle(bundle);
});

test('cross-subject target profiles remain isolated', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const owner =
    await bundle.subjectService.provisionSelfSubject('acct-owner-target');
  const other =
    await bundle.subjectService.provisionSelfSubject('acct-other-target');

  const ownerScope = {
    accountId: 'acct-owner-target',
    subjectId: owner.subjectId,
    correlationId: 'corr-owner-target',
  };
  const otherScope = {
    accountId: 'acct-other-target',
    subjectId: other.subjectId,
    correlationId: 'corr-other-target',
  };

  const ownerInitial =
    await bundle.diabetesSettingsService.getTargetProfile(ownerScope);
  const ownerCreated = await bundle.diabetesSettingsService.putTargetProfile({
    scope: ownerScope,
    ifMatch: ownerInitial.etagToken,
    range: VALID_RANGE,
  });

  const otherInitial =
    await bundle.diabetesSettingsService.getTargetProfile(otherScope);
  const otherCreated = await bundle.diabetesSettingsService.putTargetProfile({
    scope: otherScope,
    ifMatch: otherInitial.etagToken,
    range: {
      lowMmolPerL: 5.0,
      highMmolPerL: 8.0,
      source: 'user_defined',
    },
  });

  assert.notEqual(
    otherCreated.profile.profileId,
    ownerCreated.profile.profileId,
  );

  const ownerAfter =
    await bundle.diabetesSettingsService.getTargetProfile(ownerScope);
  assert.equal(
    ownerAfter.profile.defaultRange?.lowMmolPerL,
    VALID_RANGE.lowMmolPerL,
  );

  await closeMedicalServiceBundle(bundle);
});
