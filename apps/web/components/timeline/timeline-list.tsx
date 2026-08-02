import { EventCard } from '@diabetes-universe/ui';

import type { TimelineListModel } from './timeline-list-model';
import { mapTimelineEventToCard } from './timeline-event-card.mapper';

interface TimelineListProps {
  readonly model: TimelineListModel;
  readonly onAddEvent: () => void;
  readonly onOpenEvent: (eventId: string, trigger: HTMLElement) => void;
  readonly onResetCriteria: () => void;
}

function TimelineLoadingState() {
  return (
    <section
      aria-busy="true"
      aria-labelledby="timeline-loading-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="sr-only" id="timeline-loading-title">
        Загрузка событий
      </h2>
      <span className="sr-only" role="status">
        Загрузка событий
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
  onAddEvent,
}: Pick<TimelineListProps, 'onAddEvent'>) {
  return (
    <section
      aria-labelledby="timeline-empty-title"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
    >
      <h2
        className="text-lg font-bold text-slate-950"
        id="timeline-empty-title"
      >
        Событий пока нет
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
        Добавьте первое событие, чтобы начать вести историю.
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={onAddEvent}
        type="button"
      >
        Добавить событие
      </button>
    </section>
  );
}

function TimelineFilteredEmptyState({
  onResetCriteria,
}: Pick<TimelineListProps, 'onResetCriteria'>) {
  return (
    <section
      aria-labelledby="timeline-filtered-empty-title"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
    >
      <h2
        className="text-lg font-bold text-slate-950"
        id="timeline-filtered-empty-title"
      >
        Ничего не найдено
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
        Измените запрос или сбросьте фильтры.
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={onResetCriteria}
        type="button"
      >
        Сбросить фильтры
      </button>
    </section>
  );
}

function TimelineErrorState({
  errorMessage,
}: {
  readonly errorMessage: string | undefined;
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
        Не удалось загрузить события
      </h2>
      <p className="mt-2 text-sm text-rose-700">
        {errorMessage ?? 'Попробуйте обновить страницу или вернуться позже.'}
      </p>
    </section>
  );
}

export function TimelineList({
  model,
  onAddEvent,
  onOpenEvent,
  onResetCriteria,
}: TimelineListProps) {
  if (model.status === 'loading') {
    return <TimelineLoadingState />;
  }

  if (model.status === 'empty') {
    return <TimelineEmptyState onAddEvent={onAddEvent} />;
  }

  if (model.status === 'filtered-empty') {
    return <TimelineFilteredEmptyState onResetCriteria={onResetCriteria} />;
  }

  if (model.status === 'error') {
    return <TimelineErrorState errorMessage={model.errorMessage} />;
  }

  return (
    <div
      aria-label="Список событий"
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
                const eventCardProps = mapTimelineEventToCard(event);

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
                      ariaLabel={`Открыть событие: ${[
                        event.title,
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
