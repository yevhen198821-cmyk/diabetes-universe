import assert from 'node:assert/strict';
import test from 'node:test';

import { mapTimelineEventToCard } from '../../../components/timeline/timeline-event-card.mapper.ts';
import { liftLegacyTestFixtures } from '../testing/lift-legacy-test-fixtures.ts';
import { mapTimelineEventCardPresentation } from './timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';

const [glucoseEvent, insulinEvent] = liftLegacyTestFixtures([
  {
    context: 'Before meal',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-source-card',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.3 mmol/L',
  },
  {
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-source-card',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 U',
  },
]);

let targetDependencies;
let noTargetDependencies;

test.before(async () => {
  targetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: {
      highMmolPerL: 8,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
  noTargetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: null,
  });
});

function createGlucoseEvent(concentrationMmolPerL, dateTime, id, source) {
  const [event] = liftLegacyTestFixtures([
    {
      dateTime,
      id,
      kind: 'glucose',
      source,
      title: 'Glucose',
      value: `${concentrationMmolPerL} mmol/L`,
    },
  ]);

  return event;
}

test('manual glucose card exposes Manual entry metadata', () => {
  const manualEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-manual',
    'manual',
  );
  const card = mapTimelineEventCardPresentation(
    manualEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.metadataLines, ['Manual entry']);
});

test('demo glucose card exposes Demo data metadata', () => {
  const demoEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-demo',
    'demo',
  );
  const card = mapTimelineEventCardPresentation(
    demoEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.metadataLines, ['Demo data']);
});

test('device glucose card exposes Device metadata', () => {
  const deviceEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-device',
    'device',
  );
  const card = mapTimelineEventCardPresentation(
    deviceEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.metadataLines, ['Device']);
});

test('import glucose card exposes Import metadata', () => {
  const importEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-import',
    'import',
  );
  const card = mapTimelineEventCardPresentation(
    importEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.metadataLines, ['Import']);
});

test('questionable timestamp glucose card still exposes source metadata', () => {
  const futureEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T20:00:00.000Z',
    'glucose-source-future',
    'manual',
  );
  const card = mapTimelineEventCardPresentation(
    futureEvent,
    targetDependencies,
    '20:00',
  );

  assert.deepEqual(card.statusLines, ['Check measurement time']);
  assert.deepEqual(card.metadataLines, ['Manual entry']);
});

test('no-target glucose card still exposes source metadata', () => {
  const manualEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-no-target',
    'manual',
  );
  const card = mapTimelineEventCardPresentation(
    manualEvent,
    noTargetDependencies,
    '10:15',
  );

  assert.equal(card.statusLines, undefined);
  assert.deepEqual(card.metadataLines, ['Manual entry']);
});

test('glucose card aria includes source exactly once with stable prefix', () => {
  const manualEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-aria',
    'manual',
  );
  const card = mapTimelineEventCardPresentation(
    manualEvent,
    targetDependencies,
    '10:15',
  );

  assert.match(card.ariaLabel, /^Open event: Glucose, 7\.3 mmol\/L/);
  assert.match(card.ariaLabel, /Manual entry/);
  assert.equal((card.ariaLabel.match(/Manual entry/g) ?? []).length, 1);
});

test('insulin card presentation remains unchanged by glucose source metadata', () => {
  const card = mapTimelineEventCardPresentation(
    insulinEvent,
    targetDependencies,
    '08:05',
  );

  assert.equal(card.metadataLines, undefined);
  assert.equal(card.statusLines, undefined);
  assert.equal(card.title, 'NovoRapid');
});

test('EventCard mapper passes glucose source metadata lines', () => {
  const manualEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T07:15:00.000Z',
    'glucose-source-mapper',
    'manual',
  );
  const cardProps = mapTimelineEventToCard(manualEvent, targetDependencies);

  assert.deepEqual(cardProps.metadataLines, ['Manual entry']);
  assert.match(cardProps.ariaLabel, /^Open event: Glucose, 7\.3 mmol\/L/);
});

const sourceLocales = [
  ['en-GB', 'Manual entry'],
  ['ru-RU', 'Ручной ввод'],
  ['uk-UA', 'Ручний ввід'],
  ['de-DE', 'Manuelle Eingabe'],
];

for (const [locale, expected] of sourceLocales) {
  test(`timeline glucose source label is localized for ${locale}`, async () => {
    const dependencies = await createTestTimelinePresentationDependencies({
      request: { acceptLanguage: locale, cookieTimeZone: 'UTC' },
    });
    const manualEvent = createGlucoseEvent(
      7.3,
      '2026-08-02T07:15:00.000Z',
      `glucose-source-${locale}`,
      'manual',
    );
    const card = mapTimelineEventCardPresentation(
      manualEvent,
      dependencies,
      '10:15',
    );

    assert.deepEqual(card.metadataLines, [expected]);
  });
}
