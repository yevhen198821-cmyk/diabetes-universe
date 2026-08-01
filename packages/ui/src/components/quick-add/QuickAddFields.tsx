'use client';

import {
  useEffect,
  useId,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

const quickAddFieldClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none';

const quickAddLabelClass = 'block text-sm font-medium text-slate-700';

function ChevronDownIcon({
  className,
  size = 18,
}: {
  readonly className?: string;
  readonly size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function joinIds(ids: readonly (string | undefined)[]): string | undefined {
  const presentIds = ids.filter((id): id is string => Boolean(id));

  return presentIds.length > 0 ? presentIds.join(' ') : undefined;
}

export interface QuickAddSelectFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value?: string;
  readonly placeholder: string;
  readonly description?: string;
  readonly onClick: () => void;
}

export function QuickAddSelectField({
  description,
  id,
  label,
  onClick,
  placeholder,
  value,
}: QuickAddSelectFieldProps) {
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div>
      <span className={quickAddLabelClass} id={labelId}>
        {label}
      </span>
      <button
        aria-describedby={descriptionId}
        aria-haspopup="dialog"
        aria-labelledby={`${labelId} ${valueId}`}
        className={`${quickAddFieldClass} mt-2 flex items-center justify-between text-left font-medium ${
          value ? 'text-slate-950' : 'text-slate-400'
        }`}
        onClick={onClick}
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate" id={valueId}>
            {value || placeholder}
          </span>
          {description ? (
            <span
              className="mt-0.5 block truncate text-xs font-normal text-slate-500"
              id={descriptionId}
            >
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon className="text-slate-400" size={18} />
      </button>
    </div>
  );
}

export interface QuickAddNumberWithUnitFieldProps {
  readonly id: string;
  readonly label: string;
  readonly name?: string;
  readonly value: string;
  readonly unitValue?: string;
  readonly unitPlaceholder: string;
  readonly placeholder?: string;
  readonly error?: string | null;
  readonly inputMode?: 'decimal' | 'numeric';
  readonly required?: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onUnitClick: () => void;
}

export function QuickAddNumberWithUnitField({
  error,
  id,
  inputMode = 'decimal',
  label,
  name,
  onUnitClick,
  onValueChange,
  placeholder,
  required = false,
  unitPlaceholder,
  unitValue,
  value,
}: QuickAddNumberWithUnitFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const unitId = `${id}-unit`;
  const labelId = `${id}-label`;
  const hasValue = value.trim().length > 0;

  return (
    <div>
      <label className={quickAddLabelClass} htmlFor={id} id={labelId}>
        {label}
      </label>
      <div
        className={`mt-2 flex min-h-11 w-full items-stretch overflow-hidden rounded-xl border bg-slate-50 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 ${
          error ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <input
          aria-describedby={joinIds([unitId, errorId])}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-slate-400 ${
            hasValue ? 'font-semibold text-slate-950' : 'text-slate-900'
          }`}
          enterKeyHint="done"
          id={id}
          inputMode={inputMode}
          name={name}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
          placeholder={placeholder}
          required={required}
          type="text"
          value={value}
        />
        <button
          aria-haspopup="dialog"
          aria-labelledby={`${labelId} ${unitId}`}
          className={`min-h-11 shrink-0 border-l border-slate-200 px-3 text-sm font-semibold transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700 ${
            unitValue ? 'text-slate-950' : 'text-slate-400'
          }`}
          onClick={onUnitClick}
          type="button"
        >
          <span className="inline-flex items-center gap-1" id={unitId}>
            {unitValue || unitPlaceholder}
            <ChevronDownIcon size={16} />
          </span>
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-rose-600" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface QuickAddTextAreaFieldProps {
  readonly id: string;
  readonly label: string;
  readonly name?: string;
  readonly value: string;
  readonly placeholder: string;
  readonly maxLength: number;
  readonly counterThreshold?: number;
  readonly description?: string;
  readonly error?: string | null;
  readonly onChange: (value: string) => void;
}

export function QuickAddTextAreaField({
  counterThreshold,
  description,
  error,
  id,
  label,
  maxLength,
  name,
  onChange,
  placeholder,
  value,
}: QuickAddTextAreaFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const showCounter =
    counterThreshold !== undefined && value.length >= counterThreshold;

  return (
    <div>
      <label className={quickAddLabelClass} htmlFor={id}>
        {label}
      </label>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-slate-500" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <textarea
        aria-describedby={joinIds([descriptionId, errorId])}
        aria-invalid={error ? true : undefined}
        className={`${quickAddFieldClass} mt-2 min-h-24 resize-none py-3`}
        id={id}
        maxLength={maxLength}
        name={name}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        value={value}
      />
      {error ? (
        <p className="mt-2 text-sm text-rose-600" id={errorId}>
          {error}
        </p>
      ) : null}
      {showCounter ? (
        <p className="mt-1 text-right text-xs text-slate-500">
          {value.length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}

export interface QuickAddFormPreviewProps {
  readonly title: string;
  readonly primaryText: string;
  readonly secondaryText?: string;
}

export function QuickAddFormPreview({
  primaryText,
  secondaryText,
  title,
}: QuickAddFormPreviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-950">{primaryText}</p>
      {secondaryText ? (
        <p className="mt-0.5 text-sm text-slate-500">{secondaryText}</p>
      ) : null}
    </section>
  );
}

export interface QuickAddTimeFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly name?: string;
  readonly required?: boolean;
  readonly onChange: (value: string) => void;
}

const hours = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, '0'),
);

const minutes = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, '0'),
);

function splitTime(value: string): readonly [string, string] {
  const [hour = '00', minute = '00'] = value.split(':');

  return [hour.padStart(2, '0'), minute.padStart(2, '0')];
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function QuickAddTimeField({
  id,
  label,
  name,
  onChange,
  value,
}: QuickAddTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [[draftHour, draftMinute], setDraftTime] = useState(splitTime(value));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const valueId = `${id}-value`;
  const [currentHour, currentMinute] = splitTime(value);
  const displayValue = `${currentHour}:${currentMinute}`;

  const selectDraftTime = useCallback(
    (nextHour: string, nextMinute: string) => {
      setDraftTime([nextHour, nextMinute]);
    },
    [],
  );

  const closePicker = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const openPicker = useCallback(() => {
    setDraftTime(splitTime(value));
    setOpen(true);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>('[data-active-time-option="true"]')
        ?.focus();
    });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        closePicker();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const elements = focusableElements(dialogRef.current);

      if (elements.length === 0) {
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closePicker, open]);

  const hourOptions = useMemo(
    () =>
      hours.map((hour) => (
        <button
          aria-pressed={draftHour === hour}
          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            draftHour === hour
              ? 'bg-teal-700 text-white'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          data-active-time-option={draftHour === hour ? true : undefined}
          key={hour}
          onClick={() => selectDraftTime(hour, draftMinute)}
          type="button"
        >
          {hour}
        </button>
      )),
    [draftHour, draftMinute, selectDraftTime],
  );

  const minuteOptions = useMemo(
    () =>
      minutes.map((minute) => (
        <button
          aria-pressed={draftMinute === minute}
          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            draftMinute === minute
              ? 'bg-teal-700 text-white'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          key={minute}
          onClick={() => selectDraftTime(draftHour, minute)}
          type="button"
        >
          {minute}
        </button>
      )),
    [draftHour, draftMinute, selectDraftTime],
  );

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div>
      <span className={quickAddLabelClass} id={`${id}-label`}>
        {label}
      </span>
      <input name={name} type="hidden" value={value} />
      <button
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${valueId}`}
        className={`${quickAddFieldClass} mt-2 flex items-center justify-between text-left font-medium text-slate-950`}
        id={id}
        onClick={openPicker}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span id={valueId}>{displayValue}</span>
        <ChevronDownIcon className="text-slate-400" size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <button
            aria-label="Закрыть выбор времени"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={closePicker}
            type="button"
          />
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 flex max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/15 sm:rounded-3xl"
            ref={dialogRef}
            role="dialog"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            <h3 className="text-base font-bold text-slate-950" id={titleId}>
              Выберите время
            </h3>
            <p className="mt-3 text-center text-4xl font-bold text-slate-950 tabular-nums">
              {draftHour}:{draftMinute}
            </p>

            <div className="mt-5 grid min-h-0 grid-cols-2 gap-3 overflow-hidden">
              <div className="min-h-0">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Часы
                </p>
                <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {hourOptions}
                </div>
              </div>
              <div className="min-h-0">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Минуты
                </p>
                <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {minuteOptions}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="h-12 min-w-0 flex-1 basis-0 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                onClick={closePicker}
                type="button"
              >
                Отмена
              </button>
              <button
                className="h-12 min-w-0 flex-1 basis-0 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                onClick={() => {
                  onChange(`${draftHour}:${draftMinute}`);
                  closePicker();
                }}
                type="button"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
