'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TranslationKey } from '@diabetes-universe/i18n';
import {
  exportTimelineLocalData,
  deleteTimelineLocalData,
  runTimelineLocalAdoption,
  enableTimelineSync,
  readTimelineSyncState,
} from '@diabetes-universe/timeline-web';
import { createTimelineAdoptionClient } from '../../lib/medical/client/timeline-adoption-client';
import { createTimelineSyncClient } from '../../lib/medical/client/timeline-sync-client';
import { useTimelineLocalData } from '../../lib/timeline/local-data-context';
import { useLocalization } from '../../lib/platform/react/use-localization';

export function LocalDataPanel() {
  const ownership = useTimelineLocalData();
  const key =
    ownership.kind === 'authenticated' || ownership.kind === 'anonymous'
      ? ownership.databaseName
      : ownership.kind;
  return <LocalDataPanelForOwner key={key} />;
}

function LocalDataPanelForOwner() {
  const ownership = useTimelineLocalData();
  const localization = useLocalization();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'export' | 'delete' | null>(null);
  const [consent, setConsent] = useState(false);
  const [transferState, setTransferState] = useState<
    'idle' | 'busy' | 'completed' | 'failed'
  >('idle');
  const [deleteConsent, setDeleteConsent] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncConsent, setSyncConsent] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const t = (key: string) =>
    localization.translate({ key: key as TranslationKey }).value;
  const available =
    ownership.kind === 'anonymous' || ownership.kind === 'authenticated';
  useEffect(() => {
    let cancelled = false;
    if (ownership.kind === 'authenticated')
      void readTimelineSyncState(ownership.databaseName)
        .then((state) => {
          if (!cancelled) setSyncEnabled(state.enabled);
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ownership]);

  async function download() {
    if (!available || busy) return;
    setBusy(true);
    setError(null);
    try {
      const archive = await exportTimelineLocalData(ownership.databaseName);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(archive, null, 2)], {
          type: 'application/json',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `diabetes-universe-local-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      // Give the browser time to consume the download before releasing its URL.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError('export');
    } finally {
      setBusy(false);
    }
  }

  async function transfer() {
    if (
      ownership.kind !== 'authenticated' ||
      !consent ||
      busy ||
      transferState === 'busy'
    )
      return;
    setTransferState('busy');
    try {
      const result = await runTimelineLocalAdoption(
        ownership.databaseName,
        createTimelineAdoptionClient(ownership.accountId),
      );
      setTransferState(result.status === 'completed' ? 'completed' : 'failed');
    } catch {
      setTransferState('failed');
    }
  }

  async function eraseLocal() {
    if (!available || !deleteConsent || busy || transferState === 'busy')
      return;
    setBusy(true);
    setError(null);
    try {
      await deleteTimelineLocalData(ownership.databaseName);
      window.location.reload();
    } catch {
      setError('delete');
      setBusy(false);
    }
  }

  async function enableSync() {
    if (
      ownership.kind !== 'authenticated' ||
      !syncConsent ||
      busy ||
      transferState === 'busy'
    )
      return;
    setBusy(true);
    setSyncError(false);
    try {
      await enableTimelineSync(
        ownership.databaseName,
        createTimelineSyncClient(ownership.accountId),
      );
      setSyncEnabled(true);
      window.dispatchEvent(new Event('du:timeline-sync-enabled'));
    } catch {
      setSyncError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-xl border p-6">
      <Link href="/" className="inline-flex min-h-11 items-center underline">
        {t('timeline.topBar.home')}
      </Link>
      <h1 className="text-xl font-semibold">{t('timeline.storage.title')}</h1>
      <p>
        {t(
          syncEnabled
            ? 'timeline.storage.syncEnabled'
            : 'timeline.storage.localNotice',
        )}
      </p>
      <p>{t('timeline.storage.exportDescription')}</p>
      <button
        type="button"
        disabled={!available || busy}
        onClick={download}
        className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
      >
        {t('timeline.storage.export')}
      </button>
      {error && (
        <p role="alert">
          {t(
            error === 'export'
              ? 'timeline.storage.exportError'
              : 'timeline.error.default',
          )}
        </p>
      )}
      {ownership.kind === 'authenticated' && !syncEnabled && (
        <div className="space-y-3 border-t pt-4">
          <p>{t('timeline.storage.transferDescription')}</p>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={consent}
              disabled={transferState === 'busy'}
              onChange={(event) => setConsent(event.target.checked)}
            />
            {t('timeline.storage.transferConsent')}
          </label>
          <button
            type="button"
            className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
            disabled={!consent || busy || transferState === 'busy'}
            onClick={transfer}
          >
            {t(
              transferState === 'busy'
                ? 'timeline.storage.transferring'
                : 'timeline.storage.transfer',
            )}
          </button>
          {transferState === 'completed' && (
            <p role="status">{t('timeline.storage.transferCompleted')}</p>
          )}
          {transferState === 'failed' && (
            <p role="alert">{t('timeline.storage.transferFailed')}</p>
          )}
          {!syncEnabled && (
            <>
              <p>{t('timeline.storage.syncConsentDescription')}</p>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={syncConsent}
                  disabled={busy}
                  onChange={(event) => setSyncConsent(event.target.checked)}
                />
                {t('timeline.storage.syncConsent')}
              </label>
              <button
                type="button"
                disabled={!syncConsent || busy || transferState === 'busy'}
                onClick={enableSync}
                className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {t('timeline.storage.enableSync')}
              </button>
              {syncError && (
                <p role="alert">{t('timeline.storage.syncEnableError')}</p>
              )}
            </>
          )}
        </div>
      )}
      <div className="space-y-3 border-t pt-4">
        <p>{t('timeline.storage.deleteDescription')}</p>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={deleteConsent}
            disabled={busy || transferState === 'busy'}
            onChange={(event) => setDeleteConsent(event.target.checked)}
          />
          {t('timeline.storage.deleteConsent')}
        </label>
        <button
          type="button"
          onClick={eraseLocal}
          disabled={
            !available || !deleteConsent || busy || transferState === 'busy'
          }
          className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          {t('timeline.storage.deleteLocal')}
        </button>
      </div>
    </section>
  );
}
