import {
  formatTimelineCompactDateLabel,
  getTimelineCalendarDateKey,
  isTimelineCalendarDateKeyInInclusiveRange,
  shiftTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';

export type TimelineDateFilterPreset = '30days' | '7days' | 'custom' | 'today';

export interface TimelineDateFilterSelection {
  readonly customFromDateKey?: string;
  readonly customToDateKey?: string;
  readonly preset: TimelineDateFilterPreset;
}

export interface TimelineDateRange {
  readonly fromDateKey: string;
  readonly toDateKey: string;
}

export interface TimelineDateFilterLabels {
  readonly customRange: string;
  readonly last30Days: string;
  readonly last7Days: string;
  readonly today: string;
}

export const DEFAULT_TIMELINE_DATE_FILTER: TimelineDateFilterSelection = {
  preset: '30days',
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimelineDateFilterDateKey(
  dateKey: string | undefined,
): dateKey is string {
  return typeof dateKey === 'string' && DATE_KEY_PATTERN.test(dateKey);
}

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

  switch (selection.preset) {
    case 'today':
      return {
        fromDateKey: toDateKey,
        toDateKey,
      };
    case '7days': {
      const fromDateKey = shiftTimelineCalendarDateKey(toDateKey, -6);

      return fromDateKey ? { fromDateKey, toDateKey } : null;
    }
    case '30days': {
      const fromDateKey = shiftTimelineCalendarDateKey(toDateKey, -29);

      return fromDateKey ? { fromDateKey, toDateKey } : null;
    }
    case 'custom': {
      if (
        !isValidTimelineDateFilterDateKey(selection.customFromDateKey) ||
        !isValidTimelineDateFilterDateKey(selection.customToDateKey)
      ) {
        return null;
      }

      const [fromDateKey, toDateKeyResolved] =
        selection.customFromDateKey <= selection.customToDateKey
          ? [selection.customFromDateKey, selection.customToDateKey]
          : [selection.customToDateKey, selection.customFromDateKey];

      return {
        fromDateKey,
        toDateKey: toDateKeyResolved,
      };
    }
  }
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
  referenceDate: Date,
  timeZone: string,
  locale: string,
): string {
  if (selection.preset === 'today') {
    return labels.today;
  }

  if (selection.preset === '7days') {
    return labels.last7Days;
  }

  if (selection.preset === '30days') {
    return labels.last30Days;
  }

  const range = resolveTimelineDateRange(selection, referenceDate, timeZone);

  if (!range) {
    return labels.customRange;
  }

  const fromLabel = formatTimelineCompactDateLabel(
    range.fromDateKey,
    locale,
    timeZone,
  );
  const toLabel = formatTimelineCompactDateLabel(
    range.toDateKey,
    locale,
    timeZone,
  );

  return labels.customRange
    .replace('{from}', fromLabel)
    .replace('{to}', toLabel);
}
