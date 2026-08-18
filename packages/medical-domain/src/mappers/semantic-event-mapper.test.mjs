import assert from 'node:assert/strict';
import test from 'node:test';

import {
  projectEventKind,
  projectEventObservedAt,
  toServerSemanticEvent,
} from './semantic-event-mapper.ts';

test('toServerSemanticEvent strips client-local lifecycle fields', () => {
  const event = {
    id: 'local-id',
    occurredAt: '2026-08-14T10:00:00.000Z',
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:30:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.6,
  };

  const serverEvent = toServerSemanticEvent(event);

  assert.equal('id' in serverEvent, false);
  assert.equal('createdAt' in serverEvent, false);
  assert.equal('updatedAt' in serverEvent, false);
  assert.equal(serverEvent.kind, 'glucose');
});

test('projectEventObservedAt and kind derive from semantic envelope', () => {
  const event = {
    occurredAt: '2026-08-14T10:15:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'insulin',
    preparation: 'rapid',
    doseUnits: 4,
  };

  assert.equal(projectEventKind(event), 'insulin');
  assert.equal(
    projectEventObservedAt(event).toISOString(),
    '2026-08-14T10:15:00.000Z',
  );
});
