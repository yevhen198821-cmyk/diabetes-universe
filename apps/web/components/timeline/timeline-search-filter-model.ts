import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

import {
  mapTimelineSearchPresentation,
  resolveTimelinePresentationLocale,
  type TimelinePresentationDependencies,
} from '../../lib/timeline/presentation';

export type TimelineEventFilter = 'all' | TimelineEventKind;

export interface TimelineSearchFilterInput {
  readonly filter: TimelineEventFilter;
  readonly query: string;
}

export interface TimelineSearchFilterModel {
  readonly activeFilter: TimelineEventFilter;
  readonly filteredEvents: readonly SemanticTimelineEvent[];
  readonly hasActiveCriteria: boolean;
  readonly hasActiveFilter: boolean;
  readonly hasActiveSearch: boolean;
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
  input: TimelineSearchFilterInput,
  dependencies: TimelinePresentationDependencies,
): TimelineSearchFilterModel {
  const normalizedQuery = normalizeTimelineSearchQuery(
    input.query,
    resolveTimelinePresentationLocale(dependencies),
  );
  const activeFilter = timelineEventFilterOptions.includes(input.filter)
    ? input.filter
    : 'all';
  const hasActiveSearch = normalizedQuery.length > 0;
  const hasActiveFilter = activeFilter !== 'all';
  const filteredEvents = events.filter(
    (event) =>
      matchesFilter(event, activeFilter) &&
      matchesSearch(event, normalizedQuery, dependencies),
  );

  return {
    activeFilter,
    filteredEvents,
    hasActiveCriteria: hasActiveSearch || hasActiveFilter,
    hasActiveFilter,
    hasActiveSearch,
    normalizedQuery,
    resultCount: filteredEvents.length,
  };
}
