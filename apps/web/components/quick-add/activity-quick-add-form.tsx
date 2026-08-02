'use client';

import type { ActivityQuickAddEntry } from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddSelectField,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useState, type FormEvent } from 'react';

import { activityTypeOptions } from '../../lib/quick-add/activity-type-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import { parseActivityDurationInput } from '../../lib/quick-add/format-activity';

const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

interface ActivityQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: ActivityQuickAddEntry) => void;
}

interface ActivityFormState {
  readonly activityType: string;
  readonly duration: string;
  readonly note: string;
  readonly time: string;
}

function createInitialState(): ActivityFormState {
  return {
    activityType: '',
    duration: '',
    note: '',
    time: getCurrentTimeString(),
  };
}

export function ActivityQuickAddForm({
  onCancel,
  onSubmit,
}: ActivityQuickAddFormProps) {
  const [formState, setFormState] =
    useState<ActivityFormState>(createInitialState);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const parsedDuration = parseActivityDurationInput(formState.duration);
  const hasDuration = formState.duration.trim().length > 0;
  const durationValidationError =
    durationError ??
    (hasDuration && parsedDuration === null
      ? 'Введите длительность от 1 до 600 минут'
      : null);
  const canSubmit =
    formState.activityType.length > 0 &&
    parsedDuration !== null &&
    formState.time.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (parsedDuration === null) {
      setDurationError('Введите длительность от 1 до 600 минут');
      return;
    }

    if (!formState.activityType || !formState.time) {
      return;
    }

    const note = formState.note.trim();

    onSubmit({
      activityType: formState.activityType,
      durationMinutes: parsedDuration,
      note: note || undefined,
      time: formState.time,
    });
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setDurationError(null);
    onCancel();
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        <QuickAddSelectField
          id="quick-add-activity-type"
          label="Тип активности"
          onClick={() => setActivitySheetOpen(true)}
          placeholder="Выберите активность"
          value={formState.activityType || undefined}
        />

        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="quick-add-activity-duration"
          >
            Длительность
          </label>
          <div className="relative mt-2">
            <input
              aria-describedby={
                durationValidationError
                  ? 'quick-add-activity-duration-error'
                  : undefined
              }
              aria-invalid={durationValidationError ? true : undefined}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-16 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              id="quick-add-activity-duration"
              inputMode="numeric"
              name="duration"
              onChange={(event) => {
                setDurationError(null);
                setFormState((current) => ({
                  ...current,
                  duration: event.target.value,
                }));
              }}
              placeholder="30"
              required
              value={formState.duration}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-slate-500">
              мин
            </span>
          </div>
          {durationValidationError ? (
            <p
              className="mt-1 text-sm text-rose-600"
              id="quick-add-activity-duration-error"
            >
              {durationValidationError}
            </p>
          ) : null}
        </div>

        <QuickAddTimeField
          id="quick-add-activity-time"
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

        <QuickAddTextAreaField
          counterThreshold={NOTE_COUNTER_THRESHOLD}
          id="quick-add-activity-note"
          label="Заметка"
          maxLength={NOTE_MAX_LENGTH}
          name="note"
          onChange={(note) => {
            setFormState((current) => ({
              ...current,
              note,
            }));
          }}
          placeholder="Например, после обеда"
          value={formState.note}
        />
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
        />
      </QuickAddFormLayout.Footer>

      {activitySheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setActivitySheetOpen(false)}
          onSelect={(activityType) => {
            setFormState((current) => ({
              ...current,
              activityType,
            }));
            setActivitySheetOpen(false);
          }}
          options={activityTypeOptions}
          selectedValue={formState.activityType || undefined}
          title="Активность"
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
