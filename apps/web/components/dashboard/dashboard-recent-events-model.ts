import type { EventCardType } from '@diabetes-universe/ui';

import type { DashboardRecentEventsLabels } from './dashboard-recent-events-labels';

export type DashboardRecentEventCategory =
  'activity' | 'insulin' | 'medication' | 'nutrition';

export interface DashboardRecentEventSource {
  readonly category: DashboardRecentEventCategory;
  readonly context: string;
  readonly dateTime: string;
  readonly displayTime: string;
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export interface DashboardRecentEventCard {
  readonly cardType: EventCardType;
  readonly category: DashboardRecentEventCategory;
  readonly categoryLabel: string;
  readonly context: string;
  readonly dateTime: string;
  readonly displayTime: string;
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

interface DashboardRecentEventsLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardRecentEventsReadyProps {
  readonly events: readonly DashboardRecentEventSource[];
  readonly state: 'ready';
  readonly viewAllHref: string;
}

interface DashboardRecentEventsEmptyProps {
  readonly message?: string;
  readonly state: 'empty';
}

interface DashboardRecentEventsErrorProps {
  readonly message?: string;
  readonly state: 'error';
}

export type DashboardRecentEventsProps =
  | DashboardRecentEventsLoadingProps
  | DashboardRecentEventsReadyProps
  | DashboardRecentEventsEmptyProps
  | DashboardRecentEventsErrorProps;

export interface DashboardRecentEventsViewModel {
  readonly events: readonly DashboardRecentEventCard[];
  readonly isLoading: boolean;
  readonly message: string | null;
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
  readonly viewAllHref: string | null;
  readonly viewAllLabel: string;
}

export const DASHBOARD_RECENT_EVENTS_MAX_CARDS = 4;

const APPROVED_RECENT_EVENT_CATEGORIES = new Set<DashboardRecentEventCategory>([
  'activity',
  'insulin',
  'medication',
  'nutrition',
]);

const categoryToCardType: Record<DashboardRecentEventCategory, EventCardType> =
  {
    activity: 'activity',
    insulin: 'insulin',
    medication: 'medication',
    nutrition: 'nutrition',
  };

function isValidIsoDateTime(dateTime: string): boolean {
  return !Number.isNaN(Date.parse(dateTime));
}

function isApprovedRecentEventCategory(
  category: string,
): category is DashboardRecentEventCategory {
  return APPROVED_RECENT_EVENT_CATEGORIES.has(
    category as DashboardRecentEventCategory,
  );
}

function normalizeRecentEventSource(
  event: DashboardRecentEventSource,
): DashboardRecentEventSource | null {
  const id = event.id.trim();
  const title = event.title.trim();
  const value = event.value.trim();
  const unit = event.unit.trim();
  const context = event.context.trim();
  const displayTime = event.displayTime.trim();
  const dateTime = event.dateTime.trim();

  if (
    id.length === 0 ||
    title.length === 0 ||
    value.length === 0 ||
    displayTime.length === 0 ||
    dateTime.length === 0 ||
    !isValidIsoDateTime(dateTime) ||
    !isApprovedRecentEventCategory(event.category)
  ) {
    return null;
  }

  return {
    category: event.category,
    context,
    dateTime,
    displayTime,
    id,
    title,
    unit,
    value,
  };
}

function toRecentEventCard(
  event: DashboardRecentEventSource,
  categoryLabels: DashboardRecentEventsLabels['categories'],
): DashboardRecentEventCard {
  return {
    cardType: categoryToCardType[event.category],
    category: event.category,
    categoryLabel: categoryLabels[event.category],
    context: event.context,
    dateTime: event.dateTime,
    displayTime: event.displayTime,
    id: event.id,
    title: event.title,
    unit: event.unit,
    value: event.value,
  };
}

export function selectDashboardRecentEvents(
  events: readonly DashboardRecentEventSource[],
  categoryLabels: DashboardRecentEventsLabels['categories'],
): DashboardRecentEventCard[] {
  const latestByCategory = new Map<
    DashboardRecentEventCategory,
    DashboardRecentEventSource
  >();

  for (const source of events) {
    const event = normalizeRecentEventSource(source);

    if (!event) {
      continue;
    }

    const existing = latestByCategory.get(event.category);
    const eventTimestamp = Date.parse(event.dateTime);
    const existingTimestamp = existing
      ? Date.parse(existing.dateTime)
      : Number.NaN;

    if (!existing || eventTimestamp > existingTimestamp) {
      latestByCategory.set(event.category, event);
    }
  }

  return [...latestByCategory.values()]
    .sort(
      (left, right) => Date.parse(right.dateTime) - Date.parse(left.dateTime),
    )
    .slice(0, DASHBOARD_RECENT_EVENTS_MAX_CARDS)
    .map((event) => toRecentEventCard(event, categoryLabels));
}

function createEmptyViewModel(
  labels: DashboardRecentEventsLabels,
  message: string,
): DashboardRecentEventsViewModel {
  return {
    events: [],
    isLoading: false,
    message,
    state: 'empty',
    viewAllHref: null,
    viewAllLabel: labels.viewAll,
  };
}

export function createDashboardRecentEventsViewModel(
  props: DashboardRecentEventsProps,
  labels: DashboardRecentEventsLabels,
): DashboardRecentEventsViewModel {
  switch (props.state) {
    case 'loading':
      return {
        events: [],
        isLoading: true,
        message: props.loadingLabel?.trim() || labels.loading,
        state: props.state,
        viewAllHref: null,
        viewAllLabel: labels.viewAll,
      };
    case 'ready': {
      const events = selectDashboardRecentEvents(
        props.events,
        labels.categories,
      );
      const viewAllHref = props.viewAllHref.trim();

      if (events.length === 0) {
        return createEmptyViewModel(labels, labels.defaultEmpty);
      }

      if (viewAllHref.length === 0) {
        return createEmptyViewModel(labels, labels.unavailable);
      }

      return {
        events,
        isLoading: false,
        message: null,
        state: props.state,
        viewAllHref,
        viewAllLabel: labels.viewAll,
      };
    }
    case 'empty':
      return {
        events: [],
        isLoading: false,
        message: props.message?.trim() || labels.defaultEmpty,
        state: props.state,
        viewAllHref: null,
        viewAllLabel: labels.viewAll,
      };
    case 'error':
      return {
        events: [],
        isLoading: false,
        message: props.message?.trim() || labels.defaultError,
        state: props.state,
        viewAllHref: null,
        viewAllLabel: labels.viewAll,
      };
  }
}
