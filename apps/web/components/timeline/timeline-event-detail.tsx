'use client';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import {
  Button,
  dialogPanelClass,
  formErrorClass,
  formFieldClass,
  formLabelClass,
  haptics,
  overlayScrimClass,
} from '@diabetes-universe/ui';
import type { TranslationKey } from '@diabetes-universe/i18n';
import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import {
  mapTimelineEventDetailPresentation,
  resolveTimelineEventSourcePresentation,
  type TimelinePresentationDependencies,
} from '../../lib/timeline/presentation';
import {
  resolveTimelineUiLabels,
  type TimelineUiLabels,
} from './timeline-ui-labels';
import {
  createTimelineSemanticEventEditDraft,
  updateSemanticTimelineEventFromDraft,
  type TimelineEventEditDraft,
  type TimelineEventEditErrors,
} from './timeline-event-detail-model';

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

const fieldClass = `${formFieldClass} mt-2`;
const labelClass = formLabelClass;

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
    <p className={formErrorClass} id={id}>
      {message}
    </p>
  ) : null;
}

function TimelineEventEditForm({
  draft,
  errors,
  labels,
  onCancel,
  onChange,
  onSubmit,
}: {
  readonly draft: TimelineEventEditDraft;
  readonly errors: TimelineEventEditErrors;
  readonly labels: TimelineUiLabels['detail'];
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
            {labels.form.date}
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
            {labels.form.time}
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
          {labels.form.title}
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
            {labels.form.value}
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
            {labels.form.unit}
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
          {labels.form.context}
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
          {labels.form.note}
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
          className="border-border-default bg-surface text-text-primary hover:bg-surface-subtle border"
          onClick={onCancel}
          type="button"
        >
          {labels.close}
        </Button>
        <Button type="submit">{labels.form.save}</Button>
      </div>
    </form>
  );
}

export function TimelineEventDetail({
  event,
  mode,
  onClose,
  onDelete,
  onModeChange,
  onUpdate,
  presentationDependencies,
}: TimelineEventDetailProps) {
  const localization = useLocalization();
  const uiLabels = useMemo(
    () => resolveTimelineUiLabels(localization),
    [localization],
  );
  const cancelLabel = useMemo(
    () =>
      localization.translate({
        key: 'common.actions.cancel' as TranslationKey,
      }).value,
    [localization],
  );
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
  const sourcePresentation = resolveTimelineEventSourcePresentation(
    event.source,
    uiLabels.sources,
  );
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
        aria-label={uiLabels.detail.closeOverlay}
        className={overlayScrimClass}
        onClick={onClose}
        type="button"
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`${dialogPanelClass} shadow-2xl shadow-black/15`}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="border-border-subtle flex items-center gap-3 border-b px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {mode === 'view' &&
            readPresentation.kindLabel === readPresentation.title ? null : (
              <p className="text-body-small text-text-secondary">
                {readPresentation.kindLabel}
              </p>
            )}
            <h2 className="text-section-title truncate" id={titleId}>
              {mode === 'edit'
                ? uiLabels.detail.editTitle
                : readPresentation.title}
            </h2>
          </div>
          <button
            aria-label={uiLabels.detail.closeButton}
            className="border-border-default bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-interactive-primary grid size-10 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2"
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
              labels={{
                ...uiLabels.detail,
                close: cancelLabel,
              }}
              onCancel={() => {
                setDraft(createTimelineSemanticEventEditDraft(event));
                setErrors({});
                onModeChange('view');
              }}
              onChange={setDraft}
              onSubmit={handleSave}
            />
          ) : event.kind === 'glucose' ? (
            <div className="space-y-5">
              <div>
                <p className="text-text-primary text-2xl font-bold">
                  {readPresentation.primaryText}
                </p>
                {readPresentation.statusLines &&
                readPresentation.statusLines.length > 0 ? (
                  <div className="mt-2 space-y-0.5">
                    {readPresentation.statusLines.map((line) => (
                      <p className="text-text-secondary text-sm" key={line}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                <time
                  className="text-text-secondary mt-3 block text-sm"
                  dateTime={readPresentation.occurredAt}
                >
                  <span className="block">{displayDate}</span>
                  <span className="block">{displayTime}</span>
                </time>
              </div>

              <dl className="grid gap-3">
                {sourcePresentation ? (
                  <div
                    className={`rounded-xl p-3 ${
                      sourcePresentation.isDemo
                        ? 'border-status-warning/50 bg-status-warning/10 border border-dashed'
                        : 'bg-surface-subtle'
                    }`}
                  >
                    <dt className="text-text-secondary text-xs font-medium">
                      {uiLabels.detail.source}
                    </dt>
                    <dd
                      className={`mt-1 text-sm font-semibold ${
                        sourcePresentation.isDemo
                          ? 'text-status-warning'
                          : 'text-text-primary'
                      }`}
                    >
                      {sourcePresentation.label}
                    </dd>
                  </div>
                ) : null}
                {readPresentation.context ? (
                  <div className="bg-surface-subtle rounded-xl p-3">
                    <dt className="text-text-secondary text-xs font-medium">
                      {uiLabels.detail.context}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {readPresentation.context}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <time
                  className="text-text-secondary text-sm"
                  dateTime={readPresentation.occurredAt}
                >
                  {displayDate} · {displayTime}
                </time>
                <p className="text-text-primary mt-2 text-2xl font-bold">
                  {readPresentation.primaryText}
                </p>
              </div>

              <dl className="grid gap-3">
                {readPresentation.context ? (
                  <div className="bg-surface-subtle rounded-xl p-3">
                    <dt className="text-text-secondary text-xs font-medium">
                      {uiLabels.detail.context}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {readPresentation.context}
                    </dd>
                  </div>
                ) : null}
                {readPresentation.note ? (
                  <div className="bg-surface-subtle rounded-xl p-3">
                    <dt className="text-text-secondary text-xs font-medium">
                      {uiLabels.detail.note}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {readPresentation.note}
                    </dd>
                  </div>
                ) : null}
                {sourcePresentation ? (
                  <div
                    className={`rounded-xl p-3 ${
                      sourcePresentation.isDemo
                        ? 'border-status-warning/50 bg-status-warning/10 border border-dashed'
                        : 'bg-surface-subtle'
                    }`}
                  >
                    <dt className="text-text-secondary text-xs font-medium">
                      {uiLabels.detail.source}
                    </dt>
                    <dd
                      className={`mt-1 text-sm font-semibold ${
                        sourcePresentation.isDemo
                          ? 'text-status-warning'
                          : 'text-text-primary'
                      }`}
                    >
                      {sourcePresentation.label}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )}
        </div>

        {mode === 'view' ? (
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-between sm:px-6">
            <Button
              className="border-border-default bg-surface text-text-primary hover:bg-surface-subtle border"
              onClick={onClose}
              type="button"
            >
              {uiLabels.detail.close}
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                className="bg-surface border border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => setDeleteOpen(true)}
                type="button"
              >
                {uiLabels.detail.delete}
              </Button>
              <Button
                onClick={() => {
                  setDraft(createTimelineSemanticEventEditDraft(event));
                  setErrors({});
                  onModeChange('edit');
                }}
                type="button"
              >
                {uiLabels.detail.edit}
              </Button>
            </div>
          </footer>
        ) : null}
      </section>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <button
            aria-label={uiLabels.detail.deleteConfirm.closeOverlay}
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setDeleteOpen(false)}
            type="button"
          />
          <section
            aria-describedby={deleteDescriptionId}
            aria-labelledby={deleteTitleId}
            aria-modal="true"
            className="border-border-default bg-surface relative z-10 w-full max-w-md rounded-t-3xl border p-5 shadow-2xl sm:rounded-3xl"
            ref={deleteDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <h3
              className="text-text-primary text-lg font-bold"
              id={deleteTitleId}
            >
              {uiLabels.detail.deleteConfirm.title}
            </h3>
            <p
              className="text-text-secondary mt-2 text-sm"
              id={deleteDescriptionId}
            >
              {uiLabels.detail.deleteConfirm.description}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                className="border-border-default bg-surface text-text-primary hover:bg-surface-subtle border"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                {cancelLabel}
              </Button>
              <button
                className="text-text-inverse min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                onClick={handleDelete}
                type="button"
              >
                {uiLabels.detail.deleteConfirm.confirm}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
