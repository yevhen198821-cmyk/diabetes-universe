# P4 — Durable Local Persistence (Architecture Design)

## Status

**Design only — not implemented**

P3 (Semantic Timeline Event Model) is Feature Complete on `main` @ `44ca315`.
This document scopes P4 planning. No IndexedDB, SQLite, backend, auth, sync, or
outbox runtime code may land until P4 architecture is explicitly approved for
implementation.

## Purpose

Introduce **durable local persistence** for `SemanticTimelineEvent` records
behind the existing `TimelineRepository` contract, so user-created Timeline
events survive page reload without changing the P3 semantic application model.

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

- `SemanticTimelineEvent` as canonical domain model
- `TimelineRepositoryEvent = SemanticTimelineEvent`
- Repository method semantics (initialize, getSnapshot, add/update/delete/replace)
- Store mutation serialization, error contract, unmount safety
- Presentation boundary separation (P3d)
- Migration utilities remain explicit import-only (`liftLegacyToSemantic`)

## Target (P4)

```text
Quick Add / Edit
      ↓
SemanticTimelineEvent
      ↓
TimelineStoreProvider          (unchanged facade)
      ↓
TimelineRepository             (unchanged contract surface)
      ↓
DurableLocalTimelineRepository ← new Web adapter (IndexedDB-class)
      ↓
SemanticTimelineEvent[]        (persisted + reloaded)
```

ADR-0014 remains the governing persistence direction. P4 implements **only** the
first durable local adapter slice for Web demo/product shell — not full sync.

## In scope (P4 design targets)

### 1. Web durable adapter

- New implementation of `TimelineRepository` in `@diabetes-universe/timeline`
  (or approved sub-package) using an **IndexedDB-class** store.
- Adapter choice (raw IndexedDB vs library such as Dexie/idb) is an **open
  implementation decision** to be recorded in a P4 implementation ADR or addendum.
- **No `localStorage`** for medical event bodies (ADR-0014 rejected).

### 2. Persistence record envelope

Persisted rows wrap `SemanticTimelineEvent` with minimal P4 envelope fields:

| Field | P4 requirement |
| ----- | -------------- |
| `event` | `SemanticTimelineEvent` (canonical payload) |
| `persistedAt` | ISO 8601 local write timestamp (adapter metadata) |
| `storageSchemaVersion` | Adapter/storage schema generation (distinct from event `schemaVersion`) |

**Deferred to post-P4** (ADR-0014, not P4):

- `ownerId` / multi-user identity
- revision vectors / optimistic concurrency
- tombstones / sync deletion propagation
- outbox / mutation queue for backend
- encryption at rest policy implementation
- backend acknowledgement metadata

### 3. Provider wiring

- `TimelineStoreProvider` continues to receive `TimelineRepository` via boundary
  injection; only the default adapter factory changes from in-memory to durable.
- Demo seed behavior: **first-run bootstrap** loads semantic demo seed into empty
  durable store; subsequent reloads read from durable storage only.
- `replaceEvents` remains for testing/hydration; not a routine user flow.

### 4. Ordering and indexing

- Primary index: `occurredAt` + `id` (same contract as P3h normalization).
- Secondary indexes (design target): `kind`, local calendar day bucket for
  bounded Dashboard queries (ADR-0014 read-model boundary).
- Invalid `occurredAt` handling inherits P3 repository invariant (stable sort).

### 5. Migration / import

- **No routine lift** on reload. Durable store contains semantic records only.
- `liftLegacyToSemantic` / `liftRepositorySnapshot` remain explicit import tools.
- One-time import path (future): legacy fixture → lift → durable write (manual or
  admin tooling), not automatic on every startup.
- `storageSchemaVersion` migrations are adapter-local; event `schemaVersion`
  migrations use existing P3 migration utilities when needed.

### 6. Failure modes

| Scenario | Target behavior |
| -------- | --------------- |
| Durable open/init failure | Store `error` state; no silent in-memory fallback |
| Write transaction failure | No store commit; machine-readable error code |
| Corrupt record on read | Quarantine or skip with diagnostics (TBD in implementation ADR) |
| Schema upgrade | Explicit migration step before `initialize()` resolves |

### 7. Testing strategy (planned)

- Adapter unit tests with fake IndexedDB / in-memory IDB shim
- Reload integration test: create event → reload → event present
- Store provider integration unchanged except adapter swap
- Preserve P3 regression: legacy isolation, demo migration fidelity, E2E flows

## Explicit non-scope (P4)

- SQLite / React Native / mobile adapters
- Backend API, auth, authorization
- Sync protocol, outbox, conflict resolution, tombstone sync
- `ownerId`, revision metadata, device integrations
- Analytics, Reports, AI pipelines
- Caregiver/HCP access
- Encryption vendor selection
- Performance redesign beyond indexed queries for 10k+ events (foundational indexes
  only)

## Package boundaries (unchanged)

```text
packages/types          — SemanticTimelineEvent, migration types
packages/timeline       — TimelineRepository + adapters (no React/Next/i18n)
apps/web                — TimelineStoreProvider wiring only
```

New durable adapter code stays in `packages/timeline`. UI must not call IndexedDB
directly (ADR-0014).

## Proposed implementation waves (for approval)

| Wave | Deliverable |
| ---- | ----------- |
| P4a | Adapter interface + IDB schema design + fake-IDB tests |
| P4b | `IndexedDbTimelineRepository` (name TBD) + initialize/migrate |
| P4c | Provider factory cutover + reload E2E |
| P4d | Bounded query hooks for Dashboard (latest glucose, today slice) |

Waves are planning aids only. Implementation starts after explicit P4 approval.

## Open decisions (require approval before coding)

1. IndexedDB access layer (raw vs library).
2. Corrupt-record policy (quarantine table vs fail-fast init).
3. Demo seed bootstrap idempotency key (empty store detection contract).
4. Whether P4 includes export/import JSON for manual backup (local-only).
5. Storage quota handling UX.

## Dependencies

- [ADR-0014 — Local-First Medical Event Persistence](../../adr/0014-local-first-medical-event-persistence-architecture.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Timeline Shared State](shared-state.md)
- P3 merge: `44ca315` (PR #67)

## Approval gate

```
P4 architecture design (this document)
        ↓ approved
P4 implementation ADR / addendum (storage library, schema DDL)
        ↓ approved
P4a implementation
```

**No IndexedDB/SQLite code until the approval gate passes.**
