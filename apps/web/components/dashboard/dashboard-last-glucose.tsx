'use client';

import { Clock, ClockAlert, Droplets } from 'lucide-react';
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

function HeroScenery() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute bottom-0 -left-10 h-32 w-[120%] rounded-[50%] bg-gradient-to-r from-teal-300/35 via-cyan-200/25 to-blue-400/30 blur-[1px]" />
        <div className="absolute bottom-8 left-[8%] h-16 w-24 rotate-[-8deg] rounded-full bg-emerald-300/25 blur-sm" />
        <div className="absolute bottom-10 left-[28%] h-24 w-32 rotate-[6deg] rounded-full bg-teal-400/20 blur-sm" />
        <div className="absolute right-[18%] bottom-6 h-20 w-28 rotate-[-4deg] rounded-full bg-cyan-300/25 blur-sm" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-8 -right-6 grid size-[clamp(7.5rem,28vw,11rem)] place-items-center"
      >
        <span className="absolute size-full rounded-full bg-white/15 blur-md" />
        <span className="absolute size-[88%] rounded-full border border-white/25 bg-white/10" />
        <span className="relative grid size-[72%] place-items-center rounded-full bg-gradient-to-br from-white/90 via-cyan-50 to-teal-100 shadow-[0_18px_50px_rgba(8,145,178,0.28)]">
          <Droplets
            aria-hidden="true"
            className="text-cyan-500 drop-shadow-sm"
            size={56}
            strokeWidth={2.1}
          />
        </span>
      </div>
    </>
  );
}

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
      className={`relative min-h-[17.5rem] overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(14,116,144,0.18)] sm:min-h-[19rem] sm:p-7 lg:min-h-[20.5rem] ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : hasColorHero
            ? 'border-white/50 bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-600 text-white dark:border-white/10'
            : 'border-border-default bg-surface'
      }`}
    >
      {hasColorHero ? <HeroScenery /> : null}

      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="relative z-10 space-y-5">
            <div className="h-5 w-40 animate-pulse rounded bg-white/35 motion-reduce:animate-none" />
            <div className="h-16 w-52 animate-pulse rounded-2xl bg-white/35 motion-reduce:animate-none" />
            <div className="h-10 w-64 max-w-full animate-pulse rounded-full bg-white/25 motion-reduce:animate-none" />
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && measurement ? (
        <div className="relative z-10 flex h-full max-w-[62%] flex-col justify-between sm:max-w-[58%] lg:max-w-[52%]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold tracking-[0.08em] text-white/90 uppercase sm:text-base">
              <span className="grid size-8 place-items-center rounded-full bg-white/20">
                <Droplets aria-hidden="true" size={16} />
              </span>
              <h2 id={titleId}>{labels.title}</h2>
            </div>
            <p className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1 text-white drop-shadow-sm">
              <span className="text-[clamp(3.2rem,12vw,6.3rem)] leading-[0.86] font-black tracking-[-0.06em] tabular-nums">
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
                : 'bg-gradient-to-br from-cyan-400/25 via-teal-300/20 to-blue-300/25 text-teal-700 dark:text-teal-200'
            }`}
          >
            <Droplets size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-text-primary text-xl font-extrabold"
              id={titleId}
            >
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
