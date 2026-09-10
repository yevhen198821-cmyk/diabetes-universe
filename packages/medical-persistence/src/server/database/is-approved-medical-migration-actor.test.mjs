import assert from 'node:assert/strict';
import test from 'node:test';

import { isApprovedMedicalMigrationActor } from './is-approved-medical-migration-actor.ts';

test('isApprovedMedicalMigrationActor accepts only the exact deploy allowlist', () => {
  assert.equal(isApprovedMedicalMigrationActor('medical_migrator'), true);
  assert.equal(isApprovedMedicalMigrationActor('medical_deployer'), true);
});

test('isApprovedMedicalMigrationActor rejects runtime, platform, and prefix roles', () => {
  assert.equal(isApprovedMedicalMigrationActor('medical_app'), false);
  assert.equal(isApprovedMedicalMigrationActor('neondb_owner'), false);
  assert.equal(isApprovedMedicalMigrationActor('neon_superuser'), false);
  assert.equal(isApprovedMedicalMigrationActor('public'), false);
  assert.equal(isApprovedMedicalMigrationActor('PUBLIC'), false);
  assert.equal(isApprovedMedicalMigrationActor('medical_'), false);
  assert.equal(
    isApprovedMedicalMigrationActor('medical_migrator_extra'),
    false,
  );
  assert.equal(
    isApprovedMedicalMigrationActor('medical_deployer_admin'),
    false,
  );
  assert.equal(isApprovedMedicalMigrationActor('arbitrary_role'), false);
  assert.equal(isApprovedMedicalMigrationActor('postgres'), false);
  assert.equal(isApprovedMedicalMigrationActor(''), false);
  assert.equal(isApprovedMedicalMigrationActor(null), false);
  assert.equal(isApprovedMedicalMigrationActor(undefined), false);
});
