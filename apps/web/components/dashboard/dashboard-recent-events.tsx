'use client';

import {
  Activity,
  ChevronRight,
  CookingPot,
  Pill,
  Syringe,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardRecentEventsLabels } from './dashboard-recent-events-labels';
import type { DashboardRecentEventCard } from './dashboard-recent-events-model';
import {
  createDashboardRecentEventsViewModel,
  type DashboardRecentEventsProps,
} from './dashboard-recent-events-model';

const titleId = 'dashboard-recent-events-title';

const categoryVisuals: Record<
  DashboardRecentEventCard['category'],
  {
    readonly icon: typeof Activity;
    readonly iconClass: string;
    readonly tagClass: string;
  }
> = {
  activity: {
    icon: Activity,
    iconClass: 'bg-blue-500 text-white',
    tagClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  },
  insulin: {
    icon: Syringe,
    iconClass: 'bg-violet-500 text-white',
    tagClass:
      'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  },
  medication: {
    icon: Pill,
    iconClass: 'bg-rose-500 text-white',
    tagClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  },
  nutrition: {
    icon: CookingPot,
    iconClass: 'bg-orange-500 text-white',
    tagClass:
      'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200',
  },
};

function RecentEventRow({
  event,
}: {
  readonly event: DashboardRecentEventCard;
}) {
  const visual = categoryVisuals[event.category];
  const Icon = visual.icon;
  const valueWithUnit = [event.value, event.unit].filter(Boolean).join(' ');

  return (
    <li>
      <div className="flex min-h-[4.25rem] items-center gap-3 px-1.5 py-3 sm:gap-4 sm:px-2">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.10)] ${visual.iconClass}`}
        >
          <Icon size={19} strokeWidth={2.2} />
        </span>

        <time
          className="w-11 shrink-0 text-sm font-semibold text-slate-500/90 tabular-nums dark:text-slate-400"
          dateTime={event.dateTime}
        >
          {event.displayTime}
        </time>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1e3a5f] sm:text-[0.95rem] dark:text-white">
            <span>{event.title}</span>
            {valueWithUnit.length > 0 ? (
              <>
                <span aria-hidden="true"> — </span>
                <span className="font-bold">{valueWithUnit}</span>
              </>
            ) : null}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${visual.tagClass}`}
          >
            {event.categoryLabel}
          </span>
        </div>

        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-300/90 dark:text-slate-600"
        />
      </div>
    </li>
  );
}

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
}: {
  readonly title: string;
  readonly viewAllHref: string;
  readonly viewAllLabel: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <h2
        className="text-[1.25rem] font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.35rem] dark:text-white"
        id={titleId}
      >
        {title}
      </h2>
      <Link
        className="focus-visible:outline-interactive-primary inline-flex min-h-9 items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300"
        href={viewAllHref}
      >
        <span>{viewAllLabel}</span>
        <ChevronRight aria-hidden="true" size={16} />
      </Link>
    </div>
  );
}

function StatePanel({
  children,
  isError,
  title,
}: {
  readonly children: ReactNode;
  readonly isError: boolean;
  readonly title: string;
}) {
  return (
    <section aria-labelledby={titleId} className="relative col-span-full">
      <div
        aria-live={isError ? 'assertive' : 'polite'}
        className="rounded-[1.35rem] border border-white/80 bg-white/75 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/75"
        role={isError ? 'alert' : 'status'}
      >
        <h2
          className="text-[1.25rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white"
          id={titleId}
        >
          {title}
        </h2>
        <div className="text-text-secondary mt-2 text-sm">{children}</div>
      </div>
    </section>
  );
}

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
      className="relative col-span-full"
    >
      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="h-7 w-40 animate-pulse rounded bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
              <div className="h-9 w-28 animate-pulse rounded-full bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
            </div>
            <div className="space-y-0 rounded-[1.35rem] border border-white/80 bg-white/75 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/75">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="flex items-center gap-3 py-3.5" key={index}>
                  <div className="bg-surface-subtle size-11 animate-pulse rounded-full motion-reduce:animate-none" />
                  <div className="bg-surface-subtle h-4 w-10 animate-pulse rounded motion-reduce:animate-none" />
                  <div className="bg-surface-subtle h-4 flex-1 animate-pulse rounded motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && viewModel.viewAllHref ? (
        <div>
          <SectionHeader
            title={labels.title}
            viewAllHref={viewModel.viewAllHref}
            viewAllLabel={viewModel.viewAllLabel}
          />
          <div className="overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/75 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/75">
            <ul className="divide-y divide-slate-100/90 px-3 py-1 sm:px-4 dark:divide-slate-800">
              {viewModel.events.map((event) => (
                <RecentEventRow event={event} key={event.id} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <StatePanel isError={isError} title={labels.title}>
          <p className={isError ? 'text-status-danger' : undefined}>
            {viewModel.message}
          </p>
        </StatePanel>
      ) : null}
    </section>
  );
}
