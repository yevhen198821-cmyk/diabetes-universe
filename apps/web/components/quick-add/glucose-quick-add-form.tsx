'use client';

import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';
import { Button } from '@diabetes-universe/ui';
import { Check, ChevronDown } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { formField, formLabel } from '../timeline/ui-styles';
import { glucoseContextOptions } from '../../lib/quick-add/glucose-context-options';
import {
  getCurrentTimeString,
  parseGlucoseInput,
} from '../../lib/quick-add/format-glucose';
import { triggerSelectionHaptic } from '../../lib/quick-add/trigger-selection-haptic';

interface GlucoseQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: GlucoseQuickAddEntry) => void;
}

interface GlucoseFormState {
  readonly value: string;
  readonly time: string;
  readonly context: string;
}

function createInitialState(): GlucoseFormState {
  return {
    context: glucoseContextOptions[0],
    time: getCurrentTimeString(),
    value: '',
  };
}

function openNativeTimePicker(input: HTMLInputElement): void {
  if ('showPicker' in input && typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not supported in the current context.
    }
  }

  input.focus();
}

export function GlucoseQuickAddForm({
  onCancel,
  onSubmit,
}: GlucoseQuickAddFormProps) {
  const [formState, setFormState] =
    useState<GlucoseFormState>(createInitialState);
  const [valueError, setValueError] = useState<string | null>(null);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const hasValue = formState.value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedValue = parseGlucoseInput(formState.value);

    if (parsedValue === null) {
      setValueError('Введите значение от 0,1 до 40 ммоль/л');
      return;
    }

    onSubmit({
      context: formState.context,
      time: formState.time,
      valueMmol: parsedValue,
    });
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setValueError(null);
    onCancel();
  };

  const handleContextSelect = (option: string) => {
    setFormState((current) => ({
      ...current,
      context: option,
    }));
    setContextSheetOpen(false);
    triggerSelectionHaptic();
  };

  return (
    <form
      className="flex min-h-0 flex-col overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="min-h-0 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <div>
          <label className={formLabel} htmlFor="quick-add-glucose-value">
            Уровень глюкозы
          </label>
          <div className="relative mt-2">
            <input
              aria-describedby={
                valueError ? 'quick-add-glucose-value-error' : undefined
              }
              aria-invalid={valueError ? true : undefined}
              autoComplete="off"
              className={`${formField} pr-24 ${
                hasValue ? 'font-semibold text-slate-950' : 'text-slate-900'
              }`}
              enterKeyHint="done"
              id="quick-add-glucose-value"
              inputMode="decimal"
              name="value"
              onChange={(event) => {
                setValueError(null);
                setFormState((current) => ({
                  ...current,
                  value: event.target.value,
                }));
              }}
              placeholder="6,4"
              required
              type="text"
              value={formState.value}
            />
            <span
              className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                hasValue ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              ммоль/л
            </span>
          </div>
          {valueError ? (
            <p
              className="mt-2 text-sm text-rose-600"
              id="quick-add-glucose-value-error"
            >
              {valueError}
            </p>
          ) : null}
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-glucose-time">
            Время
          </label>
          <input
            className={`${formField} mt-2 appearance-auto text-slate-950`}
            id="quick-add-glucose-time"
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
          <span className={formLabel} id="quick-add-glucose-context-label">
            Контекст измерения
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-glucose-context-label quick-add-glucose-context-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium text-slate-950`}
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-glucose-context-value">
              {formState.context}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          className="h-12 min-w-0 flex-1 basis-0 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          onClick={handleCancel}
          type="button"
        >
          Отмена
        </button>
        <Button className="h-12 min-w-0 flex-1 basis-0" type="submit">
          Сохранить
        </Button>
      </div>

      {contextSheetOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:p-6">
          <button
            aria-label="Закрыть выбор контекста"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={() => setContextSheetOpen(false)}
            type="button"
          />
          <div
            aria-labelledby="quick-add-glucose-context-sheet-title"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/15 sm:rounded-3xl"
            role="dialog"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <h3
              className="text-base font-bold text-slate-950"
              id="quick-add-glucose-context-sheet-title"
            >
              Контекст измерения
            </h3>
            <div className="mt-4 space-y-2">
              {glucoseContextOptions.map((option) => {
                const selected = option === formState.context;

                return (
                  <button
                    className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    key={option}
                    onClick={() => handleContextSelect(option)}
                    type="button"
                  >
                    <span>{option}</span>
                    {selected ? (
                      <Check
                        aria-hidden="true"
                        className="text-teal-700"
                        size={18}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
