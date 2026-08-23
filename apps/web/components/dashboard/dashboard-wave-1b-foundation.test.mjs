import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const shellSource = readFileSync(
  fileURLToPath(new URL('./dashboard-shell.tsx', import.meta.url)),
  'utf8',
);
const lastGlucoseSource = readFileSync(
  fileURLToPath(new URL('./dashboard-last-glucose.tsx', import.meta.url)),
  'utf8',
);
const nextActionSource = readFileSync(
  fileURLToPath(new URL('./dashboard-next-action.tsx', import.meta.url)),
  'utf8',
);

test('dashboard shell uses semantic background tokens', () => {
  assert.match(shellSource, /bg-background text-text-primary/);
  assert.doesNotMatch(shellSource, /dark:/);
});

test('dashboard blocks preserve Wave 1A status-first order in shell', () => {
  const lastGlucoseIndex = shellSource.indexOf('{lastGlucose}');
  const nextActionIndex = shellSource.indexOf('{nextAction}');

  assert.ok(lastGlucoseIndex >= 0);
  assert.ok(nextActionIndex > lastGlucoseIndex);
});

test('dashboard migrated blocks avoid raw slate page surfaces', () => {
  assert.match(lastGlucoseSource, /bg-surface|border-border-default/);
  assert.doesNotMatch(lastGlucoseSource, /dark:/);
  assert.doesNotMatch(nextActionSource, /dark:/);
});
