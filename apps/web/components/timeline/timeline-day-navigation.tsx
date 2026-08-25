'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import type { TimelineDayNavigationModel } from './timeline-day-navigation-model';

interface TimelineDayNavigationProps {
  readonly ariaLabel: string;
  readonly model: TimelineDayNavigationModel;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
}

export function TimelineDayNavigation({
  ariaLabel,
  model,
  onNext,
  onPrevious,
  previousDayLabel,
  nextDayLabel,
}: TimelineDayNavigationProps) {
  return (
    <nav aria-label={ariaLabel} className="min-w-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button
          aria-label={previousDayLabel}
          className="focus-visible:outline-interactive-primary grid size-11 min-h-11 min-w-11 place-items-center rounded-xl border border-white/70 bg-white/75 text-[#1e3a5f] shadow-sm backdrop-blur transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-slate-900/75 dark:text-white dark:hover:border-teal-800"
          disabled={!model.canGoPrevious}
          onClick={onPrevious}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.4} />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
          <CalendarDays
            aria-hidden="true"
            className="shrink-0 text-teal-600 dark:text-teal-300"
            size={16}
            strokeWidth={2.2}
          />
          <p className="truncate text-sm font-semibold text-[#1e3a5f] dark:text-white">
            {model.label}
          </p>
        </div>

        <button
          aria-label={nextDayLabel}
          className="focus-visible:outline-interactive-primary grid size-11 min-h-11 min-w-11 place-items-center rounded-xl border border-white/70 bg-white/75 text-[#1e3a5f] shadow-sm backdrop-blur transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-slate-900/75 dark:text-white dark:hover:border-teal-800"
          disabled={!model.canGoNext}
          onClick={onNext}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={20} strokeWidth={2.4} />
        </button>
      </div>
    </nav>
  );
}
