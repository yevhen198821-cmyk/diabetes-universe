'use client';

import { Clock, ClockAlert, Droplets } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@diabetes-universe/ui';

import { resolveDashboardMedicalEventSourceLabel } from '../../lib/dashboard/dashboard-event-source-labels';
import { presentGlucoseFromTimelineEvent } from '../../lib/medical/glucose';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { DashboardHeroScenery } from './dashboard-hero-scenery';
import { resolveDashboardLastGlucoseLabels } from './dashboard-last-glucose-labels';
import {
  createDashboardLastGlucoseViewModel,
  type DashboardLastGlucoseProps,
} from './dashboard-last-glucose-model';

const titleId = 'dashboard-last-glucose-title';

export function DashboardLastGlucose(props: DashboardLastGlucoseProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardLastGlucoseLabels(localization),
    [localization],
  );
  const glucosePresentationResult = useMemo(() => {
    if (props.state !== 'ready') {
      return null;
    }

    const referenceTime = props.referenceTime ?? new Date();

    return presentGlucoseFromTimelineEvent({
      event: props.glucose.event,
      formatter: props.glucosePresentation.formatter,
      glucoseDisplayUnit: props.glucosePresentation.glucoseDisplayUnit,
      glucoseKindLabel: labels.title,
      localization: props.glucosePresentation.localization,
      referenceTime,
      targetRange: props.glucosePresentation.targetRange,
    });
  }, [labels.title, props]);
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
        formattedValue: glucosePresentationResult?.formattedMeasurement,
        freshnessState: glucosePresentationResult?.model.freshnessState,
        rangeLabel: glucosePresentationResult?.rangeLabel ?? null,
        sourceLabel,
      }),
    [glucosePresentationResult, labels, props, sourceLabel],
  );
  const isError = viewModel.state === 'error';
  const hasColorHero =
    viewModel.state === 'ready' || viewModel.state === 'loading';
  const statusMessage =
    viewModel.staleMessage ?? viewModel.freshMessage ?? null;
  const accessibilityLabel = useMemo(() => {
    if (viewModel.state !== 'ready' || !glucosePresentationResult) {
      return undefined;
    }

    return [
      glucosePresentationResult.formattedMeasurement,
      viewModel.rangeLabel,
      viewModel.displayTime,
      statusMessage,
      viewModel.sourceLabel,
    ]
      .filter((part) => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }, [glucosePresentationResult, statusMessage, viewModel]);

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative min-h-[14rem] overflow-hidden rounded-[1.75rem] border p-3.5 shadow-[0_24px_70px_rgba(14,116,144,0.2)] sm:min-h-[15.5rem] sm:p-5 lg:min-h-[19rem] lg:p-6 ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : hasColorHero
            ? 'border-white/35 bg-gradient-to-br from-sky-300/90 via-cyan-400/85 to-teal-500/90 text-white dark:border-white/10'
            : 'border-border-default bg-surface'
      }`}
    >
      {hasColorHero ? <DashboardHeroScenery /> : null}

      {viewModel.state === 'loading' ? (
        <>
          <h2 className="sr-only" id={titleId}>
            {labels.title}
          </h2>
          <span className="sr-only" role="status">
            {viewModel.message}
          </span>
          <div aria-hidden="true" className="relative z-10 space-y-4">
            <div className="h-5 w-40 animate-pulse rounded bg-white/35 motion-reduce:animate-none" />
            <div className="h-14 w-48 animate-pulse rounded-2xl bg-white/35 motion-reduce:animate-none" />
            <div className="h-9 w-56 max-w-full animate-pulse rounded-full bg-white/25 motion-reduce:animate-none" />
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' && glucosePresentationResult ? (
        <div className="relative z-10 flex h-full max-w-[62%] flex-col justify-between sm:max-w-[56%] lg:max-w-[50%]">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white/95 sm:text-base">
              <span className="grid size-9 place-items-center rounded-full bg-white text-teal-500 shadow-[0_8px_20px_rgba(15,23,42,0.14)]">
                <Droplets aria-hidden="true" size={18} strokeWidth={2.3} />
              </span>
              <h2 id={titleId}>{labels.title}</h2>
            </div>
            <p
              aria-label={accessibilityLabel}
              className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1 text-white drop-shadow-sm sm:mt-4"
            >
              <span className="text-[clamp(2.65rem,11vw,5.75rem)] leading-[0.86] font-black tracking-[-0.06em] tabular-nums">
                {glucosePresentationResult.formattedValue}
              </span>
              <span className="pb-1 text-lg font-bold sm:pb-1.5 sm:text-xl">
                {glucosePresentationResult.model.displayUnitSymbol}
              </span>
            </p>
            {viewModel.rangeLabel ? (
              <p className="mt-2 text-sm font-medium text-white/90">
                {viewModel.rangeLabel}
              </p>
            ) : null}
          </div>

          <div className="mt-4 space-y-1.5 text-sm font-medium text-white/95 sm:text-[0.925rem]">
            <p className="flex flex-wrap items-center gap-2">
              <time
                className="inline-flex items-center gap-1.5"
                dateTime={viewModel.dateTime ?? undefined}
              >
                <Clock aria-hidden="true" size={15} />
                {viewModel.displayTime}
              </time>
              {statusMessage ? (
                <>
                  <span aria-hidden="true" className="text-white/65">
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
                      <ClockAlert aria-hidden="true" size={15} />
                    ) : null}
                    {statusMessage}
                  </span>
                </>
              ) : null}
            </p>
            {viewModel.sourceLabel ? (
              <p className="text-xs text-white/75">{viewModel.sourceLabel}</p>
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
            {viewModel.state === 'empty' && viewModel.showEmptyCta ? (
              <Button
                className="mt-4"
                onClick={() => {
                  if (props.state === 'empty') {
                    props.onAddGlucose();
                  }
                }}
                size="md"
                variant="primary"
              >
                {viewModel.emptyCtaLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
