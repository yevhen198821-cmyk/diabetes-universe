import assert from 'node:assert/strict';
import test from 'node:test';

import { GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS } from '@diabetes-universe/medical-domain';

import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import { formatDashboardGlucoseDisplayTime } from './format-dashboard-glucose-display-time.ts';

const REFERENCE_ISO = '2026-08-02T12:00:00.000Z';
const REFERENCE_TIME = new Date(REFERENCE_ISO);

const EN_LABELS = {
  justNow: 'Just now',
  today: 'Today',
  yesterday: 'Yesterday',
};

const RU_LABELS = {
  justNow: 'Сейчас',
  today: 'Сегодня',
  yesterday: 'Вчера',
};

const UK_LABELS = {
  justNow: 'Зараз',
  today: 'Сьогодні',
  yesterday: 'Вчора',
};

const DE_LABELS = {
  justNow: 'Gerade eben',
  today: 'Heute',
  yesterday: 'Gestern',
};

async function createFormatter(locale, timeZone = 'UTC') {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: locale, cookieTimeZone: timeZone },
    timeZone,
  });

  return runtime.formatter;
}

function formatWithLabels(
  formatter,
  measuredAt,
  labels,
  referenceTime = REFERENCE_TIME,
  timeZone = 'UTC',
) {
  return formatDashboardGlucoseDisplayTime({
    formatter,
    labels,
    measuredAt,
    referenceTime,
    timeZone,
  });
}

test('0 seconds ago resolves to Just now', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, REFERENCE_ISO, EN_LABELS),
    'Just now',
  );
});

test('59 seconds ago resolves to Just now', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:59:01.000Z', EN_LABELS),
    'Just now',
  );
});

test('1 minute ago resolves to relative minute phrasing', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:59:00.000Z', EN_LABELS),
    '1 minute ago',
  );
});

test('8 minutes ago resolves to relative minutes', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:52:00.000Z', EN_LABELS),
    '8 minutes ago',
  );
});

test('59 minutes ago resolves to relative minutes', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:01:00.000Z', EN_LABELS),
    '59 minutes ago',
  );
});

test('60 minutes ago on the same local calendar day resolves to Today + time', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:00:00.000Z', EN_LABELS),
    'Today, 11:00',
  );
});

test('previous local calendar day resolves to Yesterday + time', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-08-01T18:42:00.000Z', EN_LABELS),
    'Yesterday, 18:42',
  );
});

test('older measurements resolve to localized date + time', async () => {
  const formatter = await createFormatter('en-GB');

  assert.equal(
    formatWithLabels(formatter, '2026-07-27T18:42:00.000Z', EN_LABELS),
    '27 Jul 2026, 18:42',
  );
});

test('timezone boundary around midnight selects Yesterday vs Today correctly', async () => {
  const formatter = await createFormatter('en-GB', 'America/Los_Angeles');
  const referenceTime = new Date('2026-08-02T10:00:00.000Z');

  assert.equal(
    formatDashboardGlucoseDisplayTime({
      formatter,
      labels: EN_LABELS,
      measuredAt: '2026-08-02T06:00:00.000Z',
      referenceTime,
      timeZone: 'America/Los_Angeles',
    }),
    'Yesterday, 23:00',
  );

  assert.equal(
    formatDashboardGlucoseDisplayTime({
      formatter,
      labels: EN_LABELS,
      measuredAt: '2026-08-02T08:00:00.000Z',
      referenceTime,
      timeZone: 'America/Los_Angeles',
    }),
    'Today, 01:00',
  );
});

test('allowed small future clock skew resolves to Just now', async () => {
  const formatter = await createFormatter('en-GB');
  const withinToleranceMs = GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS - 60_000;
  const measuredAt = new Date(
    REFERENCE_TIME.getTime() + withinToleranceMs,
  ).toISOString();

  assert.equal(formatWithLabels(formatter, measuredAt, EN_LABELS), 'Just now');
});

test('readings beyond allowed future tolerance return invalid display time', async () => {
  const formatter = await createFormatter('en-GB');
  const beyondToleranceMs = GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS + 1_000;
  const measuredAt = new Date(
    REFERENCE_TIME.getTime() + beyondToleranceMs,
  ).toISOString();

  assert.equal(formatWithLabels(formatter, measuredAt, EN_LABELS), '--:--');
});

test('explicit referenceTime keeps formatting deterministic', async () => {
  const formatter = await createFormatter('en-GB');
  const firstReference = new Date('2026-08-02T12:00:00.000Z');
  const secondReference = new Date('2026-08-02T12:30:00.000Z');
  const measuredAt = '2026-08-02T11:52:00.000Z';

  assert.equal(
    formatDashboardGlucoseDisplayTime({
      formatter,
      labels: EN_LABELS,
      measuredAt,
      referenceTime: firstReference,
      timeZone: 'UTC',
    }),
    '8 minutes ago',
  );
  assert.equal(
    formatDashboardGlucoseDisplayTime({
      formatter,
      labels: EN_LABELS,
      measuredAt,
      referenceTime: secondReference,
      timeZone: 'UTC',
    }),
    '38 minutes ago',
  );
});

test('Russian locale uses localized labels and relative minutes', async () => {
  const formatter = await createFormatter('ru-RU');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:59:30.000Z', RU_LABELS),
    'Сейчас',
  );
  assert.match(
    formatWithLabels(formatter, '2026-08-02T11:52:00.000Z', RU_LABELS),
    /8/,
  );
  assert.match(
    formatWithLabels(formatter, '2026-08-02T11:52:00.000Z', RU_LABELS),
    /минут/,
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:00:00.000Z', RU_LABELS),
    'Сегодня, 11:00',
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-01T18:42:00.000Z', RU_LABELS),
    'Вчера, 18:42',
  );
});

test('Ukrainian locale uses localized Today and Yesterday labels', async () => {
  const formatter = await createFormatter('uk-UA');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:59:30.000Z', UK_LABELS),
    'Зараз',
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:00:00.000Z', UK_LABELS),
    'Сьогодні, 11:00',
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-01T18:42:00.000Z', UK_LABELS),
    'Вчора, 18:42',
  );
});

test('German locale uses localized Today and Yesterday labels', async () => {
  const formatter = await createFormatter('de-DE');

  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:59:30.000Z', DE_LABELS),
    'Gerade eben',
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-02T11:00:00.000Z', DE_LABELS),
    'Heute, 11:00',
  );
  assert.equal(
    formatWithLabels(formatter, '2026-08-01T18:42:00.000Z', DE_LABELS),
    'Gestern, 18:42',
  );
});

test('canonical occurredAt remains available separately from display formatting', async () => {
  const measuredAt = '2026-08-02T11:52:00.000Z';
  const formatter = await createFormatter('en-GB');
  const displayTime = formatWithLabels(formatter, measuredAt, EN_LABELS);

  assert.equal(displayTime, '8 minutes ago');
  assert.equal(measuredAt, '2026-08-02T11:52:00.000Z');
});
