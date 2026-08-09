'use client';

import type { ReactNode } from 'react';

import { TimelineStoreProvider } from './timeline-store';

interface TimelineStoreBoundaryProps {
  readonly children: ReactNode;
}

export function TimelineStoreBoundary({
  children,
}: TimelineStoreBoundaryProps) {
  return <TimelineStoreProvider>{children}</TimelineStoreProvider>;
}
