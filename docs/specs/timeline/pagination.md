# Timeline Pagination Spec

## Status

Approved

## Model contract

```ts
interface TimelinePaginationInput {
  readonly events: readonly TimelineEvent[];
  readonly pageSize: number;
  readonly visibleCount: number;
}

interface TimelinePaginationModel {
  readonly visibleEvents: readonly TimelineEvent[];
  readonly visibleCount: number;
  readonly totalCount: number;
  readonly remainingCount: number;
  readonly hasMore: boolean;
  readonly nextVisibleCount: number;
}
```

`createTimelinePaginationModel` is pure, non-React, and does not mutate input.
The model expects events in the order they should be shown.

## Rules

- `pageSize` is explicit.
- `visibleCount` is never less than `pageSize` for non-empty lists.
- `visibleCount` is capped at `totalCount`.
- Empty lists return zero counts and no visible events.
- The model returns the first `visibleCount` events only.
- The model does not group, sort, search, filter, or read shared store state.

## CRUD interaction

- Add: a newly sorted top event appears in the current first page; visible count
  is not increased automatically.
- Edit: changed `dateTime` can move an event between visible and hidden pages; if
  it leaves the current visible set, details close predictably.
- Delete: total and remaining counts are recalculated; Load More disappears when
  no events remain hidden.

## Empty states

Loading and error states take priority. Store-empty and filtered-empty behavior
remains owned by `TimelineListModel`; Load More is hidden for both.
