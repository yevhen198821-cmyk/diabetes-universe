import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequestFingerprint } from './request-fingerprint.ts';

const event = {
  kind: 'glucose',
  schemaVersion: 1,
  source: 'manual',
  occurredAt: '2026-08-14T10:00:00.000Z',
  concentrationMmolPerL: 5.4,
  provenance: { label: 'original', externalId: 'source-1' },
};

test('fingerprint covers nested medical provenance', () => {
  assert.notEqual(
    createRequestFingerprint(event),
    createRequestFingerprint({
      ...event,
      provenance: { ...event.provenance, label: 'changed' },
    }),
  );
});
test('fingerprint canonicalizes nested key ordering and excludes local lifecycle', () => {
  assert.equal(
    createRequestFingerprint(event),
    createRequestFingerprint({
      ...event,
      id: 'local',
      createdAt: 'local',
      provenance: { externalId: 'source-1', label: 'original' },
    }),
  );
  assert.match(createRequestFingerprint(event), /^v2:[a-f0-9]{64}$/);
});
test('fingerprint preserves nested array items and their order', () => {
  const meal = {
    ...event,
    kind: 'nutrition',
    items: [
      { name: 'first', carbohydratesGrams: 10 },
      { name: 'second', carbohydratesGrams: 20 },
    ],
  };
  assert.notEqual(
    createRequestFingerprint(meal),
    createRequestFingerprint({ ...meal, items: [...meal.items].reverse() }),
  );
  assert.notEqual(
    createRequestFingerprint(meal),
    createRequestFingerprint({
      ...meal,
      items: [{ ...meal.items[0], carbohydratesGrams: 11 }, meal.items[1]],
    }),
  );
});
