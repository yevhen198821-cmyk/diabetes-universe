'use client';

import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import type { NoteQuickAddSubmitRequest } from '../../lib/quick-add/note-quick-add-submit';
import type { NoteQuickAddFormState } from '../../lib/quick-add/note-quick-add-submit';
import {
  createNoteQuickAddSubmitIdentityState,
  persistPreparedNoteQuickAddSubmit,
  prepareNoteQuickAddSubmitWithIdentity,
  resetNoteQuickAddSubmitIdentity,
} from '../../lib/quick-add/note-quick-add-submit-controller';
import {
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from '../../lib/quick-add/validate-note-quick-add';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveNoteQuickAddSaveLabels } from './note-quick-add-labels';

const TEXT_COUNTER_THRESHOLD = 160;

interface NoteQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (request: NoteQuickAddSubmitRequest) => Promise<void>;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
}

function createInitialState(): NoteQuickAddFormState {
  return {
    text: '',
    time: getCurrentTimeString(),
    title: '',
  };
}

export function NoteQuickAddForm({
  onCancel,
  onSubmit,
  onSubmittingChange,
}: NoteQuickAddFormProps) {
  const localization = useLocalization();
  const saveLabels = useMemo(
    () => resolveNoteQuickAddSaveLabels(localization),
    [localization],
  );
  const [formState, setFormState] =
    useState<NoteQuickAddFormState>(createInitialState);
  const [textError, setTextError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitIdentityRef = useRef(createNoteQuickAddSubmitIdentityState());
  const isSubmittingRef = useRef(false);
  const trimmedText = formState.text.trim();
  const canSubmit = trimmedText.length > 0 && formState.time.length > 0;
  const controlsDisabled = isSubmitting;

  const setSubmittingState = (pending: boolean) => {
    setIsSubmitting(pending);
    onSubmittingChange?.(pending);
  };

  const noteFailedAttemptFieldEdit = () => {
    setSaveError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const prepared = prepareNoteQuickAddSubmitWithIdentity({
      formState,
      identity: submitIdentityRef.current,
    });

    if (prepared.type === 'invalid') {
      if (prepared.field === 'title') {
        setTitleError(prepared.message ?? null);
      } else {
        setTextError(prepared.message ?? null);
      }

      return;
    }

    isSubmittingRef.current = true;
    setSubmittingState(true);
    setSaveError(null);
    setTextError(null);
    setTitleError(null);

    const result = await persistPreparedNoteQuickAddSubmit({
      identity: submitIdentityRef.current,
      onSubmit,
      request: prepared.request,
    });

    if (result.type === 'error') {
      setSaveError(saveLabels.saveErrorDescription);
    }

    isSubmittingRef.current = false;
    setSubmittingState(false);
  };

  const handleCancel = () => {
    if (isSubmittingRef.current) {
      return;
    }

    setFormState(createInitialState());
    setTextError(null);
    setTitleError(null);
    setSaveError(null);
    resetNoteQuickAddSubmitIdentity(submitIdentityRef.current);
    onCancel();
  };

  return (
    <QuickAddFormLayout
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <QuickAddFormLayout.Body>
        <div aria-busy={isSubmitting ? true : undefined}>
          {isSubmitting ? (
            <p
              className="text-sm text-slate-600"
              id="quick-add-note-saving"
              role="status"
            >
              {saveLabels.saving}
            </p>
          ) : null}

          {saveError ? (
            <section
              aria-labelledby="quick-add-note-save-error-title"
              className="space-y-1"
              role="alert"
            >
              <h3
                className="text-sm font-semibold text-rose-700"
                id="quick-add-note-save-error-title"
              >
                {saveLabels.saveErrorTitle}
              </h3>
              <p
                className="text-sm text-rose-600"
                id="quick-add-note-save-error-description"
              >
                {saveError}
              </p>
            </section>
          ) : null}

          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="quick-add-note-title"
            >
              Заголовок
            </label>
            <input
              aria-describedby={
                titleError ? 'quick-add-note-title-error' : undefined
              }
              aria-invalid={titleError ? true : undefined}
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              disabled={controlsDisabled}
              id="quick-add-note-title"
              maxLength={NOTE_TITLE_MAX_LENGTH}
              name="title"
              onChange={(event) => {
                if (controlsDisabled) {
                  return;
                }

                setTitleError(null);
                noteFailedAttemptFieldEdit();
                setFormState((current) => ({
                  ...current,
                  title: event.target.value,
                }));
              }}
              placeholder="Необязательно"
              value={formState.title}
            />
            {titleError ? (
              <p
                className="mt-1 text-sm text-rose-600"
                id="quick-add-note-title-error"
              >
                {titleError}
              </p>
            ) : null}
          </div>

          <QuickAddTextAreaField
            counterThreshold={TEXT_COUNTER_THRESHOLD}
            error={textError}
            id="quick-add-note-text"
            label="Текст заметки"
            maxLength={NOTE_TEXT_MAX_LENGTH}
            name="text"
            onChange={(text) => {
              if (controlsDisabled) {
                return;
              }

              setTextError(null);
              noteFailedAttemptFieldEdit();
              setFormState((current) => ({
                ...current,
                text,
              }));
            }}
            placeholder="Опишите самочувствие или контекст"
            value={formState.text}
          />

          <QuickAddTimeField
            disabled={controlsDisabled}
            id="quick-add-note-time"
            label="Время"
            name="time"
            onChange={(time) => {
              noteFailedAttemptFieldEdit();
              setFormState((current) => ({
                ...current,
                time,
              }));
            }}
            required
            value={formState.time}
          />
        </div>
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitAriaDescribedBy={
            isSubmitting
              ? 'quick-add-note-saving'
              : saveError
                ? 'quick-add-note-save-error-description'
                : undefined
          }
          submitDisabled={!canSubmit}
          submittingLabel={saveLabels.saving}
        />
      </QuickAddFormLayout.Footer>
    </QuickAddFormLayout>
  );
}
