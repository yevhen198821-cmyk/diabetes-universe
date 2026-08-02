import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardLastGlucoseViewModel,
  dashboardLastGlucoseLabels,
} from './dashboard-last-glucose-model.ts';

test('creates ready state from the shared LastGlucose contract', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      time: '08:00',
      value: '6,4 ммоль/л',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal(model.time, '08:00');
  assert.equal(model.message, null);
  assert.equal(model.isLoading, false);
});

test('normalizes ready state values without changing their meaning', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      time: ' 08:00 ',
      value: ' 6,4 ммоль/л ',
    },
    state: 'ready',
  });

  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal(model.time, '08:00');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardLastGlucoseViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, dashboardLastGlucoseLabels.loading);
  assert.equal(model.value, null);
  assert.equal(model.time, null);
});

test('accepts a supplied loading label', () => {
  const model = createDashboardLastGlucoseViewModel({
    loadingLabel: 'Обновление последнего измерения',
    state: 'loading',
  });

  assert.equal(model.message, 'Обновление последнего измерения');
});

test('creates empty state from caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel({
    message: 'Измерений пока нет.',
    state: 'empty',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, 'Измерений пока нет.');
  assert.equal(model.value, null);
  assert.equal(model.time, null);
});

test('creates error state from trimmed caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel({
    message: ' Не удалось загрузить последнее измерение. ',
    state: 'error',
  });

  assert.equal(model.state, 'error');
  assert.equal(model.message, 'Не удалось загрузить последнее измерение.');
  assert.equal(model.value, null);
  assert.equal(model.time, null);
  assert.equal(model.isLoading, false);
});

test('exposes stable approved labels', () => {
  assert.equal(dashboardLastGlucoseLabels.title, 'Последняя глюкоза');
  assert.equal(dashboardLastGlucoseLabels.eyebrow, 'Последнее измерение');
  assert.equal(
    dashboardLastGlucoseLabels.loading,
    'Загрузка последнего измерения глюкозы',
  );
});
