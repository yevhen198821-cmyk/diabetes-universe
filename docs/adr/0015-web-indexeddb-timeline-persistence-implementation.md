# ADR-0015 — Web IndexedDB Timeline Persistence Implementation

## Status

Draft

## Context

ADR-0014 approved a local-first persistence architecture and requires Web medical
Timeline data to use an IndexedDB-class durable adapter behind the shared
`TimelineRepository` boundary.

P3 is Feature Complete. The current repository contract is semantic-native:

```text
SemanticTimelineEvent
  ↓
TimelineStoreProvider
  ↓
TimelineRepository
  ↓
InMemoryTimelineRepository
```

The current adapter is intentionally non-durable. P4 must add reload-surviving
Web persistence without introducing backend, authentication, sync, mobile
storage, or presentation coupling.

The P4 architecture design additionally requires:

- persistent bootstrap metadata rather than empty-store detection;
- bounded repository reads before P4 completion;
- event `id` as durable primary identity;
- compound chronological indexes;
- durable quarantine for corrupt medical rows;
- transaction commit as the successful-save boundary;
- physical local deletion in P4;
- no claim that local persistence is backup or recovery.

This ADR chooses the concrete Web access layer, database schema, transaction
boundaries, query/cursor direction, bootstrap metadata, quarantine representation,
and adapter error model required before P4 runtime code starts.

## Decision

Diabetes Universe Web will implement durable Timeline persistence using the
browser IndexedDB API through the `idb` package.

The selected implementation direction is:

```text
apps/web
  ↓
TimelineStoreProvider
  ↓
TimelineRepository
  ↓
IndexedDbTimelineRepository
  ↓
`idb`
  ↓
Browser IndexedDB
```

`idb` is selected because it remains close to native IndexedDB semantics while
providing Promise-based operations, typed database schemas, explicit upgrade
callbacks, transaction completion through `tx.done`, and modern-browser support.
It does not introduce a higher-level ORM/data-model abstraction that would
become a second source of truth for Timeline semantics.

The implementation will target the current supported major line of `idb` at the
time P4a begins. Dependency versions remain lockfile-pinned by the repository.

For Node-based adapter tests, P4 will use `fake-indexeddb` as a development/test
dependency. Browser E2E remains required because the fake implementation is a
test double, not proof of browser persistence behavior.

## Rejected Access-Layer Alternatives

### Raw IndexedDB only

Rejected for P4 because the event/request callback API adds substantial adapter
boilerplate and error-prone transaction orchestration without giving Diabetes
Universe a meaningful architectural advantage. The repository boundary already
protects the product from library coupling.

### Dexie

Not selected for P4. Dexie is capable, but its richer abstraction/query model is
more than this adapter requires. The product should keep canonical query and
mutation semantics in `TimelineRepository`, rather than allowing a storage ORM
to shape application architecture.

### `idb-keyval`

Rejected because Timeline requires compound indexes, bounded range queries,
multiple object stores, schema upgrades, and transactions. A key/value-only
abstraction is insufficient.

### `localStorage`

Rejected by ADR-0014 and remains prohibited for medical Timeline event bodies.

## Package Ownership

Durable Web persistence remains owned by `@diabetes-universe/timeline`.

```text
@diabetes-universe/timeline
  ├── contracts/
  ├── runtime/in-memory-...
  └── persistence/indexeddb/
```

Allowed dependencies for the IndexedDB adapter:

- `@diabetes-universe/types`
- `idb`

The package must not depend on React, Next.js, application components,
localization, formatting, Dashboard, Quick Add, backend clients, or sync code.

`fake-indexeddb` is test-only.

## Database Identity

P4 uses one Web database for the Timeline local persistence slice:

```text
Database name: diabetes-universe-timeline
IndexedDB version: 1
Storage schema version: 1
```

IndexedDB database version and application `storageSchemaVersion` are related but
not interchangeable:

- IndexedDB version controls physical object-store/index upgrades.
- `storageSchemaVersion` identifies the row/envelope generation stored by the
  adapter.
- `SemanticTimelineEvent.schemaVersion` identifies the medical event schema.

These versions must never be treated as the same value merely because all begin
at `1`.

## Object Stores

P4 database version 1 contains three object stores.

### `timeline_events`

Primary durable medical-event store.

Key path:

```text
id
```

Stored value:

```ts
interface IndexedDbTimelineEventRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly kind: TimelineEventKind;
  readonly event: SemanticTimelineEvent;
  readonly persistedAt: string;
  readonly storageSchemaVersion: 1;
}
```

`id`, `occurredAt`, and `kind` are duplicated from `event` only as adapter index
columns. `event` remains the canonical semantic content. Adapter validation must
verify that duplicated columns equal the canonical event fields before returning
records to application code.

Indexes:

```text
by_occurredAt_id
  keyPath: [occurredAt, id]
  unique: false

by_kind_occurredAt_id
  keyPath: [kind, occurredAt, id]
  unique: false
```

No persisted local-calendar-day key is approved in P4. Calendar-day semantics
remain timezone-dependent and must be queried through occurrence ranges derived
from the active presentation/user timezone.

### `timeline_metadata`

Adapter metadata store.

Key path:

```text
key
```

P4 defines one required bootstrap record:

```ts
interface TimelineBootstrapMetadata {
  readonly key: 'bootstrap';
  readonly bootstrapVersion: 1;
  readonly seedVersion: 1;
  readonly completedAt: string;
}
```

The presence of a valid bootstrap record means first-run bootstrap has completed.
Event-store emptiness is never used as the first-run signal.

This ensures that a user who intentionally deletes all Timeline events does not
receive demo events again on the next reload.

### `timeline_quarantine`

Durable isolation store for records that cannot safely be returned as semantic
medical events.

Key path:

```text
quarantineId
```

Stored value direction:

```ts
interface IndexedDbTimelineQuarantineRecord {
  readonly quarantineId: string;
  readonly sourceRecordId?: string;
  readonly reason: TimelineStorageQuarantineReason;
  readonly quarantinedAt: string;
  readonly raw: unknown;
  readonly storageSchemaVersion?: number;
}
```

Minimum P4 reasons:

```text
invalid_record_shape
unsupported_storage_schema
semantic_identity_mismatch
invalid_event_schema
```

Quarantine records are diagnostics/recovery material. They are not valid Timeline
events and must not appear in Dashboard, Timeline list, search, totals, or Next
Action inputs.

## Database Upgrade Rules

All physical IndexedDB schema changes occur in the `idb.openDB(..., { upgrade })`
upgrade transaction.

Rules:

1. Upgrade functions are deterministic and version-gated.
2. Object stores/indexes are created or changed only in explicit version steps.
3. Upgrade failure prevents repository initialization from reaching `ready`.
4. There is no silent database deletion/recreation on upgrade failure.
5. Destructive reset is a separately approved recovery action, never an
   automatic migration policy for medical data.

P4 version 1 creates all three stores and both event indexes atomically.

## First-Run Bootstrap

First-run bootstrap is metadata-driven and atomic.

Initialization sequence:

```text
open / upgrade database
  ↓
validate bootstrap metadata
  ↓
bootstrap record absent?
  ├─ no  → normal startup
  └─ yes → one readwrite transaction over timeline_events + timeline_metadata
             ├─ insert semantic demo seed
             └─ write bootstrap metadata
  ↓
transaction commit
  ↓
repository ready
```

Required invariants:

- Demo seed and bootstrap metadata commit in the same transaction.
- If the transaction aborts, neither is considered completed.
- Bootstrap must be idempotent across reload/crash/retry.
- An empty event store with an existing valid bootstrap record remains empty.
- A missing/corrupt bootstrap record is not repaired by blindly reseeding if
  evidence suggests the database was previously initialized. Recovery policy for
  inconsistent metadata must be explicit in adapter diagnostics/tests.

P4 does not implement account/user-specific seeding because authentication and
`ownerId` are out of scope.

## Successful Save Boundary

A mutation is successful only when the IndexedDB readwrite transaction commits.

For `idb`, implementations must await both operation promises and `tx.done`.
Updating React/application state before transaction completion is not the durable
save contract.

Example architectural sequence:

```text
repository.addEvent(event)
  ↓
open readwrite transaction
  ↓
validate + put record
  ↓
await operation
  ↓
await tx.done
  ↓
return { status: 'applied' }
  ↓
TimelineStoreProvider refreshes application projection
```

If the transaction aborts or `tx.done` rejects, the repository returns/throws the
normalized repository failure and the application must not treat the mutation as
saved.

## Mutation Semantics

P4 preserves existing semantic repository behavior:

- add with a duplicate event ID replaces the record for that ID;
- update missing ID returns `not-found`;
- delete missing ID returns `not-found`;
- replace is transitional/test/hydration capability, not a routine user flow;
- mutation inputs are cloned/validated and storage outputs do not expose mutable
  internal references.

### Local deletion

P4 `deleteEvent(id)` physically deletes the local record from `timeline_events`.

This is intentional because sync, tombstones, revisions, and multi-device delete
propagation are out of scope. P4 must not introduce fake tombstone semantics that
would later conflict with the approved sync design.

Before sync is implemented, product copy/documentation must not imply that local
physical deletion represents server/account-wide medical-data erasure.

## Record Validation and Corruption Policy

Every record crossing from IndexedDB into `TimelineRepository` is validated as
an adapter record and as a `SemanticTimelineEvent`.

At minimum validate:

- object/required-field shape;
- `storageSchemaVersion` support;
- `id === event.id`;
- `occurredAt === event.occurredAt`;
- `kind === event.kind`;
- supported `event.schemaVersion`;
- supported event kind;
- kind-specific required semantic fields and finite numeric values.

A corrupt record must never be silently interpreted as valid medical data.

When corruption is discovered during initialization/integrity scan, the adapter
must move the raw row into `timeline_quarantine` and remove it from
`timeline_events` in one readwrite transaction. Repository readiness may continue
only if quarantine succeeds and the remaining database is structurally usable.

When corruption is discovered later during a bounded query, the adapter must:

1. isolate the row through the quarantine transaction;
2. expose the condition through diagnostics/error telemetry that contains no
   PHI;
3. exclude the quarantined record from the returned medical-event result;
4. never silently skip without a durable quarantine record.

P4 does not implement a user-facing quarantine repair UI. Recovery tooling is a
future product/support capability.

## Bounded Repository Read Contract

P4 extends the repository read surface before P4 is declared Feature Complete.
The exact TypeScript may be refined during P4a, but the approved semantic shape
is:

```ts
interface TimelineRepositoryQuery {
  readonly occurredFrom?: string;
  readonly occurredTo?: string;
  readonly kinds?: readonly TimelineEventKind[];
  readonly order: 'occurredAt-asc' | 'occurredAt-desc';
  readonly limit: number;
  readonly cursor?: string;
}

interface TimelineRepositoryQueryResult {
  readonly events: readonly SemanticTimelineEvent[];
  readonly nextCursor?: string;
}

interface TimelineRepository {
  initialize(): Promise<void>;
  getSnapshot(): TimelineRepositorySnapshot; // transitional/test compatibility
  getById(eventId: string): Promise<SemanticTimelineEvent | null>;
  queryEvents(query: TimelineRepositoryQuery): Promise<TimelineRepositoryQueryResult>;
  addEvent(event: SemanticTimelineEvent): Promise<TimelineRepositoryMutationResult>;
  updateEvent(event: SemanticTimelineEvent): Promise<TimelineRepositoryMutationResult>;
  deleteEvent(eventId: string): Promise<TimelineRepositoryMutationResult>;
  replaceEvents(events: readonly SemanticTimelineEvent[]): Promise<TimelineRepositoryMutationResult>;
}
```

### Query invariants

- `limit` is required and bounded by an implementation maximum approved in P4a.
- Cursor is opaque to consumers.
- Cursor represents the last chronological compound key `(occurredAt, id)` plus
  query direction/filter identity as needed to prevent incorrect reuse.
- Timeline pagination uses chronological compound indexes, not full-array sort.
- Latest glucose uses the `kind + occurredAt + id` index with descending limit 1.
- Current-day Dashboard reads use an occurrence-time range derived from the
  active timezone; no persisted `localDay` column.
- Repository results preserve deterministic `occurredAt` + `id` ordering.

By P4 completion, routine Timeline/Dashboard rendering must not require loading
all historical events through `getSnapshot()`.

`getSnapshot()` may remain temporarily for tests, bootstrap compatibility, or
migration tooling, but it is not the long-term read path for large journals.

## Cursor Encoding

Cursor encoding is an adapter detail and must be opaque outside
`@diabetes-universe/timeline`.

P4 implementation may use a versioned base64url JSON cursor containing only
non-PHI structural query state such as:

```json
{
  "v": 1,
  "occurredAt": "2026-08-09T10:00:00.000Z",
  "id": "event-id",
  "order": "occurredAt-desc"
}
```

The cursor must not contain event payload values, medication names, notes, or
other medical content.

Malformed or query-incompatible cursors produce a normalized read error rather
than falling back to an unbounded query.

## Repository Error Model

The adapter maps browser/IndexedDB failures to machine-readable repository codes.
Raw `DOMException`, database names, record payloads, and PHI must not reach UI
copy or telemetry.

P4 adds/uses normalized categories equivalent to:

```text
TIMELINE_REPOSITORY_INITIALIZE_FAILED
TIMELINE_REPOSITORY_NOT_INITIALIZED
TIMELINE_REPOSITORY_READ_FAILED
TIMELINE_REPOSITORY_WRITE_FAILED
TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE
TIMELINE_REPOSITORY_STORAGE_OPEN_BLOCKED
TIMELINE_REPOSITORY_STORAGE_QUOTA_EXCEEDED
TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED
TIMELINE_REPOSITORY_INVALID_CURSOR
TIMELINE_REPOSITORY_QUARANTINE_FAILED
```

Mapping rules:

- quota exhaustion → `STORAGE_QUOTA_EXCEEDED`;
- blocked open/upgrade → `STORAGE_OPEN_BLOCKED`;
- unsupported/failed physical schema upgrade → `SCHEMA_UPGRADE_FAILED`;
- invalid cursor → `INVALID_CURSOR`;
- failed quarantine transaction → `QUARANTINE_FAILED`;
- other read/write failures retain the generic P2 read/write categories.

The exact enum spelling may be finalized in P4a provided semantics do not change.

## Blocked / Blocking / Terminated Connections

The adapter must explicitly handle IndexedDB lifecycle callbacks exposed by
`idb`:

- `blocked`: initialization remains unresolved/fails with normalized blocked
  state rather than pretending the repository is ready;
- `blocking`: close the stale connection so another tab/version can upgrade;
- `terminated`: mark the adapter unusable and require repository reinitialize or
  application recovery rather than continuing with a dead connection.

Cross-tab live synchronization is not introduced in P4. These callbacks exist to
protect schema reliability, not to implement multi-tab event replication.

## Storage Quota

Quota errors are first-class write failures.

P4 requirements:

- never delete old medical records automatically to make room;
- never fall back to in-memory success after quota failure;
- preserve the last committed database state;
- expose a safe application error state/copy through the existing presentation
  layer;
- no PHI in diagnostic logs.

Requesting browser persistent-storage permission (`navigator.storage.persist()`)
is not required for the first P4 adapter slice and must not be treated as a
guarantee of backup or non-eviction. A later Web storage policy may evaluate it
separately.

## Backup and Recovery Boundary

IndexedDB persistence improves reload/session continuity. It is **not** backup.

P4 provides no guarantee against:

- browser/site-data deletion;
- storage eviction;
- device loss;
- profile reset;
- disk failure;
- browser corruption.

Cloud backup/recovery requires backend/auth/sync architecture and remains out of
scope. Product language must not describe P4 as secure cloud backup or account
recovery.

## Testing Strategy

### Unit / adapter tests

Use `fake-indexeddb` with isolated `IDBFactory` instances.

Required coverage:

- database v1 schema creation;
- object stores and indexes;
- empty initialization;
- atomic first-run seed + metadata;
- no reseed after user deletes every event;
- add/update/delete/replace semantics;
- transaction completion before `applied`;
- deterministic bounded ascending/descending queries;
- kind-filtered query and latest-glucose pattern;
- cursor continuation and invalid cursor;
- duplicate chronological timestamps resolved by `id`;
- quota/error normalization through injected/test failures where feasible;
- corrupt record quarantine;
- quarantine transaction failure;
- unsupported storage schema;
- immutability;
- reopen same database instance and recover persisted events.

### Browser integration / E2E

At least one real Chromium Playwright journey must prove:

```text
open app
  → add semantic event
  → reload page
  → event still present
```

Also verify:

- delete persists across reload;
- first-run demo seed does not reappear after all events are deleted;
- existing Dashboard ↔ Timeline coherence remains;
- current 29 E2E journeys remain green or are intentionally updated for durable
  persistence semantics.

Cross-browser persistence coverage for Firefox/WebKit is desirable but is not a
P4 release gate unless separately approved.

## Implementation Waves

### P4a — Contract and storage foundation

- add `idb` runtime dependency and `fake-indexeddb` dev dependency;
- add bounded query contracts/cursor types;
- define typed IDB schema;
- implement database open/upgrade lifecycle;
- implement adapter validation/error normalization primitives;
- unit-test schema and transactions;
- no default Web adapter cutover yet.

### P4b — Durable repository adapter

- implement `IndexedDbTimelineRepository`;
- mutations, bounded reads, cursor pagination;
- first-run bootstrap metadata;
- quarantine behavior;
- full adapter tests;
- in-memory adapter remains available for tests/explicit injection.

### P4c — Web default cutover and reload durability

- change Web repository factory/default injection to IndexedDB adapter;
- retain component/store facade;
- add reload/delete/bootstrap E2E;
- no silent in-memory fallback on durable init failure.

### P4d — Bounded consumer reads

- Timeline pagination/query path moves off full-history snapshot reads;
- Dashboard latest glucose/recent/today reads use bounded repository queries or
  approved read-model service;
- preserve semantic derivation and presentation boundaries;
- prove routine rendering does not require loading 10k–100k history into React
  state;
- final P4 architecture/regression audit.

P4 is not Feature Complete until P4d is complete and validation is green.

## Security and Privacy

P4 stores sensitive medical data locally in browser-managed IndexedDB.

The adapter must:

- never put PHI in keys other than stable event ID and structural index values;
- never put medical payloads into URLs;
- never log event payloads or raw quarantine records to telemetry;
- keep UI independent of IndexedDB APIs;
- treat local database access as device/profile-local access, not authentication;
- avoid claims of cryptographic at-rest protection that browsers do not provide
  to application JavaScript by default.

Application-level encryption/key management is not selected by this ADR. It
requires a separate security architecture because storing the decryption key in
the same unauthenticated Web origin can create false security.

## Explicit Non-Scope

P4 does not implement:

- SQLite / iOS / Android storage adapters;
- backend persistence or API;
- authentication or authorization;
- `ownerId`;
- sync/outbox/retry/conflict resolution;
- revision vectors;
- tombstones for sync;
- device integrations;
- cross-tab live synchronization;
- cloud backup/recovery;
- export/import backup UX;
- encryption/key-management vendor or protocol;
- Analytics, Reports, AI, caregiver, or HCP functionality.

## Consequences

Positive:

- Web writes become durable before UI reports success;
- reload continuity without changing semantic domain ownership;
- first-run behavior remains correct even after an intentionally empty journal;
- bounded indexes/query contract create a path to 10k–100k event histories;
- corrupt medical rows are isolated rather than silently trusted or discarded;
- P4 does not pre-implement sync semantics that would later need replacement.

Costs:

- IndexedDB lifecycle and schema upgrades add complexity;
- `TimelineRepository` read surface expands;
- tests require both fake IndexedDB and browser E2E coverage;
- local persistence remains vulnerable to browser/device data loss until backend
  backup/sync exists.

## Approval Gate

This ADR is a **Draft**. No runtime persistence implementation is authorized by
this document until it is reviewed and changed to **Approved**.

Approval authorizes P4a only. Later waves still require normal code review and
validation, but they do not require a new architecture decision unless they
change the decisions recorded here.

## Dependencies

- [ADR-0014 — Local-First Medical Event Persistence Architecture](./0014-local-first-medical-event-persistence-architecture.md)
- [P4 Durable Local Persistence Architecture Design](../architecture/timeline/p4-durable-local-persistence.md)
- [Timeline Entity](../data/entities/timeline.md)
- [Timeline Shared State](../architecture/timeline/shared-state.md)

## Date

2026-08-09

## Author

OpenAI — Architecture Draft
