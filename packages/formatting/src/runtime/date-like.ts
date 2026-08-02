import type { DateLike, IsoDateTimeString } from '../types/date-like';

const ISO_DATE_TIME_WITH_TIMEZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

function assertValidIsoDateTimeComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): void {
  if (month < 1 || month > 12) {
    throw new Error('DateLike string is not a valid instant.');
  }

  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error('DateLike string is not a valid instant.');
  }

  if (day < 1 || day > daysInMonth(year, month)) {
    throw new Error('DateLike string is not a valid instant.');
  }
}

export function isIsoDateTimeStringWithTimezone(
  value: string,
): value is IsoDateTimeString {
  return ISO_DATE_TIME_WITH_TIMEZONE_PATTERN.test(value);
}

export function assertValidDateLike(value: DateLike): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('DateLike value is an invalid Date.');
    }

    return value;
  }

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('DateLike string must not be empty.');
  }

  const match = ISO_DATE_TIME_WITH_TIMEZONE_PATTERN.exec(value);

  if (!match) {
    throw new Error(
      'DateLike string must be an ISO 8601 date-time with an explicit Z or numeric offset.',
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  assertValidIsoDateTimeComponents(year, month, day, hour, minute, second);

  const instant = new Date(value);

  if (Number.isNaN(instant.getTime())) {
    throw new Error('DateLike string is not a valid instant.');
  }

  return instant;
}
