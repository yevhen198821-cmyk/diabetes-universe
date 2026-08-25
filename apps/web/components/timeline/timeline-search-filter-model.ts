import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

import {
  mapTimelineSearchPresentation,
  resolveTimelinePresentationLocale,
  type TimelinePresentationDependencies,
} from '../../lib/timeline/presentation';
import {
  DEFAULT_TIMELINE_DATE_FILTER,
  formatTimelineDateFilterLabel,
  matchesTimelineDateRange,
  resolveTimelineDateRange,
  type TimelineDateFilterLabels,
  type TimelineDateFilterSelection,
} from './timeline-date-filter-model';

export type TimelineEventFilter = 'all' | TimelineEventKind;

export interface TimelineFilterInput {
  readonly dateFilter: TimelineDateFilterSelection;
  readonly filter: TimelineEventFilter;
  readonly query: string;
}

export interface TimelineSearchFilterInput {
  readonly filter: TimelineEventFilter;
  readonly query: string;
}

export interface TimelineSearchFilterModel {
  readonly activeFilter: TimelineEventFilter;
  readonly dateFilter: TimelineDateFilterSelection;
  readonly dateFilterLabel: string;
  readonly dateRangeEventCount: number;
  readonly filteredEvents: readonly SemanticTimelineEvent[];
  readonly hasActiveCriteria: boolean;
  readonly hasActiveDateFilter: boolean;
  readonly hasActiveFilter: boolean;
  readonly hasActiveSearch: boolean;
  readonly hasActiveSearchOrCategoryCriteria: boolean;
  readonly normalizedQuery: string;
  readonly resultCount: number;
}

export const timelineEventFilterOptions: readonly TimelineEventFilter[] = [
  'all',
  'glucose',
  'insulin',
  'nutrition',
  'medication',
  'activity',
  'note',
];

export function normalizeTimelineSearchQuery(
  query: string,
  locale: string,
): string {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase(locale);
}

function normalizeSearchField(
  value: string | undefined,
  locale: string,
): string {
  return normalizeTimelineSearchQuery(value ?? '', locale);
}

function createSearchHaystack(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): string {
  const locale = resolveTimelinePresentationLocale(dependencies);
  const presentation = mapTimelineSearchPresentation(event, dependencies);
  const searchable = [
    ...presentation.userContent,
    ...presentation.localizedLabels,
  ];

  return searchable
    .map((value) => normalizeSearchField(value, locale))
    .filter(Boolean)
    .join(' ');
}

function matchesFilter(
  event: SemanticTimelineEvent,
  filter: TimelineEventFilter,
): boolean {
  return filter === 'all' || event.kind === filter;
}

function matchesSearch(
  event: SemanticTimelineEvent,
  normalizedQuery: string,
  dependencies: TimelinePresentationDependencies,
): boolean {
  return (
    normalizedQuery.length === 0 ||
    createSearchHaystack(event, dependencies).includes(normalizedQuery)
  );
}

export function createTimelineSearchFilterModel(
  events: readonly SemanticTimelineEvent[],
  input: TimelineFilterInput,
  dependencies: TimelinePresentationDependencies,
  options: {
    readonly dateFilterLabels: TimelineDateFilterLabels;
    readonly referenceDate?: Date;
    readonly timeZone: string;
  },
): TimelineSearchFilterModel {
  const locale = resolveTimelinePresentationLocale(dependencies);
  const normalizedQuery = normalizeTimelineSearchQuery(input.query, locale);
  const activeFilter = timelineEventFilterOptions.includes(input.filter)
    ? input.filter
    : 'all';
  const dateFilter = input.dateFilter ?? DEFAULT_TIMELINE_DATE_FILTER;
  const referenceDate = options.referenceDate ?? new Date();
  const dateRange = resolveTimelineDateRange(
    dateFilter,
    referenceDate,
    options.timeZone,
  );
  const dateRangeEvents =
    dateRange === null
      ? [...events]
      : events.filter((event) =>
          matchesTimelineDateRange(
            event.occurredAt,
            dateRange,
            options.timeZone,
          ),
        );
  const filteredEvents = dateRangeEvents.filter(
    (event) =>
      matchesFilter(event, activeFilter) &&
      matchesSearch(event, normalizedQuery, dependencies),
  );
  const hasActiveSearch = normalizedQuery.length > 0;
  const hasActiveFilter = activeFilter !== 'all';

  return {
    activeFilter,
    dateFilter,
    dateFilterLabel: formatTimelineDateFilterLabel(
      dateFilter,
      options.dateFilterLabels,
    ),
    dateRangeEventCount: dateRangeEvents.length,
    filteredEvents,
    hasActiveCriteria:
      hasActiveSearch || hasActiveFilter || dateFilter.preset !== '30days',
    hasActiveDateFilter: dateFilter.preset !== '30days',
    hasActiveFilter,
    hasActiveSearch,
    hasActiveSearchOrCategoryCriteria: hasActiveSearch || hasActiveFilter,
    normalizedQuery,
    resultCount: filteredEvents.length,
  };
}
