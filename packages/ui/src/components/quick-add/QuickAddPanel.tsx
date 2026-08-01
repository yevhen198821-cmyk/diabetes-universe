'use client';

import { useEffect, useId, useRef } from 'react';

import { QuickAddActionButton } from './QuickAddActionButton';
import type { QuickAddPanelProps } from './QuickAdd.types';

function findActionLabel(
  actions: QuickAddPanelProps['actions'],
  selectedActionId: string,
): string {
  const selectedAction = actions.find(
    (action) => action.id === selectedActionId,
  );

  return selectedAction?.label ?? 'Событие';
}

export function QuickAddPanel({
  actions,
  onBack,
  onClose,
  onSelectAction,
  open,
  selectedActionId,
  selectedContent,
}: QuickAddPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const selectedLabel = selectedActionId
    ? findActionLabel(actions, selectedActionId)
    : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.focus();
  }, [open, selectedActionId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Закрыть быстрое добавление"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 outline-none sm:rounded-3xl"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          {selectedActionId ? (
            <button
              aria-label="Назад к выбору типа"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              onClick={onBack}
              type="button"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ←
              </span>
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-950" id={titleId}>
              {selectedActionId
                ? `Добавить: ${selectedLabel}`
                : 'Добавить событие'}
            </h2>
            {!selectedActionId ? (
              <p className="mt-0.5 text-sm text-slate-500">
                Выберите, что хотите записать
              </p>
            ) : null}
          </div>

          <button
            aria-label="Закрыть"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        {selectedActionId ? (
          (selectedContent ?? (
            <div className="px-5 py-8 sm:px-6">
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                Форма ввода появится в следующем этапе. Сейчас доступен только
                выбор типа события.
              </p>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6">
            {actions.map((action) => (
              <QuickAddActionButton
                action={action}
                key={action.id}
                onSelect={onSelectAction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
