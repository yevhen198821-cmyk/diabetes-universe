'use client';

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';

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
) {
  const restoreFocusRefSnapshot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreFocusRefSnapshot.current =
      restoreFocusRef?.current ??
      (document.activeElement as HTMLElement | null);

    requestAnimationFrame(() => {
      focusableElements(dialogRef.current ?? document.body)[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const elements = focusableElements(dialogRef.current);
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRefSnapshot.current?.focus();
    };
  }, [dialogRef, onClose, open, restoreFocusRef]);
}

interface SessionConfirmDialogProps {
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly description: string;
  readonly isPending?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
  readonly title: string;
  readonly triggerRef?: RefObject<HTMLElement | null>;
}

export function SessionConfirmDialog({
  cancelLabel,
  confirmLabel,
  description,
  isPending = false,
  onCancel,
  onConfirm,
  open,
  title,
  triggerRef,
}: SessionConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useDialogFocusTrap(open, dialogRef, onCancel, triggerRef);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={cancelLabel}
        className="absolute inset-0 bg-slate-950/50"
        onClick={onCancel}
        type="button"
      />
      <section
        aria-busy={isPending}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-950"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <h3
          className="text-lg font-bold text-slate-950 dark:text-slate-50"
          id={titleId}
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm text-slate-600 dark:text-slate-300"
          id={descriptionId}
        >
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:opacity-60"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

interface SessionStatusMessageProps {
  readonly children: ReactNode;
  readonly tone: 'error' | 'success';
}

export function SessionStatusMessage({
  children,
  tone,
}: SessionStatusMessageProps) {
  return (
    <p
      className={`rounded-xl p-4 text-sm ${
        tone === 'error'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
      }`}
      role="status"
    >
      {children}
    </p>
  );
}
