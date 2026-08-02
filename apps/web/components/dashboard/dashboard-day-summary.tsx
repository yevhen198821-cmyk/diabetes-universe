'use client';

import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';

import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardDaySummaryLabels } from './dashboard-day-summary-labels';
import {
  createDashboardDaySummaryViewModel,
  type DashboardDaySummaryFormattedMetrics,
  type DashboardDaySummaryProps,
} from './dashboard-day-summary-model';

const titleId = 'dashboard-day-summary-title';

function MetricList({
  metrics,
  variant,
}: {
  readonly metrics: ReadonlyArray<{ label: string; value: string }>;
  readonly variant: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <dl
      className={
        isPrimary
          ? 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'
          : 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'
      }
    >
      {metrics.map((metric) => (
        <div
          className={`rounded-xl p-3.5 ${
            isPrimary
              ? 'bg-slate-50 dark:bg-slate-800/70'
              : 'bg-slate-50/70 dark:bg-slate-800/40'
          }`}
          key={metric.label}
        >
          <dt
            className={`${
              isPrimary ? 'text-xs' : 'text-[11px]'
            } text-slate-500 dark:text-slate-400`}
          >
            {metric.label}
          </dt>
          <dd
            className={`mt-0.5 font-bold text-slate-950 dark:text-slate-50 ${
              isPrimary ? 'text-lg' : 'text-base'
            }`}
          >
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function createFormattedMetrics(
  summary: DashboardDaySummaryProps & { state: 'ready' },
  formatter: ReturnType<typeof useFormatter>,
): DashboardDaySummaryFormattedMetrics {
  const formattedCompleted = formatter.formatNumber(
    summary.summary.remindersCompleted,
  );
  const formattedTotal = formatter.formatNumber(summary.summary.remindersTotal);

  return {
    glucoseMeasurements: formatter.formatNumber(
      summary.summary.glucoseMeasurements,
    ),
    medicationDoses: formatter.formatNumber(summary.summary.medicationDoses),
    reminders: `${formattedCompleted} / ${formattedTotal}`,
  };
}

export function DashboardDaySummary(props: DashboardDaySummaryProps) {
  const localization = useLocalization();
  const formatter = useFormatter();
  const labels = useMemo(
    () => resolveDashboardDaySummaryLabels(localization),
    [localization],
  );
  const formattedMetrics = useMemo(() => {
    if (props.state !== 'ready') {
      return undefined;
    }

    return createFormattedMetrics(props, formatter);
  }, [formatter, props]);
  const viewModel = useMemo(
    () => createDashboardDaySummaryViewModel(props, labels, formattedMetrics),
    [formattedMetrics, labels, props],
  );
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`h-full rounded-2xl border bg-white p-5 shadow-sm sm:col-span-1 lg:col-span-5 dark:bg-slate-900 ${
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
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-14 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <>
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-300"
            >
              <CalendarDays size={20} />
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
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                <time dateTime={viewModel.dayDate ?? undefined}>
                  {viewModel.displayDayLabel}
                </time>
              </p>
            </div>
          </div>
          <MetricList metrics={viewModel.primaryMetrics} variant="primary" />
          <MetricList
            metrics={viewModel.secondaryMetrics}
            variant="secondary"
          />
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
                : 'bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-300'
            }`}
          >
            <CalendarDays size={20} />
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
