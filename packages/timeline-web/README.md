# @diabetes-universe/timeline-web

Web-specific durable Timeline persistence for Diabetes Universe. Implements ADR-0015 behind the shared `TimelineRepository` contract from `@diabetes-universe/timeline`.

## IndexedDB lifecycle

Runtime flow in the browser:

```text
openTimelineIndexedDB()
  → openDB (schema upgrade on version bump)
  → bootstrap state machine
  → ready | failed connection handle
```

**Bootstrap phases:** `uninitialized` → `migrating` → `ready` | `failed`

- First run with no bootstrap metadata writes bootstrap + optional `seedEvents` in one transaction.
- Existing event or quarantine rows without valid bootstrap metadata is `TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT` (no demo reseed).
- `blocked` / `blocking` / `terminated` connection events map to repository errors; a blocked open never becomes ready.

**Database:** `diabetes-universe-timeline` (schema version `1`).

Public entry points: `openTimelineIndexedDB`, `createIndexedDbTimelineRepository`, `createIndexedDbTimelineRepositoryFoundation`.

## Bounded reads and Web page size

The durable adapter does not preload full history via `getSnapshot()` (returns an empty snapshot). Routine reads use bounded `queryEvents()` with opaque cursors.

`apps/web` hydrates the Timeline store with **100 events per repository page** (`TIMELINE_STORE_REPOSITORY_PAGE_SIZE` in `timeline-store-repository-reads.ts`), ordered `occurredAt-desc`. Additional history loads through `loadMoreHistory()` and the Timeline “Load more” control.

## Error surfacing

Repository errors normalize to machine-readable codes. On init/bootstrap failure the Timeline store enters `error` status and the list shows an error state while preserving any events already in memory. `TIMELINE_REPOSITORY_INVALID_CURSOR` during history pagination surfaces as a non-fatal inline message; loaded events remain visible.

## Further reading

- [ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../docs/adr/0015-web-indexeddb-timeline-persistence-implementation.md)
