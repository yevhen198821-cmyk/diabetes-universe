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
    /settings\?\.glucoseDisplayUnit \?\? sessionDisplayUnit/,
  );
  assert.match(providerSource, /fetchDiabetesSettings/);
  assert.match(providerSource, /selectGlucoseDisplayUnit/);
  assert.doesNotMatch(providerSource, /localStorage/);
});

test('diabetes settings provider treats unauthorized as unconfigured without error', () => {
  assert.match(providerSource, /interpretDiabetesSettingsLoadFailure/);
  assert.match(providerSource, /interpreted.type === 'unconfigured'/);
  assert.match(providerSource, /setSettings\(null\)/);
});

test('diabetes settings provider guards overlapping refresh completions', () => {
  assert.match(providerSource, /requestIdRef/);
  assert.match(providerSource, /requestId !== requestIdRef.current/);
  assert.match(providerSource, /setLoadState\('loading'\)/);
});

test('app providers mount a single diabetes settings provider', () => {
  assert.match(providersSource, /DiabetesSettingsProvider/);
});

test('timeline presentation hook consumes glucose presentation dependencies', () => {
  assert.match(timelineHookSource, /useGlucosePresentationDependencies/);
  assert.match(timelineHookSource, /targetRange/);
});
