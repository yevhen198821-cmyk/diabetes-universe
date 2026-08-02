import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DASHBOARD_AVATAR_TARGET_CLASS_NAME,
  DASHBOARD_DESKTOP_ACTION_CLASS_NAME,
  createDashboardHeaderViewModel,
  dashboardHeaderLabels,
  formatDashboardDate,
  getDashboardAvatarInitials,
} from './dashboard-header-model.ts';

const currentDate = new Date('2026-08-01T18:30:00.000Z');

function createInput(overrides = {}) {
  return {
    currentDate,
    locale: 'ru-RU',
    onAddEvent: () => {},
    state: 'ready',
    timeZone: 'Europe/Moscow',
    user: {
      avatarUrl: 'https://example.com/avatar.png',
      displayName: 'Алексей Петров',
    },
    ...overrides,
  };
}

test('creates the ready state with localized date and supplied avatar', () => {
  const model = createDashboardHeaderViewModel(createInput());

  assert.equal(model.isLoading, false);
  assert.equal(model.isError, false);
  assert.equal(
    model.dateLabel,
    new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Moscow',
      weekday: 'long',
      year: 'numeric',
    }).format(currentDate),
  );
  assert.equal(model.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(model.avatarInitials, 'АП');
});

test('creates a non-blocking loading state', () => {
  const onAddEvent = () => {};
  const model = createDashboardHeaderViewModel(
    createInput({ onAddEvent, state: 'loading' }),
  );

  assert.equal(model.isLoading, true);
  assert.equal(model.dateLabel, null);
  assert.equal(model.avatarUrl, null);
  assert.equal(model.errorMessage, null);
  assert.equal(model.onAddEvent, onAddEvent);
});

test('creates an error fallback without removing header actions', () => {
  let addEventCalls = 0;
  const model = createDashboardHeaderViewModel(
    createInput({
      errorMessage: 'Данные пользователя временно недоступны.',
      onAddEvent: () => {
        addEventCalls += 1;
      },
      state: 'error',
    }),
  );

  assert.equal(model.isError, true);
  assert.equal(model.errorMessage, 'Данные пользователя временно недоступны.');
  assert.equal(model.avatarUrl, null);

  model.onAddEvent();
  assert.equal(addEventCalls, 1);
});

test('uses initials and then a generic fallback when avatar data is missing', () => {
  const initialsModel = createDashboardHeaderViewModel(
    createInput({
      user: {
        avatarUrl: null,
        displayName: 'Ada Lovelace',
      },
    }),
  );
  const genericModel = createDashboardHeaderViewModel(
    createInput({ user: null }),
  );

  assert.equal(initialsModel.avatarUrl, null);
  assert.equal(initialsModel.avatarInitials, 'AL');
  assert.equal(genericModel.avatarUrl, null);
  assert.equal(genericModel.avatarInitials, null);
});

test('preserves desktop action and avatar callbacks', () => {
  let addEventCalls = 0;
  let avatarCalls = 0;
  const model = createDashboardHeaderViewModel(
    createInput({
      onAddEvent: () => {
        addEventCalls += 1;
      },
      onAvatarClick: () => {
        avatarCalls += 1;
      },
    }),
  );

  model.onAddEvent();
  model.onAvatarClick?.();

  assert.equal(addEventCalls, 1);
  assert.equal(avatarCalls, 1);
});

test('provides accessible labels without hardcoding user data', () => {
  const interactiveModel = createDashboardHeaderViewModel(
    createInput({ onAvatarClick: () => {} }),
  );
  const staticModel = createDashboardHeaderViewModel(createInput());

  assert.equal(interactiveModel.addEventLabel, 'Добавить событие');
  assert.equal(interactiveModel.avatarLabel, 'Открыть профиль: Алексей Петров');
  assert.equal(staticModel.avatarLabel, 'Профиль пользователя: Алексей Петров');
  assert.equal(interactiveModel.currentDateLabel, 'Текущая дата');
  assert.equal(interactiveModel.loadingLabel, 'Загрузка данных заголовка');
});

test('uses the supplied locale and time zone and safely handles invalid values', () => {
  const instant = new Date('2026-01-01T01:00:00.000Z');
  const losAngelesDate = formatDashboardDate(
    instant,
    'en-US',
    'America/Los_Angeles',
  );
  const tokyoDate = formatDashboardDate(instant, 'ja-JP', 'Asia/Tokyo');

  assert.notEqual(losAngelesDate, tokyoDate);
  assert.equal(formatDashboardDate(instant, 'en-US', 'Invalid/Zone'), null);
  assert.equal(getDashboardAvatarInitials('élise durand', 'fr-FR'), 'ÉD');
});

test('defines desktop-only action visibility and 44px avatar target', () => {
  assert.match(DASHBOARD_DESKTOP_ACTION_CLASS_NAME, /\bhidden\b/);
  assert.match(DASHBOARD_DESKTOP_ACTION_CLASS_NAME, /\blg:inline-flex\b/);
  assert.match(DASHBOARD_AVATAR_TARGET_CLASS_NAME, /\bsize-11\b/);
  assert.equal(dashboardHeaderLabels.addEvent, 'Добавить событие');
});
