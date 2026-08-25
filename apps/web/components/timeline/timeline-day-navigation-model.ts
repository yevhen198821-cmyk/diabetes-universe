import {
  compareTimelineCalendarDateKeys,
  formatTimelineDayNavigationDateLabel,
  shiftTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';
import {
  resolveTimelineDateRange,
  resolveTimelineReferenceDateKey,
  type TimelineDateFilterSelection,
} from './timeline-date-filter-model';

export interface TimelineDayNavigationModel {
  readonly canGoNext: boolean;
  readonly canGoPrevious: boolean;
  readonly dateKey: string;
  readonly isToday: boolean;
  readonly label: string;
  readonly nextDateKey: string | null;
  readonly previousDateKey: string | null;
}

export interface TimelineDayNavigationLabels {
  readonly todayPrefix: string;
}

export function resolveDefaultTimelineSelectedDateKey(
  dateFilter: TimelineDateFilterSelection,
  referenceDate: Date,
  timeZone: string,
): string | null {
  const dateRange = resolveTimelineDateRange(
    dateFilter,
    referenceDate,
    timeZone,
  );

  return dateRange?.toDateKey ?? null;
}

export function clampTimelineSelectedDateKey(
  selectedDateKey: string,
  dateFilter: TimelineDateFilterSelection,
  referenceDate: Date,
  timeZone: string,
): string | null {
  const dateRange = resolveTimelineDateRange(
    dateFilter,
    referenceDate,
    timeZone,
  );

  if (!dateRange) {
    return null;
  }

  if (
    compareTimelineCalendarDateKeys(selectedDateKey, dateRange.fromDateKey) < 0
  ) {
    return dateRange.fromDateKey;
  }

  if (
    compareTimelineCalendarDateKeys(selectedDateKey, dateRange.toDateKey) > 0
  ) {
    return dateRange.toDateKey;
  }

  return selectedDateKey;
}

export function createTimelineDayNavigationModel(
  selectedDateKey: string,
  dateFilter: TimelineDateFilterSelection,
  referenceDate: Date,
  timeZone: string,
  labels: TimelineDayNavigationLabels,
  locale: string,
): TimelineDayNavigationModel | null {
  const dateRange = resolveTimelineDateRange(
    dateFilter,
    referenceDate,
    timeZone,
  );

  if (!dateRange) {
    return null;
  }

  const clampedDateKey =
    clampTimelineSelectedDateKey(
      selectedDateKey,
      dateFilter,
      referenceDate,
      timeZone,
    ) ?? selectedDateKey;
  const todayDateKey = resolveTimelineReferenceDateKey(referenceDate, timeZone);
  const previousDateKey = shiftTimelineCalendarDateKey(clampedDateKey, -1);
  const nextDateKey = shiftTimelineCalendarDateKey(clampedDateKey, 1);
  const canGoPrevious =
    previousDateKey !== null &&
    compareTimelineCalendarDateKeys(previousDateKey, dateRange.fromDateKey) >=
      0;
  const canGoNext =
    nextDateKey !== null &&
    compareTimelineCalendarDateKeys(nextDateKey, dateRange.toDateKey) <= 0;
  const navigationDateLabel = formatTimelineDayNavigationDateLabel(
    clampedDateKey,
    locale,
    timeZone,
  );
  const isToday = todayDateKey === clampedDateKey;
  const label = isToday
    ? `${labels.todayPrefix}, ${navigationDateLabel}`
    : navigationDateLabel;

  return {
    canGoNext,
    canGoPrevious,
    dateKey: clampedDateKey,
    isToday,
    label,
    nextDateKey: canGoNext ? nextDateKey : null,
    previousDateKey: canGoPrevious ? previousDateKey : null,
  };
}

export function shiftTimelineSelectedDateKey(
  selectedDateKey: string,
  direction: 'next' | 'previous',
  dateFilter: TimelineDateFilterSelection,
  referenceDate: Date,
  timeZone: string,
): string | null {
  const navigationModel = createTimelineDayNavigationModel(
    selectedDateKey,
    dateFilter,
    referenceDate,
    timeZone,
    { todayPrefix: '' },
    'en-GB',
  );

  if (!navigationModel) {
    return null;
  }

  if (direction === 'previous') {
    return navigationModel.previousDateKey;
  }

  return navigationModel.nextDateKey;
}
