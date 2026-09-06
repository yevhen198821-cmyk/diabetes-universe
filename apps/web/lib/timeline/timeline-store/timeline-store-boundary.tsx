'use client';

import { createInMemoryTimelineRepository } from '@diabetes-universe/timeline';
import { useEffect, useMemo, type ReactNode } from 'react';

import { createWebTimelineRepository } from '../create-web-timeline-repository';
import { useTimelineLocalOwnership } from '../use-timeline-local-ownership';
import { TimelineStoreProvider } from './timeline-store';

interface TimelineStoreBoundaryProps {
  readonly children: ReactNode;
}

function closeTimelineRepository(repository: { close?: () => void }): void {
  repository.close?.();
}

export function TimelineStoreBoundary({
  children,
}: TimelineStoreBoundaryProps) {
  const ownership = useTimelineLocalOwnership();
  const ownershipKey =
    ownership.kind === 'anonymous' || ownership.kind === 'authenticated'
      ? ownership.databaseName
      : ownership.kind;

  const repository = useMemo(() => {
    if (ownership.kind === 'anonymous' || ownership.kind === 'authenticated') {
      return createWebTimelineRepository({
        databaseName: ownership.databaseName,
      });
    }

    return createInMemoryTimelineRepository({ seedEvents: [] });
  }, [ownership]);

  useEffect(() => {
    return () => {
      closeTimelineRepository(repository);
    };
  }, [repository]);

  return (
    <div data-timeline-ownership={ownership.kind}>
      <TimelineStoreProvider key={ownershipKey} repository={repository}>
        {children}
      </TimelineStoreProvider>
    </div>
  );
}
