import { Button } from '../../button';

export interface QuickAddFormActionsProps {
  readonly cancelDisabled?: boolean;
  readonly cancelLabel?: string;
  readonly inline?: boolean;
  readonly isSubmitting?: boolean;
  readonly submitAriaDescribedBy?: string;
  readonly submitDisabled?: boolean;
  readonly submitLabel?: string;
  readonly submittingLabel?: string;
  readonly onCancel: () => void;
}

export function QuickAddFormActions({
  cancelDisabled = false,
  cancelLabel = 'Отмена',
  inline = false,
  isSubmitting = false,
  onCancel,
  submitAriaDescribedBy,
  submitDisabled = false,
  submitLabel = 'Сохранить',
  submittingLabel = 'Сохранение…',
}: QuickAddFormActionsProps) {
  const actions = (
    <>
      <Button
        className="h-12 min-w-0 flex-1 basis-0"
        disabled={cancelDisabled || isSubmitting}
        onClick={onCancel}
        type="button"
        variant="secondary"
      >
        {cancelLabel}
      </Button>
      <Button
        aria-busy={isSubmitting ? true : undefined}
        aria-describedby={submitAriaDescribedBy}
        className="h-12 min-w-0 flex-1 basis-0"
        disabled={submitDisabled || isSubmitting}
        type="submit"
      >
        {isSubmitting ? submittingLabel : submitLabel}
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
