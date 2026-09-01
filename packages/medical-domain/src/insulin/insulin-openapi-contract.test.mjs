import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  INSULIN_PREPARATION_IDS,
} from '../index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const OPENAPI_PATH = join(ROOT, 'docs/api/openapi/medical-v1.yaml');
const TYPES_PATH = join(ROOT, 'packages/types/src/semantic-timeline.ts');

function extractOpenApiEnum(source, schemaName) {
  const start = source.indexOf(`\n    ${schemaName}:`);
  assert.notEqual(start, -1, `OpenAPI schema ${schemaName} is missing`);

  const rest = source.slice(start + 1);
  const enumMarker = '\n      enum:\n';
  const enumIndex = rest.indexOf(enumMarker);
  assert.notEqual(
    enumIndex,
    -1,
    `OpenAPI schema ${schemaName} enum is missing`,
  );

  const values = [];
  for (const line of rest.slice(enumIndex + enumMarker.length).split('\n')) {
    const match = /^        - (.+)$/.exec(line);
    if (!match) {
      break;
    }
    values.push(match[1]);
  }

  assert.ok(values.length > 0, `OpenAPI schema ${schemaName} enum is empty`);
  return values;
}

function extractTypeUnionLiterals(source, typeName) {
  const match = source.match(
    new RegExp(`export type ${typeName} =\\n((?:\\s+\\| '[^']+'[;\\n]+)+)`),
  );

  assert.ok(match, `Type ${typeName} union is missing`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

test('OpenAPI insulin enums match medical-domain registry and types union', () => {
  const openApi = readFileSync(OPENAPI_PATH, 'utf8');
  const typesSource = readFileSync(TYPES_PATH, 'utf8');

  const openApiPreparationIds = extractOpenApiEnum(
    openApi,
    'InsulinPreparationId',
  );
  const openApiContexts = extractOpenApiEnum(
    openApi,
    'InsulinAdministrationContext',
  );
  const typePreparationIds = extractTypeUnionLiterals(
    typesSource,
    'InsulinPreparationId',
  );
  const typeContexts = extractTypeUnionLiterals(
    typesSource,
    'InsulinAdministrationContext',
  );

  assert.deepEqual(openApiPreparationIds, [...INSULIN_PREPARATION_IDS]);
  assert.deepEqual(typePreparationIds, [...INSULIN_PREPARATION_IDS]);
  assert.deepEqual(openApiContexts, [...INSULIN_ADMINISTRATION_CONTEXTS]);
  assert.deepEqual(typeContexts, [...INSULIN_ADMINISTRATION_CONTEXTS]);
  assert.equal(openApiPreparationIds.includes('insulin.prep.unmapped'), false);
  assert.match(
    openApi,
    /preparationId:\n\s+\$ref: '#\/components\/schemas\/InsulinPreparationId'/,
  );
  assert.match(
    openApi,
    /administrationContext:\n\s+\$ref: '#\/components\/schemas\/InsulinAdministrationContext'/,
  );
});
