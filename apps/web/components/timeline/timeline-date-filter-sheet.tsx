'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  TimelineDateFilterPreset,
  TimelineDateFilterSelection,
} from './timeline-date-filter-model';

export interface TimelineDateFilterSheetLabels {
  readonly apply: string;
  readonly closeOverlay: string;
  readonly last45Days: string;
  readonly last30Days: string;
  readonly last7Days: string;
  readonly sheetTitle: string;
  readonly today: string;
}

interface TimelineDateFilterSheetProps {
  readonly labels: TimelineDateFilterSheetLabels;
  readonly onApply: (selection: TimelineDateFilterSelection) => void;
  readonly onClose: () => void;
  readonly selection: TimelineDateFilterSelection;
}

const presetOptions: readonly {
  readonly labelKey: keyof TimelineDateFilterSheetLabels;
  readonly preset: TimelineDateFilterPreset;
}[] = [
  { labelKey: 'today', preset: 'today' },
  { labelKey: 'last7Days', preset: '7days' },
  { labelKey: 'last30Days', preset: '30days' },
  { labelKey: 'last45Days', preset: '45days' },
];

export function TimelineDateFilterSheet({
  labels,
  onApply,
  onClose,
  selection,
}: TimelineDateFilterSheetProps) {
  const titleId = useId();
  const [draftPreset, setDraftPreset] = useState(selection.preset);

  const handleApply = () => {
    onApply({ preset: draftPreset });
    onClose();
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:p-6">
      <button
        aria-label={labels.closeOverlay}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/15 sm:rounded-3xl dark:border-white/10 dark:bg-slate-950"
        role="dialog"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden dark:bg-slate-700" />
        <h3
          className="text-base font-bold text-slate-950 dark:text-white"
          id={titleId}
        >
          {labels.sheetTitle}
        </h3>
        <div className="mt-4 space-y-2">
          {presetOptions.map(({ labelKey, preset }) => {
            const selected = draftPreset === preset;

            return (
              <button
                aria-pressed={selected}
                className={`focus-visible:outline-interactive-primary flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  selected
                    ? 'border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-100'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                }`}
                key={preset}
                onClick={() => setDraftPreset(preset)}
                type="button"
              >
                <span>{labels[labelKey]}</span>
              </button>
            );
          })}
        </div>
        <button
          className="focus-visible:outline-interactive-primary mt-5 min-h-11 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={handleApply}
          type="button"
        >
          {labels.apply}
        </button>
      </div>
    </div>,
    document.body,
  );
}
