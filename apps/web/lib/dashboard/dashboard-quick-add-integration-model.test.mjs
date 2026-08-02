import assert from 'node:assert/strict';
import test from 'node:test';

import { selectDashboardRecentEvents } from '../../components/dashboard/dashboard-recent-events-model.ts';
import { deriveDashboardQuickAddBlocks } from './dashboard-quick-add-integration-model.ts';

const referenceTime = new Date('2026-08-02T10:00:00.000Z');

test('derives last glucose from shared timeline events', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: [
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Глюкоза',
          value: '6,4 ммоль/л',
        },
      ],
    },
    {
      referenceTime,
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.lastGlucose?.value, '6,4 ммоль/л');
  assert.equal(blocks.lastGlucose?.displayTime, '08:00');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 1);
  assert.equal(blocks.recentEvents.length, 0);
});

test('derives day summary only from today events', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: [
        {
          context: 'Сегодня',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-today',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
        {
          context: 'Вчера',
          dateTime: '2026-08-01T08:05:00.000Z',
          id: 'insulin-yesterday',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '8 ЕД',
        },
        {
          context: 'Сегодня',
          dateTime: '2026-08-02T08:20:00.000Z',
          id: 'nutrition-today',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '42 г углеводов',
        },
        {
          context: 'Вчера',
          dateTime: '2026-08-01T08:20:00.000Z',
          id: 'nutrition-yesterday',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '60 г углеводов',
        },
      ],
    },
    {
      referenceTime,
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.daySummary?.totalInsulin, '4 ЕД');
  assert.equal(blocks.daySummary?.totalCarbohydrates, '42 г');
});

test('updates day summary and recent events after insulin save', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: [
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-0805',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
      ],
    },
    {
      referenceTime,
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.daySummary?.totalInsulin, '4 ЕД');
  assert.equal(blocks.recentEvents[0]?.category, 'insulin');
  assert.equal(blocks.recentEvents[0]?.title, 'NovoRapid');
});

test('derives recent event sources that can be sorted by latest event time', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: [
        {
          context: 'Утром',
          dateTime: '2026-08-02T04:30:00.000Z',
          id: 'medication-0730',
          kind: 'medication',
          title: 'Метформин',
          unit: 'мг',
          value: '500',
        },
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T15:00:00.000Z',
          id: 'insulin-1800',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '6 ЕД',
        },
        {
          context: 'После инсулина',
          dateTime: '2026-08-02T05:20:00.000Z',
          id: 'nutrition-0820',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '42 г углеводов',
        },
      ],
    },
    { referenceTime, timeZone: 'Europe/Moscow' },
  );
  const selected = selectDashboardRecentEvents(blocks.recentEvents);

  assert.deepEqual(
    selected.map((event) => event.id),
    ['insulin-1800', 'nutrition-0820', 'medication-0730'],
  );
});
