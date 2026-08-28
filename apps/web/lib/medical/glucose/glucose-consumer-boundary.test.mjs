import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dashboardLastGlucoseSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../components/dashboard/dashboard-last-glucose.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('dashboard last glucose does not import timeline glucose presentation helpers', () => {
  assert.doesNotMatch(
    dashboardLastGlucoseSource,
    /lib\/timeline\/presentation/,
  );
  assert.doesNotMatch(
    dashboardLastGlucoseSource,
    /formatTimelineGlucoseDisplayValue/,
  );
  assert.doesNotMatch(
    dashboardLastGlucoseSource,
    /mapTimelineEventCardPresentation/,
  );
  assert.match(dashboardLastGlucoseSource, /lib\/medical\/glucose/);
  assert.match(dashboardLastGlucoseSource, /presentGlucoseFromTimelineEvent/);
});
