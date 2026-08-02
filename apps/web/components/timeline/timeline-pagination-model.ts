import type { TimelineEvent } from '@diabetes-universe/types';

export interface TimelinePaginationInput {
  readonly events: readonly TimelineEvent[];
  readonly pageSize: number;
  readonly visibleCount: number;
}

export interface TimelinePaginationModel {
  readonly hasMore: boolean;
  readonly nextVisibleCount: number;
  readonly remainingCount: number;
  readonly totalCount: number;
  readonly visibleCount: number;
  readonly visibleEvents: readonly TimelineEvent[];
}

function normalizePositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function createTimelinePaginationModel({
  events,
  pageSize,
  visibleCount,
}: TimelinePaginationInput): TimelinePaginationModel {
  const normalizedPageSize = normalizePositiveInteger(pageSize, 1);
  const totalCount = events.length;
  const minimumVisibleCount = Math.max(normalizedPageSize, 1);
  const requestedVisibleCount = normalizePositiveInteger(
    visibleCount,
    minimumVisibleCount,
  );
  const normalizedVisibleCount =
    totalCount === 0
      ? 0
      : Math.min(
          Math.max(requestedVisibleCount, minimumVisibleCount),
          totalCount,
        );
  const nextVisibleCount =
    totalCount === 0
      ? 0
      : Math.min(normalizedVisibleCount + normalizedPageSize, totalCount);
  const visibleEvents = events.slice(0, normalizedVisibleCount);
  const remainingCount = Math.max(totalCount - normalizedVisibleCount, 0);

  return {
    hasMore: remainingCount > 0,
    nextVisibleCount,
    remainingCount,
    totalCount,
    visibleCount: normalizedVisibleCount,
    visibleEvents,
  };
}
