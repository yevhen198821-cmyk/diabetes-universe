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
      className={`bg-surface col-span-full rounded-2xl border p-5 shadow-sm lg:col-span-8 ${
        isError ? 'border-status-danger/40' : 'border-border-default'
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
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"
              >
                <History size={20} />
              </div>
              <h2 className="text-text-primary text-lg font-bold" id={titleId}>
                {labels.title}
              </h2>
            </div>
            <Link
              className="border-border-default text-text-primary hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-interactive-primary inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
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
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-teal-500/10 text-teal-600'
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
