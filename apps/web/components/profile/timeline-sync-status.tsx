'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { TranslationKey } from '@diabetes-universe/i18n';
import {
  readTimelineSyncState,
  runTimelineSync,
} from '@diabetes-universe/timeline-web';
import type { ResolvedTimelineLocalOwnership } from '../../lib/timeline/timeline-local-ownership';
import { createTimelineSyncClient } from '../../lib/medical/client/timeline-sync-client';
import { useLocalization } from '../../lib/platform/react/use-localization';

export function TimelineSyncStatus({
  ownership,
}: {
  ownership: ResolvedTimelineLocalOwnership;
}) {
  const localization = useLocalization();
  const [enabled, setEnabled] = useState(false);
  const [problem, setProblem] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let cancelled = false,
      running = false,
      failures = 0,
      nextAttempt = 0;
    async function tick() {
      if (running || cancelled || Date.now() < nextAttempt) return;
      running = true;
      try {
        const state = await readTimelineSyncState(ownership.databaseName);
        if (cancelled) return;
        setEnabled(state.enabled);
        setPending(state.pending > 0);
        setProblem(state.conflicts > 0);
        if (state.enabled && ownership.kind === 'authenticated') {
          await runTimelineSync(
            ownership.databaseName,
            createTimelineSyncClient(ownership.accountId),
          );
          if (cancelled) return;
          const after = await readTimelineSyncState(ownership.databaseName);
          setProblem(after.conflicts > 0);
          setPending(after.pending > 0);
          window.dispatchEvent(new Event('du:timeline-sync-applied'));
        }
        failures = 0;
        nextAttempt = 0;
      } catch {
        if (!cancelled) {
          setProblem(true);
          failures += 1;
          nextAttempt =
            Date.now() + Math.min(300_000, 15_000 * 2 ** Math.min(failures, 5));
        }
      } finally {
        running = false;
      }
    }
    const wake = () => {
      nextAttempt = 0;
      void tick();
    };
    void tick();
    const timer = setInterval(() => void tick(), 15_000);
    window.addEventListener('online', wake);
    window.addEventListener('du:timeline-sync-enabled', wake);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('online', wake);
      window.removeEventListener('du:timeline-sync-enabled', wake);
    };
  }, [ownership]);
  const t = (key: string) =>
    localization.translate({ key: key as TranslationKey }).value;
  return (
    <aside
      className="text-text-secondary mx-auto max-w-3xl px-4 py-2 text-sm"
      aria-label={t('timeline.storage.title')}
    >
      <span>
        {t(
          enabled
            ? problem
              ? 'timeline.storage.syncProblem'
              : pending
                ? 'timeline.storage.syncPending'
                : 'timeline.storage.syncEnabled'
            : 'timeline.storage.localNotice',
        )}
      </span>{' '}
      <Link href="/data" className="underline">
        {t('timeline.storage.manage')}
      </Link>
    </aside>
  );
}
