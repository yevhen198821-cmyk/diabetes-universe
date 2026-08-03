import assert from 'node:assert/strict';
import test from 'node:test';

import { prepareDashboardAiInsightPresentation } from './dashboard-ai-insight-presentation.ts';

const source = {
  generatedAt: '2026-08-02T07:15:00.000Z',
  id: 'insight-1015',
  relatedEventIds: ['glucose-0800', 'meal-0820'],
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
};

test('prepareDashboardAiInsightPresentation calls formatTime once with generatedAt', () => {
  const formatDisplayTimeCalls = [];

  const presented = prepareDashboardAiInsightPresentation(source, {
    formatDisplayTime: (generatedAt) => {
      formatDisplayTimeCalls.push(generatedAt);
      return '10:15';
    },
    formatRelatedEventsCount: (count) => String(count),
    relatedEventsLabel: 'Related records',
    relatedEventsNone: 'Related records: no confirmed records',
  });

  assert.equal(formatDisplayTimeCalls.length, 1);
  assert.equal(formatDisplayTimeCalls[0], source.generatedAt);
  assert.equal(presented.displayTime, '10:15');
  assert.equal(presented.generatedAt, source.generatedAt);
});

test('prepareDashboardAiInsightPresentation calls formatNumber for positive related count', () => {
  const formatNumberCalls = [];

  const presented = prepareDashboardAiInsightPresentation(source, {
    formatDisplayTime: () => '10:15',
    formatRelatedEventsCount: (count) => {
      formatNumberCalls.push(count);
      return String(count);
    },
    relatedEventsLabel: 'Related records',
    relatedEventsNone: 'Related records: no confirmed records',
  });

  assert.deepEqual(formatNumberCalls, [2]);
  assert.equal(presented.relatedEventsLabel, 'Related records: 2');
});

test('prepareDashboardAiInsightPresentation uses none phrase for zero related count', () => {
  const formatNumberCalls = [];

  const presented = prepareDashboardAiInsightPresentation(
    {
      ...source,
      relatedEventIds: [' ', ''],
    },
    {
      formatDisplayTime: () => '10:15',
      formatRelatedEventsCount: (count) => {
        formatNumberCalls.push(count);
        return String(count);
      },
      relatedEventsLabel: 'Related records',
      relatedEventsNone: 'Related records: no confirmed records',
    },
  );

  assert.equal(formatNumberCalls.length, 0);
  assert.equal(
    presented.relatedEventsLabel,
    'Related records: no confirmed records',
  );
});

test('prepareDashboardAiInsightPresentation keeps title and summary as pass-through', () => {
  const presented = prepareDashboardAiInsightPresentation(source, {
    formatDisplayTime: () => '10:15',
    formatRelatedEventsCount: (count) => String(count),
    relatedEventsLabel: 'Related records',
    relatedEventsNone: 'Related records: no confirmed records',
  });

  assert.equal(presented.title, source.title);
  assert.equal(presented.summary, source.summary);
});
