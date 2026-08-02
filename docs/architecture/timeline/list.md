# Timeline List Architecture

## Purpose

Define the Timeline list model/view split and grouping rules.

## Status

Approved

## Responsibility

Timeline list architecture owns:

- transforming shared store state into a `TimelineListModel`;
- grouping events by local calendar date;
- sorting groups and events;
- exposing loading, ready, empty, filtered-empty, and error states to the view;
- delegating Timeline card activation to the details flow;
- rendering only the paginated visible event set it receives.

It does not own search criteria, pagination state, event details state, edit
validation, delete confirmation, Quick Add panel state, or Dashboard
derivations.

## Dependencies

- [Timeline Overview](overview.md)
- [Timeline States](states.md)
- [Timeline Shared State](shared-state.md)
- [Timeline Entity](../../data/entities/timeline.md)

## Notes

### Model

`apps/web/components/timeline/timeline-list-model.ts` is a pure TypeScript model
module. It has no React hooks and no JSX.

The model receives:

- events;
- store status;
- store error;
- reference date;
- locale/timezone.

The model returns grouped view data only.

### Grouping

- One group per local calendar date.
- Current local day label: `Сегодня`.
- Previous local day label: `Вчера`.
- Older dates use localized date labels.
- Older dates include the year when the event year differs from the reference
  year.
- Invalid `dateTime` values go into a stable fallback group labelled
  `Дата неизвестна`.

### Filtered input

Search/filter criteria are applied before events enter `TimelineListModel`. When
criteria hide all events while the store still has events, the model returns
`filtered-empty` instead of store `empty`.

### Paginated input

Pagination is applied before events enter `TimelineListModel`. The list model
groups only `visibleEvents`, so the DOM does not contain the entire long history
at once. Result counts and remaining counts stay outside the list model.

### Sorting

- Groups are ordered newest date to oldest date.
- Events inside groups are ordered newest to oldest.
- Equal `dateTime` values are ordered by `id` for stable output.
- Input arrays are never mutated.

### Card activation

The Timeline list can pass `onOpenEvent` into `EventCard` so cards render as
keyboard-accessible buttons in Timeline. Dashboard Recent Events remain separate
and are not changed by this interaction rule.
