import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalDiabetesSettingsMigrationSql,
  readMedicalFoundationMigrationSql,
} from './medical-pglite-bootstrap-migrations.ts';
import { medicalSchema } from './medical-schema.ts';

const drizzleDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle',
);

const diabetesSettingsMigrationSql = readFileSync(
  join(drizzleDirectory, '0005_medical_diabetes_settings.sql'),
  'utf8',
);

async function bootstrapMedicalSchema(client) {
  await client.exec(readMedicalFoundationMigrationSql());
  await client.exec(readMedicalAdoptionMigrationSql());
  await client.exec(readMedicalAdoptionSubjectResourceFkMigrationSql());
  await client.exec(readMedicalAdoptionItemStatesMigrationSql());
  await client.exec(readMedicalDiabetesSettingsMigrationSql());
}

test('diabetes settings migration artifact matches exported SQL constant', () => {
  assert.equal(
    readMedicalDiabetesSettingsMigrationSql(),
    diabetesSettingsMigrationSql,
  );
});

test('diabetes settings migration is additive and contains no guessed backfill', () => {
  assert.doesNotMatch(diabetesSettingsMigrationSql, /UPDATE\s+medical\./i);
  assert.doesNotMatch(
    diabetesSettingsMigrationSql,
    /INSERT\s+INTO\s+medical\.diabetes_settings/i,
  );
  assert.doesNotMatch(diabetesSettingsMigrationSql, /DROP\s+TABLE/i);
  assert.match(diabetesSettingsMigrationSql, /ON DELETE RESTRICT/);
});

test('schema permits transitional missing glucoseDisplayUnit', async () => {
  const client = new PGlite();
  await bootstrapMedicalSchema(client);

  const subjectId = '11111111-1111-4111-8111-111111111111';
  const settingsId = '22222222-2222-4222-8222-222222222222';

  await client.exec(`
    INSERT INTO medical.medical_subjects (subject_id, subject_kind, status, created_at, updated_at)
    VALUES ('${subjectId}', 'person', 'active', NOW(), NOW());

    INSERT INTO medical.diabetes_settings (
      settings_id, subject_id, glucose_display_unit, diabetes_type_category,
      created_at, updated_at, revision
    ) VALUES (
      '${settingsId}', '${subjectId}', NULL, 'unknown', NOW(), NOW(), 1
    );
  `);

  const row = await client.query(
    'SELECT glucose_display_unit, diabetes_type_category FROM medical.diabetes_settings WHERE subject_id = $1',
    [subjectId],
  );

  assert.equal(row.rows[0].glucose_display_unit, null);
  assert.equal(row.rows[0].diabetes_type_category, 'unknown');

  await client.close();
});

test('one DiabetesSettings and one GlucoseTargetProfile per MedicalSubject', async () => {
  const client = new PGlite();
  await bootstrapMedicalSchema(client);

  const subjectId = '33333333-3333-4333-8333-333333333333';

  await client.exec(`
    INSERT INTO medical.medical_subjects (subject_id, subject_kind, status, created_at, updated_at)
    VALUES ('${subjectId}', 'person', 'active', NOW(), NOW());
  `);

  await client.exec(`
    INSERT INTO medical.diabetes_settings (
      settings_id, subject_id, glucose_display_unit, diabetes_type_category,
      created_at, updated_at, revision
    ) VALUES (
      '44444444-4444-4444-8444-444444444444', '${subjectId}', 'mmol_per_l', 'unknown', NOW(), NOW(), 1
    );

    INSERT INTO medical.glucose_target_profiles (
      profile_id, subject_id, low_mmol_per_l, high_mmol_per_l, source,
      created_at, updated_at, revision
    ) VALUES (
      '55555555-5555-4555-8555-555555555555', '${subjectId}', 4, 10, 'user_defined', NOW(), NOW(), 1
    );
  `);

  await assert.rejects(
    () =>
      client.exec(`
        INSERT INTO medical.diabetes_settings (
          settings_id, subject_id, glucose_display_unit, diabetes_type_category,
          created_at, updated_at, revision
        ) VALUES (
          '66666666-6666-4666-8666-666666666666', '${subjectId}', 'mg_per_dl', 'unknown', NOW(), NOW(), 1
        );
      `),
    /duplicate key|unique constraint/i,
  );

  await assert.rejects(
    () =>
      client.exec(`
        INSERT INTO medical.glucose_target_profiles (
          profile_id, subject_id, low_mmol_per_l, high_mmol_per_l, source,
          created_at, updated_at, revision
        ) VALUES (
          '77777777-7777-4777-8777-777777777777', '${subjectId}', 3.9, 7.8, 'user_defined', NOW(), NOW(), 1
        );
      `),
    /duplicate key|unique constraint/i,
  );

  const database = drizzlePglite(client, { schema: medicalSchema });
  assert.equal(Object.keys(medicalSchema).includes('diabetesSettings'), true);
  assert.equal(
    Object.keys(medicalSchema).includes('glucoseTargetProfiles'),
    true,
  );
  assert.equal(database.query.diabetesSettings !== undefined, true);

  await client.close();
});

test('FK delete behavior restricts deleting subjects with settings', async () => {
  const client = new PGlite();
  await bootstrapMedicalSchema(client);

  const subjectId = '88888888-8888-4888-8888-888888888888';

  await client.exec(`
    INSERT INTO medical.medical_subjects (subject_id, subject_kind, status, created_at, updated_at)
    VALUES ('${subjectId}', 'person', 'active', NOW(), NOW());

    INSERT INTO medical.diabetes_settings (
      settings_id, subject_id, glucose_display_unit, diabetes_type_category,
      created_at, updated_at, revision
    ) VALUES (
      '99999999-9999-4999-8999-999999999999', '${subjectId}', NULL, 'unknown', NOW(), NOW(), 1
    );
  `);

  await assert.rejects(
    () =>
      client.exec(
        `DELETE FROM medical.medical_subjects WHERE subject_id = '${subjectId}';`,
      ),
    /violates foreign key constraint|foreign key/i,
  );

  await client.close();
});

test('target range CHECK rejects low equal to high', async () => {
  const client = new PGlite();
  await bootstrapMedicalSchema(client);

  const subjectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  await client.exec(`
    INSERT INTO medical.medical_subjects (subject_id, subject_kind, status, created_at, updated_at)
    VALUES ('${subjectId}', 'person', 'active', NOW(), NOW());
  `);

  await assert.rejects(
    () =>
      client.exec(`
        INSERT INTO medical.glucose_target_profiles (
          profile_id, subject_id, low_mmol_per_l, high_mmol_per_l, source,
          created_at, updated_at, revision
        ) VALUES (
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '${subjectId}', 5, 5, 'user_defined', NOW(), NOW(), 1
        );
      `),
    /check constraint|violates check constraint/i,
  );

  await client.close();
});
