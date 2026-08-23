'use client';

import {
  ArrowRight,
  CalendarDays,
  Droplets,
  PersonStanding,
  Syringe,
  Utensils,
} from 'lucide-react';
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
    decoration: 'wave',
    icon: Droplets,
    iconClass: 'bg-teal-500 text-white',
    shell:
      'from-teal-100/90 via-cyan-50/80 to-emerald-50/70 dark:from-teal-950/50 dark:via-cyan-950/30 dark:to-emerald-950/20',
    valueClass: 'text-teal-700 dark:text-teal-200',
  },
  {
    decoration: 'bars',
    icon: Syringe,
    iconClass: 'bg-violet-500 text-white',
    shell:
      'from-violet-100/90 via-fuchsia-50/80 to-purple-50/70 dark:from-violet-950/50 dark:via-fuchsia-950/30 dark:to-purple-950/20',
    valueClass: 'text-violet-700 dark:text-violet-200',
  },
  {
    decoration: 'gradient',
    icon: Utensils,
    iconClass: 'bg-orange-500 text-white',
    shell:
      'from-orange-100/90 via-amber-50/80 to-rose-50/70 dark:from-orange-950/50 dark:via-amber-950/30 dark:to-rose-950/20',
    valueClass: 'text-orange-700 dark:text-orange-200',
  },
  {
    decoration: 'arc',
    icon: PersonStanding,
    iconClass: 'bg-blue-500 text-white',
    shell:
      'from-sky-100/90 via-blue-50/80 to-indigo-50/70 dark:from-sky-950/50 dark:via-blue-950/30 dark:to-indigo-950/20',
    valueClass: 'text-blue-700 dark:text-blue-200',
  },
] as const;

function MetricDecoration({ kind }: { readonly kind: string }) {
  if (kind === 'wave') {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-10 w-full opacity-60"
        preserveAspectRatio="none"
        viewBox="0 0 120 24"
      >
        <path
          d="M0 16 C20 8 40 22 60 14 C80 6 100 20 120 12 L120 24 L0 24 Z"
          fill="currentColor"
          className="text-teal-400/35"
        />
      </svg>
    );
  }

  if (kind === 'bars') {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-x-3 bottom-3 flex items-end justify-center gap-1 opacity-50"
      >
        {[8, 14, 10, 16].map((height, index) => (
          <span
            className="w-2 rounded-full bg-violet-400/50"
            key={index}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  if (kind === 'arc') {
    return (
      <svg
        aria-hidden="true"
        className="absolute right-3 bottom-2 size-12 opacity-50"
        viewBox="0 0 48 48"
      >
        <circle
          cx="24"
          cy="24"
          fill="none"
          r="18"
          stroke="currentColor"
          strokeDasharray="80 120"
          strokeLinecap="round"
          strokeWidth="4"
          className="text-blue-400/45"
        />
      </svg>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-orange-300/25 to-transparent"
    />
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
  const activityMinutes = Math.floor(summary.summary.totalActivitySeconds / 60);

  return {
    glucose: summary.summary.latestGlucoseDisplay ?? '—',
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
      className={`relative col-span-full overflow-hidden rounded-[1.75rem] border bg-white/80 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-5 dark:bg-slate-900/80 ${
        isError
          ? 'border-status-danger/40'
          : 'border-white/70 dark:border-white/10'
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
          <div aria-hidden="true" className="relative space-y-4">
            <div className="bg-surface-subtle h-6 w-44 animate-pulse rounded motion-reduce:animate-none" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="bg-surface-subtle h-36 animate-pulse rounded-[1.25rem] motion-reduce:animate-none"
                  key={index}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_22px_rgba(139,92,246,0.22)]">
                <CalendarDays aria-hidden="true" size={19} />
              </span>
              <h2
                className="text-text-primary text-xl font-extrabold tracking-tight"
                id={titleId}
              >
                {labels.title}
              </h2>
            </div>
            <a
              className="focus-visible:outline-interactive-primary inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-bold text-violet-600 transition hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-violet-300"
              href="/timeline"
            >
              <span>{labels.viewDetails}</span>
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {viewModel.metrics.map((metric, index) => {
              const visual = metricVisuals[index] ?? metricVisuals[3];
              const Icon = visual.icon;

              return (
                <div
                  className={`relative min-h-[8.75rem] overflow-hidden rounded-[1.25rem] border border-white/70 bg-gradient-to-br p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 ${visual.shell}`}
                  key={metric.label}
                >
                  <MetricDecoration kind={visual.decoration} />
                  <span
                    aria-hidden="true"
                    className={`relative z-10 grid size-10 place-items-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.14)] ${visual.iconClass}`}
                  >
                    <Icon size={19} strokeWidth={2.2} />
                  </span>
                  <dt className="text-text-secondary relative z-10 mt-3 text-xs font-semibold sm:text-sm">
                    {metric.label}
                  </dt>
                  <dd
                    className={`relative z-10 mt-1 text-xl font-black tracking-tight tabular-nums sm:text-2xl ${visual.valueClass}`}
                  >
                    {metric.value}
                  </dd>
                  {metric.secondaryText ? (
                    <dd className="text-text-secondary relative z-10 mt-1 text-[11px] font-medium sm:text-xs">
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
