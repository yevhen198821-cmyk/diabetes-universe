import { expect, type Page } from '@playwright/test';

import { waitForApplicationReady } from './wait-for-application-ready';

const TIMELINE_DATABASE_NAME = 'diabetes-universe-timeline';
const TIMELINE_EVENTS_STORE = 'timeline_events';
const TIMELINE_METADATA_STORE = 'timeline_metadata';
const TIMELINE_BOOTSTRAP_METADATA_KEY = 'bootstrap';

async function readIndexedDbValue(
  page: Page,
  storeName: string,
  key: string,
): Promise<unknown> {
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
      databaseName: TIMELINE_DATABASE_NAME,
      metadataKey: key,
      objectStoreName: storeName,
    },
  );
}

async function countIndexedDbStoreRecords(
  page: Page,
  storeName: string,
): Promise<number> {
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
      databaseName: TIMELINE_DATABASE_NAME,
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

export async function clearTimelineEventsInIndexedDb(
  page: Page,
): Promise<void> {
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
      databaseName: TIMELINE_DATABASE_NAME,
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
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForEmptyTimelineInIndexedDb(page);
  await waitForDashboardEmptyGlucoseHero(page);
}
