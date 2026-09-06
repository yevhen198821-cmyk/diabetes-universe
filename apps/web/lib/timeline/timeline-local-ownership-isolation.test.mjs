import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';
import {
  createIndexedDbTimelineRepository,
  TIMELINE_INDEXEDDB_STORES,
} from '@diabetes-universe/timeline-web';

import { createWebTimelineRepository } from './create-web-timeline-repository.ts';
import {
  LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME,
  createAnonymousTimelineDatabaseName,
  createAuthenticatedTimelineDatabaseName,
} from './timeline-local-ownership.ts';

const OCCURRED_AT = '2026-09-06T08:00:00.000Z';
const LIFECYCLE_AT = '2026-09-06T08:00:00.000Z';

function createGlucoseEvent(id, mmolL) {
  return {
    concentrationMmolPerL: mmolL,
    context: 'random',
    createdAt: LIFECYCLE_AT,
    id,
    kind: 'glucose',
    occurredAt: OCCURRED_AT,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: LIFECYCLE_AT,
  };
}

function createNoteEvent(id, body) {
  return {
    body,
    createdAt: LIFECYCLE_AT,
    id,
    kind: 'note',
    occurredAt: OCCURRED_AT,
    schemaVersion: 1,
    source: 'manual',
    title: body,
    updatedAt: LIFECYCLE_AT,
  };
}

function corruptGlucoseRecord(id) {
  return {
    event: {
      concentrationMmolPerL: 6.4,
      createdAt: OCCURRED_AT,
      id,
      kind: 'glucose',
      occurredAt: OCCURRED_AT,
      schemaVersion: 999,
      source: 'manual',
      updatedAt: OCCURRED_AT,
    },
    id,
    kind: 'glucose',
    occurredAt: OCCURRED_AT,
    persistedAt: LIFECYCLE_AT,
    storageSchemaVersion: 1,
  };
}

async function openOwnedRepository(databaseName) {
  const repository = createWebTimelineRepository({ databaseName });
  await repository.initialize();
  return repository;
}

async function queryAllEvents(repository) {
  const page = await repository.queryEvents({
    limit: 100,
    order: 'occurredAt-asc',
  });
  return page.events;
}

async function deleteDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

async function putRawEvent(databaseName, record) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transaction = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readwrite',
  );
  transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events).put(record);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(undefined);
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readStoreAll(databaseName, storeName) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transaction = database.transaction(storeName, 'readonly');
  const request = transaction.objectStore(storeName).getAll();
  const records = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return records;
}

test('fresh anonymous browser starts empty and does not persist production demo seed', async () => {
  const databaseName = createAnonymousTimelineDatabaseName('anon-fresh-empty');
  await deleteDatabase(databaseName);
  const repository = await openOwnedRepository(databaseName);

  assert.deepEqual(await queryAllEvents(repository), []);
  repository.close();
  await deleteDatabase(databaseName);
});

test('anonymous local events persist only in the anonymous namespace', async () => {
  const databaseName = createAnonymousTimelineDatabaseName('anon-persist-note');
  await deleteDatabase(databaseName);
  const event = createNoteEvent('note-anonymous-only', 'anonymous local note');
  const writer = await openOwnedRepository(databaseName);
  await writer.addEvent(event);
  writer.close();

  const reopened = await openOwnedRepository(databaseName);
  assert.deepEqual(await queryAllEvents(reopened), [event]);
  reopened.close();
  await deleteDatabase(databaseName);
});

test('login A does not silently receive anonymous events and uses an A-specific namespace', async () => {
  const anonymousName =
    createAnonymousTimelineDatabaseName('anon-before-login');
  const accountAName =
    createAuthenticatedTimelineDatabaseName('acct-isolation-A');
  await deleteDatabase(anonymousName);
  await deleteDatabase(accountAName);

  const anonymousEvent = createNoteEvent(
    'note-should-not-follow-login',
    'pre-auth only',
  );
  const anonymousRepo = await openOwnedRepository(anonymousName);
  await anonymousRepo.addEvent(anonymousEvent);
  anonymousRepo.close();

  const accountA = await openOwnedRepository(accountAName);
  assert.deepEqual(await queryAllEvents(accountA), []);
  assert.notEqual(accountAName, anonymousName);
  accountA.close();

  const leftoverAnonymous = await openOwnedRepository(anonymousName);
  assert.deepEqual(await queryAllEvents(leftoverAnonymous), [anonymousEvent]);
  leftoverAnonymous.close();
  await deleteDatabase(anonymousName);
  await deleteDatabase(accountAName);
});

test('account A writes remain durable across reload of the A namespace', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-reload',
  );
  await deleteDatabase(accountAName);
  const event = createGlucoseEvent('glucose-a-owned', 6.4);
  const writer = await openOwnedRepository(accountAName);
  await writer.addEvent(event);
  writer.close();

  const reopened = await openOwnedRepository(accountAName);
  assert.deepEqual(await queryAllEvents(reopened), [event]);
  reopened.close();
  await deleteDatabase(accountAName);
});

test('logout A does not expose A events through the anonymous namespace', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-logout',
  );
  const anonymousName =
    createAnonymousTimelineDatabaseName('anon-after-logout');
  await deleteDatabase(accountAName);
  await deleteDatabase(anonymousName);

  const event = createNoteEvent('note-a-must-stay-hidden', 'account A private');
  const accountA = await openOwnedRepository(accountAName);
  await accountA.addEvent(event);
  accountA.close();

  const anonymous = await openOwnedRepository(anonymousName);
  assert.deepEqual(await queryAllEvents(anonymous), []);
  anonymous.close();
  await deleteDatabase(accountAName);
  await deleteDatabase(anonymousName);
});

test('account B cannot read A events and B writes stay isolated from A', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-switch',
  );
  const accountBName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-B-switch',
  );
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);

  const aEvent = createGlucoseEvent('glucose-a-hidden-from-b', 8.1);
  const bEvent = createGlucoseEvent('glucose-b-owned', 5.2);

  const accountA = await openOwnedRepository(accountAName);
  await accountA.addEvent(aEvent);
  accountA.close();

  const accountB = await openOwnedRepository(accountBName);
  assert.deepEqual(await queryAllEvents(accountB), []);
  await accountB.addEvent(bEvent);
  accountB.close();

  const reopenedB = await openOwnedRepository(accountBName);
  assert.deepEqual(await queryAllEvents(reopenedB), [bEvent]);
  reopenedB.close();

  const reopenedA = await openOwnedRepository(accountAName);
  assert.deepEqual(await queryAllEvents(reopenedA), [aEvent]);
  reopenedA.close();
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);
});

test('legacy unscoped diabetes-universe-timeline is not assigned to authenticated A', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-legacy',
  );
  await deleteDatabase(LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME);
  await deleteDatabase(accountAName);

  const legacyEvent = createNoteEvent(
    'legacy-unowned-note',
    'legacy global history',
  );
  const legacy = createIndexedDbTimelineRepository({
    databaseName: LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME,
    seedEvents: [legacyEvent],
  });
  await legacy.initialize();
  assert.deepEqual(await queryAllEvents(legacy), [legacyEvent]);
  legacy.close();

  const accountA = await openOwnedRepository(accountAName);
  assert.deepEqual(await queryAllEvents(accountA), []);
  accountA.close();

  const leftoverLegacy = createIndexedDbTimelineRepository({
    databaseName: LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME,
    seedEvents: [],
  });
  await leftoverLegacy.initialize();
  assert.deepEqual(await queryAllEvents(leftoverLegacy), [legacyEvent]);
  leftoverLegacy.close();
  await deleteDatabase(LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME);
  await deleteDatabase(accountAName);
});

test('quarantines a bad A record only inside the A namespace', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-quarantine',
  );
  const accountBName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-B-quarantine',
  );
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);

  const accountA = await openOwnedRepository(accountAName);
  await putRawEvent(accountAName, corruptGlucoseRecord('invalid-a-quarantine'));
  await assert.rejects(
    () => accountA.getById('invalid-a-quarantine'),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_READ_FAILED');
      return true;
    },
  );
  accountA.close();

  const aQuarantine = await readStoreAll(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.quarantine,
  );
  assert.equal(aQuarantine.length, 1);
  assert.equal(aQuarantine[0]?.sourceRecordId, 'invalid-a-quarantine');

  const accountB = await openOwnedRepository(accountBName);
  assert.deepEqual(await queryAllEvents(accountB), []);
  accountB.close();
  const bQuarantine = await readStoreAll(
    accountBName,
    TIMELINE_INDEXEDDB_STORES.quarantine,
  );
  assert.deepEqual(bQuarantine, []);
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);
});

async function putStoreRecord(databaseName, storeName, record) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transaction = database.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(record);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(undefined);
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

test('keeps A adoption acknowledgement and session metadata out of B', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-A-adoption',
  );
  const accountBName = createAuthenticatedTimelineDatabaseName(
    'acct-isolation-B-adoption',
  );
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);

  const accountA = await openOwnedRepository(accountAName);
  accountA.close();
  const accountB = await openOwnedRepository(accountBName);
  accountB.close();

  await putStoreRecord(accountAName, TIMELINE_INDEXEDDB_STORES.metadata, {
    createdAt: LIFECYCLE_AT,
    key: 'source-namespace',
    sourceNamespace: 'namespace-account-a',
  });
  await putStoreRecord(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
    {
      adoptedAt: LIFECYCLE_AT,
      adoptionSessionId: 'session-a',
      canonicalResourceId: 'resource-a',
      canonicalRevision: 'rev-a',
      localEventId: 'nutrition-a-event',
      storageSchemaVersion: 1,
    },
  );
  await putStoreRecord(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.adoptionSessions,
    {
      checkpoint: { eligibleCount: 1 },
      clientAdoptionRunId: 'run-a',
      createdAt: LIFECYCLE_AT,
      lifecycle: 'open',
      storageSchemaVersion: 1,
      updatedAt: LIFECYCLE_AT,
    },
  );
  await putStoreRecord(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.adoptionQuarantine,
    {
      localEventId: 'nutrition-a-event',
      quarantineId: 'adoption-quarantine-a',
      quarantinedAt: LIFECYCLE_AT,
      reason: 'adoption_source_conflict',
    },
  );

  const bAcknowledgements = await readStoreAll(
    accountBName,
    TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
  );
  const bSessions = await readStoreAll(
    accountBName,
    TIMELINE_INDEXEDDB_STORES.adoptionSessions,
  );
  const bAdoptionQuarantine = await readStoreAll(
    accountBName,
    TIMELINE_INDEXEDDB_STORES.adoptionQuarantine,
  );
  const bMetadata = await readStoreAll(
    accountBName,
    TIMELINE_INDEXEDDB_STORES.metadata,
  );

  assert.deepEqual(bAcknowledgements, []);
  assert.deepEqual(bSessions, []);
  assert.deepEqual(bAdoptionQuarantine, []);
  assert.equal(
    bMetadata.some(
      (record) => record?.sourceNamespace === 'namespace-account-a',
    ),
    false,
  );

  const aAcknowledgements = await readStoreAll(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
  );
  const aSessions = await readStoreAll(
    accountAName,
    TIMELINE_INDEXEDDB_STORES.adoptionSessions,
  );
  assert.equal(aAcknowledgements[0]?.localEventId, 'nutrition-a-event');
  assert.equal(aSessions[0]?.clientAdoptionRunId, 'run-a');
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);
});
