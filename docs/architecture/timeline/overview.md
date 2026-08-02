# Timeline Overview

## Purpose

Describe the approved Timeline screen as the event journal, separate from the
home Dashboard aggregation screen.

## Status

Approved

## Responsibility

Timeline is the canonical event journal for Diabetes Universe. It owns:

- chronological event history;
- search;
- filtering;
- grouped history by day;
- event details;
- edit and delete flows;
- Quick Add entry point;
- pagination / load more.

Timeline does **not** own Dashboard aggregation blocks:

- Next Action;
- Last Glucose;
- Day Summary;
- Recent Events preview;
- AI Insight.

Those blocks remain on Dashboard only.

## Dependencies

- [Navigation Overview](../navigation/overview.md)
- [Dashboard Overview](../dashboard/overview.md)
- [Timeline List Architecture](list.md)
- [Timeline Search and Filters](search-filter.md)
- [Timeline Event Details](event-details.md)
- [Timeline Event Editing](event-editing.md)
- [Timeline Event Deletion](event-deletion.md)
- [Timeline Pagination](pagination.md)
- [Timeline States Architecture](states.md)
- [Timeline Shared State](shared-state.md)
- [Timeline Quick Add Integration](quick-add-integration.md)
- [UI Bible: Event Card System](../../ui-bible/002-event-card-system.md)
- [UI Bible: Quick Add](../../ui-bible/003-quick-add.md)

## Notes

### Route

- Canonical route: `/timeline`
- Composition root: `TimelineShell` via `apps/web/app/timeline/page.tsx`

### Stage 1 structure (approved target)

After responsibility separation, Timeline contains:

1. Header / Top Bar (with back navigation to `/`)
2. Search and Filters area
3. Timeline List
4. Empty / Loading / Error states
5. Event Details
6. Quick Add (`QuickAddRoot` → shared `QuickAddHost`)
7. Load More / Pagination

Stage 1 removes Dashboard-only blocks from the shell and establishes routes.
Search, filters, details, CRUD, states, and pagination are part of the completed
Timeline module.

### Quick Add

Timeline keeps its own `QuickAddRoot` instance. It shares `QuickAddHost` with
Dashboard but does not share Dashboard block composition.

### Navigation

- Entry from Dashboard: **Все события** → `/timeline`
- Return to Dashboard: Top Bar back link → `/`

### Domain model (Stage 2)

- Canonical entity: [Timeline Entity](../../data/entities/timeline.md)
- `TimelineEvent.dateTime` is ISO 8601 and the single temporal source of truth
- Approved kinds: `glucose`, `insulin`, `nutrition`, `medication`, `activity`,
  `note`
- Legacy `meal` kind removed; use `nutrition` only
- Display time/date labels are derived by `apps/web/lib/timeline/timeline-date-time.ts`

### Shared state (Stage 3)

- Dashboard and Timeline read from one app-level in-memory Timeline store.
- Provider is mounted through `apps/web/app/providers.tsx`.
- Quick Add on both screens writes completed events through `addEvent`.
- Store does not contain search, filter, details, pagination, or Quick Add UI
  state.
- Dashboard derived data uses React-independent selectors and only counts events
  from the local current day for Day Summary.

### List model (Stage 4)

- `TimelineListModel` separates grouping, sorting, and state selection from JSX.
- Timeline groups events by each local calendar date.
- Ready state renders all date groups; loading, empty, and error render dedicated
  accessible states.
- Search, filters, CRUD, details, pagination, and API integration are handled by
  separate Timeline model/UI boundaries.

### Search and filters (Stage 5)

- Search/filter criteria are local Timeline UI state.
- Shared Timeline store stores events only and is not changed by criteria.
- `TimelineSearchFilterModel` filters events before they enter
  `TimelineListModel`.
- Search matches title, value, unit, context, note, and kind labels.
- Type filters support all six Timeline event kinds plus `all`.
- Date filters and API are not part of Timeline Feature Complete.

### Event details, edit, and delete (Stage 6)

- Event details open from Timeline cards without changing the URL.
- `TimelineShell` stores `selectedEventId`; the selected event is read from the
  shared store to avoid stale copies.
- Edit and delete actions are available only from the details dialog.
- `id`, `kind`, `source`, and `createdAt` are immutable during edit.
- Successful edit sets `updatedAt` and calls shared store `updateEvent`.
- Successful delete calls shared store `deleteEvent`; undo is out of scope.
- Dashboard Last Glucose, Day Summary, and Recent Events update through shared
  selectors after edit/delete.
- Inline edit/delete buttons, swipe actions, and API persistence are not part
  of Timeline Feature Complete.
- Activity and note Quick Add categories remain Stage 1 stubs without save flow.

### Pagination and Load More (Stage 7)

- Timeline uses client-side demo Load More with `pageSize = 20`.
- Pipeline order is shared events -> search/filter -> pagination -> list model
  -> view.
- Search and filters are applied before pagination and use the full available
  event array.
- Grouping is applied only after pagination and only to visible events.
- `visibleCount` is local Timeline UI state; shared store does not store cursor
  or pagination data.
- CRUD flows keep search/filter criteria. Add/update/delete recalculate visible
  and remaining counts through pure models.
- Future API pagination is cursor-based and documented only; no backend endpoint
  is implemented.
- Virtualization remains out of scope until measurements prove Load More is not
  enough.

## Timeline Feature Complete Checklist

- ✓ Routing
- ✓ Shared Store
- ✓ Entity Model
- ✓ ISO DateTime
- ✓ Search
- ✓ Filters
- ✓ Grouping
- ✓ Details
- ✓ Edit
- ✓ Delete
- ✓ Load More
- ✓ Shared Dashboard State
- ✓ Responsive
- ✓ Accessibility
- ✓ Documentation
- ✓ Unit tests
- ✓ Playwright

Out of scope:

- Activity and note Quick Add save flows — Stage 1 stubs only
- Backend persistence
- API cursor pagination
- Dark mode activation
