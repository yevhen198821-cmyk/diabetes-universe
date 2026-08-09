# P4 — Durable Local Persistence (Architecture Design)

## Status

**Architecture remediated; implementation not started**

P3 (Semantic Timeline Event Model) is Feature Complete on `main`.
P4 adds durable local Web persistence behind the semantic `TimelineRepository`
without introducing backend, auth, sync, mobile storage, or device runtime.

The architecture decisions in this document are approved as the P4 design
baseline. Concrete IndexedDB implementation choices are specified separately in
[ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../adr/0015-web-indexeddb-timeline-persistence-implementation.md), which remains **Draft** until separately approved.

No IndexedDB runtime code may land until ADR-0015 is approved.

## Purpose

Introduce durable local persistence for `SemanticTimelineEvent` records behind
the existing repository boundary so user-created Timeline events survive page
reload, while preserving the P3 semantic model and future local-first sync path.

## Governing Invariants

P4 must preserve:

- `SemanticTimelineEvent` as canonical medical event model;
- repository ownership of local Timeline persistence;
- UI ignorance of the storage implementation;
- transaction commit as the successful local-save boundary;
- no silent fallback from durable storage failure to in-memory success;
- no presentation strings as persisted medical semantics;
- no permanent `localStorage` medical-event architecture;
- no P4 claim of cloud backup, recovery, multi-device sync, or account ownership.

## Current State

```text
Quick Add / Edit
      ↓
SemanticTimelineEvent
      ↓
TimelineStoreProvider
      ↓
TimelineRepository
      ↓
InMemoryTimelineRepository   ← current adapter; non-durable
```

P3 guarantees already implemented:

- semantic-native repository contract;
- semantic Quick Add and edit paths;
- semantic Dashboard derivations;
- locale-aware presentation boundary;
- deterministic `occurredAt` + `id` ordering;
- store mutation serialization and safe error state;
- legacy `TimelineEvent` isolated to explicit migration/import utilities.

## Target State

```text
Quick Add / Edit
      ↓
SemanticTimelineEvent
      ↓
TimelineStoreProvider
      ↓
TimelineRepository
      ↓
IndexedDB-class Web adapter
      ↓
Durable semantic event rows
```

P4 is a Web durable-local slice of ADR-0014. Mobile SQLite/native adapters and
backend sync remain later architecture.

## Decision 1 — First-run bootstrap is metadata-driven

An empty database is **not** a reliable first-run signal.

The durable adapter must maintain persistent bootstrap metadata separate from
event rows. The bootstrap record indicates that first-run initialization has
completed.

Required behavior:

```text
metadata says never bootstrapped
    → seed demo data + write bootstrap metadata atomically

metadata says bootstrapped
    → never reseed merely because Timeline is empty
```

This prevents the following failure:

```text
user deletes all events
  → reload
  → store is empty
  → application incorrectly inserts demo medical history again
```

The event store and bootstrap metadata must be written in one durable transaction
on first initialization. If that transaction fails, bootstrap is not complete.

Exact metadata keys and storage schema are defined by the P4 Implementation ADR.

## Decision 2 — Durable record identity

`SemanticTimelineEvent.id` is the durable local primary identity.

A P4 adapter may wrap the semantic event with adapter-local metadata such as:

- `persistedAt`;
- `storageSchemaVersion`.

The adapter must not introduce a second public event identity.

Future server database IDs may exist internally, but they must not replace the
stable Timeline event ID.

## Decision 3 — Compound chronological indexes

P4 requires indexes that support deterministic chronological pagination without
loading full history.

Required index semantics:

```text
[occurredAt, id]
[kind, occurredAt, id]
```

The first supports general Timeline pagination and recent-event reads.
The second supports kind-scoped reads such as latest glucose.

`id` is part of the index key to provide deterministic ordering when multiple
events have the same `occurredAt`.

Concrete IndexedDB key paths and index names are implementation details recorded
in ADR-0015.

## Decision 4 — No persisted local-day bucket in P4

P4 does **not** persist a canonical `localDay`/calendar-date column on event rows.

Reason: a calendar day depends on timezone. Persisting one day bucket risks
encoding presentation/user-context semantics into canonical storage and becomes
incorrect if timezone context changes.

Current-day queries must instead derive an occurrence range from the active
timezone and query by `occurredAt`.

A future read-model/analytics projection may deliberately materialize day buckets
if it has explicit timezone ownership and rebuild semantics.

## Decision 5 — Repository reads become bounded

The current `getSnapshot()` full-history model is acceptable for the in-memory
demo but must not remain the routine product read architecture for 10k–100k+
events.

Before P4 is Feature Complete, the repository/application read boundary must
support bounded reads such as:

- event by ID;
- chronological page with limit/cursor;
- kind-filtered chronological page;
- occurrence-time range.

This allows:

```text
Timeline
  → page of events

Dashboard latest glucose
  → glucose, newest first, limit 1

Dashboard today's summary
  → occurredAt range for today's timezone boundaries

Recent events
  → newest first, bounded limit
```

Exact method names and cursor representation belong to ADR-0015 and P4a.

`getSnapshot()` may remain temporarily for test/migration/hydration compatibility,
but full-history loading must not be required for routine Timeline/Dashboard
rendering by P4 completion.

## Decision 6 — Cursor semantics

Pagination cursors must be opaque outside the repository boundary.

At minimum, the implementation cursor must encode enough structural state to
resume deterministic ordering after `(occurredAt, id)` without duplicate or
skipped rows.

Cursor data must not contain medical payloads, note text, medication names, or
other PHI.

Malformed/incompatible cursors fail safely. They must not silently degrade into
an unbounded read.

## Decision 7 — Corrupt rows use durable quarantine

Corrupt persisted medical records must not be silently trusted and must not be
silently skipped.

P4 requires a durable quarantine mechanism.

```text
persisted row
  ↓ validate
valid
  → repository result
invalid
  → quarantine transaction
      ├─ preserve raw row for diagnostics/recovery
      └─ remove/isolate it from active event rows
```

Quarantined records:

- do not enter Timeline UI;
- do not enter Dashboard calculations;
- do not enter search;
- do not enter Next Action inputs;
- remain diagnosable/recoverable;
- must not expose PHI to logs or telemetry.

The exact quarantine store schema and reason codes are defined in ADR-0015.

If quarantine itself cannot be completed safely, repository initialization/read
must surface an error instead of pretending the corrupt record was handled.

## Decision 8 — Successful save means durable transaction commit

A medical event is not locally saved merely because:

- React state updated;
- an IndexedDB request was scheduled;
- an object-store `put` request returned without waiting for transaction commit.

P4 success boundary:

```text
validate semantic mutation
  → begin durable transaction
  → write record
  → transaction commits successfully
  → return applied
  → application projection refreshes
```

Transaction abort/failure means the mutation was not saved.

No fallback may report success by keeping the event only in memory.

## Decision 9 — Local delete is physical in P4

P4 does not implement sync tombstones.

`deleteEvent(id)` removes the event from local durable storage after the local
transaction commits.

This is intentionally different from the future synchronized architecture in
ADR-0014, where deletion requires tombstones so other devices/backend do not
resurrect the event.

Tombstones begin only with the approved sync/outbox model. P4 must not invent a
partial sync lifecycle prematurely.

## Decision 10 — Storage schema version is distinct from event schema version

Two version domains exist:

```text
SemanticTimelineEvent.schemaVersion
  = medical/domain event shape

storageSchemaVersion
  = adapter/database physical schema generation
```

They must not be conflated.

Storage upgrades are adapter responsibility. Event-schema migrations use the
canonical event migration architecture.

## Decision 11 — No silent destructive recovery

On open/upgrade/corruption failure, the adapter must never automatically delete
and recreate the database merely to get the application running.

Medical data recovery follows an explicit policy.

Allowed responses include:

- retry;
- safe schema migration;
- durable quarantine of a specific invalid row;
- user/support-directed reset after explicit confirmation in a future recovery
  flow.

Automatic database reset is prohibited.

## Decision 12 — Local persistence is not backup

P4 improves continuity across reload/browser restarts on the same browser
profile. It is not a backup/recovery architecture.

P4 does not protect against:

- browser storage clearing;
- browser eviction;
- lost/broken device;
- lost browser profile;
- disk failure;
- malicious browser extensions/origin compromise.

Cross-device durability, backup, restore, audit authority, and account recovery
require backend/auth/sync architecture.

Product copy must not market P4 as cloud backup or secure account recovery.

## Persistence Record Direction

P4 may use an adapter envelope similar to:

```ts
interface LocalTimelinePersistenceRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly kind: TimelineEventKind;
  readonly event: SemanticTimelineEvent;
  readonly persistedAt: string;
  readonly storageSchemaVersion: number;
}
```

The duplicated structural fields are index material only. The adapter must verify
that they match `event.id`, `event.occurredAt`, and `event.kind` when reading.

Deferred beyond P4:

- `ownerId`;
- server revision;
- sync state;
- tombstone;
- client mutation ID;
- server acknowledgement timestamps.

## Failure Model

| Scenario | Required P4 behavior |
| -------- | -------------------- |
| Database unavailable | Repository initialization error |
| Open/upgrade blocked | Explicit blocked/error handling; no false ready state |
| Schema migration failure | Initialization error; no auto-reset |
| Write transaction failure | Mutation not applied |
| Quota exhaustion | Explicit write failure; no automatic medical-data deletion |
| Invalid cursor | Bounded read error |
| Corrupt row | Durable quarantine |
| Quarantine failure | Read/init error |
| Deleted all events after bootstrap | Remains empty on reload; no reseed |

UI-facing copy remains presentation-layer responsibility. Raw browser/storage
exceptions must not be exposed as user messages.

## Storage Quota Policy

P4 must not automatically delete older Timeline records to satisfy storage quota.

On quota failure:

- current committed data remains authoritative;
- attempted mutation fails;
- application shows safe storage failure UX;
- no in-memory-only success state is created.

The browser persistent-storage API may be evaluated separately, but it cannot be
used as a claim of guaranteed backup/non-eviction.

## Security / Privacy

P4 persists sensitive health data on the local browser profile.

Requirements:

- no PHI in URLs;
- no event payload logging;
- no quarantine raw-data logging to telemetry;
- no direct UI IndexedDB access;
- no claim that IndexedDB itself supplies application-level encryption;
- no auth semantics inferred from possession of browser-local data;
- no `localStorage` copy of medical event bodies.

Application-level encryption/key management is deliberately not invented in P4.
A Web encryption design without an approved authentication/key lifecycle can
create false protection because application JavaScript must also obtain the key.

## Testing Requirements

P4 adapter testing must cover more than CRUD.

Required classes of tests:

- first open + atomic demo bootstrap;
- reopen/reload preserves writes;
- empty-after-delete does not reseed;
- duplicate ID behavior;
- missing update/delete behavior;
- deterministic `(occurredAt, id)` ordering;
- bounded asc/desc queries;
- kind-filtered bounded query;
- cursor continuation;
- invalid cursor handling;
- object-store/index schema upgrade;
- corruption quarantine;
- quarantine failure;
- transaction abort/write failure;
- quota normalization where practically simulatable;
- immutable input/output semantics;
- existing P3 semantic and presentation regression suites.

Node unit tests may use a fake IndexedDB implementation, but browser E2E must also
prove real reload persistence.

Minimum browser persistence journey:

```text
open application
  → add Timeline event
  → reload
  → event remains
```

A delete/reload journey is also required.

## Revised P4 Waves

### P4a — Storage Contract & Schema Foundation

Deliver:

- approved ADR-0015 implementation decision;
- bounded repository query contracts;
- adapter-local schema types;
- IndexedDB open/upgrade foundation;
- bootstrap metadata contract;
- record validators;
- normalized error categories;
- schema/transaction unit tests.

No Web default cutover yet.

### P4b — IndexedDB Repository Adapter

Deliver:

- durable semantic CRUD;
- first-run bootstrap transaction;
- chronological/kind compound indexes;
- bounded query/cursor implementation;
- quarantine store;
- adapter test suite.

`InMemoryTimelineRepository` remains available for tests/explicit injection.

### P4c — Web Cutover & Reload Durability

Deliver:

- Web default repository becomes durable adapter;
- no silent in-memory fallback;
- reload persistence E2E;
- delete/reload E2E;
- first-run/no-reseed E2E/integration coverage;
- preserve existing product journeys.

### P4d — Bounded Product Reads

Deliver:

- Timeline client pagination backed by bounded repository queries;
- Dashboard latest glucose/recent/day-range reads backed by bounded repository
  access/read model;
- routine product rendering no longer requires full historical array;
- scale/regression audit before P4 Feature Complete.

## P4 Completion Gate

P4 cannot be declared Feature Complete merely when events survive reload.

P4 completion requires:

1. durable semantic repository active on Web;
2. successful-save boundary = committed transaction;
3. stable metadata-driven bootstrap;
4. durable corrupt-record quarantine;
5. bounded repository queries active for routine Timeline/Dashboard reads;
6. no silent in-memory fallback;
7. reload/delete/no-reseed regression coverage;
8. full validation green;
9. documentation aligned with runtime reality.

## Explicit Non-Scope

- SQLite / native mobile storage;
- backend/API;
- authentication/authorization;
- `ownerId` implementation;
- sync/outbox/retry/conflict resolution;
- tombstone sync semantics;
- device integrations;
- cross-tab live synchronization;
- cloud backup/recovery;
- manual export/import backup UX;
- encryption/key-management implementation;
- Analytics/Reports/AI changes;
- caregiver/HCP access.

## Implementation Decision Gate

Architecture is approved at this level.

Concrete Web implementation is governed by:

[ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../adr/0015-web-indexeddb-timeline-persistence-implementation.md)

ADR-0015 must be **Approved** before P4a runtime code begins.

## Dependencies

- [ADR-0014 — Local-First Medical Event Persistence](../../adr/0014-local-first-medical-event-persistence-architecture.md)
- [ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../adr/0015-web-indexeddb-timeline-persistence-implementation.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Timeline Shared State](shared-state.md)

## Date

2026-08-09
