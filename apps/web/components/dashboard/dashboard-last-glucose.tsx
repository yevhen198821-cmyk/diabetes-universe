'use client';

import { ClockAlert, Droplets } from 'lucide-react';
import { useMemo } from 'react';

import { resolveDashboardMedicalEventSourceLabel } from '../../lib/dashboard/dashboard-event-source-labels';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { formatTimelineGlucoseDisplayValue } from '../../lib/timeline/presentation';
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

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`bg-surface h-full rounded-2xl border p-5 shadow-sm sm:col-span-1 lg:col-span-7 ${
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
          <div aria-hidden="true" className="flex items-center gap-4">
            <div className="rounded-control bg-surface-subtle size-11 shrink-0 animate-pulse motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-surface-subtle h-4 w-28 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-surface-subtle h-5 w-36 max-w-full animate-pulse rounded motion-reduce:animate-none" />
            </div>
            <div className="w-24 shrink-0 space-y-2">
              <div className="bg-surface-subtle ml-auto h-6 w-24 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-surface-subtle ml-auto h-4 w-12 animate-pulse rounded motion-reduce:animate-none" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"
          >
            <Droplets size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-text-secondary text-sm">{labels.eyebrow}</p>
            <h2
              className="text-text-primary mt-0.5 text-lg font-bold"
              id={titleId}
            >
              {labels.title}
            </h2>
            {viewModel.sourceLabel ? (
              <p className="text-text-secondary mt-1 text-xs">
                {viewModel.sourceLabel}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-text-primary text-xl font-bold">
              {viewModel.value}
            </p>
            <time
              className="text-text-secondary mt-0.5 block text-sm tabular-nums"
              dateTime={viewModel.dateTime ?? undefined}
            >
              {viewModel.displayTime}
            </time>
            {viewModel.isStale && viewModel.staleMessage ? (
              <p
                className="mt-1 inline-flex items-center gap-1 text-xs text-amber-800"
                role="status"
              >
                <ClockAlert
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  size={14}
                />
                <span>{viewModel.staleMessage}</span>
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
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-sky-500/10 text-sky-600'
            }`}
          >
            <Droplets size={20} />
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
