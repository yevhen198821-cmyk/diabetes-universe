import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

import {
  mapTimelineSearchPresentation,
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

export function normalizeTimelineSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
}

function normalizeSearchField(value: string | undefined): string {
  return normalizeTimelineSearchQuery(value ?? '');
}

function createSearchHaystack(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): string {
  const presentation = mapTimelineSearchPresentation(event, dependencies);
  const searchable = [
    ...presentation.userContent,
    ...presentation.localizedLabels,
  ];

  return searchable
    .map((value) => normalizeSearchField(value))
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
  const normalizedQuery = normalizeTimelineSearchQuery(input.query);
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
