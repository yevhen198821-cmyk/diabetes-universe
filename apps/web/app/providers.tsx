'use client';

import type { ReactNode } from 'react';

import { SkipLink } from '../components/accessibility/skip-link';
import { DiabetesSettingsProvider } from '../lib/medical/react';
import { ThemeProvider } from '../lib/theme/theme-provider';
import { TimelineStoreBoundary } from '../lib/timeline/timeline-store/timeline-store-boundary';

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DiabetesSettingsProvider>
        <TimelineStoreBoundary>
          <SkipLink />
          {children}
        </TimelineStoreBoundary>
      </DiabetesSettingsProvider>
    </ThemeProvider>
  );
}
