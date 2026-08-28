import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const dashboardRootSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../components/dashboard/dashboard-root.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);
const dashboardLastGlucoseSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../components/dashboard/dashboard-last-glucose.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);
const dashboardQuickActionsSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../components/dashboard/dashboard-quick-actions.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('dashboard root owns a single glucose presentation dependency hook', () => {
  assert.equal(
    (dashboardRootSource.match(/useGlucosePresentationDependencies\(/g) ?? [])
      .length,
    1,
  );
  assert.doesNotMatch(
    dashboardRootSource,
    /useTimelinePresentationDependencies/,
  );
  assert.match(dashboardRootSource, /composeTimelinePresentationDependencies/);
  assert.match(
    dashboardRootSource,
    /glucosePresentation=\{glucosePresentation\}/,
  );
  assert.match(
    dashboardRootSource,
    /presentationDependencies=\{presentationDependencies\}/,
  );
});

test('dashboard last glucose does not fetch glucose presentation dependencies', () => {
  assert.doesNotMatch(
    dashboardLastGlucoseSource,
    /useGlucosePresentationDependencies/,
  );
  assert.doesNotMatch(dashboardLastGlucoseSource, /fetchGlucoseTargetProfile/);
  assert.match(dashboardLastGlucoseSource, /props\.glucosePresentation/);
});

test('dashboard quick actions consumes composed timeline presentation dependencies', () => {
  assert.doesNotMatch(
    dashboardQuickActionsSource,
    /useTimelinePresentationDependencies/,
  );
  assert.doesNotMatch(
    dashboardQuickActionsSource,
    /useGlucosePresentationDependencies/,
  );
  assert.match(
    dashboardQuickActionsSource,
    /presentationDependencies: TimelinePresentationDependencies/,
  );
});
