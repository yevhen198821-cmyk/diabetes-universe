import { Button } from '../../button';

export interface QuickAddFormActionsProps {
  readonly cancelLabel?: string;
  readonly inline?: boolean;
  readonly submitLabel?: string;
  readonly submitDisabled?: boolean;
  readonly onCancel: () => void;
}

export function QuickAddFormActions({
  cancelLabel = 'Отмена',
  inline = false,
  onCancel,
  submitDisabled = false,
  submitLabel = 'Сохранить',
}: QuickAddFormActionsProps) {
  const actions = (
    <>
      <Button
        className="h-12 min-w-0 flex-1 basis-0"
        onClick={onCancel}
        type="button"
        variant="secondary"
      >
        {cancelLabel}
      </Button>
      <Button
        className="h-12 min-w-0 flex-1 basis-0"
        disabled={submitDisabled}
        type="submit"
      >
        {submitLabel}
      </Button>
    </>
  );

  if (inline) {
    return actions;
  }

  return (
    <div className="border-border-subtle bg-surface flex shrink-0 gap-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      {actions}
    </div>
  );
}
