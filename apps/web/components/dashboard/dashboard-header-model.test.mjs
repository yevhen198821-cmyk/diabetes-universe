import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardHeaderDate,
  createDashboardHeaderViewModel,
  dashboardHeaderLabels,
  getDashboardAvatarImageUrl,
} from './dashboard-header-model.ts';

const currentDate = new Date('2026-08-01T18:30:00.000Z');
const formattedDate = createDashboardHeaderDate(
  currentDate,
  'ru-RU',
  'Europe/Moscow',
);

assert.ok(formattedDate);

function createInput(overrides = {}) {
  return {
    date: formattedDate,
    onAddEvent: () => {},
    state: 'ready',
    user: {
      avatarUrl: 'https://example.com/avatar.png',
      displayName: 'Алексей Петров',
    },
    ...overrides,
  };
}

test('creates the ready state with a preformatted deterministic date', () => {
  const model = createDashboardHeaderViewModel(createInput());

  assert.equal(model.isLoading, false);
  assert.equal(model.isError, false);
  assert.equal(model.dateLabel, formattedDate.label);
  assert.equal(model.dateTime, '2026-08-01');
  assert.equal(model.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(model.avatarInitials, 'АП');
});

test('formats with the supplied locale and time zone', () => {
  const instant = new Date('2026-01-01T01:00:00.000Z');
  const losAngelesDate = createDashboardHeaderDate(
    instant,
    'en-US',
    'America/Los_Angeles',
  );
  const tokyoDate = createDashboardHeaderDate(instant, 'ja-JP', 'Asia/Tokyo');

  assert.ok(losAngelesDate);
  assert.ok(tokyoDate);
  assert.equal(losAngelesDate.dateTime, '2025-12-31');
  assert.equal(tokyoDate.dateTime, '2026-01-01');
  assert.equal(losAngelesDate.locale, 'en-US');
  assert.equal(losAngelesDate.timeZone, 'America/Los_Angeles');
  assert.notEqual(losAngelesDate.label, tokyoDate.label);
});

test('rejects invalid dates, time zones, and unsupported locales', () => {
  assert.equal(
    createDashboardHeaderDate(currentDate, 'en-US', 'Invalid/Zone'),
    null,
  );
  assert.equal(
    createDashboardHeaderDate(new Date('invalid'), 'en-US', 'UTC'),
    null,
  );
  assert.equal(createDashboardHeaderDate(currentDate, 'zz-ZZ', 'UTC'), null);
  assert.equal(
    createDashboardHeaderDate(currentDate, 'not_a_locale', 'UTC'),
    null,
  );
});

test('creates a non-blocking loading state with stable actions', () => {
  const onAddEvent = () => {};
  const model = createDashboardHeaderViewModel(
    createInput({ onAddEvent, state: 'loading' }),
  );

  assert.equal(model.isLoading, true);
  assert.equal(model.dateLabel, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.avatarUrl, null);
  assert.equal(model.errorMessage, null);
  assert.equal(model.onAddEvent, onAddEvent);
});

test('creates custom and default error fallbacks without removing actions', () => {
  let addEventCalls = 0;
  const customErrorModel = createDashboardHeaderViewModel(
    createInput({
      errorMessage: 'Данные пользователя временно недоступны.',
      onAddEvent: () => {
        addEventCalls += 1;
      },
      state: 'error',
    }),
  );
  const defaultErrorModel = createDashboardHeaderViewModel(
    createInput({ state: 'error' }),
  );

  assert.equal(customErrorModel.isError, true);
  assert.equal(
    customErrorModel.errorMessage,
    'Данные пользователя временно недоступны.',
  );
  assert.equal(customErrorModel.avatarUrl, null);
  assert.equal(
    defaultErrorModel.errorMessage,
    dashboardHeaderLabels.defaultError,
  );

  customErrorModel.onAddEvent();
  assert.equal(addEventCalls, 1);
});

test('handles missing name and missing avatar independently', () => {
  const initialsModel = createDashboardHeaderViewModel(
    createInput({
      user: {
        avatarUrl: null,
        displayName: 'Ada Lovelace',
      },
    }),
  );
  const missingDataModel = createDashboardHeaderViewModel(
    createInput({
      user: {
        avatarUrl: null,
        displayName: null,
      },
    }),
  );

  assert.equal(initialsModel.avatarUrl, null);
  assert.equal(initialsModel.avatarInitials, 'AL');
  assert.equal(missingDataModel.avatarUrl, null);
  assert.equal(missingDataModel.avatarInitials, null);
  assert.equal(missingDataModel.avatarLabel, dashboardHeaderLabels.avatar);
});

test('prevents repeated avatar image failures and accepts a changed URL', () => {
  const firstUrl = 'https://example.com/avatar.png';
  const secondUrl = 'https://example.com/avatar-2.png';

  assert.equal(getDashboardAvatarImageUrl(` ${firstUrl} `, null), firstUrl);
  assert.equal(getDashboardAvatarImageUrl(firstUrl, firstUrl), null);
  assert.equal(getDashboardAvatarImageUrl(secondUrl, firstUrl), secondUrl);
  assert.equal(getDashboardAvatarImageUrl(null, firstUrl), null);
});

test('preserves required and optional callbacks and disabled action state', () => {
  let addEventCalls = 0;
  let avatarCalls = 0;
  const staticAvatarModel = createDashboardHeaderViewModel(
    createInput({
      addEventDisabled: true,
      onAddEvent: () => {
        addEventCalls += 1;
      },
    }),
  );
  const interactiveAvatarModel = createDashboardHeaderViewModel(
    createInput({
      onAvatarClick: () => {
        avatarCalls += 1;
      },
    }),
  );

  staticAvatarModel.onAddEvent();
  interactiveAvatarModel.onAvatarClick?.();

  assert.equal(addEventCalls, 1);
  assert.equal(avatarCalls, 1);
  assert.equal(staticAvatarModel.addEventDisabled, true);
  assert.equal(staticAvatarModel.onAvatarClick, undefined);
  assert.equal(
    staticAvatarModel.avatarLabel,
    'Профиль пользователя: Алексей Петров',
  );
  assert.equal(
    interactiveAvatarModel.avatarLabel,
    'Открыть профиль: Алексей Петров',
  );
});

test('provides accessible labels for actions, date, loading, and fallback', () => {
  const interactiveModel = createDashboardHeaderViewModel(
    createInput({ onAvatarClick: () => {} }),
  );
  const noUserModel = createDashboardHeaderViewModel(
    createInput({ user: null }),
  );

  assert.equal(interactiveModel.addEventLabel, 'Добавить событие');
  assert.equal(interactiveModel.avatarLabel, 'Открыть профиль: Алексей Петров');
  assert.equal(noUserModel.avatarLabel, 'Профиль пользователя');
  assert.equal(interactiveModel.currentDateLabel, 'Текущая дата');
  assert.equal(interactiveModel.loadingLabel, 'Загрузка данных заголовка');
  assert.equal(interactiveModel.dateUnavailableLabel, 'Дата недоступна');
});
