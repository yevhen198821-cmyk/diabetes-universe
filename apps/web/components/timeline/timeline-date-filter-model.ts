import {
  getTimelineCalendarDateKey,
  isTimelineCalendarDateKeyInInclusiveRange,
  shiftTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';

/**
 * Timeline active journal window (presentation/query boundary only).
 * Events older than this remain stored for a future Full history / Archive UX.
 */
export const TIMELINE_ACTIVE_WINDOW_MAX_CALENDAR_DAYS = 45;

export type TimelineDateFilterPreset = '45days' | '30days' | '7days' | 'today';

export interface TimelineDateFilterSelection {
  readonly preset: TimelineDateFilterPreset;
}

export interface TimelineDateRange {
  readonly fromDateKey: string;
  readonly toDateKey: string;
}

export interface TimelineDateFilterLabels {
  readonly last45Days: string;
  readonly last30Days: string;
  readonly last7Days: string;
  readonly today: string;
}

export const DEFAULT_TIMELINE_DATE_FILTER: TimelineDateFilterSelection = {
  preset: '30days',
};

const PRESET_LOOKBACK_DAYS: Readonly<
  Record<Exclude<TimelineDateFilterPreset, 'today'>, number>
> = {
  '45days': TIMELINE_ACTIVE_WINDOW_MAX_CALENDAR_DAYS - 1,
  '30days': 29,
  '7days': 6,
};

export function resolveTimelineReferenceDateKey(
  referenceDate: Date,
  timeZone: string,
): string | null {
  return getTimelineCalendarDateKey(referenceDate.toISOString(), timeZone);
}

export function resolveTimelineDateRange(
  selection: TimelineDateFilterSelection,
  referenceDate: Date,
  timeZone: string,
): TimelineDateRange | null {
  const toDateKey = resolveTimelineReferenceDateKey(referenceDate, timeZone);

  if (!toDateKey) {
    return null;
  }

  if (selection.preset === 'today') {
    return {
      fromDateKey: toDateKey,
      toDateKey,
    };
  }

  const lookbackDays = PRESET_LOOKBACK_DAYS[selection.preset];
  const fromDateKey = shiftTimelineCalendarDateKey(toDateKey, -lookbackDays);

  return fromDateKey ? { fromDateKey, toDateKey } : null;
}

export function matchesTimelineDateRange(
  occurredAt: string,
  range: TimelineDateRange,
  timeZone: string,
): boolean {
  const eventDateKey = getTimelineCalendarDateKey(occurredAt, timeZone);

  if (!eventDateKey) {
    return false;
  }

  return isTimelineCalendarDateKeyInInclusiveRange(
    eventDateKey,
    range.fromDateKey,
    range.toDateKey,
  );
}

export function formatTimelineDateFilterLabel(
  selection: TimelineDateFilterSelection,
  labels: TimelineDateFilterLabels,
): string {
  switch (selection.preset) {
    case 'today':
      return labels.today;
    case '7days':
      return labels.last7Days;
    case '30days':
      return labels.last30Days;
    case '45days':
      return labels.last45Days;
  }
}
