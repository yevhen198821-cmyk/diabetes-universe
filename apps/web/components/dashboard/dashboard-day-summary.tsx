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
    pillClass: 'bg-teal-100 text-teal-700',
    valueClass: 'text-teal-700 dark:text-teal-200',
  },
  {
    decoration: 'bars',
    icon: Syringe,
    iconClass: 'bg-violet-500 text-white',
    pillClass: 'bg-violet-100 text-violet-700',
    valueClass: 'text-violet-700 dark:text-violet-200',
  },
  {
    decoration: 'gradient',
    icon: Wheat,
    iconClass: 'bg-orange-500 text-white',
    pillClass: 'bg-orange-100 text-orange-700',
    valueClass: 'text-orange-700 dark:text-orange-200',
  },
  {
    decoration: 'arc',
    icon: PersonStanding,
    iconClass: 'bg-blue-500 text-white',
    pillClass: 'bg-blue-100 text-blue-700',
    valueClass: 'text-blue-700 dark:text-blue-200',
  },
] as const;

function MetricDecoration({ kind }: { readonly kind: string }) {
  if (kind === 'wave') {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-12 w-full opacity-70"
        preserveAspectRatio="none"
        viewBox="0 0 120 28"
      >
        <path
          d="M0 18 C18 10 36 24 54 16 C72 8 90 22 120 14 L120 28 L0 28 Z"
          fill="url(#todayWave)"
        />
        <defs>
          <linearGradient id="todayWave" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(45,212,191,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (kind === 'bars') {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-x-3 bottom-3 flex items-end justify-center gap-1 opacity-55"
      >
        {[10, 16, 12, 18].map((height, index) => (
          <span
            className="w-2 rounded-full bg-violet-400/55"
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
        className="absolute right-3 bottom-2 size-14 opacity-55"
        viewBox="0 0 48 48"
      >
        <circle
          cx="24"
          cy="24"
          fill="none"
          r="18"
          stroke="currentColor"
          strokeDasharray="72 120"
          strokeLinecap="round"
          strokeWidth="4"
          className="text-blue-400/50"
        />
      </svg>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-orange-300/30 to-transparent"
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
            <div className="h-7 w-32 animate-pulse rounded bg-white/80 motion-reduce:animate-none dark:bg-slate-800" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="h-40 min-w-[8.5rem] flex-1 animate-pulse rounded-[1.35rem] bg-white/80 motion-reduce:animate-none dark:bg-slate-800"
                  key={index}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              className="text-[1.35rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white"
              id={titleId}
            >
              {labels.title}
            </h2>
            <a
              className="focus-visible:outline-interactive-primary inline-flex min-h-10 items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300"
              href="/timeline"
            >
              <span>{labels.viewDetails}</span>
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>

          <div className="-mx-[max(1rem,env(safe-area-inset-left))] overflow-x-auto px-[max(1rem,env(safe-area-inset-left))] pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
            <dl className="grid min-w-[42rem] grid-cols-4 gap-3 sm:min-w-0 sm:grid-cols-2 lg:grid-cols-4">
              {viewModel.metrics.map((metric, index) => {
                const visual = metricVisuals[index] ?? metricVisuals[3];
                const Icon = visual.icon;

                return (
                  <div
                    className="relative min-h-[10.5rem] overflow-hidden rounded-[1.35rem] border border-white/90 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900"
                    key={metric.label}
                  >
                    <MetricDecoration kind={visual.decoration} />
                    <span
                      aria-hidden="true"
                      className={`relative z-10 grid size-11 place-items-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.12)] ${visual.iconClass}`}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </span>
                    <dt className="relative z-10 mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {metric.label}
                    </dt>
                    <dd
                      className={`relative z-10 mt-1 text-xl font-black tracking-tight tabular-nums sm:text-2xl ${visual.valueClass}`}
                    >
                      {metric.value}
                    </dd>
                    {metric.secondaryText ? (
                      <dd
                        className={`relative z-10 mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${visual.pillClass}`}
                      >
                        {metric.secondaryText}
                      </dd>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </div>
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
