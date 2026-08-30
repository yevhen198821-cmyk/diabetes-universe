import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createSemanticGlucoseTimelineEvent } from './create-semantic-glucose-timeline-event.ts';

const fixedClock = {
  now: () => new Date('2026-08-02T10:15:00.000Z'),
};

const creatorSource = readFileSync(
  new URL('./create-semantic-glucose-timeline-event.ts', import.meta.url),
  'utf8',
);

test('semantic glucose creator leaves context undefined when omitted', () => {
  const event = createSemanticGlucoseTimelineEvent(
    {
      time: '08:30',
      valueMmol: 7.3,
    },
    { clock: fixedClock },
  );

  assert.equal(event.context, undefined);
});

test('semantic glucose creator preserves explicit fasting context', () => {
  const event = createSemanticGlucoseTimelineEvent(
    {
      context: 'fasting',
      time: '08:30',
      valueMmol: 7.3,
    },
    { clock: fixedClock },
  );

  assert.equal(event.context, 'fasting');
});

test('semantic glucose creator preserves explicit before_meal context', () => {
  const event = createSemanticGlucoseTimelineEvent(
    {
      context: 'before_meal',
      time: '08:30',
      valueMmol: 7.3,
    },
    { clock: fixedClock },
  );

  assert.equal(event.context, 'before_meal');
});

test('semantic glucose creator does not map localized labels', () => {
  assert.doesNotMatch(creatorSource, /mapQuickAddGlucoseContext/);
});
