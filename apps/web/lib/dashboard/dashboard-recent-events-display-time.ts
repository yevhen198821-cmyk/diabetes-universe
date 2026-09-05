import {
  formatTimelineCompactDateLabel,
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
  getTimelineDayGroupKey,
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

  const dateKey = getTimelineCalendarDateKey(dateTime, timeZone);

  if (!dateKey) {
    return time;
  }

  const datePart = formatTimelineCompactDateLabel(dateKey, locale, timeZone);

  return `${datePart}, ${time}`;
}
