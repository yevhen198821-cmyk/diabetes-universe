'use client';

import { haptics } from '../../lib/haptics';

export interface QuickAddOptionSheetProps<TValue extends string> {
  readonly title: string;
  readonly options: readonly TValue[];
  readonly selectedValue?: TValue;
  readonly onClose: () => void;
  readonly onSelect: (value: TValue) => void;
}

export function QuickAddOptionSheet<TValue extends string>({
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
}: QuickAddOptionSheetProps<TValue>) {
  const titleId = `quick-add-option-sheet-${title
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:p-6">
      <button
        aria-label="Закрыть выбор"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/15 sm:rounded-3xl"
        role="dialog"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <h3 className="text-base font-bold text-slate-950" id={titleId}>
          {title}
        </h3>
        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const selected = option === selectedValue;

            return (
              <button
                className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                key={option}
                onClick={() => {
                  onSelect(option);
                  haptics.selection();
                }}
                type="button"
              >
                <span>{option}</span>
                {selected ? (
                  <svg
                    aria-hidden="true"
                    className="text-teal-700"
                    fill="none"
                    height="18"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
