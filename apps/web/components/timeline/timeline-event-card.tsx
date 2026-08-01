'use client';

import type {
  TimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';
import {
  Activity,
  ChevronDown,
  CookingPot,
  Droplets,
  FileText,
  Link2,
  Syringe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface TimelineEventCardProps {
  readonly event: TimelineEvent;
  readonly showLinkedLabel: boolean;
}

interface EventAppearance {
  readonly icon: LucideIcon;
  readonly color: string;
}

const appearances: Record<TimelineEventKind, EventAppearance> = {
  glucose: {
    icon: Droplets,
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  activity: {
    icon: Activity,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  meal: {
    icon: CookingPot,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  insulin: {
    icon: Syringe,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  note: {
    icon: FileText,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
};

export function TimelineEventCard({
  event,
  showLinkedLabel,
}: TimelineEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { color, icon: Icon } = appearances[event.kind];
  const detailsId = `${event.id}-details`;

  return (
    <article className="relative pl-14 sm:pl-20">
      <div
        className={`absolute top-6 left-0 z-10 grid size-11 place-items-center rounded-2xl border-4 border-slate-50 shadow-sm sm:left-2 dark:border-slate-950 ${color}`}
      >
        <Icon aria-hidden="true" size={19} />
      </div>

      {showLinkedLabel ? (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-teal-700 dark:text-teal-300">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Link2 aria-hidden="true" size={14} />
            Связанные события
          </span>
          <span className="text-slate-400">
            без указания причинно-следственной связи
          </span>
        </div>
      ) : null}

      <div
        className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:bg-slate-900 ${
          event.linked
            ? 'border-teal-200/80 dark:border-teal-900'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <time
                className="text-sm font-bold text-slate-950 dark:text-white"
                dateTime={event.time}
              >
                {event.time}
              </time>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {event.title}
              </h3>
              {event.linked ? (
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
                  Связано
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-white">
              {event.value}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {event.details}
            </p>
          </div>

          <button
            aria-controls={detailsId}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Скрыть' : 'Показать'} сведения о событии ${event.title} в ${event.time}`}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-700 dark:hover:text-teal-300"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            <ChevronDown
              aria-hidden="true"
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              size={18}
            />
          </button>
        </div>

        {isExpanded ? (
          <div
            className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"
            id={detailsId}
          >
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Дополнительные сведения
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              {event.expandedDetails.map((detail) => (
                <li className="flex gap-2" key={detail}>
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-teal-500"
                  />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
