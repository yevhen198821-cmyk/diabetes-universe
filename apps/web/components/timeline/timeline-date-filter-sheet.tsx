'use client';

import { useId, useState } from 'react';

import type {
  TimelineDateFilterPreset,
  TimelineDateFilterSelection,
} from './timeline-date-filter-model';
import { isValidTimelineDateFilterDateKey } from './timeline-date-filter-model';

export interface TimelineDateFilterSheetLabels {
  readonly apply: string;
  readonly closeOverlay: string;
  readonly custom: string;
  readonly customFrom: string;
  readonly customTo: string;
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
  { labelKey: 'custom', preset: 'custom' },
];

export function TimelineDateFilterSheet({
  labels,
  onApply,
  onClose,
  selection,
}: TimelineDateFilterSheetProps) {
  const titleId = useId();
  const [draftPreset, setDraftPreset] = useState(selection.preset);
  const [customFrom, setCustomFrom] = useState(
    selection.customFromDateKey ?? '',
  );
  const [customTo, setCustomTo] = useState(selection.customToDateKey ?? '');

  const canApply =
    draftPreset !== 'custom' ||
    (isValidTimelineDateFilterDateKey(customFrom) &&
      isValidTimelineDateFilterDateKey(customTo));

  const handleApply = () => {
    if (!canApply) {
      return;
    }

    onApply({
      customFromDateKey: draftPreset === 'custom' ? customFrom : undefined,
      customToDateKey: draftPreset === 'custom' ? customTo : undefined,
      preset: draftPreset,
    });
    onClose();
  };

  return (
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
        {draftPreset === 'custom' ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>{labels.customFrom}</span>
              <input
                className="focus-visible:outline-interactive-primary mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                onChange={(event) => setCustomFrom(event.target.value)}
                type="date"
                value={customFrom}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>{labels.customTo}</span>
              <input
                className="focus-visible:outline-interactive-primary mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                onChange={(event) => setCustomTo(event.target.value)}
                type="date"
                value={customTo}
              />
            </label>
          </div>
        ) : null}
        <button
          className="focus-visible:outline-interactive-primary mt-5 min-h-11 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 text-sm font-bold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canApply}
          onClick={handleApply}
          type="button"
        >
          {labels.apply}
        </button>
      </div>
    </div>
  );
}
