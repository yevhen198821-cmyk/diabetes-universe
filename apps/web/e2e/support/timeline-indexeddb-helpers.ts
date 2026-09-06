import { expect, type Page } from '@playwright/test';

import { timelineEvents as demoTimelineEvents } from '../../lib/mocks/timeline';
import {
  TIMELINE_ANONYMOUS_OWNER_STORAGE_KEY,
  createAnonymousTimelineDatabaseName,
  createAuthenticatedTimelineDatabaseName,
  readAccountIdFromSessionPayload,
} from '../../lib/timeline/timeline-local-ownership';
import { waitForApplicationReady } from './wait-for-application-ready';

const TIMELINE_EVENTS_STORE = 'timeline_events';
const TIMELINE_METADATA_STORE = 'timeline_metadata';
const TIMELINE_BOOTSTRAP_METADATA_KEY = 'bootstrap';

export async function waitForTimelineOwnershipReady(page: Page): Promise<void> {
  await expect(
    page.locator(
      '[data-timeline-ownership="anonymous"], [data-timeline-ownership="authenticated"]',
    ),
  ).toBeVisible();
}

export async function resolveActiveTimelineDatabaseName(
  page: Page,
): Promise<string> {
  await waitForTimelineOwnershipReady(page);

  const sessionResponse = await page.request.get('/api/auth/get-session');
  const session = sessionResponse.ok() ? await sessionResponse.json() : null;
  const accountId = readAccountIdFromSessionPayload(session);

  if (accountId) {
    return createAuthenticatedTimelineDatabaseName(accountId);
  }

  const ownerKey = await page.evaluate(
    (storageKey) => window.localStorage.getItem(storageKey),
    TIMELINE_ANONYMOUS_OWNER_STORAGE_KEY,
  );

  if (!ownerKey) {
    throw new Error('Anonymous Timeline owner key is not available.');
  }

  return createAnonymousTimelineDatabaseName(ownerKey);
}

async function readIndexedDbValue(
  page: Page,
  storeName: string,
  key: string,
): Promise<unknown> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);

  return page.evaluate(
    async ({ databaseName, metadataKey, objectStoreName }) => {
      return new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(objectStoreName, 'readonly');
          const getRequest = transaction
            .objectStore(objectStoreName)
            .get(metadataKey);

          getRequest.onerror = () => {
            database.close();
            reject(getRequest.error);
          };
          getRequest.onsuccess = () => {
            database.close();
            resolve(getRequest.result);
          };
        };
      });
    },
    {
      databaseName,
      metadataKey: key,
      objectStoreName: storeName,
    },
  );
}

async function countIndexedDbStoreRecords(
  page: Page,
  storeName: string,
): Promise<number> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);

  return page.evaluate(
    async ({ databaseName, objectStoreName }) => {
      return new Promise<number>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(objectStoreName, 'readonly');
          const countRequest = transaction.objectStore(objectStoreName).count();

          countRequest.onerror = () => {
            database.close();
            reject(countRequest.error);
          };
          countRequest.onsuccess = () => {
            database.close();
            resolve(countRequest.result);
          };
        };
      });
    },
    {
      databaseName,
      objectStoreName: storeName,
    },
  );
}

export async function waitForTimelineBootstrapComplete(
  page: Page,
): Promise<void> {
  await expect
    .poll(async () =>
      readIndexedDbValue(
        page,
        TIMELINE_METADATA_STORE,
        TIMELINE_BOOTSTRAP_METADATA_KEY,
      ),
    )
    .not.toBeUndefined();
}

async function putTimelineEventRecord(
  page: Page,
  event: {
    readonly id: string;
    readonly kind: string;
    readonly occurredAt: string;
    readonly [key: string]: unknown;
  },
): Promise<void> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);
  const persistedAt = new Date().toISOString();

  await page.evaluate(
    async ({ databaseName, event, objectStoreName, persistedAt }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            objectStoreName,
            'readwrite',
          );
          transaction.objectStore(objectStoreName).put({
            event,
            id: event.id,
            kind: event.kind,
            occurredAt: event.occurredAt,
            persistedAt,
            storageSchemaVersion: 1,
          });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      });
    },
    {
      databaseName,
      event,
      objectStoreName: TIMELINE_EVENTS_STORE,
      persistedAt,
    },
  );
}

export async function seedSemanticTimelineEventInIndexedDb(
  page: Page,
  event: {
    readonly createdAt: string;
    readonly id: string;
    readonly kind: string;
    readonly occurredAt: string;
    readonly schemaVersion: number;
    readonly source: string;
    readonly updatedAt: string;
    readonly [key: string]: unknown;
  },
): Promise<void> {
  await putTimelineEventRecord(page, event);
}

export async function seedTimelineEventInIndexedDb(
  page: Page,
  event: {
    readonly createdAt: string;
    readonly doseUnits: number;
    readonly id: string;
    readonly kind: 'insulin';
    readonly occurredAt: string;
    readonly preparation: string;
    readonly schemaVersion: number;
    readonly source: string;
    readonly updatedAt: string;
  },
): Promise<void> {
  await putTimelineEventRecord(page, event);
}

export async function clearTimelineEventsInIndexedDb(
  page: Page,
): Promise<void> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);

  await page.evaluate(
    async ({ databaseName, objectStoreName }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            objectStoreName,
            'readwrite',
          );
          transaction.objectStore(objectStoreName).clear();
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      });
    },
    {
      databaseName,
      objectStoreName: TIMELINE_EVENTS_STORE,
    },
  );
}

export async function waitForEmptyTimelineInIndexedDb(
  page: Page,
): Promise<void> {
  await expect
    .poll(async () => countIndexedDbStoreRecords(page, TIMELINE_EVENTS_STORE))
    .toBe(0);
}

export async function waitForDashboardEmptyGlucoseHero(
  page: Page,
): Promise<void> {
  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });

  await expect(
    lastGlucoseRegion.getByText('No measurements yet.'),
  ).toBeVisible();
  await expect(
    lastGlucoseRegion.getByRole('button', { name: 'Add glucose' }),
  ).toBeVisible();
  await expect(lastGlucoseRegion.getByText(/\d/)).toHaveCount(0);
}

/**
 * Establishes a durable empty timeline and empty Dashboard glucose hero:
 * bootstrap completes → events cleared → reload → IndexedDB still empty → empty CTA visible.
 */
export async function prepareEmptyTimelineDashboardFixture(
  page: Page,
): Promise<void> {
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForEmptyTimelineInIndexedDb(page);
  await waitForDashboardEmptyGlucoseHero(page);
}

export async function seedCanonicalDemoTimelineEvents(
  page: Page,
): Promise<void> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);
  const persistedAt = new Date().toISOString();

  await page.evaluate(
    async ({ databaseName, events, objectStoreName, persistedAt }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            objectStoreName,
            'readwrite',
          );
          const store = transaction.objectStore(objectStoreName);

          for (const event of events) {
            store.put({
              event,
              id: event.id,
              kind: event.kind,
              occurredAt: event.occurredAt,
              persistedAt,
              storageSchemaVersion: 1,
            });
          }

          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      });
    },
    {
      databaseName,
      events: demoTimelineEvents,
      objectStoreName: TIMELINE_EVENTS_STORE,
      persistedAt,
    },
  );
}

/**
 * Explicit opt-in demo history for E2E specs that still assert against the
 * canonical fixture set. Production repository creation never seeds this.
 */
export async function prepareCanonicalDemoTimelineFixture(
  page: Page,
): Promise<void> {
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForTimelineBootstrapComplete(page);
  await seedCanonicalDemoTimelineEvents(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForTimelineBootstrapComplete(page);
}

export async function readActiveTimelineStoredEvents(
  page: Page,
): Promise<readonly Record<string, unknown>[]> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);

  return page.evaluate(
    async ({ databaseName, objectStoreName }) => {
      return new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(objectStoreName, 'readonly');
          const getAll = transaction.objectStore(objectStoreName).getAll();

          getAll.onerror = () => {
            database.close();
            reject(getAll.error);
          };
          getAll.onsuccess = () => {
            database.close();
            const rows = (getAll.result ?? []) as readonly {
              readonly event?: Record<string, unknown>;
            }[];
            resolve(
              rows
                .map((row) => row.event)
                .filter((event): event is Record<string, unknown> =>
                  Boolean(event),
                ),
            );
          };
        };
      });
    },
    {
      databaseName,
      objectStoreName: TIMELINE_EVENTS_STORE,
    },
  );
}

export async function readActiveTimelineStoredEventById(
  page: Page,
  eventId: string,
): Promise<Record<string, unknown> | null> {
  const databaseName = await resolveActiveTimelineDatabaseName(page);

  return page.evaluate(
    async ({ databaseName, eventId, objectStoreName }) => {
      return new Promise<Record<string, unknown> | null>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(objectStoreName, 'readonly');
          const getRequest = transaction
            .objectStore(objectStoreName)
            .get(eventId);

          getRequest.onerror = () => {
            database.close();
            reject(getRequest.error);
          };
          getRequest.onsuccess = () => {
            database.close();
            const record = getRequest.result as
              { readonly event?: Record<string, unknown> } | undefined;
            resolve(record?.event ?? null);
          };
        };
      });
    },
    {
      databaseName,
      eventId,
      objectStoreName: TIMELINE_EVENTS_STORE,
    },
  );
}
