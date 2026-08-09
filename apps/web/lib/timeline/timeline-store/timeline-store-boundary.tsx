'use client';

import type { ReactNode } from 'react';

import { useTimelinePresentationDependencies } from '../react/use-timeline-presentation-dependencies';
import { TimelineStoreProvider } from './timeline-store';

interface TimelineStoreBoundaryProps {
  readonly children: ReactNode;
}

export function TimelineStoreBoundary({
  children,
}: TimelineStoreBoundaryProps) {
  const presentationDependencies = useTimelinePresentationDependencies();

  return (
    <TimelineStoreProvider presentationDependencies={presentationDependencies}>
      {children}
    </TimelineStoreProvider>
  );
}
