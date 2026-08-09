'use client';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import { Button, haptics } from '@diabetes-universe/ui';
import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react';

import {
  createTimelineSemanticEventEditDraft,
  updateSemanticTimelineEventFromDraft,
  type TimelineEventEditDraft,
  type TimelineEventEditErrors,
} from './timeline-event-detail-model';
import { mapTimelineEventDetailPresentation } from '../../lib/timeline/presentation';
import type { TimelinePresentationDependencies } from '../../lib/timeline/presentation';

export type TimelineEventDetailMode = 'edit' | 'view';

interface TimelineEventDetailProps {
  readonly event: SemanticTimelineEvent;
  readonly mode: TimelineEventDetailMode;
  readonly onClose: () => void;
  readonly onDelete: (eventId: string) => void;
  readonly onModeChange: (mode: TimelineEventDetailMode) => void;
  readonly onUpdate: (event: SemanticTimelineEvent) => void;
  readonly presentationDependencies: TimelinePresentationDependencies;
}

const fieldClass =
  'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const labelClass =
  'block text-sm font-medium text-slate-700 dark:text-slate-200';

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
) {
  useEffect(() => {
    if (!open) {
      return;
    }

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

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialogRef, onClose, open]);
}

function ErrorText({
  id,
  message,
}: {
  readonly id: string;
  readonly message?: string;
}) {
  return message ? (
    <p className="mt-1 text-sm text-rose-600" id={id}>
      {message}
    </p>
  ) : null;
}

function TimelineEventEditForm({
  draft,
  errors,
  onCancel,
  onChange,
  onSubmit,
}: {
  readonly draft: TimelineEventEditDraft;
  readonly errors: TimelineEventEditErrors;
  readonly onCancel: () => void;
  readonly onChange: (draft: TimelineEventEditDraft) => void;
  readonly onSubmit: () => void;
}) {
  const updateField =
    (field: keyof TimelineEventEditDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({
        ...draft,
        [field]: event.target.value,
      });
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="timeline-edit-date">
            Дата
          </label>
          <input
            aria-describedby={
              errors.date ? 'timeline-edit-date-error' : undefined
            }
            aria-invalid={errors.date ? true : undefined}
            className={fieldClass}
            id="timeline-edit-date"
            onChange={updateField('date')}
            type="date"
            value={draft.date}
          />
          <ErrorText id="timeline-edit-date-error" message={errors.date} />
        </div>
        <div>
          <label className={labelClass} htmlFor="timeline-edit-time">
            Время
          </label>
          <input
            aria-describedby={
              errors.time ? 'timeline-edit-time-error' : undefined
            }
            aria-invalid={errors.time ? true : undefined}
            className={fieldClass}
            id="timeline-edit-time"
            onChange={updateField('time')}
            type="time"
            value={draft.time}
          />
          <ErrorText id="timeline-edit-time-error" message={errors.time} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="timeline-edit-title">
          Название
        </label>
        <input
          aria-describedby={
            errors.title ? 'timeline-edit-title-error' : undefined
          }
          aria-invalid={errors.title ? true : undefined}
          className={fieldClass}
          id="timeline-edit-title"
          onChange={updateField('title')}
          value={draft.title}
        />
        <ErrorText id="timeline-edit-title-error" message={errors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div>
          <label className={labelClass} htmlFor="timeline-edit-value">
            Значение
          </label>
          <textarea
            aria-describedby={
              errors.value ? 'timeline-edit-value-error' : undefined
            }
            aria-invalid={errors.value ? true : undefined}
            className={`${fieldClass} min-h-24 py-3`}
            id="timeline-edit-value"
            onChange={updateField('value')}
            value={draft.value}
          />
          <ErrorText id="timeline-edit-value-error" message={errors.value} />
        </div>
        <div>
          <label className={labelClass} htmlFor="timeline-edit-unit">
            Ед.
          </label>
          <input
            aria-describedby={
              errors.unit ? 'timeline-edit-unit-error' : undefined
            }
            aria-invalid={errors.unit ? true : undefined}
            className={fieldClass}
            id="timeline-edit-unit"
            onChange={updateField('unit')}
            value={draft.unit}
          />
          <ErrorText id="timeline-edit-unit-error" message={errors.unit} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="timeline-edit-context">
          Контекст
        </label>
        <input
          className={fieldClass}
          id="timeline-edit-context"
          onChange={updateField('context')}
          value={draft.context}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="timeline-edit-note">
          Заметка
        </label>
        <textarea
          className={`${fieldClass} min-h-24 py-3`}
          id="timeline-edit-note"
          maxLength={500}
          onChange={updateField('note')}
          value={draft.note}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={onCancel}
          type="button"
        >
          Отмена
        </Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  );
}

const timelineEventSourceLabels = {
  demo: 'Демо-данные',
  device: 'Устройство',
  import: 'Импорт',
  manual: 'Вручную',
} as const;

export function TimelineEventDetail({
  event,
  mode,
  onClose,
  onDelete,
  onModeChange,
  onUpdate,
  presentationDependencies,
}: TimelineEventDetailProps) {
  const titleId = useId();
  const descriptionId = useId();
  const deleteTitleId = useId();
  const deleteDescriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const deleteDialogRef = useRef<HTMLElement>(null);
  const readPresentation = mapTimelineEventDetailPresentation(
    event,
    presentationDependencies,
  );
  const [draft, setDraft] = useState(() =>
    createTimelineSemanticEventEditDraft(event),
  );
  const [errors, setErrors] = useState<TimelineEventEditErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const sourceLabel = event.source
    ? timelineEventSourceLabels[event.source]
    : null;
  const displayDate = presentationDependencies.formatter.formatDate(
    event.occurredAt,
    { dateStyle: 'long' },
  );
  const displayTime = presentationDependencies.formatter.formatTime(
    event.occurredAt,
    { timeStyle: 'short' },
  );

  useDialogFocusTrap(!deleteOpen, dialogRef, onClose);
  useDialogFocusTrap(deleteOpen, deleteDialogRef, () => setDeleteOpen(false));

  const handleSave = () => {
    const result = updateSemanticTimelineEventFromDraft(event, draft);

    setErrors(result.errors);

    if (!result.event) {
      return;
    }

    onUpdate(result.event);
    onModeChange('view');
    haptics.success();
  };

  const handleDelete = () => {
    onDelete(event.id);
    setDeleteOpen(false);
    haptics.success();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Закрыть детали события"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 outline-none sm:rounded-3xl dark:border-slate-800 dark:bg-slate-950"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {readPresentation.kindLabel}
            </p>
            <h2
              className="truncate text-lg font-bold text-slate-950 dark:text-slate-50"
              id={titleId}
            >
              {mode === 'edit' ? 'Изменить событие' : readPresentation.title}
            </h2>
          </div>
          <button
            aria-label="Закрыть детали"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
          id={descriptionId}
        >
          {mode === 'edit' ? (
            <TimelineEventEditForm
              draft={draft}
              errors={errors}
              onCancel={() => {
                setDraft(createTimelineSemanticEventEditDraft(event));
                setErrors({});
                onModeChange('view');
              }}
              onChange={setDraft}
              onSubmit={handleSave}
            />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {displayDate} · {displayTime}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                  {readPresentation.primaryText}
                </p>
              </div>

              <dl className="grid gap-3">
                {readPresentation.context ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Контекст
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {readPresentation.context}
                    </dd>
                  </div>
                ) : null}
                {readPresentation.note ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Заметка
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {readPresentation.note}
                    </dd>
                  </div>
                ) : null}
                {sourceLabel ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Источник
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {sourceLabel}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )}
        </div>

        {mode === 'view' ? (
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-between sm:px-6 dark:border-slate-800">
            <Button
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Закрыть
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                className="border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                onClick={() => setDeleteOpen(true)}
                type="button"
              >
                Удалить
              </Button>
              <Button
                onClick={() => {
                  setDraft(createTimelineSemanticEventEditDraft(event));
                  setErrors({});
                  onModeChange('edit');
                }}
                type="button"
              >
                Изменить
              </Button>
            </div>
          </footer>
        ) : null}
      </section>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <button
            aria-label="Закрыть подтверждение удаления"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setDeleteOpen(false)}
            type="button"
          />
          <section
            aria-describedby={deleteDescriptionId}
            aria-labelledby={deleteTitleId}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-950"
            ref={deleteDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <h3
              className="text-lg font-bold text-slate-950 dark:text-slate-50"
              id={deleteTitleId}
            >
              Удалить событие?
            </h3>
            <p
              className="mt-2 text-sm text-slate-600 dark:text-slate-300"
              id={deleteDescriptionId}
            >
              Это действие нельзя отменить.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                Отмена
              </Button>
              <button
                className="min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                onClick={handleDelete}
                type="button"
              >
                Удалить
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
