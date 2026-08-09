# P4 — Durable Local Persistence (Architecture Design)

## Status

**Architecture approved after remediation — implementation not started**

P3 (Semantic Timeline Event Model) is Feature Complete. This document defines the
approved P4 architecture direction for durable local Web persistence.

No IndexedDB runtime adapter, SQLite adapter, backend, auth, sync, outbox, or
device-integration code may land until the separate P4 Implementation ADR is
approved.

## Purpose

Introduce **durable local persistence** for `SemanticTimelineEvent` records
behind the Timeline repository boundary so user-created Timeline events survive
page reload while preserving the P3 semantic application model.

P4 is a local-first Web persistence slice. It is **not** backup, cross-device
recovery, account recovery, cloud sync, or multi-user persistence.

## Baseline (post-P3)

```text
Quick Add / Edit
      ↓
SemanticTimelineEvent
      ↓
TimelineStoreProvider
      ↓
TimelineRepository
      ↓
InMemoryTimelineRepository   ← current adapter (non-durable)
      ↓
SemanticTimelineEvent[]
```

P3 guarantees to preserve:

- `SemanticTimelineEvent` is the canonical current medical-event model.
- `TimelineRepositoryEvent = SemanticTimelineEvent`.
- Repository mutation semantics remain explicit and testable.
- Store mutation serialization, error handling, and unmount safety remain.
- Presentation remains downstream of semantic data.
- Legacy `TimelineEvent` remains migration/import-only.

## Approved target architecture

```text
Timeline / Dashboard
        ↓
Application read/write boundary
        ↓
TimelineRepository
  ├── mutations
  │     add / update / delete
  │
  └── bounded reads
        getById / query
        ↓
IndexedDbTimelineRepository
        ↓
IndexedDB
  ├── timelineEvents
  ├── storageMetadata
  └── quarantine
```

The UI must not know whether data is backed by IndexedDB, in-memory storage, a
future SQLite adapter, or a future backend-aware repository.

ADR-0014 remains the governing persistence architecture.

## In scope

### 1. Web durable repository adapter

P4 will add a Web IndexedDB-class implementation behind the Timeline repository
boundary.

The concrete IndexedDB access layer is **not selected by this document**. The P4
Implementation ADR must compare and approve one of:

- raw IndexedDB;
- a thin IndexedDB wrapper;
- a higher-level persistence abstraction.

Selection criteria must include transactions, schema migrations, compound
indexes, cursor support, TypeScript ergonomics, maintenance, dependency weight,
browser support, and testability.

Permanent `localStorage` persistence for medical Timeline events remains
rejected.

### 2. Semantic persisted records

Durable storage stores semantic events only. It must never persist legacy
presentation `TimelineEvent` records as the active database format.

Adapter-local storage metadata may wrap or accompany a semantic event, but must
not redefine the medical event model.

Conceptually:

```text
Timeline persistence row
  event: SemanticTimelineEvent
  persistedAt: adapter-local timestamp
  storageSchemaVersion: adapter schema generation
```

`storageSchemaVersion` is distinct from
`SemanticTimelineEvent.schemaVersion`.

Deferred beyond P4:

- `ownerId` and multi-user identity;
- server revision / optimistic concurrency metadata;
- tombstones for sync propagation;
- backend outbox / sync state;
- server acknowledgement timestamps;
- encryption/key-management vendor decision.

## First-run bootstrap contract

### Invariant

**An empty event store does not mean first run.**

The following must never happen:

```text
user deletes all events
→ database becomes empty
→ reload
→ demo seed is inserted again
```

First-run initialization is controlled by durable metadata, not by event count.

The storage metadata store must contain an explicit bootstrap marker, for
example conceptually:

```text
bootstrapCompleted: true
bootstrapVersion: 1
storageSchemaVersion: <current version>
```

Bootstrap behavior:

```text
open database
   ↓
read storageMetadata
   ↓
bootstrap not completed
   → atomically write semantic demo seed + bootstrap metadata

bootstrap completed
   → never re-seed based only on event count
```

The exact metadata key names and transaction DDL belong to the Implementation
ADR, but this invariant is approved and mandatory.

## Repository read-contract evolution

### Problem

The P3 `getSnapshot()` model loads the entire collection. That is acceptable for
the current in-memory demo but is not the long-term read contract for journals
that may grow to 10k–100k+ events.

### Decision

P4 must introduce bounded repository reads before P4 is declared complete.

The target repository capability is conceptually:

```ts
getById(id): Promise<SemanticTimelineEvent | null>
query(query): Promise<TimelineQueryResult>
```

A bounded query must support at minimum:

- chronological range;
- kind filtering;
- stable ordering;
- limit;
- cursor or equivalent continuation token.

`getSnapshot()` may remain temporarily as a compatibility API during adapter
cutover, but it is **transitional** and is not the target large-history API.

P4 completion requires Timeline and Dashboard routine reads to stop depending on
full-history materialization where bounded queries are sufficient.

## IndexedDB data model

### `timelineEvents`

Stable event identity is the primary key.

Approved conceptual schema:

```text
object store: timelineEvents
primary key: event.id

compound chronological index:
  [event.occurredAt, event.id]

compound kind chronology index:
  [event.kind, event.occurredAt, event.id]
```

Rationale:

- lookup/update/delete are naturally keyed by stable event `id`;
- chronological pagination uses `[occurredAt, id]`;
- kind-filtered chronology uses `[kind, occurredAt, id]`;
- `id` preserves deterministic P3 tie-breaking.

`persistedAt` must never control medical Timeline ordering.

### No persisted local-calendar-day authority

P4 does **not** define a canonical persisted `localDay` bucket.

Calendar-day membership depends on the requested IANA time zone. Because the
current semantic event model does not contain an authoritative
`occurredTimeZone`, storing one local-day bucket would create incorrect results
when the presentation/query timezone changes.

Instead:

```text
requested local date + requested IANA timezone
        ↓
resolve start/end instants
        ↓
range query via [occurredAt, id]
```

A future architecture decision may revisit event occurrence timezone semantics.

### `storageMetadata`

The metadata store owns adapter-level state such as:

- bootstrap completion/version;
- current storage schema version;
- future adapter migration markers when explicitly approved.

It must not contain medical presentation data.

### `quarantine`

Structurally invalid or unreadable durable rows must not be silently skipped,
auto-deleted, or converted into fabricated valid medical events.

A durable quarantine record must preserve enough evidence for diagnosis and
possible recovery, conceptually:

```text
quarantineId
originalKey
rawRecord
reasonCode
detectedAt
storageSchemaVersion
```

Exact serialization belongs to the Implementation ADR.

## Corrupt-record policy

### Decision

**Silent skip is rejected. Durable quarantine is required.**

Read behavior:

```text
read stored row
   ↓
validate storage envelope + semantic event
   ├── valid   → active repository result
   └── invalid → preserve in quarantine + report diagnostics
```

A corrupt row must not become a valid `SemanticTimelineEvent` by guessing
medical semantics.

The Implementation ADR must decide whether partial corruption produces:

- a `ready/degraded` repository state with valid events still available; or
- initialization failure with preserved quarantine evidence.

Whichever state model is chosen, evidence preservation is mandatory and silent
loss is forbidden.

## Mutation transaction semantics

For P4, a medical event is saved only after the durable IndexedDB transaction
commits successfully.

```text
add / update / delete
      ↓
IndexedDB transaction
      ↓
transaction commit
      ↓
repository resolves `applied`
      ↓
application state may reflect durable success
```

Request-level success before transaction commit is not sufficient.

If the transaction aborts or storage fails:

- repository mutation must fail;
- application must not claim the event was saved;
- no silent in-memory fallback is allowed.

## Delete semantics in P4

P4 is local-only and has no sync/tombstone model.

Therefore P4 local deletion is:

```text
deleteEvent(id)
→ physical deletion from the local event store
```

This is explicitly **not** the future synced deletion model. Before backend sync
is introduced, deletion semantics must be evolved to the ADR-0014 tombstone
model so deleted events cannot reappear through synchronization.

## Failure model

| Scenario | Approved P4 behavior |
| --- | --- |
| Durable database open/init failure | Application/store error; no silent in-memory fallback |
| Transaction/write failure | Mutation is not saved; machine-readable repository failure |
| Quota/capacity failure | Write fails; no false success or silent eviction policy |
| Structurally corrupt row | Durable quarantine; no silent skip or fabricated event |
| Storage schema upgrade | Explicit adapter migration before initialization resolves |
| Unsupported future event schema | Preserve evidence; explicit failure/quarantine according to approved migration policy |

Repository errors must normalize storage implementation exceptions before they
reach application/UI boundaries.

The Implementation ADR must decide whether quota/capacity receives a dedicated
machine code or is normalized to the existing repository write-failure code.

## Backup and recovery boundary

P4 durable local persistence is **not a backup system**.

P4 does not guarantee recovery after:

- browser profile deletion/reset;
- user-cleared site data;
- browser/OS storage eviction;
- device loss;
- device migration.

Manual JSON export/import is not part of P4 core implementation. It may be
specified as a separate product/security capability later.

Before a public local-only medical diary release, backup/recovery requirements
must be revisited explicitly.

## Migration and import

- Routine startup reads semantic durable records directly.
- `liftLegacyToSemantic` and related legacy helpers remain explicit
  migration/import tools only.
- Legacy presentation records are never the active durable schema.
- Storage-schema migrations are adapter-local and versioned independently from
  semantic event-schema migrations.
- No migration may silently discard a medical event.

## Package boundaries

```text
packages/types
  → semantic event and migration contracts

packages/timeline
  → repository contracts
  → in-memory adapter
  → future IndexedDB adapter
  → no React / Next / i18n / presentation dependencies

apps/web
  → repository composition/wiring
  → application read/write services
  → presentation and UI
```

UI components must never call IndexedDB directly.

## Testing requirements

The Implementation ADR must define a contract-test strategy shared where
possible by the in-memory and IndexedDB repositories.

Minimum P4 coverage:

- database initialization;
- bootstrap exactly once via metadata marker;
- empty-after-user-delete does not re-seed;
- add/update/delete commit semantics;
- aborted transaction does not report success;
- deterministic chronological ordering;
- kind/time compound-index queries;
- bounded pagination/cursor behavior;
- schema upgrade path;
- corruption → quarantine with evidence preservation;
- quota/write failure normalization;
- reload survival integration test;
- P3 semantic repository and product E2E regression coverage.

## Revised implementation waves

| Wave | Deliverable |
| --- | --- |
| **P4a — Implementation ADR & Storage Contract** | Approve IndexedDB access layer, database name/version, object stores, primary keys/indexes, bounded query contract, transaction semantics, bootstrap metadata, quarantine policy, schema upgrades, delete semantics, failure normalization, and testing strategy |
| **P4b — IndexedDB Repository Adapter** | Implement durable repository + contract tests behind approved schema; no UI architecture redesign |
| **P4c — Web Composition Cutover** | Switch Web default repository factory to durable adapter; first-run metadata bootstrap; reload survival; failure-state integration |
| **P4d — Bounded Read Migration** | Timeline pagination and Dashboard routine reads use bounded repository queries instead of full-history snapshots |

P4 is not Feature Complete until P4d and the final architecture/regression audit
are complete.

## Explicit non-scope

- SQLite / native mobile adapters;
- backend/API;
- authentication / authorization / `ownerId` runtime;
- sync protocol / outbox / conflict resolution / tombstones;
- device integrations;
- Analytics / Reports / AI implementation;
- caregiver/HCP sharing;
- encryption/key-management vendor selection;
- cross-device recovery;
- account backup;
- manual export/import implementation.

## Decisions closed by P4 architecture remediation

The following are no longer open:

1. First run is determined by persistent bootstrap metadata, **not** empty event count.
2. Bounded repository reads are required before P4 completion; full `getSnapshot()` is transitional.
3. Event `id` is the durable primary identity; chronological indexes are compound `[occurredAt, id]` and `[kind, occurredAt, id]`.
4. No canonical persisted local-calendar-day bucket is introduced in P4.
5. Corrupt medical rows use durable quarantine; silent skip is rejected.
6. Durable transaction commit is the successful-save boundary.
7. P4 local delete is physical delete only; sync tombstones are deferred until sync architecture.
8. P4 local persistence is not backup/recovery.

## Decisions reserved for P4 Implementation ADR

1. IndexedDB access library / wrapper selection.
2. Exact database name and version numbers.
3. Exact object-store and index DDL.
4. Query/cursor TypeScript signatures and compatibility lifecycle for `getSnapshot()`.
5. `ready/degraded` versus fail-init behavior when some rows are quarantined.
6. Exact repository error codes for quota/capacity and corruption.
7. Storage schema migration implementation mechanics.
8. Fake IndexedDB/test harness selection.

## Dependencies

- [ADR-0014 — Local-First Medical Event Persistence](../../adr/0014-local-first-medical-event-persistence-architecture.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Timeline Shared State](shared-state.md)
- P3 merge: `44ca315` (PR #67)

## Approval gate

```text
P4 architecture design (this document)
        ↓ approved
P4 Implementation ADR
        ↓ approved
P4a/P4b implementation
```

**No IndexedDB/SQLite runtime code before the P4 Implementation ADR is approved.**
