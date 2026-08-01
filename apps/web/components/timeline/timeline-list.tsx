import type { TimelineEvent } from '@diabetes-universe/types';
import { EventCard } from '@diabetes-universe/ui';

import { mapTimelineEventToCard } from './timeline-event-card.mapper';

interface TimelineListProps {
  readonly events: readonly TimelineEvent[];
}

const todayLabel = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
}).format(new Date());

export function TimelineList({ events }: TimelineListProps) {
  return (
    <section aria-labelledby="timeline-title" className="min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <h2
          className="shrink-0 text-sm font-semibold text-slate-600"
          id="timeline-title"
        >
          Сегодня
        </h2>
        <p className="shrink-0 text-sm text-slate-500">{todayLabel}</p>
        <div aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      </div>

      <ul className="space-y-2.5">
        {events.map((event, index) => {
          const eventCardProps = mapTimelineEventToCard(event);

          return (
            <li className="relative pl-10 sm:pl-12" key={event.id}>
              <div
                aria-hidden="true"
                className={`absolute top-0 left-[15px] w-0.5 bg-slate-300 sm:left-[17px] ${
                  index === events.length - 1 ? 'h-7' : 'bottom-0'
                }`}
              />
              <EventCard {...eventCardProps} variant="compact" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
