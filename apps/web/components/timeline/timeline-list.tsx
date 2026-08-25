import { Button, EventCard, Skeleton } from '@diabetes-universe/ui';

import type { TimelineListModel } from './timeline-list-model';
import type { TimelineUiLabels } from './timeline-ui-labels';
import { mapTimelineEventToCard } from './timeline-event-card.mapper';
import type { TimelinePresentationDependencies } from '../../lib/timeline/presentation';
import { frostedPanelClassName } from '../shared/app-page-background';

const frostedStatePanelClassName = `${frostedPanelClassName} p-6 text-center`;

interface TimelineListProps {
  readonly labels: TimelineUiLabels;
  readonly model: TimelineListModel;
  readonly onAddEvent: () => void;
  readonly onOpenEvent: (eventId: string, trigger: HTMLElement) => void;
  readonly onResetCriteria: () => void;
  readonly presentationDependencies: TimelinePresentationDependencies;
}

function TimelineLoadingState({ labels }: Pick<TimelineListProps, 'labels'>) {
  return (
    <section
      aria-busy="true"
      aria-labelledby="timeline-loading-title"
      className={`${frostedPanelClassName} p-5`}
    >
      <h2 className="sr-only" id="timeline-loading-title">
        {labels.loading.title}
      </h2>
      <span className="sr-only" role="status">
        {labels.loading.status}
      </span>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-3">
          <Skeleton className="h-16" rounded="control" />
          <Skeleton className="h-16" rounded="control" />
          <Skeleton className="h-16" rounded="control" />
        </div>
      </div>
    </section>
  );
}

function TimelineEmptyState({
  labels,
  onAddEvent,
}: Pick<TimelineListProps, 'labels' | 'onAddEvent'>) {
  return (
    <section
      aria-labelledby="timeline-empty-title"
      className={frostedStatePanelClassName}
    >
      <h2
        className="text-lg font-extrabold text-[#1e3a5f] dark:text-white"
        id="timeline-empty-title"
      >
        {labels.empty.title}
      </h2>
      <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
        {labels.empty.description}
      </p>
      <Button className="mt-5" onClick={onAddEvent} type="button">
        {labels.empty.action}
      </Button>
    </section>
  );
}

function TimelineFilteredEmptyState({
  labels,
  onResetCriteria,
}: Pick<TimelineListProps, 'labels' | 'onResetCriteria'>) {
  return (
    <section
      aria-labelledby="timeline-filtered-empty-title"
      className={frostedStatePanelClassName}
    >
      <h2
        className="text-lg font-extrabold text-[#1e3a5f] dark:text-white"
        id="timeline-filtered-empty-title"
      >
        {labels.filteredEmpty.title}
      </h2>
      <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
        {labels.filteredEmpty.description}
      </p>
      <Button
        className="mt-5"
        onClick={onResetCriteria}
        type="button"
        variant="secondary"
      >
        {labels.filteredEmpty.reset}
      </Button>
    </section>
  );
}

function TimelineDayEmptyState({ labels }: Pick<TimelineListProps, 'labels'>) {
  return (
    <section
      aria-labelledby="timeline-day-empty-title"
      className={frostedStatePanelClassName}
    >
      <h2
        className="text-lg font-extrabold text-[#1e3a5f] dark:text-white"
        id="timeline-day-empty-title"
      >
        {labels.dayEmpty.title}
      </h2>
      <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
        {labels.dayEmpty.description}
      </p>
    </section>
  );
}

function TimelinePeriodEmptyState({
  labels,
}: Pick<TimelineListProps, 'labels'>) {
  return (
    <section
      aria-labelledby="timeline-period-empty-title"
      className={frostedStatePanelClassName}
    >
      <h2
        className="text-lg font-extrabold text-[#1e3a5f] dark:text-white"
        id="timeline-period-empty-title"
      >
        {labels.periodEmpty.title}
      </h2>
      <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
        {labels.periodEmpty.description}
      </p>
    </section>
  );
}

function TimelineErrorState({
  errorMessage,
  labels,
}: {
  readonly errorMessage: string | undefined;
  readonly labels: TimelineUiLabels;
}) {
  return (
    <section
      aria-labelledby="timeline-error-title"
      className={`${frostedPanelClassName} border-status-danger/30 p-6`}
      role="alert"
    >
      <h2
        className="text-lg font-extrabold text-[#1e3a5f] dark:text-white"
        id="timeline-error-title"
      >
        {labels.error.title}
      </h2>
      <p className="text-status-danger mt-2 text-sm">
        {errorMessage ?? labels.error.default}
      </p>
    </section>
  );
}

export function TimelineList({
  labels,
  model,
  onAddEvent,
  onOpenEvent,
  onResetCriteria,
  presentationDependencies,
}: TimelineListProps) {
  if (model.status === 'loading') {
    return <TimelineLoadingState labels={labels} />;
  }

  if (model.status === 'empty') {
    return <TimelineEmptyState labels={labels} onAddEvent={onAddEvent} />;
  }

  if (model.status === 'period-empty') {
    return <TimelinePeriodEmptyState labels={labels} />;
  }

  if (model.status === 'day-empty') {
    return <TimelineDayEmptyState labels={labels} />;
  }

  if (model.status === 'filtered-empty') {
    return (
      <TimelineFilteredEmptyState
        labels={labels}
        onResetCriteria={onResetCriteria}
      />
    );
  }

  if (model.status === 'error') {
    return (
      <TimelineErrorState errorMessage={model.errorMessage} labels={labels} />
    );
  }

  return (
    <div
      aria-label={labels.list.ariaLabel}
      className="min-w-0 space-y-8"
      id="timeline-events-list"
    >
      {model.periodGroups.length > 0
        ? model.periodGroups.map((group) => {
            const groupTitleId = `timeline-period-${group.key}-title`;

            return (
              <section
                aria-labelledby={groupTitleId}
                className="min-w-0"
                key={group.key}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="min-w-0 shrink-0">
                    <h2
                      className="text-sm font-extrabold tracking-wide text-[#1e3a5f]/75 uppercase dark:text-slate-300"
                      id={groupTitleId}
                    >
                      {group.label}
                    </h2>
                    <p className="text-text-secondary mt-0.5 text-xs tabular-nums">
                      {group.timeRangeLabel}
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-px flex-1 bg-gradient-to-r from-teal-300/60 via-violet-300/40 to-transparent"
                  />
                  <p className="text-text-secondary shrink-0 text-xs font-semibold">
                    {group.eventCountLabel}
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {group.events.map((event, index) => {
                    const eventCardProps = mapTimelineEventToCard(
                      event,
                      presentationDependencies,
                    );

                    return (
                      <li
                        className="relative pl-10 sm:pl-12"
                        data-timeline-event-id={event.id}
                        key={event.id}
                      >
                        <div
                          aria-hidden="true"
                          className={`absolute top-0 left-[15px] w-0.5 bg-gradient-to-b from-teal-300/70 via-violet-300/45 to-orange-300/35 sm:left-[17px] ${
                            index === group.events.length - 1
                              ? 'h-7'
                              : 'bottom-0'
                          }`}
                        />
                        <EventCard
                          {...eventCardProps}
                          appearance="vibrant"
                          ariaLabel={`${presentationDependencies.labels.openEventAriaPrefix}: ${[
                            eventCardProps.title,
                            [eventCardProps.value, eventCardProps.unit]
                              .filter(Boolean)
                              .join(' '),
                            eventCardProps.time,
                          ]
                            .filter(Boolean)
                            .join(', ')}`}
                          onClick={(clickEvent) => {
                            onOpenEvent(event.id, clickEvent.currentTarget);
                          }}
                          variant="compact"
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        : null}
    </div>
  );
}
