import type { QuickAddActionItem } from './QuickAdd.types';
import { eventTypeAppearances } from '../../theme/event-type-appearance';

interface QuickAddActionButtonProps {
  readonly action: QuickAddActionItem;
  readonly onSelect: (actionId: string) => void;
}

export function QuickAddActionButton({
  action,
  onSelect,
}: QuickAddActionButtonProps) {
  const { accent } = eventTypeAppearances[action.category];

  return (
    <button
      aria-label={`${action.label}. ${action.description}`}
      className="flex min-h-28 flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.98]"
      onClick={() => onSelect(action.id)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`grid size-11 place-items-center rounded-xl ${accent}`}
      >
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-slate-950">
          {action.label}
        </span>
        <span className="mt-1 block text-sm text-slate-500">
          {action.description}
        </span>
      </span>
    </button>
  );
}
