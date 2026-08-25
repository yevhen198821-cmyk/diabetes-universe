import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const shellSource = readFileSync(
  fileURLToPath(new URL('./timeline-shell.tsx', import.meta.url)),
  'utf8',
);
const listSource = readFileSync(
  fileURLToPath(new URL('./timeline-list.tsx', import.meta.url)),
  'utf8',
);
const toolbarSource = readFileSync(
  fileURLToPath(new URL('./timeline-toolbar.tsx', import.meta.url)),
  'utf8',
);
const pageBackgroundSource = readFileSync(
  fileURLToPath(new URL('../shared/app-page-background.tsx', import.meta.url)),
  'utf8',
);

test('timeline shell reuses the home page colorful backdrop', () => {
  assert.match(shellSource, /AppPageBackground/);
  assert.match(shellSource, /appPageShellClassName/);
  assert.match(pageBackgroundSource, /bg-\[#f7fafd\]/);
  assert.match(shellSource, /DashboardMobileNav/);
  assert.match(shellSource, /activeTab="timeline"/);
});

test('timeline mobile quick add FAB uses compact sizing tokens', () => {
  const navLayoutSource = readFileSync(
    fileURLToPath(
      new URL('../dashboard/dashboard-mobile-nav-layout.ts', import.meta.url),
    ),
    'utf8',
  );
  const mobileNavSource = readFileSync(
    fileURLToPath(
      new URL('../dashboard/dashboard-mobile-nav.tsx', import.meta.url),
    ),
    'utf8',
  );

  assert.match(navLayoutSource, /DASHBOARD_MOBILE_QUICK_ADD_FAB_SIZE = '4rem'/);
  assert.match(navLayoutSource, /size-16/);
  assert.match(
    navLayoutSource,
    /shadow-\[0_12px_30px_rgba\(6,182,212,0\.28\)\]/,
  );
  assert.match(
    navLayoutSource,
    /DASHBOARD_MOBILE_QUICK_ADD_FAB_ICON_SIZE = 22/,
  );
  assert.doesNotMatch(navLayoutSource, /size-\[3\.75rem\]/);
  assert.match(mobileNavSource, /DASHBOARD_MOBILE_QUICK_ADD_FAB_CLASSES/);
});

test('timeline list uses vibrant frosted event cards', () => {
  assert.match(listSource, /frostedPanelClassName/);
  assert.match(listSource, /appearance="vibrant"/);
  assert.match(toolbarSource, /frostedPanelClassName/);
});
