import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTimelineEventCardAriaLabel,
  buildTimelineEventMapMarkerAriaLabel,
} from './build-timeline-event-card-aria-label.ts';

const glucosePresentation = {
  context: 'Before meal',
  statusLines: ['In your range', 'Current target range'],
  time: '10:15',
  title: 'Glucose',
  unit: 'mmol/L',
  value: '7.3',
};

test('card aria label includes glucose history status once', () => {
  const ariaLabel = buildTimelineEventCardAriaLabel(
    glucosePresentation,
    'Open event',
  );

  assert.match(ariaLabel, /^Open event: Glucose, 7\.3 mmol\/L/);
  assert.equal(
    ariaLabel,
    'Open event: Glucose, 7.3 mmol/L, 10:15, Before meal, In your range, Current target range',
  );
  assert.equal((ariaLabel.match(/Glucose/g) ?? []).length, 1);
});

test('map marker aria label avoids duplicate glucose identity', () => {
  const ariaLabel = buildTimelineEventMapMarkerAriaLabel(glucosePresentation);

  assert.equal(
    ariaLabel,
    '10:15, Glucose, 7.3 mmol/L, In your range, Current target range, Before meal',
  );
  assert.equal((ariaLabel.match(/Glucose/g) ?? []).length, 1);
});
