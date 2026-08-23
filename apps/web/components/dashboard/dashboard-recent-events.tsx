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
    readonly pillClass: string;
  }
> = {
  activity: {
    icon: Activity,
    iconClass: 'bg-blue-500 text-white',
    pillClass:
      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  },
  insulin: {
    icon: Syringe,
    iconClass: 'bg-violet-500 text-white',
    pillClass:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  },
  medication: {
    icon: Pill,
    iconClass: 'bg-rose-500 text-white',
    pillClass:
      'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  },
  nutrition: {
    icon: CookingPot,
    iconClass: 'bg-orange-500 text-white',
    pillClass:
      'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
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
      <div className="flex min-h-[3.75rem] items-center gap-3 px-1 py-2.5 sm:gap-4 sm:px-2">
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-full shadow-[0_6px_16px_rgba(15,23,42,0.10)] ${visual.iconClass}`}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>

        <time
          className="w-11 shrink-0 text-sm font-semibold text-slate-500 tabular-nums dark:text-slate-400"
          dateTime={event.dateTime}
        >
          {event.displayTime}
        </time>

        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1e3a5f] sm:text-base dark:text-white">
          <span>{event.title}</span>
          {valueWithUnit.length > 0 ? (
            <>
              <span aria-hidden="true"> — </span>
              <span>{valueWithUnit}</span>
            </>
          ) : null}
        </p>

        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${visual.pillClass}`}
        >
          {event.categoryLabel}
        </span>

        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-300 dark:text-slate-600"
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2
        className="text-[1.35rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white"
        id={titleId}
      >
        {title}
      </h2>
      <Link
        className="focus-visible:outline-interactive-primary inline-flex min-h-10 items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300"
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
        className="rounded-[1.35rem] border border-white/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900"
        role={isError ? 'alert' : 'status'}
      >
        <h2
          className="text-[1.35rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white"
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
          <div aria-hidden="true" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="h-7 w-40 animate-pulse rounded bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
              <div className="h-10 w-28 animate-pulse rounded-full bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
            </div>
            <div className="space-y-0 rounded-[1.35rem] border border-white/90 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="flex items-center gap-3 py-3" key={index}>
                  <div className="bg-surface-subtle size-10 animate-pulse rounded-full motion-reduce:animate-none" />
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
          <div className="overflow-hidden rounded-[1.35rem] border border-white/90 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
            <ul className="divide-y divide-slate-100 px-3 py-1 sm:px-4 dark:divide-slate-800">
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
