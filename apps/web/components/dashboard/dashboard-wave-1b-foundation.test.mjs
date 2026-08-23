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
const quickActionsSource = readFileSync(
  fileURLToPath(new URL('./dashboard-quick-actions.tsx', import.meta.url)),
  'utf8',
);

test('dashboard shell keeps semantic page foundation under decorative layers', () => {
  assert.match(shellSource, /bg-background text-text-primary/);
  assert.match(shellSource, /id="main-content"/);
});

test('dashboard blocks preserve Wave 1A status-first order in shell', () => {
  const lastGlucoseIndex = shellSource.indexOf('{lastGlucose}');
  const daySummaryIndex = shellSource.indexOf('{daySummary}');
  const nextActionIndex = shellSource.indexOf('{nextAction}');
  const recentEventsIndex = shellSource.indexOf('{recentEvents}');

  assert.ok(lastGlucoseIndex >= 0);
  assert.ok(daySummaryIndex > lastGlucoseIndex);
  assert.ok(nextActionIndex > daySummaryIndex);
  assert.ok(recentEventsIndex > nextActionIndex);
});

test('Wave 1C decorative color does not remove semantic accessibility states', () => {
  assert.match(lastGlucoseSource, /role="status"/);
  assert.match(lastGlucoseSource, /text-text-primary/);
  assert.match(nextActionSource, /text-text-primary/);
  assert.match(quickActionsSource, /focus-visible:outline-interactive-primary/);
});
