# Timeline List Specification

## Status

Approved

## Purpose

Specify the Timeline event list behavior for grouped multi-day history.

## Functional Requirements

- The list receives a ready `TimelineListModel`.
- The list renders every group from `model.groups`.
- Each group renders as a separate `section`.
- Each group has a stable `key`.
- Each group heading is connected with `aria-labelledby`.
- Events render through existing compact `EventCard`.
- Timeline event cards are interactive buttons when details are available.
- Timeline rail is scoped to each group and does not connect days.
- The list receives only paginated visible events.

## Group Rules

- Group by local calendar date.
- Sort groups newest to oldest.
- Sort events newest to oldest inside each group.
- Equal `dateTime` values use `id` as stable tiebreaker.
- Invalid dates render in `Дата неизвестна` fallback group.

## Non-Goals

- Event details.
- Edit/delete UI.
- Pagination state and Load More controls.
- API integration.

## Acceptance Criteria

- Multi-day demo data shows `Сегодня`, `Вчера`, and older date groups.
- No grouping or sorting is performed inside React JSX.
- No slicing, search, filter, or pagination is performed inside React JSX.
- Empty arrays do not render empty `<ul>` elements.
