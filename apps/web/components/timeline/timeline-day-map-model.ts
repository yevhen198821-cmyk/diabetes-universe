import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

import {
  getTimelineMinutesFromMidnight,
  parseTimelineDateTime,
} from '../../lib/timeline/timeline-date-time';

export const TIMELINE_DAY_MAP_MINUTES_PER_DAY = 24 * 60;

export const TIMELINE_DAY_MAP_COLLISION_THRESHOLD_MINUTES = 18;

export interface TimelineDayMapMarkerPresentation {
  readonly ariaLabel: string;
  readonly category: TimelineEventKind;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly positionPercent: number;
  readonly primaryValue?: string;
  readonly timeLabel: string;
  readonly title: string;
}

export interface TimelineDayMapClusterMarker {
  readonly ariaLabel: string;
  readonly eventIds: readonly string[];
  readonly kind: 'cluster';
  readonly markers: readonly TimelineDayMapMarkerPresentation[];
  readonly positionPercent: number;
}

export interface TimelineDayMapSingleMarker {
  readonly eventId: string;
  readonly kind: 'single';
  readonly marker: TimelineDayMapMarkerPresentation;
  readonly positionPercent: number;
}

export type TimelineDayMapRenderableMarker =
  TimelineDayMapClusterMarker | TimelineDayMapSingleMarker;

export interface TimelineDayMapModel {
  readonly clusters: readonly TimelineDayMapClusterMarker[];
  readonly currentTimePercent: number | null;
  readonly hasEvents: boolean;
  readonly markers: readonly TimelineDayMapRenderableMarker[];
  readonly singles: readonly TimelineDayMapSingleMarker[];
}

export interface TimelineDayMapMarkerInput {
  readonly ariaLabel: string;
  readonly category: TimelineEventKind;
  readonly event: SemanticTimelineEvent;
  readonly primaryValue?: string;
  readonly timeLabel: string;
  readonly title: string;
}

export function getTimelineEventPositionPercent(
  occurredAt: string,
  timeZone?: string,
): number | null {
  const minutesFromMidnight = getTimelineMinutesFromMidnight(
    occurredAt,
    timeZone,
  );

  if (minutesFromMidnight === null) {
    return null;
  }

  return (minutesFromMidnight / TIMELINE_DAY_MAP_MINUTES_PER_DAY) * 100;
}

export function getTimelineCurrentTimePositionPercent(
  referenceDate: Date,
  timeZone?: string,
): number | null {
  const minutesFromMidnight = getTimelineMinutesFromMidnight(
    referenceDate.toISOString(),
    timeZone,
  );

  if (minutesFromMidnight === null) {
    return null;
  }

  return (minutesFromMidnight / TIMELINE_DAY_MAP_MINUTES_PER_DAY) * 100;
}

function createMarkerPresentation(
  input: TimelineDayMapMarkerInput,
  timeZone?: string,
): TimelineDayMapMarkerPresentation | null {
  const positionPercent = getTimelineEventPositionPercent(
    input.event.occurredAt,
    timeZone,
  );

  if (positionPercent === null) {
    return null;
  }

  return {
    ariaLabel: input.ariaLabel,
    category: input.category,
    eventId: input.event.id,
    occurredAt: input.event.occurredAt,
    positionPercent,
    primaryValue: input.primaryValue,
    timeLabel: input.timeLabel,
    title: input.title,
  };
}

function compareMarkerPresentations(
  left: TimelineDayMapMarkerPresentation,
  right: TimelineDayMapMarkerPresentation,
): number {
  const leftTime = parseTimelineDateTime(left.occurredAt);
  const rightTime = parseTimelineDateTime(right.occurredAt);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.eventId.localeCompare(right.eventId);
}

function clusterMarkerPresentations(
  markers: readonly TimelineDayMapMarkerPresentation[],
  clusterAriaLabel: (count: number) => string,
): TimelineDayMapRenderableMarker[] {
  if (markers.length === 0) {
    return [];
  }

  const sortedMarkers = [...markers].sort(compareMarkerPresentations);
  const renderableMarkers: TimelineDayMapRenderableMarker[] = [];
  let currentCluster: TimelineDayMapMarkerPresentation[] = [sortedMarkers[0]!];

  const flushCluster = () => {
    if (currentCluster.length === 0) {
      return;
    }

    const positionPercent =
      currentCluster.reduce(
        (total, marker) => total + marker.positionPercent,
        0,
      ) / currentCluster.length;

    if (currentCluster.length === 1) {
      const marker = currentCluster[0]!;

      renderableMarkers.push({
        eventId: marker.eventId,
        kind: 'single',
        marker,
        positionPercent: marker.positionPercent,
      });
      return;
    }

    renderableMarkers.push({
      ariaLabel: clusterAriaLabel(currentCluster.length),
      eventIds: currentCluster.map((marker) => marker.eventId),
      kind: 'cluster',
      markers: currentCluster,
      positionPercent,
    });
  };

  for (let index = 1; index < sortedMarkers.length; index += 1) {
    const previousMarker = currentCluster[currentCluster.length - 1]!;
    const nextMarker = sortedMarkers[index]!;
    const previousMinutes =
      (previousMarker.positionPercent / 100) * TIMELINE_DAY_MAP_MINUTES_PER_DAY;
    const nextMinutes =
      (nextMarker.positionPercent / 100) * TIMELINE_DAY_MAP_MINUTES_PER_DAY;

    if (
      nextMinutes - previousMinutes <=
      TIMELINE_DAY_MAP_COLLISION_THRESHOLD_MINUTES
    ) {
      currentCluster = [...currentCluster, nextMarker];
      continue;
    }

    flushCluster();
    currentCluster = [nextMarker];
  }

  flushCluster();

  return renderableMarkers;
}

export function deriveTimelineDayMapModel(
  markerInputs: readonly TimelineDayMapMarkerInput[],
  options: {
    readonly clusterAriaLabel: (count: number) => string;
    readonly isSelectedDayToday: boolean;
    readonly referenceDate?: Date;
    readonly timeZone?: string;
  },
): TimelineDayMapModel {
  const timeZone = options.timeZone;
  const markerPresentations = markerInputs
    .map((input) => createMarkerPresentation(input, timeZone))
    .filter(
      (marker): marker is TimelineDayMapMarkerPresentation => marker !== null,
    );
  const markers = clusterMarkerPresentations(
    markerPresentations,
    options.clusterAriaLabel,
  );
  const singles = markers.filter(
    (marker): marker is TimelineDayMapSingleMarker => marker.kind === 'single',
  );
  const clusters = markers.filter(
    (marker): marker is TimelineDayMapClusterMarker =>
      marker.kind === 'cluster',
  );
  const currentTimePercent = options.isSelectedDayToday
    ? getTimelineCurrentTimePositionPercent(
        options.referenceDate ?? new Date(),
        timeZone,
      )
    : null;

  return {
    clusters,
    currentTimePercent,
    hasEvents: markerPresentations.length > 0,
    markers,
    singles,
  };
}
