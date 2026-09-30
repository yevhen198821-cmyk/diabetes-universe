'use client';

import type { TimelineRepository } from '@diabetes-universe/timeline';
import type { TranslationKey } from '@diabetes-universe/i18n';
import { useEffect, useMemo, type ReactNode } from 'react';

import { createWebTimelineRepository } from '../create-web-timeline-repository';
import { createUnavailableTimelineRepository } from '../create-unavailable-timeline-repository';
import { useLocalization } from '../../platform/react/use-localization';
import { useTimelineLocalOwnership } from '../use-timeline-local-ownership';
import { TimelineStoreProvider } from './timeline-store';
import { TimelineSyncStatus } from '../../../components/profile/timeline-sync-status';
import { TimelineLocalDataContext } from '../local-data-context';

interface TimelineStoreBoundaryProps {
  readonly children: ReactNode;
}

function closeTimelineRepository(repository: TimelineRepository): void {
  const closable = repository as TimelineRepository & {
    readonly close?: () => void;
  };

  closable.close?.();
}

export function TimelineStoreBoundary({
  children,
}: TimelineStoreBoundaryProps) {
  const { ownership, failureReason, retry } = useTimelineLocalOwnership();
  const localization = useLocalization();
  const unavailable =
    ownership.kind === 'blocked' ||
    (ownership.kind === 'pending' && failureReason !== null);
  const translate = (key: string) =>
    localization.translate({ key: key as TranslationKey }).value;
  const ownerResolved =
    ownership.kind === 'anonymous' || ownership.kind === 'authenticated';
  const ownershipKey =
    ownership.kind === 'authenticated'
      ? ownership.databaseName
      : 'unauthenticated';

  const repository = useMemo(() => {
    if (ownership.kind === 'anonymous' || ownership.kind === 'authenticated') {
      return createWebTimelineRepository({
        databaseName: ownership.databaseName,
      });
    }

    return createUnavailableTimelineRepository(retry);
  }, [ownership, retry]);

  useEffect(() => {
    return () => {
      closeTimelineRepository(repository);
    };
  }, [repository]);

  return (
    <TimelineLocalDataContext.Provider value={ownership}>
      <div data-timeline-ownership={ownership.kind}>
        {(ownership.kind === 'anonymous' ||
          ownership.kind === 'authenticated') && (
          <TimelineSyncStatus
            key={ownership.databaseName}
            ownership={ownership}
          />
        )}
        {unavailable && (
          <section
            role="status"
            className="mx-auto my-4 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
          >
            <p>{translate('timeline.storage.unavailable')}</p>
            {failureReason && <code>{failureReason}</code>}
            <button
              type="button"
              onClick={retry}
              className="mt-3 rounded-lg border px-4 py-2"
            >
              {translate('timeline.storage.retry')}
            </button>
          </section>
        )}
        <TimelineStoreProvider
          key={ownershipKey}
          repository={repository}
          enabled={ownerResolved || unavailable}
        >
          {children}
        </TimelineStoreProvider>
      </div>
    </TimelineLocalDataContext.Provider>
  );
}
