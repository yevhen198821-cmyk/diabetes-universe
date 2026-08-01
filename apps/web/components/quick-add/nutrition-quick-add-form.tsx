'use client';

import type {
  NutritionEntryMode,
  NutritionProductEntry,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddOptionSheet,
} from '@diabetes-universe/ui';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  findNutritionDemoProductByName,
  nutritionDemoProductOptions,
} from '../../lib/quick-add/nutrition-demo-products';
import { nutritionMealOptions } from '../../lib/quick-add/nutrition-meal-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  calculateNutritionProductCarbs,
  formatNutritionCarbs,
  parseNutritionDecimalInput,
} from '../../lib/quick-add/format-nutrition';
import { openNativeTimePicker } from '../../lib/quick-add/open-native-time-picker';
import { formField, formLabel } from '../timeline/ui-styles';

const MAX_MANUAL_CARBS_GRAMS = 500;
const MAX_PRODUCT_WEIGHT_GRAMS = 3000;
const MAX_PRODUCT_ROWS = 10;
const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

interface NutritionQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: NutritionQuickAddEntry) => void;
}

interface NutritionProductRowState {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly carbsPer100Grams: number | null;
  readonly weight: string;
}

interface NutritionFormState {
  readonly mode: NutritionEntryMode;
  readonly mealType: string;
  readonly manualCarbs: string;
  readonly time: string;
  readonly note: string;
  readonly productRows: readonly NutritionProductRowState[];
}

let productRowIdCounter = 0;

function createProductRow(): NutritionProductRowState {
  productRowIdCounter += 1;

  return {
    carbsPer100Grams: null,
    id: `nutrition-product-row-${productRowIdCounter}`,
    productId: '',
    productName: '',
    weight: '',
  };
}

function createInitialState(): NutritionFormState {
  return {
    manualCarbs: '',
    mealType: '',
    mode: 'manual',
    note: '',
    productRows: [createProductRow()],
    time: getCurrentTimeString(),
  };
}

function getProductRowCarbs(row: NutritionProductRowState): number | null {
  const weightGrams = parseNutritionDecimalInput(
    row.weight,
    MAX_PRODUCT_WEIGHT_GRAMS,
  );

  if (weightGrams === null || row.carbsPer100Grams === null) {
    return null;
  }

  return calculateNutritionProductCarbs(weightGrams, row.carbsPer100Grams);
}

function isProductRowValid(row: NutritionProductRowState): boolean {
  return getProductRowCarbs(row) !== null && row.productId.length > 0;
}

function buildProductEntry(
  row: NutritionProductRowState,
): NutritionProductEntry | null {
  const weightGrams = parseNutritionDecimalInput(
    row.weight,
    MAX_PRODUCT_WEIGHT_GRAMS,
  );
  const calculatedCarbsGrams = getProductRowCarbs(row);

  if (
    weightGrams === null ||
    calculatedCarbsGrams === null ||
    row.carbsPer100Grams === null ||
    !row.productId ||
    !row.productName
  ) {
    return null;
  }

  return {
    calculatedCarbsGrams,
    carbsPer100Grams: row.carbsPer100Grams,
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    weightGrams,
  };
}

function getProductsTotalCarbs(
  rows: readonly NutritionProductRowState[],
): number {
  return rows.reduce((total, row) => {
    const rowCarbs = getProductRowCarbs(row);

    return total + (rowCarbs ?? 0);
  }, 0);
}

export function NutritionQuickAddForm({
  onCancel,
  onSubmit,
}: NutritionQuickAddFormProps) {
  const [formState, setFormState] =
    useState<NutritionFormState>(createInitialState);
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [selectedProductRowId, setSelectedProductRowId] = useState<
    string | null
  >(null);

  const parsedManualCarbs = parseNutritionDecimalInput(
    formState.manualCarbs,
    MAX_MANUAL_CARBS_GRAMS,
  );
  const manualCarbsHasValue = formState.manualCarbs.trim().length > 0;
  const manualCarbsInvalid = manualCarbsHasValue && parsedManualCarbs === null;
  const productRowsValid = formState.productRows.every(isProductRowValid);
  const productEntries = formState.productRows
    .map(buildProductEntry)
    .filter((entry): entry is NutritionProductEntry => entry !== null);
  const productsTotalCarbs = getProductsTotalCarbs(formState.productRows);
  const canSubmitManual =
    formState.mealType.length > 0 &&
    parsedManualCarbs !== null &&
    formState.time.length > 0;
  const canSubmitProducts =
    formState.mealType.length > 0 &&
    productEntries.length > 0 &&
    productRowsValid &&
    productsTotalCarbs > 0 &&
    formState.time.length > 0;
  const canSubmit =
    formState.mode === 'manual' ? canSubmitManual : canSubmitProducts;
  const selectedProductRow = selectedProductRowId
    ? formState.productRows.find((row) => row.id === selectedProductRowId)
    : undefined;
  const showNoteCounter = formState.note.length >= NOTE_COUNTER_THRESHOLD;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const note = formState.note.trim();

    if (formState.mode === 'manual' && parsedManualCarbs !== null) {
      onSubmit({
        carbohydratesGrams: parsedManualCarbs,
        mealType: formState.mealType,
        mode: 'manual',
        note: note || undefined,
        time: formState.time,
      });
      return;
    }

    if (formState.mode === 'products') {
      onSubmit({
        carbohydratesGrams: productsTotalCarbs,
        mealType: formState.mealType,
        mode: 'products',
        note: note || undefined,
        products: productEntries,
        time: formState.time,
      });
    }
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setSelectedProductRowId(null);
    onCancel();
  };

  const updateProductRow = (
    rowId: string,
    update: Partial<NutritionProductRowState>,
  ) => {
    setFormState((current) => ({
      ...current,
      productRows: current.productRows.map((row) =>
        row.id === rowId ? { ...row, ...update } : row,
      ),
    }));
  };

  const handleProductSelect = (productName: string) => {
    const product = findNutritionDemoProductByName(productName);

    if (!product || !selectedProductRowId) {
      setSelectedProductRowId(null);
      return;
    }

    updateProductRow(selectedProductRowId, {
      carbsPer100Grams: product.carbsPer100Grams,
      productId: product.id,
      productName: product.name,
    });
    setSelectedProductRowId(null);
  };

  return (
    <form
      className="flex min-h-0 flex-col overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="min-h-0 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <fieldset>
          <legend className="sr-only">Способ добавления углеводов</legend>
          <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {(
              [
                ['manual', 'Вручную'],
                ['products', 'По продуктам'],
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
            Тип приёма пищи
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-nutrition-meal-label quick-add-nutrition-meal-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.mealType ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setMealSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-nutrition-meal-value">
              {formState.mealType || 'Выберите тип приёма пищи'}
            </span>
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
              Углеводы
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
                  setFormState((current) => ({
                    ...current,
                    manualCarbs: event.target.value,
                  }));
                }}
                placeholder="42"
                required={formState.mode === 'manual'}
                type="text"
                value={formState.manualCarbs}
              />
              <span
                className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                  manualCarbsHasValue ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                г
              </span>
            </div>
            {manualCarbsInvalid ? (
              <p
                className="mt-2 text-sm text-rose-600"
                id="quick-add-nutrition-manual-carbs-error"
              >
                Введите углеводы больше 0 и не более 500 г
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Продукты</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Demo-каталог используется только для интерфейса и не является
                медицинской или нормативной базой продуктов.
              </p>
            </div>

            <div className="space-y-3">
              {formState.productRows.map((row, index) => {
                const rowCarbs = getProductRowCarbs(row);
                const weightHasValue = row.weight.trim().length > 0;
                const weightInvalid =
                  weightHasValue &&
                  parseNutritionDecimalInput(
                    row.weight,
                    MAX_PRODUCT_WEIGHT_GRAMS,
                  ) === null;

                return (
                  <section
                    aria-label={`Продукт ${index + 1}`}
                    className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    key={row.id}
                  >
                    <div>
                      <span
                        className={formLabel}
                        id={`quick-add-nutrition-product-${row.id}-label`}
                      >
                        Продукт
                      </span>
                      <button
                        aria-haspopup="dialog"
                        aria-labelledby={`quick-add-nutrition-product-${row.id}-label quick-add-nutrition-product-${row.id}-value`}
                        className={`${formField} mt-2 flex items-center justify-between bg-white text-left font-medium ${
                          row.productName ? 'text-slate-950' : 'text-slate-400'
                        }`}
                        onClick={() => setSelectedProductRowId(row.id)}
                        type="button"
                      >
                        <span
                          id={`quick-add-nutrition-product-${row.id}-value`}
                        >
                          {row.productName || 'Выберите продукт'}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className="text-slate-400"
                          size={18}
                        />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                      <div>
                        <label
                          className={formLabel}
                          htmlFor={`quick-add-nutrition-weight-${row.id}`}
                        >
                          Вес порции
                        </label>
                        <div className="relative mt-2">
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
                            name={`productWeight-${row.id}`}
                            onChange={(event) => {
                              updateProductRow(row.id, {
                                weight: event.target.value,
                              });
                            }}
                            placeholder="100"
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
                            г
                          </span>
                        </div>
                        {weightInvalid ? (
                          <p
                            className="mt-2 text-sm text-rose-600"
                            id={`quick-add-nutrition-weight-${row.id}-error`}
                          >
                            Вес должен быть больше 0 и не более 3000 г
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <span className={formLabel}>Углеводы</span>
                        <p className="mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950">
                          {rowCarbs === null
                            ? '—'
                            : `${formatNutritionCarbs(rowCarbs)} г`}
                        </p>
                      </div>
                    </div>

                    {formState.productRows.length > 1 ? (
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        onClick={() => {
                          setFormState((current) => ({
                            ...current,
                            productRows: current.productRows.filter(
                              (productRow) => productRow.id !== row.id,
                            ),
                          }));
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        Удалить продукт
                      </button>
                    ) : null}
                  </section>
                );
              })}
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
              Итого углеводов: {formatNutritionCarbs(productsTotalCarbs)} г
            </div>

            <button
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={formState.productRows.length >= MAX_PRODUCT_ROWS}
              onClick={() => {
                setFormState((current) => ({
                  ...current,
                  productRows: [...current.productRows, createProductRow()],
                }));
              }}
              type="button"
            >
              Добавить продукт
            </button>
          </div>
        )}

        <div>
          <label className={formLabel} htmlFor="quick-add-nutrition-time">
            Время
          </label>
          <input
            className={`${formField} mt-2 appearance-auto text-slate-950`}
            id="quick-add-nutrition-time"
            name="time"
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                time: event.target.value,
              }));
            }}
            onClick={(event) => {
              openNativeTimePicker(event.currentTarget);
            }}
            required
            step={60}
            type="time"
            value={formState.time}
          />
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-nutrition-note">
            Заметка
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
            placeholder="Например, домашняя овсянка с ягодами"
            value={formState.note}
          />
          {showNoteCounter ? (
            <p className="mt-1 text-right text-xs text-slate-500">
              {formState.note.length}/{NOTE_MAX_LENGTH}
            </p>
          ) : null}
        </div>
      </div>

      <QuickAddFormActions
        onCancel={handleCancel}
        submitDisabled={!canSubmit}
      />

      {mealSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setMealSheetOpen(false)}
          onSelect={(mealType) => {
            setFormState((current) => ({
              ...current,
              mealType,
            }));
            setMealSheetOpen(false);
          }}
          options={nutritionMealOptions}
          selectedValue={formState.mealType || undefined}
          title="Тип приёма пищи"
        />
      ) : null}

      {selectedProductRowId ? (
        <QuickAddOptionSheet
          onClose={() => setSelectedProductRowId(null)}
          onSelect={handleProductSelect}
          options={nutritionDemoProductOptions}
          selectedValue={selectedProductRow?.productName || undefined}
          title="Продукт"
        />
      ) : null}
    </form>
  );
}
