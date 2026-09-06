'use client';

import {
  formErrorClass,
  formFieldClass,
  formLabelClass,
} from '@diabetes-universe/ui';
import type { NutritionMealType } from '@diabetes-universe/types';
import { type ChangeEvent } from 'react';

import {
  createAddedNutritionEditItem,
  isUnchangedNutritionNumericInput,
  type NutritionTimelineEditErrors,
  type NutritionTimelineEventEditDraft,
} from '../../lib/medical/nutrition/nutrition-timeline-edit-model';
import { createNutritionEditItemId } from '../../lib/medical/nutrition/nutrition-timeline-adoption';
import { NUTRITION_QUICK_ADD_MEAL_TYPES } from '../../lib/quick-add/nutrition-quick-add-submit';
import type { TimelineUiLabels } from './timeline-ui-labels';

const fieldClass = `${formFieldClass} mt-2`;
const labelClass = formLabelClass;

const MANUAL_MEAL_TYPES = NUTRITION_QUICK_ADD_MEAL_TYPES;

function FieldError({
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

export function TimelineNutritionEditFields({
  disabled,
  draft,
  errors,
  labels,
  mealTypeLabels,
  onChange,
}: {
  readonly disabled: boolean;
  readonly draft: NutritionTimelineEventEditDraft;
  readonly errors: NutritionTimelineEditErrors;
  readonly labels: TimelineUiLabels['detail']['form']['nutrition'];
  readonly mealTypeLabels: Readonly<Record<NutritionMealType, string>>;
  readonly onChange: (draft: NutritionTimelineEventEditDraft) => void;
}) {
  const mealTypes: readonly NutritionMealType[] =
    draft.mealType === 'unspecified'
      ? [...MANUAL_MEAL_TYPES, 'unspecified']
      : MANUAL_MEAL_TYPES;

  const updateCarbs = (event: ChangeEvent<HTMLInputElement>) => {
    const carbohydratesGrams = event.target.value;

    onChange({
      ...draft,
      carbsEdited: !isUnchangedNutritionNumericInput(
        carbohydratesGrams,
        draft.storedCarbohydratesGrams,
      ),
      carbohydratesGrams,
    });
  };

  return (
    <>
      {draft.mealTypeSource === 'unknown' ? (
        <p className="text-text-secondary text-sm" role="status">
          {labels.legacyMealGuidance}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="timeline-nutrition-edit-meal">
          {labels.mealTypeLabel}
        </label>
        <select
          aria-describedby={
            errors.mealType ? 'timeline-nutrition-edit-meal-error' : undefined
          }
          aria-invalid={errors.mealType ? true : undefined}
          className={fieldClass}
          disabled={disabled}
          id="timeline-nutrition-edit-meal"
          onChange={(event) =>
            onChange({
              ...draft,
              mealType: event.target.value as NutritionMealType | '',
            })
          }
          value={draft.mealType}
        >
          {draft.mealType === '' ? (
            <option value="">{labels.mealTypePlaceholder}</option>
          ) : null}
          {mealTypes.map((mealType) => (
            <option key={mealType} value={mealType}>
              {mealTypeLabels[mealType]}
            </option>
          ))}
        </select>
        <FieldError
          id="timeline-nutrition-edit-meal-error"
          message={errors.mealType}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="timeline-nutrition-edit-carbs">
          {labels.carbsLabel}
        </label>
        <input
          aria-describedby={
            errors.carbs ? 'timeline-nutrition-edit-carbs-error' : undefined
          }
          aria-invalid={errors.carbs ? true : undefined}
          className={fieldClass}
          disabled={disabled}
          id="timeline-nutrition-edit-carbs"
          inputMode="decimal"
          onChange={updateCarbs}
          value={draft.carbohydratesGrams}
        />
        <FieldError
          id="timeline-nutrition-edit-carbs-error"
          message={errors.carbs}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="timeline-nutrition-edit-note">
          {labels.noteLabel}
        </label>
        <textarea
          className={`${fieldClass} min-h-24 py-3`}
          disabled={disabled}
          id="timeline-nutrition-edit-note"
          maxLength={200}
          onChange={(event) =>
            onChange({
              ...draft,
              note: event.target.value,
            })
          }
          value={draft.note}
        />
      </div>

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-body-small text-text-secondary font-medium">
          {labels.itemsHeading}
        </legend>
        {draft.items.map((item, index) => (
          <div
            className="border-border-subtle space-y-3 rounded-xl border p-3"
            key={item.itemId}
          >
            <div>
              <label
                className={labelClass}
                htmlFor={`timeline-nutrition-edit-item-name-${item.itemId}`}
              >
                {labels.itemNameLabel}
              </label>
              <input
                aria-describedby={
                  errors.itemName
                    ? `timeline-nutrition-edit-item-name-error-${item.itemId}`
                    : undefined
                }
                aria-invalid={errors.itemName ? true : undefined}
                className={fieldClass}
                id={`timeline-nutrition-edit-item-name-${item.itemId}`}
                onChange={(event) => {
                  const items = draft.items.map((candidate, candidateIndex) =>
                    candidateIndex === index
                      ? {
                          ...candidate,
                          name: event.target.value,
                          nameEdited:
                            event.target.value.trim() !==
                            (candidate.historicalSnapshot?.name ?? ''),
                        }
                      : candidate,
                  );

                  onChange({
                    ...draft,
                    items,
                    itemsEdited: true,
                  });
                }}
                value={item.name}
              />
            </div>
            <div>
              <label
                className={labelClass}
                htmlFor={`timeline-nutrition-edit-item-carbs-${item.itemId}`}
              >
                {labels.itemCarbsLabel}
              </label>
              <input
                aria-describedby={
                  errors.itemCarbs
                    ? `timeline-nutrition-edit-item-carbs-error-${item.itemId}`
                    : undefined
                }
                aria-invalid={errors.itemCarbs ? true : undefined}
                className={fieldClass}
                id={`timeline-nutrition-edit-item-carbs-${item.itemId}`}
                inputMode="decimal"
                onChange={(event) => {
                  const items = draft.items.map((candidate, candidateIndex) =>
                    candidateIndex === index
                      ? {
                          ...candidate,
                          carbsEdited:
                            candidate.historicalSnapshot === null ||
                            !isUnchangedNutritionNumericInput(
                              event.target.value,
                              candidate.historicalSnapshot.carbohydratesGrams,
                            ),
                          carbohydratesGrams: event.target.value,
                        }
                      : candidate,
                  );

                  onChange({
                    ...draft,
                    items,
                    itemsEdited: true,
                  });
                }}
                value={item.carbohydratesGrams}
              />
            </div>
            <button
              className="text-status-danger text-sm font-semibold"
              onClick={() =>
                onChange({
                  ...draft,
                  items: draft.items.filter(
                    (candidate) => candidate.itemId !== item.itemId,
                  ),
                  itemsEdited: true,
                })
              }
              type="button"
            >
              {labels.removeItem}
            </button>
          </div>
        ))}
        <button
          className="text-interactive-primary text-sm font-semibold"
          onClick={() =>
            onChange({
              ...draft,
              items: [
                ...draft.items,
                createAddedNutritionEditItem({
                  carbohydratesGrams: '',
                  itemId: createNutritionEditItemId(),
                  name: '',
                }),
              ],
              itemsEdited: true,
            })
          }
          type="button"
        >
          {labels.addItem}
        </button>
        <FieldError
          id="timeline-nutrition-edit-items-error"
          message={errors.itemName ?? errors.itemCarbs}
        />
      </fieldset>
    </>
  );
}
