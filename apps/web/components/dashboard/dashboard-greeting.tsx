'use client';

import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  createDashboardGreetingMessage,
  resolveDashboardGreetingLabels,
} from './dashboard-greeting-labels';

export interface DashboardGreetingProps {
  readonly referenceTime?: Date;
  readonly state: 'loading' | 'ready';
}

export function DashboardGreeting({
  referenceTime,
  state,
}: DashboardGreetingProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardGreetingLabels(localization),
    [localization],
  );
  const resolvedReferenceTime = useMemo(
    () => referenceTime ?? new Date(),
    [referenceTime],
  );
  const greeting = useMemo(
    () => createDashboardGreetingMessage(labels, resolvedReferenceTime),
    [labels, resolvedReferenceTime],
  );

  if (state === 'loading') {
    return (
      <div
        aria-hidden="true"
        className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]"
      >
        <div className="space-y-2 py-1">
          <div className="h-8 w-52 max-w-full animate-pulse rounded-xl bg-white/70 motion-reduce:animate-none dark:bg-slate-800" />
          <div className="h-4 w-40 max-w-full animate-pulse rounded bg-white/60 motion-reduce:animate-none dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
      <div className="py-1">
        <h2 className="text-[clamp(1.65rem,5vw,2.35rem)] font-extrabold tracking-tight text-slate-950 dark:text-white">
          {greeting}
        </h2>
        <p className="text-text-secondary mt-1 text-sm font-medium sm:text-base">
          {labels.contextToday}
        </p>
      </div>
    </div>
  );
}
