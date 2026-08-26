import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import SwaggerParser from '@apidevtools/swagger-parser';
import { load as loadYaml } from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_PATH = join(ROOT, 'docs/api/openapi/medical-v1.yaml');

const EXPECTED_GLUCOSE_DISPLAY_UNITS = ['mmol_per_l', 'mg_per_dl'];
const EXPECTED_DIABETES_TYPE_CATEGORIES = [
  'type_1',
  'type_2',
  'gestational',
  'other',
  'unknown',
];
const EXPECTED_TARGET_RANGE_SOURCES = [
  'user_defined',
  'clinician_defined',
  'imported',
  'system_reference',
];

function readOpenApiEnums(schemaName) {
  const source = readFileSync(SPEC_PATH, 'utf8');
  const document = loadYaml(source);
  return document.components.schemas[schemaName].enum;
}

test('OpenAPI GlucoseDisplayUnit matches domain taxonomy', () => {
  assert.deepEqual(
    readOpenApiEnums('GlucoseDisplayUnit'),
    EXPECTED_GLUCOSE_DISPLAY_UNITS,
  );
});

test('OpenAPI DiabetesTypeCategory matches domain taxonomy', () => {
  assert.deepEqual(
    readOpenApiEnums('DiabetesTypeCategory'),
    EXPECTED_DIABETES_TYPE_CATEGORIES,
  );
});

test('OpenAPI TargetRangeSource matches domain taxonomy', () => {
  assert.deepEqual(
    readOpenApiEnums('TargetRangeSource'),
    EXPECTED_TARGET_RANGE_SOURCES,
  );
});

test('OpenAPI diabetes settings schemas validate', async () => {
  const api = await SwaggerParser.validate(SPEC_PATH);
  assert.equal(
    api.components.schemas.DiabetesSettings.properties.glucoseDisplayUnit
      .nullable,
    true,
  );
  assert.equal(
    api.components.schemas.GlucoseTargetProfile.properties.defaultRange
      .nullable,
    true,
  );
  assert.equal(
    api.components.schemas.DiabetesSettingsResponse.properties.configured.type,
    'boolean',
  );
});

test('OpenAPI exposes diabetes settings runtime paths', async () => {
  const source = readFileSync(SPEC_PATH, 'utf8');
  const document = loadYaml(source);

  assert.ok(document.paths['/me/diabetes-settings']?.get);
  assert.ok(document.paths['/me/diabetes-settings']?.patch);
  assert.ok(document.paths['/me/glucose-target-profile']?.get);
  assert.ok(document.paths['/me/glucose-target-profile']?.put);
  assert.ok(document.paths['/me/glucose-target-profile']?.delete);
});
