import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardRecentEventsViewModel,
  DASHBOARD_RECENT_EVENTS_MAX_CARDS,
  selectDashboardRecentEvents,
} from './dashboard-recent-events-model.ts';

const labels = {
  categories: {
    activity: 'Activity',
    insulin: 'Insulin',
    medication: 'Medication',
    nutrition: 'Nutrition',
  },
  defaultEmpty: 'No recent events yet.',
  defaultError: 'Could not load recent events.',
  loading: 'Loading recent events',
  title: 'Recent events',
  unavailable: 'Recent events unavailable.',
  viewAll: 'All events',
};

const insulinMorning = {
  category: 'insulin',
  context: 'Before breakfast',
  dateTime: '2026-08-02T05:05:00.000Z',
  displayTime: '08:05',
  id: 'insulin-0805',
  title: 'NovoRapid',
  unit: 'ЕД',
  value: '4',
};

const insulinEvening = {
  category: 'insulin',
  context: 'Before dinner',
  dateTime: '2026-08-02T15:00:00.000Z',
  displayTime: '18:00',
  id: 'insulin-1800',
  title: 'NovoRapid',
  unit: 'ЕД',
  value: '6',
};

const nutritionBreakfast = {
  category: 'nutrition',
  context: 'After insulin',
  dateTime: '2026-08-02T05:20:00.000Z',
  displayTime: '08:20',
  id: 'nutrition-0820',
  title: 'Breakfast',
  unit: 'г углеводов',
  value: '42',
};

const medicationMorning = {
  category: 'medication',
  context: 'Morning',
  dateTime: '2026-08-02T04:30:00.000Z',
  displayTime: '07:30',
  id: 'medication-0730',
  title: 'Metformin',
  unit: 'мг',
  value: '500',
};

const activityWalk = {
  category: 'activity',
  context: 'After lunch',
  dateTime: '2026-08-02T11:00:00.000Z',
  displayTime: '14:00',
  id: 'activity-1400',
  title: 'Walk',
  unit: 'минут',
  value: '30',
};

test('sorts events newest-first by occurredAt instead of category buckets', () => {
  const events = selectDashboardRecentEvents(
    [insulinMorning, insulinEvening, nutritionBreakfast, medicationMorning],
    labels.categories,
  );

  assert.equal(events.length, 4);
  assert.deepEqual(
    events.map((event) => event.id),
    ['insulin-1800', 'nutrition-0820', 'insulin-0805', 'medication-0730'],
  );
});

test('sorts events by latest dateTime instead of category order', () => {
  const events = selectDashboardRecentEvents(
    [medicationMorning, nutritionBreakfast, insulinEvening, activityWalk],
    labels.categories,
  );

  assert.deepEqual(
    events.map((event) => event.id),
    ['insulin-1800', 'activity-1400', 'nutrition-0820', 'medication-0730'],
  );
});

test('limits the preview to four cards even when more events are supplied', () => {
  const events = selectDashboardRecentEvents(
    [
      insulinMorning,
      insulinEvening,
      nutritionBreakfast,
      medicationMorning,
      activityWalk,
      {
        ...nutritionBreakfast,
        dateTime: '2026-08-02T16:00:00.000Z',
        displayTime: '19:00',
        id: 'nutrition-1900',
        title: 'Dinner',
        value: '35',
      },
    ],
    labels.categories,
  );

  assert.equal(events.length, DASHBOARD_RECENT_EVENTS_MAX_CARDS);
  assert.deepEqual(
    events.map((event) => event.id),
    ['nutrition-1900', 'insulin-1800', 'activity-1400', 'nutrition-0820'],
  );
});

test('includes activity when it is among the newest events', () => {
  const events = selectDashboardRecentEvents(
    [insulinEvening, nutritionBreakfast, medicationMorning, activityWalk],
    labels.categories,
  );

  assert.equal(
    events.some((event) => event.category === 'activity'),
    true,
  );
  assert.equal(events.length, 4);
});

test('rejects invalid events without affecting valid categories', () => {
  const events = selectDashboardRecentEvents(
    [
      insulinEvening,
      {
        ...nutritionBreakfast,
        dateTime: 'invalid',
      },
      {
        ...medicationMorning,
        value: '   ',
      },
    ],
    labels.categories,
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.category, 'insulin');
});

test('passes through title context value and unit unchanged', () => {
  const events = selectDashboardRecentEvents(
    [insulinEvening],
    labels.categories,
  );

  assert.equal(events[0]?.title, 'NovoRapid');
  assert.equal(events[0]?.context, 'Before dinner');
  assert.equal(events[0]?.value, '6');
  assert.equal(events[0]?.unit, 'ЕД');
  assert.equal(events[0]?.displayTime, '18:00');
});

test('creates ready state with view-all navigation', () => {
  const model = createDashboardRecentEventsViewModel(
    {
      events: [insulinEvening, nutritionBreakfast, medicationMorning],
      state: 'ready',
      viewAllHref: '/timeline',
    },
    labels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.events.length, 3);
  assert.equal(model.viewAllHref, '/timeline');
  assert.equal(model.viewAllLabel, labels.viewAll);
});

test('downgrades ready state without events to empty', () => {
  const model = createDashboardRecentEventsViewModel(
    {
      events: [],
      state: 'ready',
      viewAllHref: '/timeline',
    },
    labels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.defaultEmpty);
  assert.equal(model.viewAllHref, null);
});

test('downgrades ready state without view-all href to unavailable empty', () => {
  const model = createDashboardRecentEventsViewModel(
    {
      events: [insulinEvening],
      state: 'ready',
      viewAllHref: '   ',
    },
    labels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.unavailable);
});

test('does not expose timeline, filter, search, edit, or delete fields', () => {
  const model = createDashboardRecentEventsViewModel(
    {
      events: [insulinEvening, nutritionBreakfast],
      state: 'ready',
      viewAllHref: '/timeline',
    },
    labels,
  );

  assert.equal('timeline' in model, false);
  assert.equal('filters' in model, false);
  assert.equal('search' in model, false);
  assert.equal('onEdit' in model, false);
  assert.equal('onDelete' in model, false);
  assert.equal(
    model.events.every((event) => !('onClick' in event)),
    true,
  );
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardRecentEventsViewModel(
    { state: 'loading' },
    labels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, labels.loading);
  assert.equal(model.events.length, 0);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardRecentEventsViewModel(
    { state: 'empty' },
    labels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardRecentEventsViewModel(
    { state: 'error' },
    labels,
  );

  assert.equal(model.state, 'error');
  assert.equal(model.message, labels.defaultError);
});
