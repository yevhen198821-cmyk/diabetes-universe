'use client';

import type { ReactNode } from 'react';

import { TimelineStoreBoundary } from '../lib/timeline/timeline-store/timeline-store-boundary';

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <TimelineStoreBoundary>{children}</TimelineStoreBoundary>;
}
