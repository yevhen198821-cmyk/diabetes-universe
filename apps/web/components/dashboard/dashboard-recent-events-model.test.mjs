import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardRecentEventsViewModel,
  DASHBOARD_RECENT_EVENTS_MAX_CARDS,
  dashboardRecentEventCategoryLabels,
  dashboardRecentEventsLabels,
  selectDashboardRecentEvents,
} from './dashboard-recent-events-model.ts';

const insulinMorning = {
  category: 'insulin',
  context: 'Перед завтраком',
  dateTime: '2026-08-02T05:05:00.000Z',
  displayTime: '08:05',
  id: 'insulin-0805',
  title: 'NovoRapid',
  unit: 'ЕД',
  value: '4',
};

const insulinEvening = {
  category: 'insulin',
  context: 'Перед ужином',
  dateTime: '2026-08-02T15:00:00.000Z',
  displayTime: '18:00',
  id: 'insulin-1800',
  title: 'NovoRapid',
  unit: 'ЕД',
  value: '6',
};

const nutritionBreakfast = {
  category: 'nutrition',
  context: 'После инсулина',
  dateTime: '2026-08-02T05:20:00.000Z',
  displayTime: '08:20',
  id: 'nutrition-0820',
  title: 'Завтрак',
  unit: 'г углеводов',
  value: '42',
};

const medicationMorning = {
  category: 'medication',
  context: 'Утром',
  dateTime: '2026-08-02T04:30:00.000Z',
  displayTime: '07:30',
  id: 'medication-0730',
  title: 'Метформин',
  unit: 'мг',
  value: '500',
};

const activityWalk = {
  category: 'activity',
  context: 'После обеда',
  dateTime: '2026-08-02T11:00:00.000Z',
  displayTime: '14:00',
  id: 'activity-1400',
  title: 'Прогулка',
  unit: 'минут',
  value: '30',
};

test('keeps only the latest event per category', () => {
  const events = selectDashboardRecentEvents([
    insulinMorning,
    insulinEvening,
    nutritionBreakfast,
    medicationMorning,
  ]);

  assert.equal(events.length, 3);
  assert.equal(
    events.find((event) => event.category === 'insulin')?.id,
    'insulin-1800',
  );
});

test('sorts events by latest dateTime instead of category order', () => {
  const events = selectDashboardRecentEvents([
    medicationMorning,
    nutritionBreakfast,
    insulinEvening,
    activityWalk,
  ]);

  assert.deepEqual(
    events.map((event) => event.id),
    ['insulin-1800', 'activity-1400', 'nutrition-0820', 'medication-0730'],
  );
});

test('limits the preview to four cards', () => {
  const events = selectDashboardRecentEvents([
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
      title: 'Ужин',
      value: '35',
    },
  ]);

  assert.equal(events.length, DASHBOARD_RECENT_EVENTS_MAX_CARDS);
});

test('omits activity when no activity event is supplied', () => {
  const events = selectDashboardRecentEvents([
    insulinEvening,
    nutritionBreakfast,
    medicationMorning,
  ]);

  assert.equal(
    events.some((event) => event.category === 'activity'),
    false,
  );
  assert.equal(events.length, 3);
});

test('rejects invalid events without affecting valid categories', () => {
  const events = selectDashboardRecentEvents([
    insulinEvening,
    {
      ...nutritionBreakfast,
      dateTime: 'invalid',
    },
    {
      ...medicationMorning,
      value: '   ',
    },
  ]);

  assert.equal(events.length, 1);
  assert.equal(events[0]?.category, 'insulin');
});

test('creates ready state with view-all navigation', () => {
  const model = createDashboardRecentEventsViewModel({
    events: [insulinEvening, nutritionBreakfast, medicationMorning],
    state: 'ready',
    viewAllHref: '/timeline',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.events.length, 3);
  assert.equal(model.viewAllHref, '/timeline');
  assert.equal(model.viewAllLabel, dashboardRecentEventsLabels.viewAll);
});

test('downgrades ready state without events to empty', () => {
  const model = createDashboardRecentEventsViewModel({
    events: [],
    state: 'ready',
    viewAllHref: '/timeline',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardRecentEventsLabels.defaultEmpty);
  assert.equal(model.viewAllHref, null);
});

test('downgrades ready state without view-all href to unavailable empty', () => {
  const model = createDashboardRecentEventsViewModel({
    events: [insulinEvening],
    state: 'ready',
    viewAllHref: '   ',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardRecentEventsLabels.unavailable);
});

test('does not expose timeline, filter, search, edit, or delete fields', () => {
  const model = createDashboardRecentEventsViewModel({
    events: [insulinEvening, nutritionBreakfast],
    state: 'ready',
    viewAllHref: '/timeline',
  });

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
  const model = createDashboardRecentEventsViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, dashboardRecentEventsLabels.loading);
  assert.equal(model.events.length, 0);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardRecentEventsViewModel({ state: 'empty' });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardRecentEventsLabels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardRecentEventsViewModel({ state: 'error' });

  assert.equal(model.state, 'error');
  assert.equal(model.message, dashboardRecentEventsLabels.defaultError);
});

test('exposes stable approved labels and category names', () => {
  assert.equal(dashboardRecentEventsLabels.title, 'Недавние события');
  assert.equal(dashboardRecentEventsLabels.viewAll, 'Все события');
  assert.equal(dashboardRecentEventCategoryLabels.insulin, 'Инсулин');
  assert.equal(dashboardRecentEventCategoryLabels.nutrition, 'Питание');
  assert.equal(dashboardRecentEventCategoryLabels.medication, 'Лекарства');
  assert.equal(dashboardRecentEventCategoryLabels.activity, 'Активность');
});
