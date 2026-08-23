'use client';

import { CalendarDays, CookingPot, Droplets, Pill, Syringe } from 'lucide-react';
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

const metricVisuals = [
  {
    icon: Droplets,
    shell: 'from-emerald-300/28 via-teal-200/18 to-cyan-200/28',
    iconClass: 'bg-emerald-500 text-white',
    accent: 'text-emerald-700 dark:text-emerald-200',
  },
  {
    icon: Syringe,
    shell: 'from-violet-300/28 via-fuchsia-200/18 to-purple-200/28',
    iconClass: 'bg-violet-500 text-white',
    accent: 'text-violet-700 dark:text-violet-200',
  },
  {
    icon: CookingPot,
    shell: 'from-amber-300/30 via-orange-200/18 to-rose-200/25',
    iconClass: 'bg-orange-500 text-white',
    accent: 'text-orange-700 dark:text-orange-200',
  },
  {
    icon: Pill,
    shell: 'from-sky-300/28 via-blue-200/18 to-indigo-200/25',
    iconClass: 'bg-sky-500 text-white',
    accent: 'text-sky-700 dark:text-sky-200',
  },
] as const;

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
  const readyMetrics = [
    ...viewModel.primaryMetrics,
    ...viewModel.secondaryMetrics,
  ];

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative col-span-full overflow-hidden rounded-[1.75rem] border bg-white/80 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:bg-slate-900/80 sm:p-5 lg:col-span-12 ${
        isError
          ? 'border-status-danger/40'
          : 'border-white/70 dark:border-white/10'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-14 size-44 rounded-full bg-gradient-to-br from-teal-200/35 via-violet-200/20 to-orange-200/25 blur-3xl dark:opacity-20"
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
            <div className="bg-surface-subtle h-6 w-44 animate-pulse rounded motion-reduce:animate-none" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="rounded-[1.4rem] bg-surface-subtle h-36 animate-pulse motion-reduce:animate-none"
                  key={index}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_22px_rgba(139,92,246,0.22)]">
                <CalendarDays aria-hidden="true" size={19} />
              </span>
              <div>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.08em]">
                  {labels.eyebrow}
                </p>
                <h2
                  className="text-text-primary text-xl font-extrabold tracking-tight"
                  id={titleId}
                >
                  {labels.title}
                </h2>
              </div>
            </div>
            <time
              className="text-text-secondary rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-semibold sm:text-sm"
              dateTime={viewModel.dayDate ?? undefined}
            >
              {viewModel.displayDayLabel}
            </time>
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {readyMetrics.map((metric, index) => {
              const visual = metricVisuals[index] ?? metricVisuals[3];
              const Icon = visual.icon;

              return (
                <div
                  className={`relative min-h-36 overflow-hidden rounded-[1.4rem] border border-white/70 bg-gradient-to-br p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 ${visual.shell}`}
                  key={metric.label}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-8 -right-8 size-24 rounded-full bg-white/35 blur-xl dark:bg-white/5"
                  />
                  <span
                    aria-hidden="true"
                    className={`grid size-10 place-items-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.14)] ${visual.iconClass}`}
                  >
                    <Icon size={19} strokeWidth={2.2} />
                  </span>
                  <dt className="text-text-secondary mt-3 text-xs font-semibold sm:text-sm">
                    {metric.label}
                  </dt>
                  <dd
                    className={`mt-1 text-2xl font-black tracking-tight tabular-nums sm:text-3xl ${visual.accent}`}
                  >
                    {metric.value}
                  </dd>
                </div>
              );
            })}
          </dl>
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
                : 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
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
