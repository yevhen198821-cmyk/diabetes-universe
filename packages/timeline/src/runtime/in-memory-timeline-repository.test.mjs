import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InMemoryTimelineRepository,
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '../index.ts';

function createSemanticEvent(id, occurredAt, overrides = {}) {
  const kind = overrides.kind ?? 'glucose';
  const envelope = {
    createdAt: '2026-08-09T08:30:00.000Z',
    id,
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: '2026-08-09T08:30:00.000Z',
  };

  switch (kind) {
    case 'insulin':
      return {
        ...envelope,
        doseUnits: 4,
        kind,
        preparation: 'NovoRapid',
        ...overrides,
      };
    case 'nutrition':
      return {
        ...envelope,
        carbohydratesGrams: 42,
        kind,
        mealType: 'breakfast',
        mode: 'manual',
        ...overrides,
      };
    case 'glucose':
    default:
      return {
        ...envelope,
        concentrationMmolPerL: 6.4,
        kind: 'glucose',
        ...overrides,
      };
  }
}

const glucoseEarly = createSemanticEvent(
  'glucose-0800',
  '2026-08-02T05:00:00.000Z',
);
const insulinLater = createSemanticEvent(
  'insulin-0805',
  '2026-08-02T05:05:00.000Z',
  { kind: 'insulin' },
);
const nutritionLatest = createSemanticEvent(
  'nutrition-0820',
  '2026-08-02T05:20:00.000Z',
  { kind: 'nutrition' },
);

test('getSnapshot fails with a machine-readable code before initialization', () => {
  const repository = createInMemoryTimelineRepository();

  assert.throws(
    () => repository.getSnapshot(),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_NOT_INITIALIZED',
  );
});

test('mutations fail with a machine-readable code before initialization', async () => {
  const repository = createInMemoryTimelineRepository();

  await assert.rejects(
    () => repository.addEvent(glucoseEarly),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_NOT_INITIALIZED',
  );
});

test('initializes an empty repository', async () => {
  const repository = createInMemoryTimelineRepository();

  await repository.initialize();

  assert.deepEqual(repository.getSnapshot().events, []);
});

test('initializes a seeded repository with deterministic ordering', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [nutritionLatest, glucoseEarly, insulinLater],
  });

  await repository.initialize();

  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['glucose-0800', 'insulin-0805', 'nutrition-0820'],
  );
});

test('addEvent inserts, sorts, and returns a bounded mutation result', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [nutritionLatest],
  });

  await repository.initialize();
  const result = await repository.addEvent(glucoseEarly);

  assert.deepEqual(result, { status: 'applied' });
  assert.equal(Object.hasOwn(result, 'events'), false);
  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['glucose-0800', 'nutrition-0820'],
  );
});

test('addEvent with a duplicate id replaces the existing event', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly, insulinLater],
  });
  const replacement = createSemanticEvent(
    'glucose-0800',
    '2026-08-02T06:00:00.000Z',
    {
      concentrationMmolPerL: 7,
    },
  );

  await repository.initialize();
  const result = await repository.addEvent(replacement);
  const events = repository.getSnapshot().events;

  assert.deepEqual(result, { status: 'applied' });
  assert.equal(events.length, 2);
  assert.equal(
    events.find((event) => event.id === 'glucose-0800')?.concentrationMmolPerL,
    7,
  );
  assert.deepEqual(
    events.map((event) => event.id),
    ['insulin-0805', 'glucose-0800'],
  );
});

test('updateEvent changes an existing event without creating a new event', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly, insulinLater],
  });

  await repository.initialize();
  const result = await repository.updateEvent({
    ...insulinLater,
    doseUnits: 5,
  });
  const events = repository.getSnapshot().events;

  assert.deepEqual(result, { status: 'applied' });
  assert.equal(events.length, 2);
  assert.equal(
    events.find((event) => event.id === 'insulin-0805')?.doseUnits,
    5,
  );
});

test('updateEvent with a missing id is a bounded not-found result', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly],
  });

  await repository.initialize();
  const result = await repository.updateEvent(insulinLater);

  assert.deepEqual(result, { status: 'not-found' });
  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['glucose-0800'],
  );
});

test('deleteEvent removes an existing event', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly, insulinLater],
  });

  await repository.initialize();
  const result = await repository.deleteEvent('glucose-0800');

  assert.deepEqual(result, { status: 'applied' });
  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['insulin-0805'],
  );
});

test('deleteEvent with a missing id is a bounded not-found result', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly],
  });

  await repository.initialize();
  const result = await repository.deleteEvent('unknown');

  assert.deepEqual(result, { status: 'not-found' });
  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['glucose-0800'],
  );
});

test('replaceEvents hydrates the collection as a transitional capability', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly],
  });

  await repository.initialize();
  const result = await repository.replaceEvents([
    nutritionLatest,
    insulinLater,
  ]);

  assert.deepEqual(result, { status: 'applied' });
  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['insulin-0805', 'nutrition-0820'],
  );
});

test('orders matching occurredAt values by id', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [
      createSemanticEvent('same-b', '2026-08-02T05:00:00.000Z'),
      createSemanticEvent('same-a', '2026-08-02T05:00:00.000Z'),
    ],
  });

  await repository.initialize();

  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['same-a', 'same-b'],
  );
});

test('invalid occurredAt values follow the stable temporal fallback', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [
      createSemanticEvent('invalid', 'invalid'),
      createSemanticEvent('valid', '2026-08-02T05:00:00.000Z'),
    ],
  });

  await repository.initialize();

  assert.deepEqual(
    repository.getSnapshot().events.map((event) => event.id),
    ['valid', 'invalid'],
  );
});

test('caller cannot mutate internal state through seed events or snapshots', async () => {
  const seedEvent = createSemanticEvent('seed', '2026-08-02T05:00:00.000Z');
  const repository = new InMemoryTimelineRepository({
    seedEvents: [seedEvent],
  });

  seedEvent.concentrationMmolPerL = 9.9;

  await repository.initialize();

  const firstSnapshot = repository.getSnapshot();
  firstSnapshot.events[0].concentrationMmolPerL = 9.1;
  firstSnapshot.events.push(
    createSemanticEvent('external', '2026-08-02T06:00:00.000Z'),
  );

  const secondSnapshot = repository.getSnapshot();

  assert.equal(secondSnapshot.events.length, 1);
  assert.equal(secondSnapshot.events[0].concentrationMmolPerL, 6.4);
});
