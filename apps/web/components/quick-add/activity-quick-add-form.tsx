'use client';

import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddSelectField,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import { activityTypeOptions } from '../../lib/quick-add/activity-type-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  ACTIVITY_DURATION_MAX_MINUTES,
  parseActivityDurationInput,
} from '../../lib/quick-add/format-activity';
import type { ActivityQuickAddSubmitRequest } from '../../lib/quick-add/activity-quick-add-submit';
import type { ActivityQuickAddFormState } from '../../lib/quick-add/activity-quick-add-submit';
import {
  createActivityQuickAddSubmitIdentityState,
  persistPreparedActivityQuickAddSubmit,
  prepareActivityQuickAddSubmitWithIdentity,
  resetActivityQuickAddSubmitIdentity,
} from '../../lib/quick-add/activity-quick-add-submit-controller';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveActivityQuickAddSaveLabels } from './activity-quick-add-labels';

const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

interface ActivityQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (request: ActivityQuickAddSubmitRequest) => Promise<void>;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
}

function createInitialState(): ActivityQuickAddFormState {
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
  onSubmittingChange,
}: ActivityQuickAddFormProps) {
  const localization = useLocalization();
  const saveLabels = useMemo(
    () => resolveActivityQuickAddSaveLabels(localization),
    [localization],
  );
  const [formState, setFormState] =
    useState<ActivityQuickAddFormState>(createInitialState);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitIdentityRef = useRef(createActivityQuickAddSubmitIdentityState());
  const isSubmittingRef = useRef(false);
  const parsedDuration = parseActivityDurationInput(formState.duration);
  const hasDuration = formState.duration.trim().length > 0;
  const durationValidationError =
    durationError ??
    (hasDuration && parsedDuration === null
      ? `Введите продолжительность от 1 до ${ACTIVITY_DURATION_MAX_MINUTES} минут`
      : null);
  const canSubmit =
    formState.activityType.length > 0 &&
    parsedDuration !== null &&
    formState.time.length > 0;
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

    const prepared = prepareActivityQuickAddSubmitWithIdentity({
      formState,
      identity: submitIdentityRef.current,
    });

    if (prepared.type === 'invalid') {
      setDurationError(
        prepared.message ??
          `Введите продолжительность от 1 до ${ACTIVITY_DURATION_MAX_MINUTES} минут`,
      );
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingState(true);
    setSaveError(null);
    setDurationError(null);
    setActivitySheetOpen(false);

    const result = await persistPreparedActivityQuickAddSubmit({
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
    setDurationError(null);
    setSaveError(null);
    resetActivityQuickAddSubmitIdentity(submitIdentityRef.current);
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
              id="quick-add-activity-saving"
              role="status"
            >
              {saveLabels.saving}
            </p>
          ) : null}

          {saveError ? (
            <section
              aria-labelledby="quick-add-activity-save-error-title"
              className="space-y-1"
              role="alert"
            >
              <h3
                className="text-sm font-semibold text-rose-700"
                id="quick-add-activity-save-error-title"
              >
                {saveLabels.saveErrorTitle}
              </h3>
              <p
                className="text-sm text-rose-600"
                id="quick-add-activity-save-error-description"
              >
                {saveError}
              </p>
            </section>
          ) : null}

          <QuickAddSelectField
            id="quick-add-activity-type"
            label="Вид активности"
            onClick={() => {
              if (controlsDisabled) {
                return;
              }

              setActivitySheetOpen(true);
            }}
            placeholder="Выберите вид активности"
            value={formState.activityType || undefined}
          />

          <div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="quick-add-activity-duration"
            >
              Продолжительность, мин
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
                disabled={controlsDisabled}
                id="quick-add-activity-duration"
                inputMode="numeric"
                name="duration"
                onChange={(event) => {
                  if (controlsDisabled) {
                    return;
                  }

                  setDurationError(null);
                  noteFailedAttemptFieldEdit();
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
            disabled={controlsDisabled}
            id="quick-add-activity-time"
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

          <QuickAddTextAreaField
            counterThreshold={NOTE_COUNTER_THRESHOLD}
            id="quick-add-activity-note"
            label="Заметка"
            maxLength={NOTE_MAX_LENGTH}
            name="note"
            onChange={(note) => {
              if (controlsDisabled) {
                return;
              }

              noteFailedAttemptFieldEdit();
              setFormState((current) => ({
                ...current,
                note,
              }));
            }}
            placeholder="Необязательно"
            value={formState.note}
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
              ? 'quick-add-activity-saving'
              : saveError
                ? 'quick-add-activity-save-error-description'
                : undefined
          }
          submitDisabled={!canSubmit}
          submittingLabel={saveLabels.saving}
        />
      </QuickAddFormLayout.Footer>

      {activitySheetOpen && !controlsDisabled ? (
        <QuickAddOptionSheet
          onClose={() => setActivitySheetOpen(false)}
          onSelect={(activityType) => {
            noteFailedAttemptFieldEdit();
            setFormState((current) => ({
              ...current,
              activityType,
            }));
            setActivitySheetOpen(false);
          }}
          options={activityTypeOptions}
          selectedValue={formState.activityType || undefined}
          title="Вид активности"
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
