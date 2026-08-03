import assert from 'node:assert/strict';
import test from 'node:test';

import { selectDashboardRecentEvents } from '../../components/dashboard/dashboard-recent-events-model.ts';
import { deriveDashboardRecentEventSources } from './dashboard-recent-events-derivation.ts';
import { formatTimelineDisplayTime } from '../timeline/timeline-date-time.ts';
import { getRecentTimelineEvents } from '../timeline/timeline-selectors.ts';

const categoryLabels = {
  activity: 'Activity',
  insulin: 'Insulin',
  medication: 'Medication',
  nutrition: 'Nutrition',
};

const pipelineEvents = [
  {
    dateTime: '2026-08-02T05:00:00.000Z',
    id: 'glucose-0800',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
  },
  {
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-1015',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
  },
  {
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-today',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
  },
  {
    dateTime: '2026-08-01T05:05:00.000Z',
    id: 'insulin-yesterday',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '8 ЕД',
  },
  {
    dateTime: '2026-08-02T05:20:00.000Z',
    id: 'nutrition-today',
    kind: 'nutrition',
    title: 'Завтрак',
    value: '42 г углеводов',
  },
  {
    dateTime: '2026-08-01T05:20:00.000Z',
    id: 'nutrition-yesterday',
    kind: 'nutrition',
    title: 'Завтрак',
    value: '60 г углеводов',
  },
  {
    dateTime: '2026-08-02T04:30:00.000Z',
    id: 'medication-today',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '500',
  },
  {
    dateTime: '2026-08-01T04:30:00.000Z',
    id: 'medication-yesterday',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '500',
  },
  {
    dateTime: '2026-08-02T12:00:00.000Z',
    id: 'note-today',
    kind: 'note',
    title: 'Самочувствие',
    value: 'Усталость',
  },
];

test('deriveDashboardRecentEventSources matches getRecentTimelineEvents selection baseline', () => {
  const baseline = getRecentTimelineEvents(pipelineEvents, {
    limit: 4,
    timeZone: 'UTC',
  });
  const derived = deriveDashboardRecentEventSources(pipelineEvents, {
    formatDisplayTime: (dateTime) =>
      formatTimelineDisplayTime(dateTime, 'ru-RU', 'UTC'),
    limit: 4,
  });

  assert.deepEqual(
    derived.map((event) => event.id),
    baseline.map((event) => event.id),
  );
  assert.deepEqual(
    derived.map((event) => event.category),
    baseline.map((event) => event.category),
  );
  assert.deepEqual(
    derived.map((event) => event.dateTime),
    baseline.map((event) => event.dateTime),
  );
});

test('deriveDashboardRecentEventSources preserves desc ordering and first limit', () => {
  const derived = deriveDashboardRecentEventSources(pipelineEvents, {
    formatDisplayTime: () => '10:00',
    limit: 3,
  });

  assert.deepEqual(
    derived.map((event) => event.id),
    ['nutrition-today', 'insulin-today', 'medication-today'],
  );
});

test('deriveDashboardRecentEventSources excludes glucose and note kinds', () => {
  const derived = deriveDashboardRecentEventSources(
    [
      {
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-0805',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 ЕД',
      },
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-1015',
        kind: 'glucose',
        title: 'Glucose',
        value: '7,3 ммоль/л',
      },
      {
        dateTime: '2026-08-02T08:20:00.000Z',
        id: 'nutrition-0820',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 г углеводов',
      },
      {
        dateTime: '2026-08-02T08:25:00.000Z',
        id: 'note-0825',
        kind: 'note',
        title: 'Note',
        value: 'Feeling fine',
      },
    ],
    {
      formatDisplayTime: () => '10:00',
    },
  );

  assert.deepEqual(
    derived.map((event) => event.id),
    ['nutrition-0820', 'insulin-0805'],
  );
});

test('deriveDashboardRecentEventSources invokes formatter once per mappable event only', () => {
  const formatCalls = [];

  const derived = deriveDashboardRecentEventSources(
    [
      {
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-0805',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 ЕД',
      },
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-1015',
        kind: 'glucose',
        title: 'Glucose',
        value: '7,3 ммоль/л',
      },
      {
        dateTime: '2026-08-02T08:20:00.000Z',
        id: 'nutrition-0820',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 г углеводов',
      },
    ],
    {
      formatDisplayTime: (dateTime) => {
        formatCalls.push(dateTime);
        return '10:00';
      },
    },
  );

  assert.equal(formatCalls.length, 2);
  assert.deepEqual(formatCalls, [
    '2026-08-02T08:20:00.000Z',
    '2026-08-02T08:05:00.000Z',
  ]);
  assert.deepEqual(
    derived.map((event) => event.id),
    ['nutrition-0820', 'insulin-0805'],
  );
});

test('deriveDashboardRecentEventSources passes original dateTime through unchanged', () => {
  const derived = deriveDashboardRecentEventSources(
    [
      {
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-0805',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 ЕД',
      },
    ],
    {
      formatDisplayTime: () => 'formatted-time',
    },
  );

  assert.equal(derived[0]?.dateTime, '2026-08-02T08:05:00.000Z');
  assert.equal(derived[0]?.displayTime, 'formatted-time');
});

test('deriveDashboardRecentEventSources does not format excluded glucose or note events', () => {
  const formatCalls = [];

  deriveDashboardRecentEventSources(
    [
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-1015',
        kind: 'glucose',
        title: 'Glucose',
        value: '7,3 ммоль/л',
      },
      {
        dateTime: '2026-08-02T08:25:00.000Z',
        id: 'note-0825',
        kind: 'note',
        title: 'Note',
        value: 'Feeling fine',
      },
    ],
    {
      formatDisplayTime: (dateTime) => {
        formatCalls.push(dateTime);
        return '10:00';
      },
    },
  );

  assert.equal(formatCalls.length, 0);
});

test('getRecentTimelineEvents consumer behavior remains unchanged without dashboard formatter', () => {
  const recentEvents = getRecentTimelineEvents(pipelineEvents, {
    limit: 3,
    timeZone: 'UTC',
  });

  assert.deepEqual(
    recentEvents.map((event) => event.id),
    ['nutrition-today', 'insulin-today', 'medication-today'],
  );
});

test('dashboard pipeline keeps latest-per-category and final limit unchanged', () => {
  const baselineSources = getRecentTimelineEvents(pipelineEvents, {
    limit: 4,
    timeZone: 'UTC',
  });
  const dashboardSources = deriveDashboardRecentEventSources(pipelineEvents, {
    formatDisplayTime: (dateTime) =>
      formatTimelineDisplayTime(dateTime, 'ru-RU', 'UTC'),
    limit: 4,
  });

  const baselineSelected = selectDashboardRecentEvents(
    baselineSources,
    categoryLabels,
  );
  const dashboardSelected = selectDashboardRecentEvents(
    dashboardSources,
    categoryLabels,
  );

  assert.deepEqual(
    dashboardSelected.map((event) => event.id),
    baselineSelected.map((event) => event.id),
  );
});
