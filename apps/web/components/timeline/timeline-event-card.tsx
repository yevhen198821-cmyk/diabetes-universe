import type {
  TimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';
import { CookingPot, Droplets, Syringe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TimelineEventCardProps {
  readonly event: TimelineEvent;
  readonly isLast?: boolean;
}

interface EventAppearance {
  readonly icon: LucideIcon;
  readonly accent: string;
}

const appearances: Record<TimelineEventKind, EventAppearance> = {
  glucose: {
    icon: Droplets,
    accent: 'bg-sky-500/10 text-sky-600',
  },
  meal: {
    icon: CookingPot,
    accent: 'bg-amber-500/10 text-amber-600',
  },
  insulin: {
    icon: Syringe,
    accent: 'bg-rose-500/10 text-rose-600',
  },
};

export function TimelineEventCard({
  event,
  isLast = false,
}: TimelineEventCardProps) {
  const { accent, icon: Icon } = appearances[event.kind];

  return (
    <article className="relative pl-10 sm:pl-12">
      <div
        aria-hidden="true"
        className={`absolute top-0 left-[15px] w-0.5 bg-slate-300 sm:left-[17px] ${
          isLast ? 'h-7' : 'bottom-0'
        }`}
      />

      <div
        className={`absolute top-3 left-0 z-10 grid size-8 place-items-center rounded-lg border-4 border-slate-50 sm:left-0.5 ${accent}`}
      >
        <Icon aria-hidden="true" size={15} />
      </div>

      <div className="grid min-h-14 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300">
        <time
          className="text-sm font-medium text-slate-500 tabular-nums"
          dateTime={event.time}
        >
          {event.time}
        </time>

        <div className="min-w-0">
          <p className="text-base font-bold text-slate-950 sm:text-lg">
            {event.value}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="text-sm text-slate-600">{event.title}</h3>
            <span className="text-xs text-slate-400">{event.context}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
