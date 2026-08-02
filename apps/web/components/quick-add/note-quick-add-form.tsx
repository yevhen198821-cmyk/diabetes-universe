'use client';

import type { NoteQuickAddEntry } from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useState, type FormEvent } from 'react';

import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  validateNoteQuickAddEntry,
} from '../../lib/quick-add/validate-note-quick-add';

const TEXT_COUNTER_THRESHOLD = 160;

interface NoteQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: NoteQuickAddEntry) => void;
}

interface NoteFormState {
  readonly text: string;
  readonly time: string;
  readonly title: string;
}

function createInitialState(): NoteFormState {
  return {
    text: '',
    time: getCurrentTimeString(),
    title: '',
  };
}

export function NoteQuickAddForm({
  onCancel,
  onSubmit,
}: NoteQuickAddFormProps) {
  const [formState, setFormState] = useState<NoteFormState>(createInitialState);
  const [textError, setTextError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const trimmedText = formState.text.trim();
  const canSubmit = trimmedText.length > 0 && formState.time.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const entry: NoteQuickAddEntry = {
      text: formState.text,
      time: formState.time,
      title: formState.title.trim() || undefined,
    };
    const validationError = validateNoteQuickAddEntry(entry);

    if (validationError) {
      if (validationError.includes('Заголовок')) {
        setTitleError(validationError);
      } else {
        setTextError(validationError);
      }
      return;
    }

    onSubmit(entry);
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setTextError(null);
    setTitleError(null);
    onCancel();
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
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
            id="quick-add-note-title"
            maxLength={NOTE_TITLE_MAX_LENGTH}
            name="title"
            onChange={(event) => {
              setTitleError(null);
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
            setTextError(null);
            setFormState((current) => ({
              ...current,
              text,
            }));
          }}
          placeholder="Опишите самочувствие или контекст"
          value={formState.text}
        />

        <QuickAddTimeField
          id="quick-add-note-time"
          label="Время"
          name="time"
          onChange={(time) => {
            setFormState((current) => ({
              ...current,
              time,
            }));
          }}
          required
          value={formState.time}
        />
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
        />
      </QuickAddFormLayout.Footer>
    </QuickAddFormLayout>
  );
}
