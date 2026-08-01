'use client';

import { haptics } from '../../lib/haptics';

import type {
  QuickAddOptionGroup,
  QuickAddOptionSheetProps,
} from './QuickAdd.types';

function OptionButton<TValue extends string>({
  onSelect,
  option,
  selected,
}: {
  readonly option: TValue;
  readonly selected: boolean;
  readonly onSelect: (value: TValue) => void;
}) {
  return (
    <button
      className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
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
}

export function QuickAddOptionSheet<TValue extends string>({
  groups,
  onClose,
  onSelect,
  options = [],
  selectedValue,
  title,
}: QuickAddOptionSheetProps<TValue>) {
  const titleId = `quick-add-option-sheet-${title
    .toLowerCase()
    .replace(/\s+/g, '-')}`;
  const groupedOptions = groups ?? [{ options }];

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
        <div className="mt-4 space-y-4">
          {groupedOptions.map((group, groupIndex) => (
            <div
              className="space-y-2"
              key={group.label ?? `group-${groupIndex}`}
            >
              {group.label ? (
                <p className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {group.label}
                </p>
              ) : null}
              {group.options.map((option) => (
                <OptionButton
                  key={option}
                  onSelect={onSelect}
                  option={option}
                  selected={option === selectedValue}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { QuickAddOptionGroup, QuickAddOptionSheetProps };
