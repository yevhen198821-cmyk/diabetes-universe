# Timeline Search and Filters Architecture

## Purpose

Define Timeline-local search and type filtering without changing the shared
Timeline store.

## Status

Approved

## Responsibility

Search/filter architecture owns:

- query normalization;
- type filter selection;
- combining query and type filter;
- returning filtered events for `TimelineListModel`;
- distinguishing store-empty from filtered-empty presentation.

It does not own shared event storage, Dashboard derived data, date filtering,
details, edit, delete, pagination, or API integration.

## Dependencies

- [Timeline List Architecture](list.md)
- [Timeline States Architecture](states.md)
- [Timeline Shared State](shared-state.md)

## Notes

### Model

`apps/web/components/timeline/timeline-search-filter-model.ts` is pure
TypeScript. It has no React hooks and no JSX.

The model receives:

- `events`;
- `query`;
- `filter`.

It returns:

- normalized query;
- active filter;
- filtered events;
- result count;
- active criteria flags.

### Search fields

Search matches:

- `title`;
- `value`;
- `unit`;
- `context`;
- `note`;
- kind display label;
- raw kind string.

### Normalization

- trims leading/trailing whitespace;
- collapses repeated spaces;
- case-insensitive;
- supports Cyrillic and Latin text;
- partial matching only;
- no fuzzy search and no external library.

### Filters

Approved filters:

- `all`;
- `glucose`;
- `insulin`;
- `nutrition`;
- `medication`;
- `activity`;
- `note`.

Only one type filter is active at a time. `all` does not restrict events.

### State ownership

`query` and `activeFilter` are Timeline UI state owned by `TimelineShell`. The
shared Timeline store never stores UI criteria.

### Empty distinction

- Store empty: `Событий пока нет`, primary action opens Quick Add.
- Filtered empty: `Ничего не найдено`, primary action resets criteria.

Store loading/error statuses have priority over filtered-empty.
