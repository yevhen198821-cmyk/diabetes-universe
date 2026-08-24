import {
  formatTimelineDisplayTime,
  getTimelineDayGroupKey,
  parseTimelineDateTime,
} from '../timeline/timeline-date-time';

export function formatDashboardRecentEventDisplayTime(
  dateTime: string,
  referenceDate: Date,
  locale: string,
  yesterdayLabel: string,
  timeZone?: string,
): string {
  const time = formatTimelineDisplayTime(dateTime, locale, timeZone);

  if (time === '--:--') {
    return time;
  }

  const groupKey = getTimelineDayGroupKey(dateTime, referenceDate, timeZone);

  if (groupKey === 'today') {
    return time;
  }

  if (groupKey === 'yesterday') {
    return `${yesterdayLabel}, ${time}`;
  }

  const timestamp = parseTimelineDateTime(dateTime);

  if (Number.isNaN(timestamp)) {
    return time;
  }

  const datePart = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(new Date(timestamp));

  return `${datePart}, ${time}`;
}
