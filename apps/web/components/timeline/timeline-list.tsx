import type { TimelineEvent } from '@diabetes-universe/types';

import { TimelineEventCard } from './timeline-event-card';

interface TimelineListProps {
  readonly events: readonly TimelineEvent[];
}

export function TimelineList({ events }: TimelineListProps) {
  return (
    <section aria-labelledby="events-title" className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-300">
            Сегодня
          </p>
          <h2
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
            id="events-title"
          >
            Лента событий
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Новые события сверху
        </p>
      </div>

      <div className="relative space-y-4">
        <div
          aria-hidden="true"
          className="absolute top-8 bottom-8 left-[21px] w-px bg-slate-200 sm:left-[29px] dark:bg-slate-800"
        />
        <div
          aria-hidden="true"
          className="absolute top-8 bottom-[18%] left-[21px] w-px bg-gradient-to-b from-teal-400/80 via-teal-400/35 to-transparent sm:left-[29px]"
        />
        {events.map((event) => (
          <TimelineEventCard
            event={event}
            key={event.id}
            showLinkedLabel={event.id === 'glucose-1015'}
          />
        ))}
      </div>
    </section>
  );
}
