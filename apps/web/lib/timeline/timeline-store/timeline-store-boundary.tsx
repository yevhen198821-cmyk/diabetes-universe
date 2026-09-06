'use client';

import {
  createInMemoryTimelineRepository,
  type TimelineRepository,
} from '@diabetes-universe/timeline';
import { useEffect, useMemo, type ReactNode } from 'react';

import { createWebTimelineRepository } from '../create-web-timeline-repository';
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
  const ownership = useTimelineLocalOwnership();
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
