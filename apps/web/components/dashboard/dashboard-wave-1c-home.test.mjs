import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createDashboardGreetingMessage,
  resolveDashboardGreetingPeriod,
} from './dashboard-greeting-labels.ts';

const rootSource = readFileSync(
  fileURLToPath(new URL('./dashboard-root.tsx', import.meta.url)),
  'utf8',
);
const heroSource = readFileSync(
  fileURLToPath(new URL('./dashboard-last-glucose.tsx', import.meta.url)),
  'utf8',
);
const heroScenerySource = readFileSync(
  fileURLToPath(new URL('./dashboard-hero-scenery.tsx', import.meta.url)),
  'utf8',
);
const summarySource = readFileSync(
  fileURLToPath(new URL('./dashboard-day-summary.tsx', import.meta.url)),
  'utf8',
);
const summaryModelSource = readFileSync(
  fileURLToPath(new URL('./dashboard-day-summary-model.ts', import.meta.url)),
  'utf8',
);
const headerSource = readFileSync(
  fileURLToPath(new URL('./dashboard-header.tsx', import.meta.url)),
  'utf8',
);
const quickActionsSource = readFileSync(
  fileURLToPath(new URL('./dashboard-quick-actions.tsx', import.meta.url)),
  'utf8',
);
const mobileNavSource = readFileSync(
  fileURLToPath(new URL('./dashboard-mobile-nav.tsx', import.meta.url)),
  'utf8',
);
const miniChartsSource = readFileSync(
  fileURLToPath(
    new URL('./dashboard-day-summary-mini-charts.tsx', import.meta.url),
  ),
  'utf8',
);
const shellSource = readFileSync(
  fileURLToPath(new URL('./dashboard-shell.tsx', import.meta.url)),
  'utf8',
);
const navLayoutSource = readFileSync(
  fileURLToPath(new URL('./dashboard-mobile-nav-layout.ts', import.meta.url)),
  'utf8',
);
const pageBackgroundSource = readFileSync(
  fileURLToPath(new URL('../shared/app-page-background.tsx', import.meta.url)),
  'utf8',
);

test('Home composition keeps trust-first blocks and excludes deferred AI insight', () => {
  assert.match(rootSource, /DashboardLastGlucose/);
  assert.match(rootSource, /DashboardDaySummary/);
  assert.match(rootSource, /DashboardQuickActions/);
  assert.match(rootSource, /DashboardGreeting/);
  assert.match(rootSource, /DashboardMobileNav/);
  assert.match(rootSource, /DashboardRecentEvents/);
  assert.doesNotMatch(rootSource, /DashboardAiInsight/);
  assert.doesNotMatch(rootSource, /DashboardNextAction/);
  assert.doesNotMatch(rootSource, /showFloatingActionButton=\{true\}/);
});

test('glucose hero preserves explicit stale and source presentation', () => {
  assert.match(heroSource, /viewModel\.sourceLabel/);
  assert.match(heroSource, /viewModel\.staleMessage/);
  assert.match(heroSource, /viewModel\.freshMessage/);
  assert.match(heroSource, /ClockAlert/);
  assert.match(heroSource, /dateTime=/);
  assert.match(heroSource, /DashboardHeroScenery/);
  assert.match(heroScenerySource, /heroHillFront/);
});

test('today summary presents four distinct metric visual slots with real mini charts', () => {
  assert.equal((summarySource.match(/icon:/g) ?? []).length, 4);
  assert.match(summarySource, /grid-cols-2/);
  assert.match(summarySource, /lg:grid-cols-4/);
  assert.match(summarySource, /GlucoseMiniChart/);
  assert.match(summarySource, /InsulinMiniChart/);
  assert.match(summarySource, /NutritionMiniChart/);
  assert.match(summarySource, /ActivityMiniChart/);
  assert.match(summaryModelSource, /resolveSecondaryText/);
  assert.match(summaryModelSource, /chartEmptyHint/);
  assert.match(summarySource, /dark:from-teal-950/);
  assert.doesNotMatch(summarySource, /MetricDecoration/);
});

test('empty mini charts avoid fabricated data visuals and misleading chart semantics', () => {
  assert.doesNotMatch(miniChartsSource, /strokeDasharray/);
  assert.match(miniChartsSource, /sr-only/);

  const emptyMiniChartSource = miniChartsSource.match(
    /function EmptyMiniChart\([\s\S]*?\n\}/,
  )?.[0];

  assert.ok(emptyMiniChartSource, 'EmptyMiniChart helper is present');
  assert.doesNotMatch(emptyMiniChartSource, /<svg/);
  assert.doesNotMatch(emptyMiniChartSource, /role="img"/);

  assert.match(miniChartsSource, /buildSparklinePath/);
  assert.match(summarySource, /metric\.chartValues\.length === 0/);
});

test('home shell reserves mobile nav clearance from shared layout tokens', () => {
  assert.match(shellSource, /dashboardMainMobileNavPaddingClassName/);
  assert.match(navLayoutSource, /DASHBOARD_MOBILE_NAV_INNER_HEIGHT/);
  assert.match(navLayoutSource, /max\(0\.5rem,env\(safe-area-inset-bottom\)\)/);
  assert.match(mobileNavSource, /dashboardMobileNavOuterClassName/);
  assert.match(mobileNavSource, /id="dashboard-mobile-nav"/);
});

test('quick actions expose exactly five approved high-frequency categories including notes', () => {
  assert.equal(visibleCategoriesCount(quickActionsSource), 5);

  for (const category of [
    'glucose',
    'insulin',
    'nutrition',
    'activity',
    'note',
  ]) {
    assert.match(quickActionsSource, new RegExp(`'${category}'`));
  }

  assert.doesNotMatch(quickActionsSource, /\btruncate\b/);
  assert.match(quickActionsSource, /min-h-11/);
});

function visibleCategoriesCount(source) {
  const match = source.match(
    /const visibleCategories = \[([\s\S]*?)\] as const/,
  );

  assert.ok(match, 'visibleCategories declaration is present');

  return match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean).length;
}

test('header keeps approved brand logo with wordmark and account affordance', () => {
  assert.match(headerSource, /\/brand\/diabetes-universe-logo\.png/);
  assert.match(headerSource, /DashboardBrandWordmark/);
  assert.match(headerSource, /DashboardAvatar/);
  assert.doesNotMatch(headerSource, /DashboardBrandMark/);
  assert.doesNotMatch(headerSource, /viewModel\.addEventLabel/);
  assert.doesNotMatch(headerSource, /aria-label=\{viewModel\.addEventLabel\}/);
});

test('mobile navigation links only to real routes without duplicate quick-add FAB', () => {
  assert.match(mobileNavSource, /href="\/"/);
  assert.match(mobileNavSource, /href="\/timeline"/);
  assert.match(mobileNavSource, /href="\/account"/);
  assert.match(mobileNavSource, /showQuickAddFab/);
  assert.match(mobileNavSource, /grid-cols-3/);
  assert.match(mobileNavSource, /min-h-11/);
  assert.match(rootSource, /showQuickAddFab=\{false\}/);
  assert.doesNotMatch(mobileNavSource, /href="\/analytics"/);
  assert.doesNotMatch(mobileNavSource, /Anna/);
});

test('home shell keeps airy light canvas and dark-compatible ambient backdrop', () => {
  assert.match(pageBackgroundSource, /bg-\[#f7fafd\]/);
  assert.match(pageBackgroundSource, /dark:bg-background/);
  assert.match(pageBackgroundSource, /dark:opacity-/);
  assert.match(shellSource, /AppPageBackground/);
  assert.doesNotMatch(rootSource, /DashboardNextAction/);
  assert.doesNotMatch(rootSource, /DashboardAiInsight/);
});

test('greeting resolves by time of day without health judgment copy', () => {
  const labels = {
    contextToday: 'Your data for today',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    greetingMorning: 'Good morning',
    greetingNight: 'Good night',
  };

  assert.equal(
    resolveDashboardGreetingPeriod(new Date('2026-08-02T09:00:00.000Z')),
    'morning',
  );
  assert.equal(
    createDashboardGreetingMessage(
      labels,
      new Date('2026-08-02T09:00:00.000Z'),
    ),
    'Good morning',
  );
  assert.doesNotMatch(labels.contextToday, /great|excellent|справляетесь/i);
});
