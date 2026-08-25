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

test('timeline mobile quick add FAB is embedded in bottom navigation', () => {
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

  assert.match(navLayoutSource, /TIMELINE_MOBILE_QUICK_ADD_FAB_SIZE = '3rem'/);
  assert.match(navLayoutSource, /size-12/);
  assert.match(navLayoutSource, /TIMELINE_MOBILE_QUICK_ADD_FAB_ICON_SIZE = 20/);
  assert.doesNotMatch(
    navLayoutSource,
    /timelineMobileQuickAddFabPositionClassName/,
  );
  assert.match(mobileNavSource, /<Plus/);
  assert.match(mobileNavSource, /showQuickAddFab/);
  assert.match(mobileNavSource, /grid-cols-4/);
  assert.match(shellSource, /showQuickAddFab/);
  assert.doesNotMatch(shellSource, /TimelineMobileQuickAddFab/);
});

test('timeline shell renders events of the day and day navigation', () => {
  assert.match(shellSource, /TimelineDayNavigation/);
  assert.match(shellSource, /TimelineEventsOfDayMap/);
  assert.match(shellSource, /createTimelineDayPeriodListModel/);
});

test('timeline list uses vibrant frosted event cards and day period groups', () => {
  assert.match(listSource, /frostedPanelClassName/);
  assert.match(listSource, /appearance="vibrant"/);
  assert.match(listSource, /periodGroups/);
  assert.match(toolbarSource, /frostedPanelClassName/);
});
