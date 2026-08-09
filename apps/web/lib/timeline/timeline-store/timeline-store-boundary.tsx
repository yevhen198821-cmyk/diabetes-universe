'use client';

import { useMemo, type ReactNode } from 'react';

import { createWebTimelineRepository } from '../create-web-timeline-repository';
import { TimelineStoreProvider } from './timeline-store';

interface TimelineStoreBoundaryProps {
  readonly children: ReactNode;
}

export function TimelineStoreBoundary({
  children,
}: TimelineStoreBoundaryProps) {
  const repository = useMemo(() => createWebTimelineRepository(), []);

  return (
    <TimelineStoreProvider repository={repository}>
      {children}
    </TimelineStoreProvider>
  );
}
