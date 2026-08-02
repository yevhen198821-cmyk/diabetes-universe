'use client';

import { Droplets } from 'lucide-react';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardLastGlucoseLabels } from './dashboard-last-glucose-labels';
import {
  createDashboardLastGlucoseViewModel,
  type DashboardLastGlucoseProps,
} from './dashboard-last-glucose-model';

const titleId = 'dashboard-last-glucose-title';

export function DashboardLastGlucose(props: DashboardLastGlucoseProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardLastGlucoseLabels(localization),
    [localization],
  );
  const viewModel = useMemo(
    () => createDashboardLastGlucoseViewModel(props, labels),
    [labels, props],
  );
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`h-full rounded-2xl border bg-white p-5 shadow-sm sm:col-span-1 lg:col-span-7 dark:bg-slate-900 ${
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
          <div aria-hidden="true" className="flex items-center gap-4">
            <div className="size-11 shrink-0 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-5 w-36 max-w-full animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
            <div className="w-24 shrink-0 space-y-2">
              <div className="ml-auto h-6 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="ml-auto h-4 w-12 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-300"
          >
            <Droplets size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {labels.eyebrow}
            </p>
            <h2
              className="mt-0.5 text-lg font-bold text-slate-950 dark:text-slate-50"
              id={titleId}
            >
              {labels.title}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-slate-950 dark:text-slate-50">
              {viewModel.value}
            </p>
            <time
              className="mt-0.5 block text-sm text-slate-500 tabular-nums dark:text-slate-400"
              dateTime={viewModel.dateTime ?? undefined}
            >
              {viewModel.displayTime}
            </time>
            {viewModel.isStale && viewModel.staleMessage ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {viewModel.staleMessage}
              </p>
            ) : null}
          </div>
        </div>
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
                : 'bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-300'
            }`}
          >
            <Droplets size={20} />
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
