# Timeline Pagination Architecture

## Purpose

Define client-side demo pagination for long Timeline histories and document the
future cursor API contract.

## Status

Approved

## Responsibility

Pagination owns:

- limiting the number of Timeline events rendered in the DOM;
- local `visibleCount` UI state in `TimelineShell`;
- explicit Load More progression;
- a pure `TimelinePaginationModel`;
- API-ready cursor contract documentation.

Pagination does not own shared store state, Dashboard derivations, Quick Add
state, search/filter matching, grouping, virtualization, or backend endpoints.

## Pipeline

The approved Timeline pipeline is:

```text
shared events
-> search/filter model
-> pagination model
-> list model
-> TimelineList
```

Search and filters are applied to the full available event array before
pagination. Grouping is applied only to `visibleEvents` after pagination.

## Demo behavior

- Demo `pageSize`: 20 events.
- Initial `visibleCount`: 20.
- Load More increases `visibleCount` by 20, capped at total count.
- Criteria changes reset `visibleCount` to 20 in event handlers.
- Shared store does not store cursor or visible count.

## Future API contract

```http
GET /timeline/events?cursor=<cursor>&limit=20&kind=<kind>&query=<query>
```

```ts
interface TimelinePage {
  readonly items: readonly TimelineEvent[];
  readonly nextCursor?: string;
  readonly hasMore: boolean;
}
```

- Cursor is opaque.
- Client does not create or decode cursors.
- Server sorts descending by `dateTime` with `id` tie-break.
- Server applies search/filter before pagination.
- The client-side demo model can be replaced by API-backed pages without
  changing Timeline list/detail UI contracts.

## Performance policy

Virtualization is not introduced in this stage. It is allowed only after
measurement shows jank, hundreds of visible cards are required at once, and Load
More is insufficient for the target UX.
