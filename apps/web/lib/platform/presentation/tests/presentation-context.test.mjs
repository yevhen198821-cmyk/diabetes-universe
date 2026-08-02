import assert from 'node:assert/strict';
import test from 'node:test';

import { asLocaleCode } from '../../platform-type-helpers.ts';
import { createPresentationSnapshot } from '../create-presentation-snapshot.ts';
import { assertValidPresentationContext } from '../validation.ts';

const baseContext = Object.freeze({
  language: 'en',
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
});

test('accepts a valid presentation context', () => {
  assert.doesNotThrow(() => assertValidPresentationContext(baseContext));
});

test('rejects an invalid presentation time zone', () => {
  assert.throws(
    () =>
      assertValidPresentationContext({
        ...baseContext,
        timeZone: 'Not/A_Zone',
      }),
    /valid IANA zone/,
  );
});

test('preserves optional numberingSystem and calendar', () => {
  const context = Object.freeze({
    ...baseContext,
    numberingSystem: 'latn',
    calendar: 'gregory',
  });

  assert.doesNotThrow(() => assertValidPresentationContext(context));
  const snapshot = createPresentationSnapshot(context);

  assert.equal(snapshot.numberingSystem, 'latn');
  assert.equal(snapshot.calendar, 'gregory');
});

test('does not mutate the input context', () => {
  const context = structuredClone(baseContext);
  const snapshot = structuredClone(baseContext);

  createPresentationSnapshot(context);

  assert.deepEqual(context, snapshot);
});

test('uses canonical i18n-backed fields without duplicating types', () => {
  assert.equal(typeof baseContext.language, 'string');
  assert.equal(typeof baseContext.locale, 'string');
  assert.equal(baseContext.hourCycle, 'h23');
});
