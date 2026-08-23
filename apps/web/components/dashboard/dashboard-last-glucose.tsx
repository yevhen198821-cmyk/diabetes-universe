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
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300/55 via-cyan-400/35 to-teal-500/75" />
        <svg
          className="absolute inset-x-0 bottom-0 h-[58%] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 400 220"
        >
          <path
            d="M0 150 C60 110 120 170 190 130 C250 95 320 150 400 115 L400 220 L0 220 Z"
            fill="rgba(16,185,129,0.35)"
          />
          <path
            d="M0 175 C70 145 150 195 230 160 C300 130 350 180 400 165 L400 220 L0 220 Z"
            fill="rgba(34,197,94,0.42)"
          />
          <path
            d="M0 190 C90 170 170 205 260 185 C320 172 360 198 400 188 L400 220 L0 220 Z"
            fill="rgba(74,222,128,0.38)"
          />
          <path
            d="M250 120 C290 95 330 110 400 88 L400 170 C360 178 310 160 250 175 Z"
            fill="rgba(56,189,248,0.28)"
          />
        </svg>
        <div className="absolute top-[18%] right-[16%] size-16 rounded-full bg-white/25 blur-xl" />
        <div className="absolute top-[12%] left-[20%] size-24 rounded-full bg-white/20 blur-2xl" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-6 -right-2 grid size-[clamp(8rem,31vw,12rem)] place-items-center sm:top-8 sm:right-2"
      >
        <span className="absolute size-full animate-pulse rounded-full bg-cyan-200/25 motion-reduce:animate-none" />
        <span className="absolute size-[92%] rounded-full border border-white/30 bg-white/10" />
        <span className="absolute size-[78%] rounded-full border border-white/20 bg-white/5" />
        <span className="relative grid size-[62%] place-items-center rounded-full bg-gradient-to-br from-white via-cyan-50 to-teal-100 shadow-[0_20px_55px_rgba(8,145,178,0.35)]">
          <Droplets
            aria-hidden="true"
            className="text-cyan-500 drop-shadow-[0_4px_12px_rgba(6,182,212,0.45)]"
            size={58}
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
  const statusMessage =
    viewModel.staleMessage ?? viewModel.freshMessage ?? null;

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative min-h-[18.5rem] overflow-hidden rounded-[2rem] border p-5 shadow-[0_28px_80px_rgba(14,116,144,0.22)] sm:min-h-[20rem] sm:p-7 lg:min-h-[21rem] ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : hasColorHero
            ? 'border-white/40 bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-500 text-white dark:border-white/10'
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
        <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-between sm:max-w-[54%] lg:max-w-[48%]">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white sm:text-base">
              <span className="grid size-9 place-items-center rounded-full bg-white text-teal-500 shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
                <Droplets aria-hidden="true" size={18} strokeWidth={2.3} />
              </span>
              <h2 id={titleId}>{labels.title}</h2>
            </div>
            <p className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1 text-white drop-shadow-sm">
              <span className="text-[clamp(3.4rem,13vw,6.5rem)] leading-[0.84] font-black tracking-[-0.06em] tabular-nums">
                {measurement.value}
              </span>
              <span className="pb-1 text-xl font-bold sm:pb-2 sm:text-2xl">
                {measurement.unit}
              </span>
            </p>
          </div>

          <div className="mt-6 space-y-2 text-sm font-medium text-white/95 sm:text-base">
            <p className="flex flex-wrap items-center gap-2">
              <time
                className="inline-flex items-center gap-2"
                dateTime={viewModel.dateTime ?? undefined}
              >
                <Clock aria-hidden="true" size={16} />
                {viewModel.displayTime}
              </time>
              {statusMessage ? (
                <>
                  <span aria-hidden="true" className="text-white/70">
                    •
                  </span>
                  <span
                    className={
                      viewModel.isStale
                        ? 'inline-flex items-center gap-1.5'
                        : undefined
                    }
                    role={viewModel.isStale ? 'status' : undefined}
                  >
                    {viewModel.isStale ? (
                      <ClockAlert aria-hidden="true" size={16} />
                    ) : null}
                    {statusMessage}
                  </span>
                </>
              ) : null}
            </p>
            {viewModel.sourceLabel ? (
              <p className="text-xs text-white/80 sm:text-sm">
                {viewModel.sourceLabel}
              </p>
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
