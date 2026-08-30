'use client';

import { INSULIN_PREPARATION_OTHER_ID } from '@diabetes-universe/medical-domain';
import {
  formErrorClass,
  formFieldClass,
  formHelperClass,
  formLabelClass,
} from '@diabetes-universe/ui';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';

import {
  resolveInsulinAdministrationContextOptions,
  resolveInsulinPreparationOptionGroups,
  type InsulinEditSelection,
  type InsulinPresentationLabels,
} from '../../lib/medical/insulin';
import type { TimelineEventEditErrors } from './timeline-event-detail-model';
import type { TimelineUiLabels } from './timeline-ui-labels';

export type TimelineInsulinEditLabels =
  TimelineUiLabels['detail']['form']['insulin'];

interface TimelineInsulinEditFieldsProps {
  readonly errors: TimelineEventEditErrors;
  readonly labels: TimelineInsulinEditLabels;
  /** Unmatched legacy `context` text preserved verbatim, when present. */
  readonly legacyContextText: string | null;
  readonly onChange: (selection: InsulinEditSelection) => void;
  readonly presentationLabels: InsulinPresentationLabels;
  readonly selection: InsulinEditSelection;
  /** `true` when the stored event carries no catalogue identity. */
  readonly storedPreparationIsUnmatched: boolean;
  readonly storedPreparation: string;
}

const fieldClass = `${formFieldClass} mt-2`;
const selectClass = `${fieldClass} appearance-none`;

function InsulinFieldError({
  id,
  message,
}: {
  readonly id: string;
  readonly message?: string;
}) {
  return message ? (
    <p className={formErrorClass} id={id} role="alert">
      {message}
    </p>
  ) : null;
}

export function TimelineInsulinEditFields({
  errors,
  labels,
  legacyContextText,
  onChange,
  presentationLabels,
  selection,
  storedPreparation,
  storedPreparationIsUnmatched,
}: TimelineInsulinEditFieldsProps) {
  const preparationGroups =
    resolveInsulinPreparationOptionGroups(presentationLabels);
  const contextOptions =
    resolveInsulinAdministrationContextOptions(presentationLabels);
  const showOtherName =
    selection.preparationId === INSULIN_PREPARATION_OTHER_ID;

  const handlePreparationChange = (value: string) => {
    onChange({
      ...selection,
      preparationId: value === '' ? null : (value as InsulinPreparationId),
    });
  };

  const handleContextChange = (value: string) => {
    onChange({
      ...selection,
      administrationContext:
        value === '' ? null : (value as InsulinAdministrationContext),
      contextEdited: true,
    });
  };

  return (
    <>
      <div>
        <label className={formLabelClass} htmlFor="timeline-edit-insulin-prep">
          {labels.preparationLabel}
        </label>
        <select
          className={selectClass}
          id="timeline-edit-insulin-prep"
          onChange={(event) => handlePreparationChange(event.target.value)}
          value={selection.preparationId ?? ''}
        >
          {storedPreparationIsUnmatched ? (
            <option value="">
              {`${labels.keepRecordedPreparation}: ${storedPreparation}`}
            </option>
          ) : null}
          {preparationGroups.map((group) => (
            <optgroup key={group.grouping} label={group.label}>
              {group.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {storedPreparationIsUnmatched ? (
          <p className={formHelperClass}>{labels.legacyPreparationHint}</p>
        ) : null}
      </div>

      {showOtherName ? (
        <div>
          <label
            className={formLabelClass}
            htmlFor="timeline-edit-insulin-other-name"
          >
            {labels.otherNameLabel}
          </label>
          <input
            aria-describedby={
              errors.otherName
                ? 'timeline-edit-insulin-other-name-error'
                : undefined
            }
            aria-invalid={errors.otherName ? true : undefined}
            className={fieldClass}
            id="timeline-edit-insulin-other-name"
            maxLength={120}
            onChange={(event) =>
              onChange({ ...selection, otherName: event.target.value })
            }
            value={selection.otherName}
          />
          <InsulinFieldError
            id="timeline-edit-insulin-other-name-error"
            message={errors.otherName}
          />
        </div>
      ) : null}

      <div>
        <label className={formLabelClass} htmlFor="timeline-edit-insulin-dose">
          {labels.doseLabel}
        </label>
        <input
          aria-describedby={
            errors.dose ? 'timeline-edit-insulin-dose-error' : undefined
          }
          aria-invalid={errors.dose ? true : undefined}
          className={fieldClass}
          id="timeline-edit-insulin-dose"
          inputMode="decimal"
          onChange={(event) =>
            onChange({ ...selection, dose: event.target.value })
          }
          value={selection.dose}
        />
        <InsulinFieldError
          id="timeline-edit-insulin-dose-error"
          message={errors.dose}
        />
      </div>

      <div>
        <label
          className={formLabelClass}
          htmlFor="timeline-edit-insulin-context"
        >
          {labels.contextLabel}
        </label>
        <select
          className={selectClass}
          id="timeline-edit-insulin-context"
          onChange={(event) => handleContextChange(event.target.value)}
          value={selection.administrationContext ?? ''}
        >
          {legacyContextText === null &&
          selection.administrationContext === null &&
          !selection.contextEdited ? (
            <option value="">{labels.noRecordedContext}</option>
          ) : legacyContextText === null ? null : (
            <option value="">
              {`${labels.keepRecordedContext}: ${legacyContextText}`}
            </option>
          )}
          {contextOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        {legacyContextText === null ? null : (
          <p className={formHelperClass}>{labels.legacyContextHint}</p>
        )}
      </div>
    </>
  );
}
