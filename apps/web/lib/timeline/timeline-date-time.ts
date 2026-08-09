import { WEB_PLATFORM_DEFAULT_LOCALE } from '../platform/web-platform-defaults';

export const DEFAULT_TIMELINE_LOCALE = WEB_PLATFORM_DEFAULT_LOCALE;

export type TimelineDayGroupKey = 'earlier' | 'today' | 'yesterday';

const INVALID_DISPLAY_TIME = '--:--';

function parseTimeString(
  time: string,
): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function parseDateKey(
  dateKey: string,
): { day: number; month: number; year: number } | null {
  const match = dateKey.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

export function parseTimelineDateTime(dateTime: string): number {
  return Date.parse(dateTime);
}

export function isValidTimelineDateTime(dateTime: string): boolean {
  return Number.isFinite(parseTimelineDateTime(dateTime));
}

export function createIsoDateTimeFromLocalTime(
  time: string,
  referenceDate: Date = new Date(),
): string {
  const parsedTime = parseTimeString(time);

  if (!parsedTime) {
    throw new Error(`Invalid timeline time value: "${time}"`);
  }

  const eventDate = new Date(referenceDate);
  eventDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

  if (Number.isNaN(eventDate.getTime())) {
    throw new Error(`Unable to create timeline dateTime from time "${time}"`);
  }

  return eventDate.toISOString();
}

export function createIsoDateTimeFromLocalDateAndTime(
  dateKey: string,
  time: string,
): string {
  const parsedDate = parseDateKey(dateKey);
  const parsedTime = parseTimeString(time);

  if (!parsedDate) {
    throw new Error(`Invalid timeline date value: "${dateKey}"`);
  }

  if (!parsedTime) {
    throw new Error(`Invalid timeline time value: "${time}"`);
  }

  const eventDate = new Date(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day,
    parsedTime.hours,
    parsedTime.minutes,
    0,
    0,
  );

  if (Number.isNaN(eventDate.getTime())) {
    throw new Error(
      `Unable to create timeline dateTime from date "${dateKey}" and time "${time}"`,
    );
  }

  return eventDate.toISOString();
}

export function compareTimelineDateTime(
  leftDateTime: string,
  rightDateTime: string,
): number {
  const leftTime = parseTimelineDateTime(leftDateTime);
  const rightTime = parseTimelineDateTime(rightDateTime);
  const leftInvalid = Number.isNaN(leftTime);
  const rightInvalid = Number.isNaN(rightTime);

  if (leftInvalid && rightInvalid) {
    return leftDateTime.localeCompare(rightDateTime);
  }

  if (leftInvalid) {
    return 1;
  }

  if (rightInvalid) {
    return -1;
  }

  return leftTime - rightTime;
}

export function formatTimelineDisplayTime(
  dateTime: string,
  locale: string = DEFAULT_TIMELINE_LOCALE,
  timeZone?: string,
): string {
  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp)) {
    return INVALID_DISPLAY_TIME;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone,
  }).format(new Date(timestamp));
}

export function getTimelineCalendarDateKey(
  dateTime: string,
  timeZone?: string,
): string | null {
  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const dateParts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(new Date(timestamp));
  const day = dateParts.find((part) => part.type === 'day')?.value;
  const month = dateParts.find((part) => part.type === 'month')?.value;
  const year = dateParts.find((part) => part.type === 'year')?.value;

  if (!day || !month || !year) {
    return null;
  }

  return `${year.padStart(4, '0')}-${month}-${day}`;
}

export function getTimelineDayGroupKey(
  dateTime: string,
  referenceDate: Date = new Date(),
  timeZone?: string,
): TimelineDayGroupKey {
  const eventDateKey = getTimelineCalendarDateKey(dateTime, timeZone);
  const todayDateKey = getTimelineCalendarDateKey(
    referenceDate.toISOString(),
    timeZone,
  );
  const yesterdayDate = new Date(referenceDate);
  yesterdayDate.setDate(referenceDate.getDate() - 1);
  const yesterdayDateKey = getTimelineCalendarDateKey(
    yesterdayDate.toISOString(),
    timeZone,
  );

  if (!eventDateKey || !todayDateKey || !yesterdayDateKey) {
    return 'earlier';
  }

  if (eventDateKey === todayDateKey) {
    return 'today';
  }

  if (eventDateKey === yesterdayDateKey) {
    return 'yesterday';
  }

  return 'earlier';
}

export function formatTimelineDayGroupLabel(
  groupKey: TimelineDayGroupKey,
  dateTime: string,
  locale: string = DEFAULT_TIMELINE_LOCALE,
  timeZone?: string,
  groupLabels?: Readonly<{
    readonly earlier: string;
    readonly today: string;
    readonly yesterday: string;
  }>,
): string {
  if (groupKey === 'today') {
    return groupLabels?.today ?? 'Today';
  }

  if (groupKey === 'yesterday') {
    return groupLabels?.yesterday ?? 'Yesterday';
  }

  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp)) {
    return groupLabels?.earlier ?? 'Earlier';
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(new Date(timestamp));
}

export function formatTimelineDisplayDate(
  dateTime: string,
  locale: string = DEFAULT_TIMELINE_LOCALE,
  timeZone?: string,
): string {
  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp)) {
    return 'Earlier';
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(new Date(timestamp));
}

export function formatTimelineDateGroupLabel(
  dateTime: string,
  referenceDate: Date = new Date(),
  locale: string = DEFAULT_TIMELINE_LOCALE,
  timeZone?: string,
  groupLabels?: Readonly<{
    readonly earlier: string;
    readonly today: string;
    readonly yesterday: string;
  }>,
): string {
  const groupKey = getTimelineDayGroupKey(dateTime, referenceDate, timeZone);

  if (groupKey === 'today' || groupKey === 'yesterday') {
    return formatTimelineDayGroupLabel(
      groupKey,
      dateTime,
      locale,
      timeZone,
      groupLabels,
    );
  }

  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp) || Number.isNaN(referenceDate.getTime())) {
    return 'Дата неизвестна';
  }

  const eventYear = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
  }).format(new Date(timestamp));
  const referenceYear = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
  }).format(referenceDate);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone,
    year: eventYear === referenceYear ? undefined : 'numeric',
  }).format(new Date(timestamp));
}
