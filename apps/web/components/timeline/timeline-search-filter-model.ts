import type {
  TimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

export type TimelineEventFilter = 'all' | TimelineEventKind;

export interface TimelineSearchFilterInput {
  readonly filter: TimelineEventFilter;
  readonly query: string;
}

export interface TimelineSearchFilterModel {
  readonly activeFilter: TimelineEventFilter;
  readonly filteredEvents: readonly TimelineEvent[];
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

function createSearchHaystack(event: TimelineEvent): string {
  return [
    event.title,
    event.value,
    event.unit,
    event.context,
    event.note,
    timelineEventKindLabels[event.kind],
    event.kind,
  ]
    .map(normalizeSearchField)
    .filter(Boolean)
    .join(' ');
}

function matchesFilter(
  event: TimelineEvent,
  filter: TimelineEventFilter,
): boolean {
  return filter === 'all' || event.kind === filter;
}

function matchesSearch(event: TimelineEvent, normalizedQuery: string): boolean {
  return (
    normalizedQuery.length === 0 ||
    createSearchHaystack(event).includes(normalizedQuery)
  );
}

export function createTimelineSearchFilterModel(
  events: readonly TimelineEvent[],
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
