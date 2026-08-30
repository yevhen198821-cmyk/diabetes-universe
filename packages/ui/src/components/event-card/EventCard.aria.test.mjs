import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEventCardFallbackAriaLabel } from './EventCard.tsx';

test('EventCard fallback aria includes metadataLines exactly once', () => {
  const ariaLabel = buildEventCardFallbackAriaLabel({
    context: 'Before meal',
    metadataLines: ['Manual entry'],
    statusLines: ['In your range', 'Current target range'],
    time: '10:15',
    title: 'Glucose',
    unit: 'mmol/L',
    value: '7.3',
  });

  assert.equal(
    ariaLabel,
    '10:15, Glucose, 7.3, mmol/L, Before meal, In your range, Current target range, Manual entry',
  );
  assert.equal((ariaLabel.match(/Manual entry/g) ?? []).length, 1);
});

test('EventCard fallback aria omits metadata when none is provided', () => {
  const ariaLabel = buildEventCardFallbackAriaLabel({
    time: '08:05',
    title: 'NovoRapid',
    unit: 'U',
    value: '4',
  });

  assert.equal(ariaLabel, '08:05, NovoRapid, 4, U');
});
