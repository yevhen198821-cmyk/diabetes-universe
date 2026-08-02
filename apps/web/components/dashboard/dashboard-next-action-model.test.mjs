import assert from 'node:assert/strict';
import test from 'node:test';

import { createDashboardNextActionViewModel } from './dashboard-next-action-model.ts';

const englishLabels = {
  emptyDescription: 'New actions will appear here.',
  emptyTitle: 'No actions available',
  errorDescription: 'Please try again later.',
  errorTitle: 'Action unavailable',
  loading: 'Loading next action',
};

const action = {
  actionLabel: 'Add',
  description: 'Add insulin',
  title: 'Next action',
};

test('creates the ready state from the shared NextStep contract', () => {
  let actionCalls = 0;
  const model = createDashboardNextActionViewModel(
    {
      action,
      onAction: () => {
        actionCalls += 1;
      },
      state: 'ready',
    },
    englishLabels,
  );

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
  const model = createDashboardNextActionViewModel(
    {
      action,
      actionDisabled: true,
      onAction: () => {},
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.actionDisabled, true);
  assert.equal(typeof model.onAction, 'function');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardNextActionViewModel(
    { state: 'loading' },
    englishLabels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.statusLabel, englishLabels.loading);
  assert.equal(model.actionLabel, null);
  assert.equal(model.onAction, undefined);
});

test('accepts a supplied loading label', () => {
  const model = createDashboardNextActionViewModel(
    {
      loadingLabel: 'Refreshing next action',
      state: 'loading',
    },
    englishLabels,
  );

  assert.equal(model.statusLabel, 'Refreshing next action');
});

test('creates an empty state without an action callback', () => {
  const model = createDashboardNextActionViewModel(
    {
      content: {
        description: englishLabels.emptyDescription,
        title: englishLabels.emptyTitle,
      },
      state: 'empty',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.title, englishLabels.emptyTitle);
  assert.equal(model.description, englishLabels.emptyDescription);
  assert.equal(model.onAction, undefined);
  assert.equal(model.actionLabel, null);
});

test('creates an error state with trimmed caller-supplied content', () => {
  const model = createDashboardNextActionViewModel(
    {
      content: {
        description: ' Please try again later. ',
        title: ' Action unavailable ',
      },
      state: 'error',
    },
    englishLabels,
  );

  assert.equal(model.state, 'error');
  assert.equal(model.title, englishLabels.errorTitle);
  assert.equal(model.description, englishLabels.errorDescription);
  assert.equal(model.isLoading, false);
  assert.equal(model.actionDisabled, true);
});

test('omits an optional empty-state description', () => {
  const model = createDashboardNextActionViewModel(
    {
      content: {
        title: englishLabels.emptyTitle,
      },
      state: 'empty',
    },
    englishLabels,
  );

  assert.equal(model.description, null);
});
