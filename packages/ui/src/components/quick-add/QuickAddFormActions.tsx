import { Button } from '../../button';

export interface QuickAddFormActionsProps {
  readonly cancelLabel?: string;
  readonly submitLabel?: string;
  readonly submitDisabled?: boolean;
  readonly onCancel: () => void;
}

export function QuickAddFormActions({
  cancelLabel = 'Отмена',
  onCancel,
  submitDisabled = false,
  submitLabel = 'Сохранить',
}: QuickAddFormActionsProps) {
  return (
    <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      <button
        className="h-12 min-w-0 flex-1 basis-0 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        onClick={onCancel}
        type="button"
      >
        {cancelLabel}
      </button>
      <Button
        className="h-12 min-w-0 flex-1 basis-0"
        disabled={submitDisabled}
        type="submit"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
