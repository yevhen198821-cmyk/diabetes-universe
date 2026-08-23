'use client';

import { Clock, ClockAlert, Droplets, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import { resolveDashboardMedicalEventSourceLabel } from '../../lib/dashboard/dashboard-event-source-labels';
import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  formatTimelineGlucoseDisplayValue,
  mapTimelineEventCardPresentation,
} from '../../lib/timeline/presentation';
import { useTimelinePresentationDependencies } from '../../lib/timeline/react/use-timeline-presentation-dependencies';
import { resolveDashboardLastGlucoseLabels } from './dashboard-last-glucose-labels';
import {
  createDashboardLastGlucoseViewModel,
  type DashboardLastGlucoseProps,
} from './dashboard-last-glucose-model';

const titleId = 'dashboard-last-glucose-title';

export function DashboardLastGlucose(props: DashboardLastGlucoseProps) {
  const localization = useLocalization();
  const presentationDependencies = useTimelinePresentationDependencies();
  const labels = useMemo(
    () => resolveDashboardLastGlucoseLabels(localization),
    [localization],
  );
  const formattedValue = useMemo(() => {
    if (props.state !== 'ready') {
      return undefined;
    }

    return formatTimelineGlucoseDisplayValue(
      props.glucose.event,
      presentationDependencies,
    );
  }, [presentationDependencies, props]);
  const measurement = useMemo(() => {
    if (props.state !== 'ready') {
      return null;
    }

    return mapTimelineEventCardPresentation(
      props.glucose.event,
      presentationDependencies,
      props.glucose.displayTime,
    );
  }, [presentationDependencies, props]);
  const sourceLabel = useMemo(() => {
    if (props.state !== 'ready') {
      return null;
    }

    return resolveDashboardMedicalEventSourceLabel(
      localization,
      props.glucose.event.source,
    );
  }, [localization, props]);
  const viewModel = useMemo(
    () =>
      createDashboardLastGlucoseViewModel(props, labels, {
        formattedValue,
        sourceLabel,
      }),
    [formattedValue, labels, props, sourceLabel],
  );
  const isError = viewModel.state === 'error';
  const hasColorHero =
    viewModel.state === 'ready' || viewModel.state === 'loading';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative min-h-[15.5rem] overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(14,116,144,0.16)] sm:col-span-2 sm:min-h-[17rem] sm:p-7 lg:col-span-12 lg:min-h-[18rem] ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : hasColorHero
            ? 'border-white/60 bg-gradient-to-br from-[#ff6654] via-[#ff9a54] to-[#16bfb4] text-white dark:border-white/10'
            : 'border-border-default bg-surface'
      }`}
    >
      {hasColorHero ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full border border-white/25 bg-white/10 shadow-[inset_0_0_60px_rgba(255,255,255,0.15)] sm:size-80"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-7 top-10 grid size-32 place-items-center rounded-full border border-white/30 bg-white/20 shadow-[0_18px_50px_rgba(90,45,18,0.16)] backdrop-blur-sm sm:right-16 sm:size-40"
          >
            <span className="grid size-20 place-items-center rounded-full bg-white/90 text-[#ff5b4f] shadow-[0_12px_30px_rgba(83,48,28,0.18)] sm:size-24">
              <Droplets aria-hidden="true" size={42} strokeWidth={2.2} />
            </span>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-[35%] h-44 w-[75%] -rotate-3 rounded-[50%] bg-gradient-to-r from-rose-500/30 via-violet-500/20 to-teal-500/40 blur-sm"
          />
          <Sparkles
            aria-hidden="true"
            className="absolute right-5 top-5 hidden text-white/75 sm:block"
            size={22}
          />
        </>
      ) : null}

      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="relative z-10 space-y-5">
            <div className="h-5 w-36 animate-pulse rounded bg-white/35 motion-reduce:animate-none" />
            <div className="h-16 w-52 animate-pulse rounded-2xl bg-white/35 motion-reduce:animate-none" />
            <div className="h-10 w-64 max-w-full animate-pulse rounded-full bg-white/25 motion-reduce:animate-none" />
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && measurement ? (
        <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-between sm:max-w-[62%] lg:max-w-[56%]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/90 sm:text-base">
              <Droplets aria-hidden="true" size={18} />
              <h2 id={titleId}>{labels.title}</h2>
            </div>
            <p className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1 text-white drop-shadow-sm">
              <span className="text-[clamp(3.2rem,12vw,6.3rem)] font-black leading-[0.86] tracking-[-0.06em] tabular-nums">
                {measurement.value}
              </span>
              <span className="pb-1 text-lg font-bold sm:pb-2 sm:text-2xl">
                {measurement.unit}
              </span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-sm font-semibold text-white/95 sm:text-base">
            <time
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/25 bg-white/[0.12] px-3 py-1.5 backdrop-blur-sm"
              dateTime={viewModel.dateTime ?? undefined}
            >
              <Clock aria-hidden="true" size={17} />
              {viewModel.displayTime}
            </time>
            {viewModel.sourceLabel ? (
              <span className="inline-flex min-h-9 items-center rounded-full border border-white/25 bg-white/[0.12] px-3 py-1.5 backdrop-blur-sm">
                {viewModel.sourceLabel}
              </span>
            ) : null}
            {viewModel.isStale && viewModel.staleMessage ? (
              <span
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/30 bg-slate-950/20 px-3 py-1.5 backdrop-blur-sm"
                role="status"
              >
                <ClockAlert aria-hidden="true" size={17} />
                {viewModel.staleMessage}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="relative z-10 flex items-start gap-4"
          role={isError ? 'alert' : 'status'}
        >
          <div
            aria-hidden="true"
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              isError
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-gradient-to-br from-rose-400/25 via-orange-300/20 to-teal-300/25 text-teal-700 dark:text-teal-200'
            }`}
          >
            <Droplets size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary text-xl font-extrabold" id={titleId}>
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
