'use client';

import { EventCard } from '@diabetes-universe/ui';
import { ArrowRight, History } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { mapDashboardRecentEventToCard } from './dashboard-recent-events-card.mapper';
import { resolveDashboardRecentEventsLabels } from './dashboard-recent-events-labels';
import {
  createDashboardRecentEventsViewModel,
  type DashboardRecentEventsProps,
} from './dashboard-recent-events-model';

const titleId = 'dashboard-recent-events-title';

export function DashboardRecentEvents(props: DashboardRecentEventsProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardRecentEventsLabels(localization),
    [localization],
  );
  const viewModel = useMemo(
    () => createDashboardRecentEventsViewModel(props, labels),
    [labels, props],
  );
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative col-span-full overflow-hidden rounded-[1.75rem] border bg-white/85 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-5 lg:col-span-12 dark:bg-slate-900/85 ${
        isError
          ? 'border-status-danger/40'
          : 'border-white/70 dark:border-white/10'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-16 size-52 rounded-full bg-gradient-to-br from-cyan-200/25 via-violet-200/20 to-rose-200/25 blur-3xl dark:opacity-20"
      />

      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="relative space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="bg-surface-subtle h-6 w-44 animate-pulse rounded motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-10 w-32 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="space-y-3">
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white shadow-[0_10px_22px_rgba(6,182,212,0.22)]"
              >
                <History size={19} />
              </div>
              <h2
                className="text-text-primary truncate text-xl font-extrabold tracking-tight"
                id={titleId}
              >
                {labels.title}
              </h2>
            </div>
            <Link
              className="focus-visible:outline-interactive-primary inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold text-violet-600 transition hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-violet-300"
              href={viewModel.viewAllHref ?? '/timeline'}
            >
              <span>{viewModel.viewAllLabel}</span>
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <ul className="mt-4 space-y-2.5">
            {viewModel.events.map((event) => (
              <li key={event.id}>
                <div className="rounded-2xl bg-gradient-to-r from-slate-50/90 via-white to-white p-[1px] shadow-[0_8px_22px_rgba(15,23,42,0.05)] dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
                  <EventCard
                    {...mapDashboardRecentEventToCard(event)}
                    variant="standard"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="relative flex items-start gap-4"
          role={isError ? 'alert' : 'status'}
        >
          <div
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
              isError
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-gradient-to-br from-teal-400/25 via-cyan-300/20 to-blue-300/25 text-teal-700 dark:text-teal-200'
            }`}
          >
            <History size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary text-lg font-bold" id={titleId}>
              {labels.title}
            </h2>
            <p
              className={`mt-2 text-sm ${
                isError ? 'text-status-danger' : 'text-text-secondary'
              }`}
            >
              {viewModel.message}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
