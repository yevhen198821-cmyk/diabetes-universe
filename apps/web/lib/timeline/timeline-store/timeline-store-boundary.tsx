'use client';

import type { TimelineRepository } from '@diabetes-universe/timeline';
import type { TranslationKey } from '@diabetes-universe/i18n';
import { useEffect, useMemo, type ReactNode } from 'react';

import { createWebTimelineRepository } from '../create-web-timeline-repository';
import { createUnavailableTimelineRepository } from '../create-unavailable-timeline-repository';
import { useLocalization } from '../../platform/react/use-localization';
import { useTimelineLocalOwnership } from '../use-timeline-local-ownership';
import { TimelineStoreProvider } from './timeline-store';

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
  const { ownership, retry } = useTimelineLocalOwnership();
  const localization = useLocalization();
  const unavailable =
    ownership.kind === 'pending' || ownership.kind === 'blocked';
  const translate = (key: string) =>
    localization.translate({ key: key as TranslationKey }).value;
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

    return createUnavailableTimelineRepository();
  }, [ownership]);

  useEffect(() => {
    return () => {
      closeTimelineRepository(repository);
    };
  }, [repository]);

  return (
    <div data-timeline-ownership={ownership.kind}>
      {unavailable && (
        <section
          role="status"
          className="mx-auto my-4 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <p>{translate('timeline.storage.unavailable')}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-lg border px-4 py-2"
          >
            {translate('timeline.storage.retry')}
          </button>
        </section>
      )}
      <TimelineStoreProvider key={ownershipKey} repository={repository}>
        {children}
      </TimelineStoreProvider>
    </div>
  );
}
