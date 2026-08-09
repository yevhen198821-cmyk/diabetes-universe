import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

import {
  getSemanticEventCardContext,
  getSemanticEventCardTitle,
  getSemanticEventCardUnit,
  getSemanticEventCardValue,
} from '../../lib/timeline/semantic-event-fields';

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

export const timelineEventKindLabels: Record<TimelineEventKind, string> = {
  activity: 'Активность',
  glucose: 'Глюкоза',
  insulin: 'Инсулин',
  medication: 'Лекарство',
  note: 'Заметка',
  nutrition: 'Питание',
};

export const timelineEventFilterLabels: Record<TimelineEventFilter, string> = {
  all: 'Все',
  activity: 'Активность',
  glucose: 'Глюкоза',
  insulin: 'Инсулин',
  medication: 'Лекарства',
  note: 'Заметки',
  nutrition: 'Питание',
};

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

function createSearchHaystack(event: SemanticTimelineEvent): string {
  const searchable = [
    getSemanticEventCardTitle(event),
    getSemanticEventCardValue(event),
    getSemanticEventCardUnit(event),
    getSemanticEventCardContext(event),
    event.kind === 'nutrition'
      ? event.note
      : event.kind === 'medication'
        ? event.note
        : event.kind === 'activity'
          ? event.note
          : undefined,
    timelineEventKindLabels[event.kind],
    event.kind,
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
): boolean {
  return (
    normalizedQuery.length === 0 ||
    createSearchHaystack(event).includes(normalizedQuery)
  );
}

export function createTimelineSearchFilterModel(
  events: readonly SemanticTimelineEvent[],
  input: TimelineSearchFilterInput,
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
      matchesSearch(event, normalizedQuery),
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
