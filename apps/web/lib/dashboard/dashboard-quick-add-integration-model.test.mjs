import assert from 'node:assert/strict';
import test from 'node:test';

import { selectDashboardRecentEvents } from '../../components/dashboard/dashboard-recent-events-model.ts';
import {
  applyGlucoseQuickAddEntry,
  applyInsulinQuickAddEntry,
  deriveDashboardQuickAddBlocks,
} from './dashboard-quick-add-integration-model.ts';

const referenceTime = new Date('2026-08-02T10:00:00.000Z');

test('updates last glucose and recent events after a successful glucose save', () => {
  const initialState = {
    events: [],
  };
  const nextState = applyGlucoseQuickAddEntry(initialState, {
    context: 'Перед завтраком',
    time: '08:00',
    valueMmol: 6.4,
  });
  const blocks = deriveDashboardQuickAddBlocks(nextState, {
    referenceTime,
  });

  assert.equal(blocks.lastGlucose?.value, '6,4 ммоль/л');
  assert.equal(blocks.lastGlucose?.displayTime, '08:00');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 1);
  assert.equal(blocks.recentEvents.length, 0);
});

test('updates day summary and recent events after insulin save', () => {
  const nextState = applyInsulinQuickAddEntry(
    {
      events: [],
    },
    {
      context: 'Перед завтраком',
      doseUnits: 4,
      preparation: 'NovoRapid',
      time: '08:05',
    },
  );
  const blocks = deriveDashboardQuickAddBlocks(nextState, {
    referenceTime,
  });

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
          id: 'medication-0730',
          kind: 'medication',
          time: '07:30',
          title: 'Метформин',
          unit: 'мг',
          value: '500',
        },
        {
          context: 'Перед завтраком',
          id: 'insulin-1800',
          kind: 'insulin',
          time: '18:00',
          title: 'NovoRapid',
          value: '6 ЕД',
        },
        {
          context: 'После инсулина',
          id: 'nutrition-0820',
          kind: 'nutrition',
          time: '08:20',
          title: 'Завтрак',
          value: '42 г углеводов',
        },
      ],
    },
    { referenceTime },
  );
  const selected = selectDashboardRecentEvents(blocks.recentEvents);

  assert.deepEqual(
    selected.map((event) => event.id),
    ['insulin-1800', 'nutrition-0820', 'medication-0730'],
  );
});
