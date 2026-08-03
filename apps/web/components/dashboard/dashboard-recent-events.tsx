'use client';

import { EventCard } from '@diabetes-universe/ui';
import { History } from 'lucide-react';
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
      className={`col-span-full rounded-2xl border bg-white p-5 shadow-sm lg:col-span-8 dark:bg-slate-900 ${
        isError
          ? 'border-rose-200 dark:border-rose-900/70'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="h-6 w-44 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-300"
              >
                <History size={20} />
              </div>
              <h2
                className="text-lg font-bold text-slate-950 dark:text-slate-50"
                id={titleId}
              >
                {labels.title}
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              href={viewModel.viewAllHref ?? '/timeline'}
            >
              {viewModel.viewAllLabel}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {viewModel.events.map((event) => (
              <li key={event.id}>
                <EventCard
                  {...mapDashboardRecentEventToCard(event)}
                  variant="standard"
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="flex items-start gap-4"
          role={isError ? 'alert' : 'status'}
        >
          <div
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${
              isError
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300'
                : 'bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-300'
            }`}
          >
            <History size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-bold text-slate-950 dark:text-slate-50"
              id={titleId}
            >
              {labels.title}
            </h2>
            <p
              className={`mt-2 text-sm ${
                isError
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-600 dark:text-slate-300'
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
