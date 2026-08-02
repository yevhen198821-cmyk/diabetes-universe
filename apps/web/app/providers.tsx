'use client';

import type { ReactNode } from 'react';

import { TimelineStoreProvider } from '../lib/timeline/timeline-store';

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <TimelineStoreProvider>{children}</TimelineStoreProvider>;
}
