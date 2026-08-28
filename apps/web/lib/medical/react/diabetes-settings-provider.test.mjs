import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const providerSource = readFileSync(
  fileURLToPath(new URL('./diabetes-settings-provider.tsx', import.meta.url)),
  'utf8',
);
const providersSource = readFileSync(
  fileURLToPath(new URL('../../../app/providers.tsx', import.meta.url)),
  'utf8',
);
const timelineHookSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../timeline/react/use-timeline-presentation-dependencies.ts',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('diabetes settings provider exposes authoritative glucoseDisplayUnit', () => {
  assert.match(
    providerSource,
    /glucoseDisplayUnit: settings\?\.glucoseDisplayUnit/,
  );
  assert.match(providerSource, /fetchDiabetesSettings/);
  assert.doesNotMatch(providerSource, /localStorage/);
});

test('diabetes settings provider treats unauthorized as unconfigured without error', () => {
  assert.match(providerSource, /kind === 'unauthorized'/);
  assert.match(providerSource, /setSettings\(null\)/);
});

test('app providers mount a single diabetes settings provider', () => {
  assert.match(providersSource, /DiabetesSettingsProvider/);
});

test('timeline presentation hook consumes diabetes settings provider', () => {
  assert.match(timelineHookSource, /useDiabetesSettings/);
  assert.match(timelineHookSource, /glucoseDisplayUnit/);
});
