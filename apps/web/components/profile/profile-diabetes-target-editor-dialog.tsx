'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';

import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';

import { validateTargetEditorInput } from '../../lib/medical/client/diabetes-settings-target-validation';
import type { ProfileDiabetesManagementLabels } from './profile-diabetes-management-labels';
import {
  profileThemeControlActiveClassName,
  profileThemeControlInactiveClassName,
} from './profile-surface-styles';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function useDialogFocusTrap(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  restoreFocusRef?: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const restoreFocusRefSnapshot = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const isOpening = !wasOpenRef.current;
      wasOpenRef.current = true;

      if (isOpening) {
        restoreFocusRefSnapshot.current =
          restoreFocusRef?.current ??
          (document.activeElement as HTMLElement | null);

        requestAnimationFrame(() => {
          const focusTarget =
            initialFocusRef?.current ??
            focusableElements(dialogRef.current ?? document.body)[0];
          focusTarget?.focus();
        });
      }

      return;
    }

    if (wasOpenRef.current) {
      restoreFocusRefSnapshot.current?.focus();
    }

    wasOpenRef.current = false;
  }, [dialogRef, initialFocusRef, open, restoreFocusRef]);
}

export function ProfileDiabetesTargetEditorDialog({
  displayUnit,
  highValue,
  isPending,
  labels,
  lowValue,
  onCancel,
  onHighValueChange,
  onLowValueChange,
  onSave,
  open,
  triggerRef,
  validationMessage,
}: {
  readonly displayUnit: GlucoseDisplayUnit;
  readonly highValue: string;
  readonly isPending: boolean;
  readonly labels: ProfileDiabetesManagementLabels;
  readonly lowValue: string;
  readonly onCancel: () => void;
  readonly onHighValueChange: (value: string) => void;
  readonly onLowValueChange: (value: string) => void;
  readonly onSave: () => void;
  readonly open: boolean;
  readonly triggerRef?: RefObject<HTMLElement | null>;
  readonly validationMessage: string | null;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const lowerInputId = useId();
  const upperInputId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const lowerInputRef = useRef<HTMLInputElement>(null);

  useDialogFocusTrap(open, dialogRef, onCancel, triggerRef, lowerInputRef);

  if (!open) {
    return null;
  }

  const unitSuffix = displayUnit === 'mg_per_dl' ? 'mg/dL' : 'mmol/L';
  const inputMode = displayUnit === 'mg_per_dl' ? 'numeric' : 'decimal';

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={labels.target.dialog.cancel}
        className="absolute inset-0 bg-slate-950/50"
        disabled={isPending}
        onClick={onCancel}
        type="button"
      />
      <section
        aria-busy={isPending}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="border-border-default bg-surface relative z-10 w-full max-w-md rounded-t-3xl border p-5 shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-slate-950"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <h3 className="text-text-primary text-lg font-bold" id={titleId}>
          {labels.target.dialog.title}
        </h3>
        <p className="text-text-secondary mt-2 text-sm" id={descriptionId}>
          {unitSuffix}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1.5" htmlFor={lowerInputId}>
            <span className="text-text-primary text-sm font-semibold">
              {labels.target.dialog.lowerLabel}
            </span>
            <input
              aria-invalid={validationMessage ? true : undefined}
              className="focus-visible:outline-interactive-primary text-text-primary border-border-default bg-surface-subtle min-h-11 w-full rounded-xl border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/40"
              disabled={isPending}
              id={lowerInputId}
              inputMode={inputMode}
              onChange={(event) => onLowValueChange(event.target.value)}
              ref={lowerInputRef}
              type="text"
              value={lowValue}
            />
          </label>

          <label className="block space-y-1.5" htmlFor={upperInputId}>
            <span className="text-text-primary text-sm font-semibold">
              {labels.target.dialog.upperLabel}
            </span>
            <input
              aria-invalid={validationMessage ? true : undefined}
              className="focus-visible:outline-interactive-primary text-text-primary border-border-default bg-surface-subtle min-h-11 w-full rounded-xl border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-950/40"
              disabled={isPending}
              id={upperInputId}
              inputMode={inputMode}
              onChange={(event) => onHighValueChange(event.target.value)}
              type="text"
              value={highValue}
            />
          </label>

          {validationMessage ? (
            <p
              className="text-sm text-rose-700 dark:text-rose-300"
              role="alert"
            >
              {validationMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className={`focus-visible:outline-interactive-primary inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${profileThemeControlInactiveClassName}`}
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {labels.target.dialog.cancel}
          </button>
          <button
            className={`focus-visible:outline-interactive-primary inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${profileThemeControlActiveClassName}`}
            disabled={isPending}
            onClick={onSave}
            type="button"
          >
            {isPending ? labels.saving : labels.target.dialog.save}
          </button>
        </div>
      </section>
    </div>
  );
}

export function validateTargetEditorForm(
  lowValue: string,
  highValue: string,
  displayUnit: GlucoseDisplayUnit,
  labels: ProfileDiabetesManagementLabels,
):
  | { ok: true; lowMmolPerL: number; highMmolPerL: number }
  | { ok: false; message: string } {
  const result = validateTargetEditorInput(lowValue, highValue, displayUnit);

  if (!result.ok) {
    return {
      ok: false,
      message: labels.target.validation[result.issue],
    };
  }

  return result;
}
