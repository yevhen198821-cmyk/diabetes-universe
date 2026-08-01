'use client';

import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';
import { Button } from '@diabetes-universe/ui';
import { useState, type FormEvent } from 'react';

import { formField, formLabel } from '../timeline/ui-styles';
import { glucoseContextOptions } from '../../lib/quick-add/glucose-context-options';
import {
  getCurrentTimeString,
  parseGlucoseInput,
} from '../../lib/quick-add/format-glucose';

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

export function GlucoseQuickAddForm({
  onCancel,
  onSubmit,
}: GlucoseQuickAddFormProps) {
  const [formState, setFormState] =
    useState<GlucoseFormState>(createInitialState);
  const [valueError, setValueError] = useState<string | null>(null);

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

  return (
    <form
      className="space-y-5 px-5 py-5 sm:px-6 sm:py-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className={formLabel} htmlFor="quick-add-glucose-value">
          Уровень глюкозы
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            aria-describedby={
              valueError ? 'quick-add-glucose-value-error' : undefined
            }
            aria-invalid={valueError ? true : undefined}
            autoComplete="off"
            className={formField}
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
          <span className="shrink-0 text-sm font-medium text-slate-500">
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
          className={`${formField} mt-2`}
          id="quick-add-glucose-time"
          name="time"
          onChange={(event) => {
            setFormState((current) => ({
              ...current,
              time: event.target.value,
            }));
          }}
          required
          type="time"
          value={formState.time}
        />
      </div>

      <div>
        <label className={formLabel} htmlFor="quick-add-glucose-context">
          Контекст измерения
        </label>
        <select
          className={`${formField} mt-2`}
          id="quick-add-glucose-context"
          name="context"
          onChange={(event) => {
            setFormState((current) => ({
              ...current,
              context: event.target.value,
            }));
          }}
          value={formState.context}
        >
          {glucoseContextOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          onClick={handleCancel}
          type="button"
        >
          Отмена
        </button>
        <Button className="h-12 flex-1" type="submit">
          Сохранить
        </Button>
      </div>
    </form>
  );
}
