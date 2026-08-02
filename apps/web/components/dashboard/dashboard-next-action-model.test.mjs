import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardNextActionViewModel,
  dashboardNextActionLabels,
} from './dashboard-next-action-model.ts';

const action = {
  actionLabel: 'Добавить',
  description: 'Добавить инсулин',
  title: 'Следующее действие',
};

test('creates the ready state from the shared NextStep contract', () => {
  let actionCalls = 0;
  const model = createDashboardNextActionViewModel({
    action,
    onAction: () => {
      actionCalls += 1;
    },
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.title, action.title);
  assert.equal(model.description, action.description);
  assert.equal(model.actionLabel, action.actionLabel);
  assert.equal(model.actionDisabled, false);
  assert.equal(model.statusLabel, null);

  model.onAction?.();
  assert.equal(actionCalls, 1);
});

test('preserves the disabled ready action state', () => {
  const model = createDashboardNextActionViewModel({
    action,
    actionDisabled: true,
    onAction: () => {},
    state: 'ready',
  });

  assert.equal(model.actionDisabled, true);
  assert.equal(typeof model.onAction, 'function');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardNextActionViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.statusLabel, dashboardNextActionLabels.loading);
  assert.equal(model.actionLabel, null);
  assert.equal(model.onAction, undefined);
});

test('accepts a supplied loading label', () => {
  const model = createDashboardNextActionViewModel({
    loadingLabel: 'Обновление следующего действия',
    state: 'loading',
  });

  assert.equal(model.statusLabel, 'Обновление следующего действия');
});

test('creates an empty state without an action callback', () => {
  const model = createDashboardNextActionViewModel({
    content: {
      description: 'Новые действия появятся здесь.',
      title: 'Нет доступных действий',
    },
    state: 'empty',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.title, 'Нет доступных действий');
  assert.equal(model.description, 'Новые действия появятся здесь.');
  assert.equal(model.onAction, undefined);
  assert.equal(model.actionLabel, null);
});

test('creates an error state with trimmed caller-supplied content', () => {
  const model = createDashboardNextActionViewModel({
    content: {
      description: ' Повторите попытку позже. ',
      title: ' Действие недоступно ',
    },
    state: 'error',
  });

  assert.equal(model.state, 'error');
  assert.equal(model.title, 'Действие недоступно');
  assert.equal(model.description, 'Повторите попытку позже.');
  assert.equal(model.isLoading, false);
  assert.equal(model.actionDisabled, true);
});

test('omits an optional empty-state description', () => {
  const model = createDashboardNextActionViewModel({
    content: {
      title: 'Нет доступных действий',
    },
    state: 'empty',
  });

  assert.equal(model.description, null);
});
