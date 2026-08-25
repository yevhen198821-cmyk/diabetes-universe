'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import type { TimelineDateFilterSelection } from './timeline-date-filter-model';
import {
  TimelineDateFilterSheet,
  type TimelineDateFilterSheetLabels,
} from './timeline-date-filter-sheet';

interface TimelineDateFilterControlProps {
  readonly activeLabel: string;
  readonly ariaLabel: string;
  readonly labels: TimelineDateFilterSheetLabels;
  readonly onChange: (selection: TimelineDateFilterSelection) => void;
  readonly selection: TimelineDateFilterSelection;
}

export function TimelineDateFilterControl({
  activeLabel,
  ariaLabel,
  labels,
  onChange,
  selection,
}: TimelineDateFilterControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="focus-visible:outline-interactive-primary inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 text-sm font-semibold text-[#1e3a5f] shadow-sm backdrop-blur transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:border-teal-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 opacity-70"
        />
      </button>
      {open ? (
        <TimelineDateFilterSheet
          key={`${selection.preset}-${selection.customFromDateKey ?? ''}-${selection.customToDateKey ?? ''}`}
          labels={labels}
          onApply={onChange}
          onClose={() => setOpen(false)}
          selection={selection}
        />
      ) : null}
    </>
  );
}
