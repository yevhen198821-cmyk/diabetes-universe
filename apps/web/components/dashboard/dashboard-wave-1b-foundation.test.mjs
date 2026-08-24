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
const rootSource = readFileSync(
  fileURLToPath(new URL('./dashboard-root.tsx', import.meta.url)),
  'utf8',
);

test('dashboard shell keeps semantic page foundation under decorative layers', () => {
  assert.match(shellSource, /text-text-primary/);
  assert.match(shellSource, /min-h-screen/);
  assert.match(shellSource, /id="main-content"/);
});

test('dashboard blocks preserve Wave 1C home order without next action', () => {
  const lastGlucoseIndex = shellSource.indexOf('{lastGlucose}');
  const daySummaryIndex = shellSource.indexOf('{daySummary}');
  const quickActionsIndex = shellSource.indexOf('{quickActions}');
  const recentEventsIndex = shellSource.indexOf('{recentEvents}');

  assert.ok(lastGlucoseIndex >= 0);
  assert.ok(daySummaryIndex > lastGlucoseIndex);
  assert.ok(quickActionsIndex > daySummaryIndex);
  assert.ok(recentEventsIndex > quickActionsIndex);
  assert.equal(shellSource.includes('{nextAction}'), false);
  assert.doesNotMatch(rootSource, /DashboardNextAction/);
});

test('Wave 1C decorative color does not remove semantic accessibility states', () => {
  assert.match(lastGlucoseSource, /role="status"/);
  assert.match(lastGlucoseSource, /text-text-primary/);
  assert.match(nextActionSource, /aria-labelledby=\{titleId\}/);
  assert.match(nextActionSource, /text-status-danger/);
  assert.match(quickActionsSource, /focus-visible:outline-interactive-primary/);
});
