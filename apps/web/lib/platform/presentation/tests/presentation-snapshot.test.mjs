import assert from 'node:assert/strict';
import test from 'node:test';

import { asLocaleCode } from '../../platform-type-helpers.ts';
import { createPresentationSnapshot } from '../create-presentation-snapshot.ts';
import {
  restorePresentationContext,
  restorePresentationContextFromSnapshot,
} from '../restore-presentation-context.ts';

const baseContext = Object.freeze({
  language: 'en',
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
});

test('createPresentationSnapshot creates an immutable snapshot from context', () => {
  const snapshot = createPresentationSnapshot(baseContext);

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.locale, 'en-GB');
  assert.equal(Object.isFrozen(snapshot), true);
});

test('createPresentationSnapshot is JSON serializable', () => {
  const snapshot = createPresentationSnapshot(baseContext);
  const serialized = JSON.parse(JSON.stringify(snapshot));

  assert.deepEqual(serialized, {
    version: 1,
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  });
});

test('restorePresentationContext restores a valid snapshot', () => {
  const snapshot = createPresentationSnapshot(baseContext);
  const result = restorePresentationContext(snapshot);

  assert.equal(result.status, 'restored');
  assert.deepEqual(result.context, baseContext);
});

test('restorePresentationContext rejects unknown snapshot versions', () => {
  const result = restorePresentationContext({
    version: 2,
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  });

  assert.deepEqual(result, { status: 'invalid' });
});

test('restorePresentationContext rejects invalid time zones', () => {
  const result = restorePresentationContext({
    version: 1,
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Invalid/Zone',
    hourCycle: 'h23',
  });

  assert.deepEqual(result, { status: 'invalid' });
});

test('restorePresentationContext rejects missing required fields', () => {
  const result = restorePresentationContext({
    version: 1,
    locale: 'en-GB',
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  });

  assert.deepEqual(result, { status: 'invalid' });
});

test('restorePresentationContext does not mutate the input snapshot', () => {
  const snapshot = createPresentationSnapshot(baseContext);
  const copy = structuredClone(snapshot);

  restorePresentationContext(snapshot);

  assert.deepEqual(snapshot, copy);
});

test('restorePresentationContextFromSnapshot restores trusted snapshots', () => {
  const snapshot = createPresentationSnapshot(baseContext);

  assert.deepEqual(
    restorePresentationContextFromSnapshot(snapshot),
    baseContext,
  );
});
