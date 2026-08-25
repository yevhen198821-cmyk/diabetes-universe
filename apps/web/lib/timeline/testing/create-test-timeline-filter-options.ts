import type { TimelineDateFilterLabels } from '../../../components/timeline/timeline-date-filter-model';

export const TEST_TIMELINE_FILTER_REFERENCE_DATE = new Date(
  '2026-08-02T12:00:00.000Z',
);

export const TEST_TIMELINE_FILTER_TIME_ZONE = 'UTC';

export const TEST_TIMELINE_DATE_FILTER_LABELS: TimelineDateFilterLabels = {
  customRange: '{from} – {to}',
  last30Days: 'Last 30 days',
  last7Days: 'Last 7 days',
  today: 'Today',
};

export function createTestTimelineFilterOptions(
  overrides: {
    readonly dateFilterLabels?: TimelineDateFilterLabels;
    readonly referenceDate?: Date;
    readonly timeZone?: string;
  } = {},
) {
  return {
    dateFilterLabels:
      overrides.dateFilterLabels ?? TEST_TIMELINE_DATE_FILTER_LABELS,
    referenceDate:
      overrides.referenceDate ?? TEST_TIMELINE_FILTER_REFERENCE_DATE,
    timeZone: overrides.timeZone ?? TEST_TIMELINE_FILTER_TIME_ZONE,
  };
}
