import assert from 'node:assert/strict';
import test from 'node:test';

import { getTimelineCalendarDateKey } from '../../lib/timeline/timeline-date-time.ts';
import {
  createDashboardHeaderDate,
  createDashboardHeaderViewModel,
  getDashboardAvatarImageUrl,
} from './dashboard-header-model.ts';

const englishLabels = {
  addEvent: 'Add event',
  avatar: 'User profile',
  avatarAction: 'Open profile',
  currentDate: 'Current date',
  dateUnavailable: 'Date unavailable',
  defaultError: 'Could not load header data.',
  loading: 'Loading header',
  productName: 'Diabetes Universe',
};

const currentDate = new Date('2026-08-01T18:30:00.000Z');

function createFormattedDate(current, locale, timeZone) {
  return createDashboardHeaderDate({
    currentDate: current,
    formatCalendarDateKey: (date) =>
      getTimelineCalendarDateKey(date.toISOString(), timeZone),
    formatDisplayDate: (date) =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        timeZone,
        weekday: 'long',
        year: 'numeric',
      }).format(date),
    locale,
    timeZone,
  });
}

const formattedDate = createFormattedDate(
  currentDate,
  'en-GB',
  'Europe/London',
);

assert.ok(formattedDate);

function createInput(overrides = {}) {
  return {
    date: formattedDate,
    labels: englishLabels,
    onAddEvent: () => {},
    state: 'ready',
    user: {
      avatarUrl: 'https://example.com/avatar.png',
      displayName: 'Alex Example',
    },
    ...overrides,
  };
}

test('creates the ready state with a preformatted deterministic date', () => {
  const model = createDashboardHeaderViewModel(createInput());

  assert.equal(model.isLoading, false);
  assert.equal(model.isError, false);
  assert.equal(model.dateLabel, formattedDate.label);
  assert.equal(model.dateTime, formattedDate.dateTime);
  assert.equal(model.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(model.avatarInitials, 'AE');
});

test('formats with the supplied locale and time zone via formatter dependencies', () => {
  const instant = new Date('2026-01-01T01:00:00.000Z');
  const losAngelesDate = createFormattedDate(
    instant,
    'en-US',
    'America/Los_Angeles',
  );
  const tokyoDate = createFormattedDate(instant, 'en-GB', 'Asia/Tokyo');

  assert.ok(losAngelesDate);
  assert.ok(tokyoDate);
  assert.notEqual(losAngelesDate.dateTime, tokyoDate.dateTime);
  assert.equal(losAngelesDate.locale, 'en-US');
  assert.equal(losAngelesDate.timeZone, 'America/Los_Angeles');
  assert.notEqual(losAngelesDate.label, tokyoDate.label);
});

test('rejects invalid dates and formatter failures', () => {
  assert.equal(
    createDashboardHeaderDate({
      currentDate: currentDate,
      formatCalendarDateKey: () => null,
      formatDisplayDate: () => 'Friday, 1 August 2026',
      locale: 'en-GB',
      timeZone: 'Europe/London',
    }),
    null,
  );
  assert.equal(
    createDashboardHeaderDate({
      currentDate: new Date('invalid'),
      formatCalendarDateKey: () => '2026-08-01',
      formatDisplayDate: () => 'Friday, 1 August 2026',
      locale: 'en-GB',
      timeZone: 'Europe/London',
    }),
    null,
  );
  assert.equal(
    createDashboardHeaderDate({
      currentDate: currentDate,
      formatCalendarDateKey: () => {
        throw new Error('formatter failure');
      },
      formatDisplayDate: () => 'Friday, 1 August 2026',
      locale: 'en-GB',
      timeZone: 'Europe/London',
    }),
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
      errorMessage: 'Temporary profile outage.',
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
  assert.equal(customErrorModel.errorMessage, 'Temporary profile outage.');
  assert.equal(customErrorModel.avatarUrl, null);
  assert.equal(defaultErrorModel.errorMessage, englishLabels.defaultError);

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
  assert.equal(missingDataModel.avatarLabel, englishLabels.avatar);
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
  assert.equal(staticAvatarModel.avatarLabel, 'User profile: Alex Example');
  assert.equal(
    interactiveAvatarModel.avatarLabel,
    'Open profile: Alex Example',
  );
});

test('provides accessible labels for actions, date, loading, and fallback', () => {
  const interactiveModel = createDashboardHeaderViewModel(
    createInput({ onAvatarClick: () => {} }),
  );
  const noUserModel = createDashboardHeaderViewModel(
    createInput({ user: null }),
  );

  assert.equal(interactiveModel.addEventLabel, 'Add event');
  assert.equal(interactiveModel.avatarLabel, 'Open profile: Alex Example');
  assert.equal(noUserModel.avatarLabel, 'User profile');
  assert.equal(interactiveModel.currentDateLabel, 'Current date');
  assert.equal(
    interactiveModel.currentDateAriaLabel,
    `Current date: ${formattedDate.label}`,
  );
  assert.equal(interactiveModel.loadingLabel, 'Loading header');
  assert.equal(interactiveModel.dateUnavailableLabel, 'Date unavailable');
});
