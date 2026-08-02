'use client';

import type { NoteQuickAddEntry } from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddSelectField,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useState, type FormEvent } from 'react';

import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import { noteTitleOptions } from '../../lib/quick-add/note-title-options';

const TEXT_COUNTER_THRESHOLD = 160;
const TEXT_MAX_LENGTH = 500;

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
  const [titleSheetOpen, setTitleSheetOpen] = useState(false);
  const trimmedText = formState.text.trim();
  const canSubmit =
    formState.title.length > 0 &&
    trimmedText.length > 0 &&
    formState.time.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (trimmedText.length === 0) {
      setTextError('Введите текст заметки');
      return;
    }

    if (trimmedText.length > TEXT_MAX_LENGTH) {
      setTextError('Заметка должна быть не длиннее 500 символов');
      return;
    }

    if (!formState.title || !formState.time) {
      return;
    }

    onSubmit({
      text: trimmedText,
      time: formState.time,
      title: formState.title,
    });
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setTextError(null);
    onCancel();
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        <QuickAddSelectField
          id="quick-add-note-title"
          label="Тема"
          onClick={() => setTitleSheetOpen(true)}
          placeholder="Выберите тему"
          value={formState.title || undefined}
        />

        <QuickAddTextAreaField
          counterThreshold={TEXT_COUNTER_THRESHOLD}
          error={textError}
          id="quick-add-note-text"
          label="Текст заметки"
          maxLength={TEXT_MAX_LENGTH}
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

      {titleSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setTitleSheetOpen(false)}
          onSelect={(title) => {
            setFormState((current) => ({
              ...current,
              title,
            }));
            setTitleSheetOpen(false);
          }}
          options={noteTitleOptions}
          selectedValue={formState.title || undefined}
          title="Тема заметки"
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
