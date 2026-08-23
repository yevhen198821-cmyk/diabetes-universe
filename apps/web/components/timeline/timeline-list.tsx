import { EventCard } from '@diabetes-universe/ui';

import type { TimelineListModel } from './timeline-list-model';
import type { TimelineUiLabels } from './timeline-ui-labels';
import { mapTimelineEventToCard } from './timeline-event-card.mapper';
import type { TimelinePresentationDependencies } from '../../lib/timeline/presentation';

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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="sr-only" id="timeline-loading-title">
        {labels.loading.title}
      </h2>
      <span className="sr-only" role="status">
        {labels.loading.status}
      </span>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
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
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
    >
      <h2
        className="text-lg font-bold text-slate-950"
        id="timeline-empty-title"
      >
        {labels.empty.title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
        {labels.empty.description}
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={onAddEvent}
        type="button"
      >
        {labels.empty.action}
      </button>
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
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
    >
      <h2
        className="text-lg font-bold text-slate-950"
        id="timeline-filtered-empty-title"
      >
        {labels.filteredEmpty.title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
        {labels.filteredEmpty.description}
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={onResetCriteria}
        type="button"
      >
        {labels.filteredEmpty.reset}
      </button>
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
      className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
      role="alert"
    >
      <h2
        className="text-lg font-bold text-slate-950"
        id="timeline-error-title"
      >
        {labels.error.title}
      </h2>
      <p className="mt-2 text-sm text-rose-700">
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
      {model.groups.map((group) => {
        const groupTitleId = `${group.key}-title`;

        return (
          <section
            aria-labelledby={groupTitleId}
            className="min-w-0"
            key={group.key}
          >
            <div className="mb-4 flex items-center gap-3">
              <h2
                className="shrink-0 text-sm font-semibold text-slate-600"
                id={groupTitleId}
              >
                {group.label}
              </h2>
              <div aria-hidden="true" className="h-px flex-1 bg-slate-200" />
            </div>

            <ul className="space-y-2.5">
              {group.events.map((event, index) => {
                const eventCardProps = mapTimelineEventToCard(
                  event,
                  presentationDependencies,
                );

                return (
                  <li className="relative pl-10 sm:pl-12" key={event.id}>
                    <div
                      aria-hidden="true"
                      className={`absolute top-0 left-[15px] w-0.5 bg-slate-300 sm:left-[17px] ${
                        index === group.events.length - 1 ? 'h-7' : 'bottom-0'
                      }`}
                    />
                    <EventCard
                      {...eventCardProps}
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
      })}
    </div>
  );
}
