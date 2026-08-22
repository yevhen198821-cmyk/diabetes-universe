import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { findOpenApiBreakingChanges } from './lib/openapi-contract-diff.mjs';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/openapi-breaking',
);

function readFixture(name) {
  return readFileSync(join(FIXTURES, name), 'utf8');
}

test('additive optional response field passes', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    '        revision:\n          type: string',
    '        revision:\n          type: string\n        compatibilityNote:\n          type: string',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, false);
});

test('new endpoint passes', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    'paths:',
    "paths:\n  /me/medical-events/health:\n    get:\n      operationId: healthCheck\n      responses:\n        '200':\n          description: ok",
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, false);
});

test('new optional request property passes', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    '      properties:\n        event:',
    '      properties:\n        clientHint:\n          type: string\n        event:',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, false);
});

test('removed endpoint fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(/\n    post:[\s\S]*?(?=\ncomponents:)/, '\n');

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
  assert.match(result.changes.join('\n'), /Removed operation/i);
});

test('removed method fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(/\n    get:[\s\S]*?(?=\n    post:)/, '\n');

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
});

test('removed required header fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    `        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string`,
    '',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
  assert.match(result.changes.join('\n'), /Idempotency-Key/i);
});

test('removed success response fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    /\n        '201':[\s\S]*?MedicalEventResource'\n/,
    '\n',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
});

test('removed required field fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(/\n        revision:\n          type: string/, '');

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
  assert.match(result.changes.join('\n'), /revision/i);
});

test('enum narrowed fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    'enum: [manual, device, import]',
    'enum: [manual, device]',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
  assert.match(result.changes.join('\n'), /Enum narrowed/i);
});

test('incompatible type change fails', async () => {
  const base = readFixture('base.yaml');
  const head = base.replace(
    '        revision:\n          type: string',
    '        revision:\n          type: integer',
  );

  const result = await findOpenApiBreakingChanges(base, head);
  assert.equal(result.breaking, true);
  assert.match(result.changes.join('\n'), /Incompatible type change/i);
});
