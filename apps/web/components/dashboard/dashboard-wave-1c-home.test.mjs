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
  assert.doesNotMatch(summarySource, /MetricDecoration/);
});

test('quick actions expose approved high-frequency categories including notes', () => {
  for (const category of [
    'glucose',
    'insulin',
    'nutrition',
    'activity',
    'note',
  ]) {
    assert.match(quickActionsSource, new RegExp(`'${category}'`));
  }
});

test('header keeps brand and account affordance without duplicate add-event CTA', () => {
  assert.match(headerSource, /DashboardBrandMark/);
  assert.match(headerSource, /DashboardAvatar/);
  assert.doesNotMatch(headerSource, /viewModel\.addEventLabel/);
  assert.doesNotMatch(headerSource, /aria-label=\{viewModel\.addEventLabel\}/);
});

test('mobile navigation links only to real routes', () => {
  assert.match(mobileNavSource, /href="\/"/);
  assert.match(mobileNavSource, /href="\/timeline"/);
  assert.match(mobileNavSource, /href="\/account"/);
  assert.match(mobileNavSource, /Clock/);
  assert.doesNotMatch(mobileNavSource, /href="\/analytics"/);
  assert.doesNotMatch(mobileNavSource, /Anna/);
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
