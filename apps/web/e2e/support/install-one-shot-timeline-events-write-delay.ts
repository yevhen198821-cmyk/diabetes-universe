import type { Page } from '@playwright/test';

const TIMELINE_EVENTS_STORE = 'timeline_events';

interface TimelineEventsWriteDelayHookState {
  readonly delayMs: number;
  installed: boolean;
  readonly originalTransaction: IDBDatabase['transaction'];
}

declare global {
  interface Window {
    __duTimelineEventsWriteDelay?: TimelineEventsWriteDelayHookState;
  }
}

/**
 * Installs a one-shot delay on the next `timeline_events` readwrite IndexedDB
 * transaction only. The hook removes itself before the delayed transaction
 * starts so auth, bootstrap, clearing, and unrelated stores are unaffected.
 */
export async function installOneShotTimelineEventsWriteDelay(
  page: Page,
  delayMs: number,
): Promise<void> {
  await page.evaluate(
    ({ delay, timelineEventsStore }) => {
      const isTimelineEventsWriteTransaction = (
        storeNames: string | string[],
        mode?: IDBTransactionMode,
      ): boolean => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];

        return (
          mode === 'readwrite' &&
          names.length === 1 &&
          names[0] === timelineEventsStore
        );
      };

      const delayCompleteEventListener = (
        transaction: IDBTransaction,
        completeDelayMs: number,
      ): void => {
        const originalAddEventListener =
          transaction.addEventListener.bind(transaction);
        const passthroughAddEventListener = originalAddEventListener as (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: boolean | AddEventListenerOptions,
        ) => void;

        transaction.addEventListener = function (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: boolean | AddEventListenerOptions,
        ): void {
          if (type !== 'complete' || listener === null) {
            passthroughAddEventListener(type, listener, options);
            return;
          }

          passthroughAddEventListener(
            type,
            (event: Event) => {
              window.setTimeout(() => {
                if (typeof listener === 'function') {
                  listener.call(this, event);
                  return;
                }

                listener.handleEvent(event);
              }, completeDelayMs);
            },
            options,
          );
        };
      };

      const existingHook = window.__duTimelineEventsWriteDelay;
      if (existingHook !== undefined) {
        IDBDatabase.prototype.transaction = existingHook.originalTransaction;
      }

      const hookState: TimelineEventsWriteDelayHookState = {
        delayMs: delay,
        installed: true,
        originalTransaction: IDBDatabase.prototype.transaction,
      };

      window.__duTimelineEventsWriteDelay = hookState;

      IDBDatabase.prototype.transaction = function (
        storeNames: string | string[],
        mode?: IDBTransactionMode,
        options?: IDBTransactionOptions,
      ): IDBTransaction {
        const hook = window.__duTimelineEventsWriteDelay;
        const shouldDelay =
          hook !== undefined &&
          hook.installed &&
          isTimelineEventsWriteTransaction(storeNames, mode);

        const transaction = hookState.originalTransaction.call(
          this,
          storeNames,
          mode,
          options,
        );

        if (!shouldDelay || hook === undefined) {
          return transaction;
        }

        hook.installed = false;
        IDBDatabase.prototype.transaction = hook.originalTransaction;

        delayCompleteEventListener(transaction, hook.delayMs);

        return transaction;
      };
    },
    { delay: delayMs, timelineEventsStore: TIMELINE_EVENTS_STORE },
  );
}
