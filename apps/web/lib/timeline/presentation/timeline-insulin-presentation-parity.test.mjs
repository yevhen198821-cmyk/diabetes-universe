import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveDashboardRecentEventSources } from '../../dashboard/dashboard-recent-events-derivation.ts';
import { createTimelineSearchFilterModel } from '../../../components/timeline/timeline-search-filter-model.ts';
import { createTestTimelineFilterOptions } from '../testing/create-test-timeline-filter-options.ts';
import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';
import {
  mapTimelineEventCardPresentation,
  mapTimelineEventDetailPresentation,
} from './timeline-presentation-mapper.ts';

const envelope = {
  createdAt: '2026-08-02T05:05:00.000Z',
  kind: 'insulin',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const semanticInsulin = {
  ...envelope,
  administrationContext: 'correction',
  id: 'insulin-semantic',
  occurredAt: '2026-08-02T05:05:00.000Z',
  doseUnits: 4,
  preparation: 'НовоРапид',
  preparationId: 'insulin.prep.aspart_novorapid',
};

const legacyInsulin = {
  ...envelope,
  context: 'Перед завтраком',
  doseUnits: 6,
  id: 'insulin-legacy',
  occurredAt: '2026-08-02T04:05:00.000Z',
  preparation: 'Lantus',
};

let dependencies;
let russianDependencies;

test.before(async () => {
  dependencies = await createTestTimelinePresentationDependencies();
  russianDependencies = await createTestTimelinePresentationDependencies({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });
});

test('dashboard recent events and timeline cards share one insulin presentation result', () => {
  const events = [semanticInsulin, legacyInsulin];
  const dashboardRows = deriveDashboardRecentEventSources(
    events,
    dependencies,
    { formatDisplayTime: () => '08:05' },
  );

  assert.equal(dashboardRows.length, 2);

  for (const event of events) {
    const card = mapTimelineEventCardPresentation(event, dependencies, '08:05');
    const row = dashboardRows.find((candidate) => candidate.id === event.id);

    assert.equal(row.title, card.title);
    assert.equal(row.value, card.value);
    assert.equal(row.unit, card.unit);
    assert.equal(row.context, card.context);
  }
});

test('timeline detail and card agree on the insulin title and context', () => {
  for (const event of [semanticInsulin, legacyInsulin]) {
    const card = mapTimelineEventCardPresentation(event, dependencies, '08:05');
    const detail = mapTimelineEventDetailPresentation(event, dependencies);

    assert.equal(detail.title, card.title);
    assert.equal(detail.context, card.context);
    assert.equal(detail.primaryText, `${card.value} ${card.unit}`);
  }
});

test('semantic insulin context is localized on both dashboard and timeline', () => {
  const englishRow = deriveDashboardRecentEventSources(
    [semanticInsulin],
    dependencies,
    { formatDisplayTime: () => '08:05' },
  )[0];
  const russianRow = deriveDashboardRecentEventSources(
    [semanticInsulin],
    russianDependencies,
    { formatDisplayTime: () => '08:05' },
  )[0];

  assert.equal(englishRow.context, 'Correction');
  assert.equal(russianRow.context, 'Коррекция');
  assert.equal(englishRow.title, 'НовоРапид');
  assert.equal(russianRow.title, 'НовоРапид');
});

test('unmatched legacy insulin context stays verbatim on dashboard and timeline', () => {
  const row = deriveDashboardRecentEventSources([legacyInsulin], dependencies, {
    formatDisplayTime: () => '07:05',
  })[0];
  const card = mapTimelineEventCardPresentation(
    legacyInsulin,
    dependencies,
    '07:05',
  );

  assert.equal(row.context, 'Перед завтраком');
  assert.equal(card.context, 'Перед завтраком');
});

test('timeline search finds insulin by stored snapshot and unmatched legacy text', () => {
  const events = [semanticInsulin, legacyInsulin];
  const search = (query) =>
    createTimelineSearchFilterModel(
      events,
      { filter: 'all', query },
      dependencies,
      createTestTimelineFilterOptions(),
    ).filteredEvents.map((event) => event.id);

  assert.deepEqual(search('НовоРапид'), ['insulin-semantic']);
  assert.deepEqual(search('Перед завтраком'), ['insulin-legacy']);
  assert.deepEqual(search('lantus'), ['insulin-legacy']);
  assert.deepEqual(search('Correction'), ['insulin-semantic']);
  assert.deepEqual(search('Long-acting insulin'), []);
});
