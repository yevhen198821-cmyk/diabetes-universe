import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { getTimelineCalendarDateKey } from '../../lib/timeline/timeline-date-time';
import {
  groupTimelineEventsByDayPeriod,
  type TimelineDayPeriodGroup,
  type TimelineDayPeriodLabels,
  type TimelineDayPeriodTimeRangeLabels,
} from './timeline-day-period-model';
import {
  deriveTimelineDayMapModel,
  type TimelineDayMapMarkerInput,
  type TimelineDayMapModel,
} from './timeline-day-map-model';
import {
  createTimelineDayNavigationModel,
  type TimelineDayNavigationLabels,
  type TimelineDayNavigationModel,
} from './timeline-day-navigation-model';
import type { TimelineDateFilterSelection } from './timeline-date-filter-model';

export interface TimelineDayViewModel {
  readonly dayNavigation: TimelineDayNavigationModel | null;
  readonly dayPeriodGroups: readonly TimelineDayPeriodGroup[];
  readonly dayMap: TimelineDayMapModel;
  readonly hasEventsForSelectedDay: boolean;
  readonly selectedDayEvents: readonly SemanticTimelineEvent[];
}

export interface TimelineDayViewModelInput {
  readonly clusterAriaLabel: (count: number) => string;
  readonly dateFilter: TimelineDateFilterSelection;
  readonly dayNavigationLabels: TimelineDayNavigationLabels;
  readonly dayPeriodLabels: TimelineDayPeriodLabels;
  readonly dayPeriodTimeRangeLabels: TimelineDayPeriodTimeRangeLabels;
  readonly events: readonly SemanticTimelineEvent[];
  readonly locale: string;
  readonly mapMarkerInputs: readonly TimelineDayMapMarkerInput[];
  readonly referenceDate: Date;
  readonly selectedDateKey: string;
  readonly timeZone: string;
}

export function filterTimelineEventsForSelectedDay(
  events: readonly SemanticTimelineEvent[],
  selectedDateKey: string,
  timeZone?: string,
): readonly SemanticTimelineEvent[] {
  return events.filter((event) => {
    const eventDateKey = getTimelineCalendarDateKey(event.occurredAt, timeZone);

    return eventDateKey === selectedDateKey;
  });
}

export function createTimelineDayViewModel({
  clusterAriaLabel,
  dateFilter,
  dayNavigationLabels,
  events,
  locale,
  mapMarkerInputs,
  referenceDate,
  selectedDateKey,
  timeZone,
}: TimelineDayViewModelInput): TimelineDayViewModel {
  const dayNavigation = createTimelineDayNavigationModel(
    selectedDateKey,
    dateFilter,
    referenceDate,
    timeZone,
    dayNavigationLabels,
    locale,
  );
  const effectiveDateKey = dayNavigation?.dateKey ?? selectedDateKey;
  const selectedDayEvents = filterTimelineEventsForSelectedDay(
    events,
    effectiveDateKey,
    timeZone,
  );
  const dayPeriodGroups = groupTimelineEventsByDayPeriod(
    selectedDayEvents,
    timeZone,
  );
  const dayMap = deriveTimelineDayMapModel(mapMarkerInputs, {
    clusterAriaLabel,
    isSelectedDayToday: dayNavigation?.isToday ?? false,
    referenceDate,
    timeZone,
  });

  return {
    dayNavigation,
    dayPeriodGroups,
    dayMap,
    hasEventsForSelectedDay: selectedDayEvents.length > 0,
    selectedDayEvents,
  };
}
