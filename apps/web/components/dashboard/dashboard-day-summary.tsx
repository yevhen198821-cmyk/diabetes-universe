'use client';

import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';

import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  resolveDashboardDaySummaryLabels,
  type DashboardDaySummaryLabels,
} from './dashboard-day-summary-labels';
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
            isPrimary ? 'bg-surface-subtle' : 'bg-surface-subtle/80'
          }`}
          key={metric.label}
        >
          <dt
            className={`${
              isPrimary ? 'text-xs' : 'text-[11px]'
            } text-text-secondary`}
          >
            {metric.label}
          </dt>
          <dd
            className={`text-text-primary mt-0.5 font-bold ${
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
  labels: DashboardDaySummaryLabels,
): DashboardDaySummaryFormattedMetrics {
  const formattedInsulin = formatter.formatNumber(
    summary.summary.totalInsulinUnits,
    { maximumFractionDigits: 1, minimumFractionDigits: 0 },
  );
  const formattedCarbs = formatter.formatNumber(
    summary.summary.totalCarbohydrateGrams,
    { maximumFractionDigits: 0, minimumFractionDigits: 0 },
  );

  return {
    glucoseMeasurements: formatter.formatNumber(
      summary.summary.glucoseMeasurements,
    ),
    medicationDoses: formatter.formatNumber(summary.summary.medicationDoses),
    totalCarbohydrates: `${formattedCarbs} ${labels.units.compactMassG}`,
    totalInsulin: `${formattedInsulin} ${labels.units.compactInsulinDose}`,
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

    return createFormattedMetrics(props, formatter, labels);
  }, [formatter, labels, props]);
  const viewModel = useMemo(
    () => createDashboardDaySummaryViewModel(props, labels, formattedMetrics),
    [formattedMetrics, labels, props],
  );
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`bg-surface h-full rounded-2xl border p-5 shadow-sm sm:col-span-1 lg:col-span-5 ${
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
            <div className="space-y-2">
              <div className="bg-surface-subtle h-4 w-24 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-surface-subtle h-6 w-40 animate-pulse rounded motion-reduce:animate-none" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-16 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-control bg-surface-subtle h-14 animate-pulse motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-14 animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <>
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"
            >
              <CalendarDays size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary text-sm">{labels.eyebrow}</p>
              <h2
                className="text-text-primary mt-0.5 text-lg font-bold"
                id={titleId}
              >
                {labels.title}
              </h2>
              <p className="text-text-secondary mt-1 text-sm">
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
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-violet-500/10 text-violet-600'
            }`}
          >
            <CalendarDays size={20} />
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
