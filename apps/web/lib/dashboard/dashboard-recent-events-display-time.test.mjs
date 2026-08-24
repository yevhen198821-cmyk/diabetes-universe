import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDashboardRecentEventDisplayTime } from './dashboard-recent-events-display-time.ts';

const referenceTime = new Date('2026-08-02T10:00:00.000Z');

test('today events show time only', () => {
  assert.equal(
    formatDashboardRecentEventDisplayTime(
      '2026-08-02T08:30:00.000Z',
      referenceTime,
      'en-GB',
      'Yesterday',
      'UTC',
    ),
    '08:30',
  );
});

test('yesterday events show localized date context with time', () => {
  assert.equal(
    formatDashboardRecentEventDisplayTime(
      '2026-08-01T12:00:00.000Z',
      referenceTime,
      'en-GB',
      'Yesterday',
      'UTC',
    ),
    'Yesterday, 12:00',
  );
});

test('older events show short date and time in active locale', () => {
  const formatted = formatDashboardRecentEventDisplayTime(
    '2026-07-30T09:00:00.000Z',
    referenceTime,
    'en-GB',
    'Yesterday',
    'UTC',
  );

  assert.match(formatted, /30 Jul, 09:00/);
});

test('timezone boundary keeps yesterday context accurate', () => {
  assert.equal(
    formatDashboardRecentEventDisplayTime(
      '2026-08-01T10:00:00.000Z',
      referenceTime,
      'en-GB',
      'Yesterday',
      'Europe/London',
    ),
    'Yesterday, 11:00',
  );
});

test('ru-RU yesterday label is preserved without hardcoded English', () => {
  assert.equal(
    formatDashboardRecentEventDisplayTime(
      '2026-08-01T12:00:00.000Z',
      referenceTime,
      'ru-RU',
      'Вчера',
      'UTC',
    ),
    'Вчера, 12:00',
  );
});
