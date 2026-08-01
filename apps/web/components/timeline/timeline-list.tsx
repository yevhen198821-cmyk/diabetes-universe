import type { TimelineEvent } from '@diabetes-universe/types';

import { TimelineEventCard } from './timeline-event-card';

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
        {events.map((event, index) => (
          <li key={event.id}>
            <TimelineEventCard
              event={event}
              isLast={index === events.length - 1}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
