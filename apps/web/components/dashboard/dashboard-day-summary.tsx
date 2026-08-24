'use client';

import {
  ArrowRight,
  Droplets,
  PersonStanding,
  Syringe,
  Wheat,
} from 'lucide-react';
import { useMemo } from 'react';

import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  ActivityMiniChart,
  GlucoseMiniChart,
  InsulinMiniChart,
  NutritionMiniChart,
} from './dashboard-day-summary-mini-charts';
import {
  resolveDashboardDaySummaryLabels,
  type DashboardDaySummaryLabels,
} from './dashboard-day-summary-labels';
import {
  createDashboardDaySummaryViewModel,
  type DashboardDaySummaryFormattedMetrics,
  type DashboardDaySummaryMetric,
  type DashboardDaySummaryProps,
} from './dashboard-day-summary-model';

const titleId = 'dashboard-day-summary-title';

const metricVisuals = [
  {
    icon: Droplets,
    iconClass:
      'bg-teal-500 text-white shadow-[0_8px_18px_rgba(20,184,166,0.24)]',
    labelClass: 'text-teal-800/75 dark:text-teal-200/80',
    surfaceClass:
      'border-teal-100/70 bg-gradient-to-br from-teal-50/95 via-cyan-50/85 to-white/80 dark:border-teal-500/15 dark:from-teal-950/45 dark:via-cyan-950/25 dark:to-slate-900/55',
    valueClass: 'text-teal-800 dark:text-teal-100',
  },
  {
    icon: Syringe,
    iconClass:
      'bg-violet-500 text-white shadow-[0_8px_18px_rgba(139,92,246,0.24)]',
    labelClass: 'text-violet-800/75 dark:text-violet-200/80',
    surfaceClass:
      'border-violet-100/70 bg-gradient-to-br from-violet-50/95 via-fuchsia-50/70 to-white/80 dark:border-violet-500/15 dark:from-violet-950/45 dark:via-fuchsia-950/20 dark:to-slate-900/55',
    valueClass: 'text-violet-800 dark:text-violet-100',
  },
  {
    icon: Wheat,
    iconClass:
      'bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.24)]',
    labelClass: 'text-orange-800/75 dark:text-orange-200/80',
    surfaceClass:
      'border-orange-100/70 bg-gradient-to-br from-orange-50/95 via-amber-50/75 to-white/80 dark:border-orange-500/15 dark:from-orange-950/45 dark:via-amber-950/20 dark:to-slate-900/55',
    valueClass: 'text-orange-800 dark:text-orange-100',
  },
  {
    icon: PersonStanding,
    iconClass:
      'bg-blue-500 text-white shadow-[0_8px_18px_rgba(59,130,246,0.24)]',
    labelClass: 'text-blue-800/75 dark:text-blue-200/80',
    surfaceClass:
      'border-blue-100/70 bg-gradient-to-br from-sky-50/95 via-blue-50/75 to-white/80 dark:border-blue-500/15 dark:from-sky-950/45 dark:via-blue-950/20 dark:to-slate-900/55',
    valueClass: 'text-blue-800 dark:text-blue-100',
  },
] as const;

function MetricMiniChart({
  emptyHint,
  metric,
}: {
  readonly emptyHint: string;
  readonly metric: DashboardDaySummaryMetric;
}) {
  switch (metric.kind) {
    case 'glucose':
      return (
        <GlucoseMiniChart
          ariaLabel={metric.chartAriaLabel}
          emptyHint={emptyHint}
          values={metric.chartValues}
        />
      );
    case 'insulin':
      return (
        <InsulinMiniChart
          ariaLabel={metric.chartAriaLabel}
          emptyHint={emptyHint}
          values={metric.chartValues}
        />
      );
    case 'nutrition':
      return (
        <NutritionMiniChart
          ariaLabel={metric.chartAriaLabel}
          emptyHint={emptyHint}
          values={metric.chartValues}
        />
      );
    case 'activity':
      return (
        <ActivityMiniChart
          ariaLabel={metric.chartAriaLabel}
          emptyHint={emptyHint}
          values={metric.chartValues}
        />
      );
  }
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
  const activityMinutes = Math.floor(summary.summary.totalActivitySeconds / 60);

  return {
    glucose: summary.summary.latestTodayGlucoseDisplay ?? '—',
    totalActivity: formatter.formatDuration({ minutes: activityMinutes }),
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
            <div className="h-7 w-32 animate-pulse rounded bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="h-36 animate-pulse rounded-[1.35rem] bg-white/80 motion-reduce:animate-none dark:bg-slate-800"
                  key={index}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2
              className="text-[1.25rem] font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.35rem] dark:text-white"
              id={titleId}
            >
              {labels.title}
            </h2>
            <a
              className="focus-visible:outline-interactive-primary inline-flex min-h-9 items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300"
              href="/timeline"
            >
              <span>{labels.viewDetails}</span>
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
            {viewModel.metrics.map((metric, index) => {
              const visual = metricVisuals[index] ?? metricVisuals[3];
              const Icon = visual.icon;

              return (
                <div
                  className={`relative min-h-[9.25rem] overflow-hidden rounded-[1.25rem] border p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:min-h-[9.75rem] sm:rounded-[1.35rem] sm:p-3.5 ${visual.surfaceClass}`}
                  key={metric.label}
                >
                  <span
                    aria-hidden="true"
                    className={`relative z-10 grid size-11 place-items-center rounded-full sm:size-12 ${visual.iconClass}`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <dt
                    className={`relative z-10 mt-2 text-[0.8125rem] font-semibold sm:text-sm ${visual.labelClass}`}
                  >
                    {metric.label}
                  </dt>
                  <dd
                    className={`relative z-10 mt-0.5 text-[1.25rem] font-black tracking-tight tabular-nums sm:mt-1 sm:text-[1.35rem] ${visual.valueClass}`}
                  >
                    {metric.value}
                  </dd>
                  <MetricMiniChart
                    emptyHint={labels.chartEmptyHint}
                    metric={metric}
                  />
                  {metric.secondaryText ? (
                    <dd
                      className={`relative z-10 mt-1 text-xs font-medium ${visual.labelClass}`}
                    >
                      {metric.secondaryText}
                    </dd>
                  ) : null}
                </div>
              );
            })}
          </dl>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/90"
          role={isError ? 'alert' : 'status'}
        >
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
      ) : null}
    </section>
  );
}
