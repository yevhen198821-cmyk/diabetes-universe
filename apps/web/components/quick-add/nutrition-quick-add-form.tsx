'use client';

import type {
  NutritionItemSnapshot,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import {
  parseNutritionManualCarbsInput,
  parseNutritionManualDecimalInput,
} from '../../lib/medical/nutrition/nutrition-manual-carbs-input';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  formatNutritionCarbs,
  formatNutritionCarbsPer100Grams,
} from '../../lib/quick-add/format-nutrition';
import {
  findNutritionDemoProductById,
  NUTRITION_DEMO_PRODUCT_IDS,
  type NutritionDemoProductId,
} from '../../lib/quick-add/nutrition-demo-products';
import {
  buildNutritionQuickAddItemSnapshot,
  isNutritionQuickAddMealType,
  NUTRITION_QUICK_ADD_MEAL_TYPES,
  prepareNutritionQuickAddSubmit,
  sumNutritionItemCarbohydrates,
  type NutritionQuickAddMealType,
} from '../../lib/quick-add/nutrition-quick-add-submit';
import { formField, formLabel } from '../timeline/ui-styles';
import { resolveNutritionQuickAddLabels } from './nutrition-quick-add-labels';

const MAX_ITEM_WEIGHT_GRAMS = 3000;
const MAX_ITEM_ROWS = 10;
const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

type NutritionFormMode = 'manual' | 'items';

interface NutritionQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: NutritionQuickAddEntry) => void;
}

interface NutritionItemRowState {
  readonly carbsPer100Grams: number | null;
  readonly demoProductId: NutritionDemoProductId | '';
  readonly id: string;
  readonly name: string;
  readonly weight: string;
}

interface NutritionFormState {
  readonly itemRows: readonly NutritionItemRowState[];
  readonly manualCarbs: string;
  readonly mealType: NutritionQuickAddMealType | '';
  readonly mode: NutritionFormMode;
  readonly note: string;
  readonly time: string;
}

let itemRowIdCounter = 0;

function createItemRow(): NutritionItemRowState {
  itemRowIdCounter += 1;

  return {
    carbsPer100Grams: null,
    demoProductId: '',
    id: `nutrition-item-${itemRowIdCounter}`,
    name: '',
    weight: '',
  };
}

function createInitialState(): NutritionFormState {
  return {
    itemRows: [createItemRow()],
    manualCarbs: '',
    mealType: '',
    mode: 'manual',
    note: '',
    time: getCurrentTimeString(),
  };
}

function getItemRowCarbs(row: NutritionItemRowState): number | null {
  const weightGrams = parseNutritionManualDecimalInput(
    row.weight,
    MAX_ITEM_WEIGHT_GRAMS,
  );

  if (weightGrams === null || row.carbsPer100Grams === null) {
    return null;
  }

  return (weightGrams * row.carbsPer100Grams) / 100;
}

function isItemRowEmpty(row: NutritionItemRowState): boolean {
  return row.demoProductId.length === 0 && row.weight.trim().length === 0;
}

function isItemRowValid(row: NutritionItemRowState): boolean {
  return getItemRowCarbs(row) !== null && row.name.length > 0;
}

function buildItemSnapshot(
  row: NutritionItemRowState,
): NutritionItemSnapshot | null {
  const weightGrams = parseNutritionManualDecimalInput(
    row.weight,
    MAX_ITEM_WEIGHT_GRAMS,
  );

  if (
    weightGrams === null ||
    row.carbsPer100Grams === null ||
    row.name.length === 0
  ) {
    return null;
  }

  return buildNutritionQuickAddItemSnapshot({
    carbsPer100Grams: row.carbsPer100Grams,
    itemId: row.id,
    name: row.name,
    weightGrams,
  });
}

export function NutritionQuickAddForm({
  onCancel,
  onSubmit,
}: NutritionQuickAddFormProps) {
  const formatter = useFormatter();
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveNutritionQuickAddLabels(localization),
    [localization],
  );
  const [formState, setFormState] =
    useState<NutritionFormState>(createInitialState);
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [selectedItemRowId, setSelectedItemRowId] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedManualCarbs = parseNutritionManualCarbsInput(
    formState.manualCarbs,
  );
  const manualCarbsHasValue = formState.manualCarbs.trim().length > 0;
  const manualCarbsInvalid = manualCarbsHasValue && parsedManualCarbs === null;
  const activeItemRows = formState.itemRows.filter(
    (row) => !isItemRowEmpty(row),
  );
  const itemRowsValid = activeItemRows.every(isItemRowValid);
  const itemSnapshots = activeItemRows
    .map(buildItemSnapshot)
    .filter((entry): entry is NutritionItemSnapshot => entry !== null);
  const itemsTotalCarbs = sumNutritionItemCarbohydrates(itemSnapshots);
  const mealTypeSelected = isNutritionQuickAddMealType(formState.mealType);
  const canSubmitManual =
    mealTypeSelected && parsedManualCarbs !== null && formState.time.length > 0;
  const canSubmitItems =
    mealTypeSelected &&
    activeItemRows.length > 0 &&
    itemRowsValid &&
    itemsTotalCarbs > 0 &&
    formState.time.length > 0;
  const canSubmit =
    formState.mode === 'manual' ? canSubmitManual : canSubmitItems;
  const selectedItemRow = selectedItemRowId
    ? formState.itemRows.find((row) => row.id === selectedItemRowId)
    : undefined;
  const showNoteCounter = formState.note.length >= NOTE_COUNTER_THRESHOLD;
  const mealOptions = NUTRITION_QUICK_ADD_MEAL_TYPES.map((mealType) => ({
    label: labels.mealTypes[mealType],
    value: mealType,
  }));
  const itemOptions = NUTRITION_DEMO_PRODUCT_IDS.map((productId) => ({
    label: labels.demoProducts[productId],
    value: productId,
  }));
  const selectedMealLabel = mealTypeSelected
    ? labels.mealTypes[formState.mealType]
    : labels.mealTypePlaceholder;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!canSubmit || !mealTypeSelected) {
      return;
    }

    const note = formState.note.trim();

    if (formState.mode === 'manual' && parsedManualCarbs !== null) {
      const prepared = prepareNutritionQuickAddSubmit({
        carbohydratesGrams: parsedManualCarbs,
        mealType: formState.mealType,
        note,
        time: formState.time,
      });

      if (!prepared.ok) {
        setSubmitError(labels.carbsError);
        return;
      }

      onSubmit(prepared.value);
      return;
    }

    if (formState.mode === 'items') {
      const prepared = prepareNutritionQuickAddSubmit({
        carbohydratesGrams: itemsTotalCarbs,
        items: itemSnapshots,
        mealType: formState.mealType,
        note,
        time: formState.time,
      });

      if (!prepared.ok) {
        setSubmitError(labels.carbsError);
        return;
      }

      onSubmit(prepared.value);
    }
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setSelectedItemRowId(null);
    setSubmitError(null);
    onCancel();
  };

  const updateItemRow = (
    rowId: string,
    update: Partial<NutritionItemRowState>,
  ) => {
    setFormState((current) => ({
      ...current,
      itemRows: current.itemRows.map((row) =>
        row.id === rowId ? { ...row, ...update } : row,
      ),
    }));
  };

  const handleItemSelect = (productId: NutritionDemoProductId) => {
    const product = findNutritionDemoProductById(productId);

    if (!product || !selectedItemRowId) {
      setSelectedItemRowId(null);
      return;
    }

    updateItemRow(selectedItemRowId, {
      carbsPer100Grams: product.carbsPer100Grams,
      demoProductId: product.id,
      name: labels.demoProducts[product.id],
    });
    setSelectedItemRowId(null);
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        {submitError ? (
          <p className="text-sm text-rose-600" role="alert">
            {submitError}
          </p>
        ) : null}

        <fieldset>
          <legend className="sr-only">{labels.modeLegend}</legend>
          <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {(
              [
                ['manual', labels.modeManual],
                ['items', labels.modeItems],
              ] as const
            ).map(([mode, label]) => (
              <label
                className={`relative cursor-pointer rounded-xl px-3 py-2.5 text-center text-sm font-semibold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700 ${
                  formState.mode === mode
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
                key={mode}
              >
                <input
                  checked={formState.mode === mode}
                  className="sr-only"
                  name="nutrition-entry-mode"
                  onChange={() => {
                    setFormState((current) => ({
                      ...current,
                      mode,
                    }));
                  }}
                  type="radio"
                  value={mode}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span className={formLabel} id="quick-add-nutrition-meal-label">
            {labels.mealTypeLabel}
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-nutrition-meal-label quick-add-nutrition-meal-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              mealTypeSelected ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setMealSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-nutrition-meal-value">{selectedMealLabel}</span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        {formState.mode === 'manual' ? (
          <div>
            <label
              className={formLabel}
              htmlFor="quick-add-nutrition-manual-carbs"
            >
              {labels.carbsLabel}
            </label>
            <div className="relative mt-2">
              <input
                aria-describedby={
                  manualCarbsInvalid
                    ? 'quick-add-nutrition-manual-carbs-error'
                    : undefined
                }
                aria-invalid={manualCarbsInvalid ? true : undefined}
                autoComplete="off"
                className={`${formField} pr-12 ${
                  manualCarbsHasValue
                    ? 'font-semibold text-slate-950'
                    : 'text-slate-900'
                }`}
                enterKeyHint="done"
                id="quick-add-nutrition-manual-carbs"
                inputMode="decimal"
                name="manualCarbs"
                onChange={(event) => {
                  setSubmitError(null);
                  setFormState((current) => ({
                    ...current,
                    manualCarbs: event.target.value,
                  }));
                }}
                placeholder={labels.carbsPlaceholder}
                required={formState.mode === 'manual'}
                type="text"
                value={formState.manualCarbs}
              />
              <span
                className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                  manualCarbsHasValue ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {labels.carbsUnit}
              </span>
            </div>
            {manualCarbsInvalid ? (
              <p
                className="mt-2 text-sm text-rose-600"
                id="quick-add-nutrition-manual-carbs-error"
                role="alert"
              >
                {labels.carbsError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {labels.itemsHeading}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {labels.itemsHelp}
              </p>
            </div>

            <div className="space-y-2">
              {formState.itemRows.map((row, index) => {
                const rowCarbs = getItemRowCarbs(row);
                const weightHasValue = row.weight.trim().length > 0;
                const weightInvalid =
                  weightHasValue &&
                  parseNutritionManualDecimalInput(
                    row.weight,
                    MAX_ITEM_WEIGHT_GRAMS,
                  ) === null;
                const itemAriaLabel = `${labels.itemAriaLabel} ${index + 1}`;

                return (
                  <section
                    aria-label={itemAriaLabel}
                    className="space-y-2 rounded-2xl bg-slate-50/80 p-3"
                    key={row.id}
                  >
                    <div>
                      <span
                        className={formLabel}
                        id={`quick-add-nutrition-item-${row.id}-label`}
                      >
                        {labels.itemLabel}
                      </span>
                      <button
                        aria-describedby={
                          row.carbsPer100Grams !== null
                            ? `quick-add-nutrition-item-${row.id}-carbs`
                            : undefined
                        }
                        aria-haspopup="dialog"
                        aria-labelledby={`quick-add-nutrition-item-${row.id}-label quick-add-nutrition-item-${row.id}-value`}
                        className={`mt-1.5 flex min-h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium transition hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none ${
                          row.name ? 'text-slate-950' : 'text-slate-400'
                        }`}
                        onClick={() => setSelectedItemRowId(row.id)}
                        type="button"
                      >
                        <span
                          className="min-w-0 pr-3"
                          id={`quick-add-nutrition-item-${row.id}-value`}
                        >
                          <span className="block truncate">
                            {row.name || labels.itemPlaceholder}
                          </span>
                          {row.carbsPer100Grams !== null ? (
                            <span
                              className="mt-0.5 block truncate text-xs font-normal text-slate-500"
                              id={`quick-add-nutrition-item-${row.id}-carbs`}
                            >
                              {formatNutritionCarbsPer100Grams(
                                row.carbsPer100Grams,
                                formatter,
                                labels.carbsPer100Label,
                              )}
                            </span>
                          ) : null}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className="text-slate-400"
                          size={18}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
                      <div>
                        <label
                          className={formLabel}
                          htmlFor={`quick-add-nutrition-weight-${row.id}`}
                        >
                          {labels.weightLabel}
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            aria-describedby={
                              weightInvalid
                                ? `quick-add-nutrition-weight-${row.id}-error`
                                : undefined
                            }
                            aria-invalid={weightInvalid ? true : undefined}
                            autoComplete="off"
                            className={`${formField} bg-white pr-12 ${
                              weightHasValue
                                ? 'font-semibold text-slate-950'
                                : 'text-slate-900'
                            }`}
                            enterKeyHint="done"
                            id={`quick-add-nutrition-weight-${row.id}`}
                            inputMode="decimal"
                            name={`itemWeight-${row.id}`}
                            onChange={(event) => {
                              updateItemRow(row.id, {
                                weight: event.target.value,
                              });
                            }}
                            placeholder={labels.weightPlaceholder}
                            type="text"
                            value={row.weight}
                          />
                          <span
                            className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                              weightHasValue
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {labels.carbsUnit}
                          </span>
                        </div>
                        {weightInvalid ? (
                          <p
                            className="mt-2 text-sm text-rose-600"
                            id={`quick-add-nutrition-weight-${row.id}-error`}
                            role="alert"
                          >
                            {labels.weightError}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <span className={formLabel}>
                          {labels.itemCarbsLabel}
                        </span>
                        <p className="mt-1.5 flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950">
                          {rowCarbs === null
                            ? '—'
                            : `${formatNutritionCarbs(rowCarbs, formatter)} ${labels.carbsUnit}`}
                        </p>
                      </div>
                    </div>

                    {formState.itemRows.length > 1 ? (
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        onClick={() => {
                          setFormState((current) => ({
                            ...current,
                            itemRows: current.itemRows.filter(
                              (itemRow) => itemRow.id !== row.id,
                            ),
                          }));
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        {labels.removeItem}
                      </button>
                    ) : null}
                  </section>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-slate-600">
                {labels.totalCarbsLabel}
              </span>
              <span className="text-xl font-bold text-slate-950">
                {formatNutritionCarbs(itemsTotalCarbs, formatter)}{' '}
                {labels.carbsUnit}
              </span>
            </div>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={formState.itemRows.length >= MAX_ITEM_ROWS}
              onClick={() => {
                setFormState((current) => ({
                  ...current,
                  itemRows: [...current.itemRows, createItemRow()],
                }));
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              {labels.addItem}
            </button>
          </div>
        )}

        <QuickAddTimeField
          id="quick-add-nutrition-time"
          label={labels.timeLabel}
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

        <div>
          <label className={formLabel} htmlFor="quick-add-nutrition-note">
            {labels.noteLabel} ({labels.noteOptional})
          </label>
          <textarea
            className={`${formField} mt-2 min-h-24 resize-none py-3`}
            id="quick-add-nutrition-note"
            maxLength={NOTE_MAX_LENGTH}
            name="note"
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                note: event.target.value,
              }));
            }}
            placeholder={labels.notePlaceholder}
            value={formState.note}
          />
          {showNoteCounter ? (
            <p className="mt-1 text-right text-xs text-slate-500">
              {formState.note.length}/{NOTE_MAX_LENGTH}
            </p>
          ) : null}
        </div>
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          cancelLabel={labels.cancel}
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
          submitLabel={labels.save}
        />
      </QuickAddFormLayout.Footer>

      {mealSheetOpen ? (
        <QuickAddOptionSheet<NutritionQuickAddMealType>
          onClose={() => setMealSheetOpen(false)}
          onSelect={(mealType) => {
            setFormState((current) => ({
              ...current,
              mealType,
            }));
            setMealSheetOpen(false);
          }}
          options={mealOptions}
          selectedValue={mealTypeSelected ? formState.mealType : undefined}
          title={labels.mealTypeSheetTitle}
        />
      ) : null}

      {selectedItemRowId ? (
        <QuickAddOptionSheet<NutritionDemoProductId>
          onClose={() => setSelectedItemRowId(null)}
          onSelect={handleItemSelect}
          options={itemOptions}
          selectedValue={selectedItemRow?.demoProductId || undefined}
          title={labels.itemSheetTitle}
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
