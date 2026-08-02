import type {
  TimelineEvent,
  TimelineEventKind,
  TimelineEventSource,
} from '@diabetes-universe/types';

import {
  createIsoDateTimeFromLocalDateAndTime,
  formatTimelineDisplayDate,
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
  isValidTimelineDateTime,
} from '../../lib/timeline/timeline-date-time';

export interface TimelineEventDetailRow {
  readonly label: string;
  readonly value: string;
}

export interface TimelineEventDetailModel {
  readonly canDelete: boolean;
  readonly canEdit: boolean;
  readonly context: string | null;
  readonly date: string;
  readonly kindLabel: string;
  readonly note: string | null;
  readonly primaryText: string;
  readonly rows: readonly TimelineEventDetailRow[];
  readonly sourceLabel: string | null;
  readonly time: string;
  readonly title: string;
}

export interface TimelineEventEditDraft {
  readonly context: string;
  readonly date: string;
  readonly note: string;
  readonly time: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export type TimelineEventEditErrors = Partial<
  Record<keyof TimelineEventEditDraft, string>
>;

export interface TimelineEventEditResult {
  readonly errors: TimelineEventEditErrors;
  readonly event: TimelineEvent | null;
}

export const timelineDetailKindLabels: Record<TimelineEventKind, string> = {
  activity: 'Активность',
  glucose: 'Глюкоза',
  insulin: 'Инсулин',
  medication: 'Лекарство',
  note: 'Заметка',
  nutrition: 'Питание',
};

export const timelineEventSourceLabels: Record<TimelineEventSource, string> = {
  demo: 'Демо-данные',
  device: 'Устройство',
  import: 'Импорт',
  manual: 'Вручную',
};

const defaultUnits: Partial<Record<TimelineEventKind, string>> = {
  activity: 'минут',
  glucose: 'ммоль/л',
  insulin: 'ЕД',
  nutrition: 'г углеводов',
};

function trimToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';

  return trimmed.length > 0 ? trimmed : null;
}

function parseEditableNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');

  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatEditableNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toString().replace('.', ',');
}

function removeUnit(value: string, unit: string): string {
  const trimmedValue = value.trim();
  const trimmedUnit = unit.trim();

  if (trimmedUnit.length === 0) {
    return trimmedValue;
  }

  const suffix = ` ${trimmedUnit}`;

  return trimmedValue.endsWith(suffix)
    ? trimmedValue.slice(0, -suffix.length)
    : trimmedValue;
}

function createPrimaryText(event: TimelineEvent): string {
  const unit = event.unit?.trim();

  return unit ? `${event.value} ${unit}` : event.value;
}

function createDateValue(event: TimelineEvent): string {
  return isValidTimelineDateTime(event.dateTime)
    ? formatTimelineDisplayDate(event.dateTime)
    : 'Дата неизвестна';
}

function createTimeValue(event: TimelineEvent): string {
  return formatTimelineDisplayTime(event.dateTime);
}

export function createTimelineEventDetailModel(
  event: TimelineEvent,
): TimelineEventDetailModel {
  const context = trimToNull(event.context);
  const note = trimToNull(event.note);
  const sourceLabel = event.source
    ? timelineEventSourceLabels[event.source]
    : null;
  const rows: TimelineEventDetailRow[] = [
    { label: 'Дата', value: createDateValue(event) },
    { label: 'Время', value: createTimeValue(event) },
  ];

  if (context) {
    rows.push({ label: 'Контекст', value: context });
  }

  if (note && event.kind !== 'note') {
    rows.push({ label: 'Заметка', value: note });
  }

  if (sourceLabel) {
    rows.push({ label: 'Источник', value: sourceLabel });
  }

  return {
    canDelete: true,
    canEdit: true,
    context,
    date: createDateValue(event),
    kindLabel: timelineDetailKindLabels[event.kind],
    note,
    primaryText: createPrimaryText(event),
    rows,
    sourceLabel,
    time: createTimeValue(event),
    title: event.title,
  };
}

export function createTimelineEventEditDraft(
  event: TimelineEvent,
): TimelineEventEditDraft {
  const unit = event.unit ?? defaultUnits[event.kind] ?? '';

  return {
    context: event.context ?? '',
    date: getTimelineCalendarDateKey(event.dateTime) ?? '',
    note: event.note ?? '',
    time: formatTimelineDisplayTime(event.dateTime),
    title: event.title,
    unit,
    value: event.kind === 'note' ? event.value : removeUnit(event.value, unit),
  };
}

function validateNumber(
  draft: TimelineEventEditDraft,
  max: number,
  label: string,
): { errors: TimelineEventEditErrors; parsed: number | null } {
  const parsed = parseEditableNumber(draft.value);

  if (parsed === null || parsed <= 0 || parsed > max) {
    return {
      errors: {
        value: `${label}: введите значение больше 0 и не более ${max}.`,
      },
      parsed: null,
    };
  }

  return { errors: {}, parsed };
}

function validateCommonDraft(
  draft: TimelineEventEditDraft,
): TimelineEventEditErrors {
  const errors: TimelineEventEditErrors = {};

  if (draft.date.trim().length === 0) {
    errors.date = 'Укажите дату.';
  }

  if (draft.time.trim().length === 0) {
    errors.time = 'Укажите время.';
  }

  if (draft.title.trim().length === 0) {
    errors.title = 'Укажите название.';
  }

  return errors;
}

function createEventValue(
  kind: TimelineEventKind,
  parsed: number,
  unit: string,
): string {
  const formatted = formatEditableNumber(parsed);

  switch (kind) {
    case 'glucose':
      return `${formatted} ммоль/л`;
    case 'insulin':
      return `${formatted} ЕД`;
    case 'nutrition':
      return `${formatted} г углеводов`;
    case 'medication':
      return formatted;
    case 'activity':
    case 'note':
      return unit.length > 0 ? `${formatted} ${unit}` : formatted;
  }
}

export function updateTimelineEventFromDraft(
  event: TimelineEvent,
  draft: TimelineEventEditDraft,
  now: Date = new Date(),
): TimelineEventEditResult {
  const errors: TimelineEventEditErrors = validateCommonDraft(draft);
  const title = draft.title.trim();
  const context = draft.context.trim();
  const note = draft.note.trim();
  const unit = draft.unit.trim();
  let value = draft.value.trim();

  try {
    createIsoDateTimeFromLocalDateAndTime(draft.date, draft.time);
  } catch {
    errors.date = errors.date ?? 'Укажите корректную дату.';
    errors.time = errors.time ?? 'Укажите корректное время.';
  }

  if (event.kind === 'note') {
    if (value.length === 0) {
      errors.value = 'Введите текст заметки.';
    } else if (value.length > 500) {
      errors.value = 'Заметка должна быть не длиннее 500 символов.';
    }
  } else if (event.kind === 'activity') {
    if (value.length === 0) {
      errors.value = 'Укажите значение активности.';
    }
  } else {
    const maxByKind: Record<
      'glucose' | 'insulin' | 'medication' | 'nutrition',
      number
    > = {
      glucose: 40,
      insulin: 100,
      medication: 100000,
      nutrition: 500,
    };
    const validation = validateNumber(
      draft,
      maxByKind[event.kind],
      timelineDetailKindLabels[event.kind],
    );

    Object.assign(errors, validation.errors);

    if (validation.parsed !== null) {
      value = createEventValue(event.kind, validation.parsed, unit);
    }
  }

  if (event.kind === 'medication' && unit.length === 0) {
    errors.unit = 'Укажите единицу лекарства.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, event: null };
  }

  return {
    errors: {},
    event: {
      ...event,
      context: context || undefined,
      dateTime: createIsoDateTimeFromLocalDateAndTime(draft.date, draft.time),
      note: event.kind === 'note' ? event.note : note || undefined,
      title,
      unit:
        event.kind === 'medication' || event.kind === 'activity'
          ? unit || undefined
          : event.unit,
      updatedAt: now.toISOString(),
      value,
    },
  };
}
