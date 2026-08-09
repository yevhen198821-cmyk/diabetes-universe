# ADR-0015 — Web IndexedDB Timeline Persistence Implementation

## Status

Draft

## Audit Note

This ADR remains Draft after architecture audit. Two blocking refinements are required before approval:

1. **Platform-specific package boundary.** The IndexedDB adapter must not make the cross-platform `@diabetes-universe/timeline` package depend directly on the Web-only `idb` runtime. The approved direction is a dedicated Web adapter package (`@diabetes-universe/timeline-web`) that depends on `@diabetes-universe/timeline`, `@diabetes-universe/types`, and `idb`. `@diabetes-universe/timeline` remains platform-neutral and continues to own the repository contract and in-memory implementation.
2. **First-run/bootstrap state machine.** Missing bootstrap metadata is not sufficient by itself to prove a true first run. If metadata is absent or corrupt while event/quarantine data exists, initialization must fail into an explicit inconsistent-bootstrap/recovery state and must not seed demo events. Demo seeding is allowed only when bootstrap metadata is absent and all P4 durable stores are structurally empty after database creation/upgrade.

A non-blocking refinement is also required in P4a: `getSnapshot()` is transitional compatibility only and must not force the durable adapter to preload all history. Routine Web startup and product reads must move to bounded async reads before P4 completion.

## Context

ADR-0014 approved a local-first persistence architecture and requires Web medical Timeline data to use an IndexedDB-class durable adapter behind the shared `TimelineRepository` boundary.

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

The current adapter is intentionally non-durable. P4 must add reload-surviving Web persistence without introducing backend, authentication, sync, mobile storage, or presentation coupling.

The P4 architecture design additionally requires persistent bootstrap metadata rather than empty-store detection, bounded repository reads before P4 completion, event `id` as durable primary identity, compound chronological indexes, durable quarantine for corrupt medical rows, transaction commit as the successful-save boundary, physical local deletion in P4, and no claim that local persistence is backup or recovery.

## Decision

Diabetes Universe Web will implement durable Timeline persistence using the browser IndexedDB API through the `idb` package, behind a Web-specific adapter package.

```text
apps/web
  ↓
TimelineStoreProvider
  ↓
TimelineRepository
  ↓
@diabetes-universe/timeline-web
  ↓
IndexedDbTimelineRepository
  ↓
`idb`
  ↓
Browser IndexedDB
```

`@diabetes-universe/timeline` remains platform-neutral and owns the repository contract, semantic repository types, migration utilities, and `InMemoryTimelineRepository`. The Web adapter package owns IndexedDB lifecycle, schema, record validation, quarantine persistence, bootstrap, bounded IndexedDB queries, and browser-specific error normalization.

`idb` is selected because it remains close to native IndexedDB semantics while providing Promise-based operations, typed database schemas, explicit upgrade callbacks, transaction completion through `tx.done`, and modern-browser support. It does not introduce a higher-level ORM/data-model abstraction that would become a second source of truth for Timeline semantics.

The implementation will target the current supported major line of `idb` at the time P4a begins. Dependency versions remain lockfile-pinned by the repository. For Node-based adapter tests, P4 will use `fake-indexeddb` as a development/test dependency of `@diabetes-universe/timeline-web`. Browser E2E remains required because the fake implementation is a test double, not proof of browser persistence behavior.

## Package Ownership

```text
@diabetes-universe/timeline
  ├── contracts/
  ├── runtime/in-memory-...
  └── migration/...

@diabetes-universe/timeline-web
  └── persistence/indexeddb/
```

Allowed dependency direction:

```text
apps/web
  → @diabetes-universe/timeline-web
      → @diabetes-universe/timeline
      → @diabetes-universe/types
      → idb

@diabetes-universe/timeline
  → @diabetes-universe/types
```

The Web adapter package must not depend on React, Next.js, application components, localization, formatting, Dashboard, Quick Add, backend clients, or sync code. `fake-indexeddb` is test-only.

## Rejected Access-Layer Alternatives

Raw IndexedDB-only access is rejected because callback/request orchestration adds error-prone boilerplate without architectural benefit behind the repository boundary. Dexie is not selected because its richer abstraction is unnecessary for this adapter and risks shaping application contracts. `idb-keyval` is insufficient because Timeline requires compound indexes, bounded range queries, multiple stores, upgrades, and transactions. `localStorage` remains prohibited for medical Timeline event bodies.

## Database Identity

P4 uses one Web database for the Timeline local persistence slice:

```text
Database name: diabetes-universe-timeline
IndexedDB version: 1
Storage schema version: 1
```

IndexedDB version controls physical object-store/index upgrades. `storageSchemaVersion` identifies the adapter record generation. `SemanticTimelineEvent.schemaVersion` identifies the medical event schema. These are independent version domains.

## Object Stores

Database version 1 contains three object stores.

### `timeline_events`

Key path: `id`.

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

`id`, `occurredAt`, and `kind` are adapter index columns duplicated from `event`. The semantic event remains canonical. Reads must verify the duplicated columns match `event.id`, `event.occurredAt`, and `event.kind`.

Required indexes:

```text
by_occurredAt_id          [occurredAt, id]
by_kind_occurredAt_id     [kind, occurredAt, id]
```

No persisted local-calendar-day key is approved in P4. Day queries derive an occurrence range from the active timezone.

### `timeline_metadata`

Key path: `key`.

```ts
interface TimelineBootstrapMetadata {
  readonly key: 'bootstrap';
  readonly bootstrapVersion: 1;
  readonly seedVersion: 1;
  readonly completedAt: string;
}
```

A valid bootstrap record means first-run bootstrap completed. Event-store emptiness alone is never the first-run signal.

### `timeline_quarantine`

Key path: `quarantineId`.

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

Minimum reasons:

```text
invalid_record_shape
unsupported_storage_schema
semantic_identity_mismatch
invalid_event_schema
```

Quarantine records are recovery/diagnostics material and never valid Timeline events.

## Database Upgrade Rules

All physical IndexedDB schema changes occur in the `openDB(..., { upgrade })` upgrade transaction. Upgrade functions are deterministic and version-gated. Upgrade failure prevents repository readiness. The adapter must never silently delete/recreate the database to recover from an upgrade failure.

P4 version 1 creates all three stores and both event indexes atomically.

## First-Run Bootstrap State Machine

First-run detection is metadata-driven **and integrity-aware**.

```text
open / upgrade database
  ↓
read bootstrap metadata + structural store counts
  ↓
valid bootstrap record exists?
  ├─ yes → normal startup (event store may legitimately be empty)
  └─ no
       ↓
       are timeline_events AND timeline_quarantine empty?
       ├─ yes → true first-run candidate
       │        → one readwrite transaction:
       │             seed semantic demo events
       │             + write bootstrap metadata
       │        → await commit
       └─ no  → inconsistent bootstrap state
                → fail initialization with normalized recovery-required error
                → never reseed automatically
```

A corrupt/unsupported bootstrap record is treated the same as missing metadata with existing durable evidence: initialization fails into recovery-required state rather than guessing.

Required invariants:

- Seed and bootstrap metadata commit in one transaction.
- Failed/aborted transaction leaves bootstrap incomplete.
- Bootstrap is idempotent across reload/crash/retry.
- Valid metadata + empty event store remains empty forever unless user adds data.
- Missing/corrupt metadata + any existing event/quarantine evidence is **not** a first run.
- No automatic destructive reset or blind reseed.

P4 does not implement account/user-specific seeding because authentication and `ownerId` are out of scope.

## Successful Save Boundary

A mutation is successful only when the IndexedDB readwrite transaction commits. Implementations must await the write request and `tx.done`. React state must not report a durable save before transaction completion. On abort/rejection, the repository surfaces a normalized failure and the application preserves the last committed state.

## Mutation Semantics

P4 preserves existing repository semantics: duplicate-ID add replaces, missing update/delete returns `not-found`, mutation inputs/outputs are cloned, and `replaceEvents` remains transitional/test/hydration capability only.

P4 local delete physically removes the record. Sync tombstones, revisions, and multi-device delete propagation remain future scope.

## Record Validation and Corruption Policy

Every IndexedDB row crossing into the repository is validated for adapter shape, storage schema, identity duplication, semantic schema, event kind, required fields, and finite numeric values.

Corrupt data must never be silently interpreted or skipped. During initialization/integrity scan, invalid rows move to `timeline_quarantine` and are removed from `timeline_events` in one transaction. During a bounded query, an invalid row is quarantined durably before it is excluded from the returned result. If quarantine fails, initialization/read fails.

No PHI may be emitted to telemetry/logs as part of corruption handling.

## Bounded Repository Read Contract

P4 extends the repository read surface before Feature Complete:

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
```

The shared repository contract adds async `getById()` and `queryEvents()`. `limit` is mandatory and implementation-bounded. Cursors are opaque and query-compatible. General pagination uses `[occurredAt, id]`; single-kind reads use `[kind, occurredAt, id]`. Multi-kind filters must remain bounded and deterministic, either through a bounded merge of kind-index cursors or through the chronological index with bounded filtering; P4a must choose and test one strategy.

### Transitional `getSnapshot()` rule

`getSnapshot()` is legacy compatibility for the current in-memory/application-store transition only. **The durable IndexedDB adapter must not require preloading all historical records merely to implement this method.** P4a must either:

- deprecate/remove `getSnapshot()` from the shared product read path and provide it only on explicit test/migration utilities; or
- redefine it as an async bounded/debug compatibility operation that is never called during normal Web initialization.

By P4c Web cutover, startup must not load all history merely to populate a synchronous snapshot. By P4d, routine Timeline and Dashboard rendering must exclusively use bounded repository/read-model operations.

## Cursor Encoding

Cursor encoding is adapter-private. A versioned base64url JSON representation may contain only non-PHI structural query state such as cursor version, `(occurredAt, id)`, order, and filter identity. It must not contain event payload values, medication names, notes, or other medical content. Malformed or query-incompatible cursors fail with a normalized read error; no fallback to unbounded reads is permitted.

## Repository Error Model

The adapter maps browser/IndexedDB failures to machine-readable repository codes and never exposes raw `DOMException`, database payloads, or PHI to UI/telemetry.

Required semantic categories include:

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
TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT
```

The exact enum spelling may be finalized in P4a without changing these semantics.

## IndexedDB Connection Lifecycle

The adapter explicitly handles `blocked`, `blocking`, and `terminated` lifecycle conditions. A blocked open/upgrade must never transition the repository to ready. A blocking stale connection closes so another tab/version can upgrade. A terminated connection marks the adapter unusable until reinitialization/recovery. Cross-tab live synchronization is out of scope.

## Storage Quota

Quota exhaustion is a first-class write failure. P4 never deletes older medical records automatically, never falls back to in-memory success, and preserves the last committed database state. Browser persistent-storage permission may be evaluated later and is not a backup guarantee.

## Backup and Recovery Boundary

IndexedDB persistence improves same-profile continuity; it is not backup. P4 does not guarantee recovery from site-data clearing, eviction, device loss, profile reset, disk failure, or browser corruption. Cloud backup/recovery requires backend/auth/sync.

## Testing Strategy

Node adapter tests use `fake-indexeddb` with isolated factories. Browser E2E must prove real reload persistence.

Required coverage includes schema/store/index creation; first-run atomic bootstrap; valid-bootstrap empty-store no-reseed; **missing/corrupt metadata with existing event/quarantine rows fails without reseed**; reopen persistence; duplicate-ID behavior; update/delete not-found; `(occurredAt,id)` ordering; bounded asc/desc reads; single-kind and multi-kind filters; cursor continuation and incompatibility; corruption quarantine; quarantine failure; transaction abort; quota normalization where simulatable; connection lifecycle behavior; immutable values; and the existing P3 semantic regression suite.

Minimum browser journeys:

```text
add event → reload → event remains
delete event → reload → event remains deleted
delete all events → reload → demo seed does not return
```

## P4 Waves

### P4a — Web Storage Contract & Schema Foundation

- create `@diabetes-universe/timeline-web`;
- add `idb` and test-only `fake-indexeddb` there;
- extend bounded shared repository contracts;
- resolve/remove routine synchronous `getSnapshot()` dependency;
- define IndexedDB schema types, open/upgrade lifecycle, bootstrap metadata, validators, quarantine/error contracts;
- implement schema/transaction/query-contract unit tests;
- no default Web repository cutover yet.

### P4b — IndexedDB Repository Adapter

- durable semantic CRUD;
- integrity-aware first-run bootstrap;
- compound indexes;
- bounded query/cursor implementation;
- durable quarantine;
- adapter test suite;
- `InMemoryTimelineRepository` remains available for tests/explicit injection.

### P4c — Web Cutover & Reload Durability

- apps/web composition selects `IndexedDbTimelineRepository` by default;
- no silent in-memory fallback;
- startup uses bounded read/bootstrap flow rather than full-history preload;
- reload/delete/no-reseed browser coverage;
- existing product journeys remain green.

### P4d — Bounded Product Reads

- Timeline pagination backed by bounded repository queries;
- Dashboard latest-glucose/recent/day-range reads backed by bounded query/read models;
- routine product rendering no longer requires full historical arrays;
- scale/regression audit before P4 Feature Complete.

## Completion Gate

P4 cannot be Feature Complete merely because events survive reload. Completion requires durable semantic Web repository, committed transaction save boundary, stable bootstrap state machine, durable quarantine, bounded routine reads, no silent in-memory fallback, reload/delete/no-reseed regression coverage, green validation, and documentation aligned with runtime reality.

## Explicit Non-Scope

SQLite/native mobile storage; backend/API; authentication/authorization; `ownerId`; sync/outbox/retry/conflict resolution; tombstones; device integrations; cross-tab live synchronization; cloud backup/recovery; export/import backup UX; encryption/key management; Analytics/Reports/AI changes; caregiver/HCP access.

## Approval Gate

This ADR remains **Draft** until the P4 architecture audit confirms the package boundary and bootstrap/read-contract refinements above. After approval, P4a runtime work may begin. No IndexedDB runtime code may land before that status transition.

## Dependencies

- ADR-0014 — Local-First Medical Event Persistence Architecture
- P4 Durable Local Persistence Architecture Design
- Timeline Entity
- Timeline Shared State

## Date

2026-08-09
