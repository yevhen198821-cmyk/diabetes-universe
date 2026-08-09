# P4 — Durable Local Persistence (Architecture Design)

## Status

**Architecture Approved; implementation not started**

P3 (Semantic Timeline Event Model) is Feature Complete on `main`.
P4 adds durable local Web persistence behind the semantic `TimelineRepository` without introducing backend, authentication, sync, mobile storage, or device runtime.

The architecture baseline in this document and the concrete Web implementation decisions in [ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../adr/0015-web-indexeddb-timeline-persistence-implementation.md) are approved.

No P4 runtime implementation is implied by architecture approval. P4a begins only after the approved documentation change is merged to `main`.

## Purpose

Persist `SemanticTimelineEvent` records durably on Web so user-created Timeline events survive reload/browser restart while preserving the P3 semantic model, future mobile adapters, and the local-first sync direction from ADR-0014.

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

P3 already guarantees semantic-native repository records, semantic Quick Add/edit, semantic Dashboard derivations, locale-aware presentation, deterministic `occurredAt + id` ordering, and legacy `TimelineEvent` isolation to migration/import utilities.

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
@diabetes-universe/timeline-web
      ↓
IndexedDbTimelineRepository
      ↓
Browser IndexedDB
```

`@diabetes-universe/timeline` stays platform-neutral. Web-only IndexedDB dependencies belong to `@diabetes-universe/timeline-web`. Future native SQLite adapters must be able to implement the same repository semantics without importing browser infrastructure.

## Governing Invariants

P4 must preserve all of the following:

- `SemanticTimelineEvent` is the canonical medical event model.
- UI and product components never call IndexedDB directly.
- Web storage implementation is isolated behind the repository boundary.
- A successful save means the durable IndexedDB transaction committed.
- Durable write failure never falls back to an in-memory success.
- Localized presentation strings are never canonical persisted medical semantics.
- `localStorage` is not used for medical event bodies.
- First-run bootstrap is persistent-metadata-driven and integrity-aware.
- Corrupt persisted rows are quarantined durably, never silently skipped.
- Routine Timeline/Dashboard reads become bounded; full-history startup is not the P4 end state.
- P4 local persistence is not cloud backup, account recovery, sync, or multi-device durability.

## Decision 1 — Platform-specific Web adapter package

The Web IndexedDB implementation lives in `@diabetes-universe/timeline-web`.

```text
apps/web
  → @diabetes-universe/timeline-web
      → @diabetes-universe/timeline
      → @diabetes-universe/types
      → idb

@diabetes-universe/timeline
  → @diabetes-universe/types
```

This keeps the shared Timeline package reusable by future iOS/Android storage adapters and prevents a Web-only runtime dependency from contaminating cross-platform domain/repository code.

## Decision 2 — First-run bootstrap is metadata-driven and integrity-aware

An empty event store is not a first-run signal.

A persistent bootstrap record identifies completed initialization. Demo seed and bootstrap metadata are committed atomically.

```text
valid bootstrap metadata
  → normal startup, even if event store is empty

no valid bootstrap metadata
  + events/quarantine empty
  → true first-run candidate → seed + metadata in one transaction

no valid bootstrap metadata
  + any durable event/quarantine evidence
  → inconsistent state → fail safely, never reseed automatically
```

This prevents deleted user history from being replaced by demo medical history and prevents metadata corruption from being mistaken for a new install.

## Decision 3 — Durable identity and storage envelope

`SemanticTimelineEvent.id` remains the durable local event identity. The adapter may wrap it with storage-only metadata:

```ts
interface LocalTimelinePersistenceRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly kind: TimelineEventKind;
  readonly event: SemanticTimelineEvent;
  readonly persistedAt: string;
  readonly storageSchemaVersion: 1;
}
```

Duplicated structural fields exist only for indexes and must be validated against the canonical event on read.

## Decision 4 — Required stores and indexes

P4 Web database v1 contains:

```text
timeline_events
  primary key: id
  index: [occurredAt, id]
  index: [kind, occurredAt, id]

timeline_metadata
  bootstrap metadata

timeline_quarantine
  corrupt-record isolation/recovery material
```

No canonical persisted `localDay` field is approved. Day boundaries are timezone-dependent and must be translated to an `occurredAt` range.

## Decision 5 — Bounded repository reads

P4 must add bounded reads for:

- event by ID;
- chronological page with required limit/cursor;
- kind-scoped chronological reads;
- occurrence-time ranges.

Timeline pagination uses chronological compound indexes. Latest glucose uses the kind index with descending limit 1. Dashboard day summaries query a timezone-derived occurrence range.

Multi-kind filtering must remain bounded. P4a must choose and test either a bounded merge of kind cursors or a chronological scan with an explicit scan budget.

`getSnapshot()` is transitional compatibility only. The durable adapter must not preload all historical events merely to satisfy a synchronous snapshot API. P4a resolves that contract before Web cutover; by P4d routine product rendering uses bounded reads only.

## Decision 6 — Opaque cursor semantics

Repository cursors are opaque outside the Timeline repository implementation. They may encode only structural state required for deterministic continuation, such as `(occurredAt, id)`, order, version, and filter identity.

Cursors must not contain event payload values, medication names, notes, or other PHI. Invalid/incompatible cursors fail safely and never fall back to an unbounded read.

## Decision 7 — Durable quarantine

Invalid persisted medical rows are not silently trusted or silently discarded.

```text
read persisted row
      ↓
validate adapter + semantic record
      ↓
valid → repository result
invalid → one transaction:
            preserve raw row in timeline_quarantine
            remove row from timeline_events
```

Quarantined records never enter Timeline, Dashboard, search, totals, or Next Action inputs. If quarantine itself fails, the read/initialization fails.

No PHI from quarantine records may be emitted to telemetry/logging.

## Decision 8 — Successful save means transaction commit

A local mutation is saved only after the IndexedDB readwrite transaction commits. An object-store request or React state update is insufficient.

```text
validate semantic mutation
  → begin transaction
  → write/delete record
  → await operation
  → await transaction commit
  → return applied
  → refresh application projection
```

Transaction failure preserves the last committed state and surfaces a normalized repository error.

## Decision 9 — Local delete is physical in P4

P4 physically removes locally deleted records. Sync tombstones, revisions, outbox, multi-device deletion, and server acknowledgement are not implemented until the dedicated sync architecture.

## Decision 10 — Version domains are separate

Do not conflate:

```text
IndexedDB database version
storageSchemaVersion
SemanticTimelineEvent.schemaVersion
```

Physical DB upgrades, adapter-record migrations, and semantic event migrations have separate ownership.

## Decision 11 — No silent destructive recovery

On schema/open/corruption failure, the adapter never automatically deletes and recreates the database. Allowed recovery is explicit: safe migration, retry, row quarantine, or a future user/support-confirmed reset.

## Decision 12 — Local persistence is not backup

P4 protects same-browser continuity, not browser-data deletion, eviction, device loss, profile loss, disk failure, or cross-device recovery. Cloud backup/recovery requires later backend/auth/sync architecture.

## Failure Model

| Scenario                                              | Required behavior                                |
| ----------------------------------------------------- | ------------------------------------------------ |
| Storage unavailable                                   | Repository initialization error                  |
| Open/upgrade blocked                                  | Explicit blocked lifecycle; never false-ready    |
| Schema upgrade failure                                | Initialization error; no reset                   |
| Missing/corrupt bootstrap + existing durable evidence | Inconsistent-bootstrap error; no reseed          |
| Write transaction failure                             | Mutation not applied                             |
| Quota exhaustion                                      | Explicit failure; no automatic deletion/fallback |
| Invalid cursor                                        | Bounded read error                               |
| Corrupt row                                           | Durable quarantine                               |
| Quarantine failure                                    | Read/init error                                  |
| User deleted all events after bootstrap               | Remains empty after reload                       |
| Terminated IndexedDB connection                       | Adapter unusable until recovery/reinitialize     |

UI copy remains presentation-layer responsibility; raw browser/storage exceptions and PHI must not leak to user copy or telemetry.

## Security / Privacy

P4 persists sensitive health data in the browser profile. Required constraints:

- no PHI in URLs;
- no event/quarantine payload logging;
- no direct UI IndexedDB access;
- no `localStorage` copy of medical event bodies;
- no claim that IndexedDB provides application-level encryption;
- no authentication semantics inferred from local browser possession.

Application-level encryption/key management remains a separate future decision because encryption without an approved identity/key lifecycle can create false protection.

## Testing Requirements

P4 testing must cover schema creation/upgrades, first-run atomic bootstrap, no-reseed after delete-all, inconsistent bootstrap detection, reload durability, duplicate IDs, missing update/delete, compound ordering, bounded asc/desc queries, kind and multi-kind reads, cursor continuation/incompatibility, corruption quarantine, quarantine failure, transaction abort, quota normalization where practical, connection lifecycle, immutability, and all P3 semantic regressions.

Node tests may use `fake-indexeddb`; browser E2E must prove real persistence.

Minimum browser journeys:

```text
add event → reload → event remains
delete event → reload → event remains deleted
delete all events → reload → demo data does not return
```

## P4 Waves

### P4a — Web Storage Contract & Schema Foundation

Deliver the new `@diabetes-universe/timeline-web` package, `idb`/test dependency boundaries, bounded repository contracts, removal/resolution of routine synchronous `getSnapshot()`, DB schema/open/upgrade foundation, bootstrap metadata/state machine, validators, quarantine/error contracts, connection lifecycle, and foundation tests. No default Web cutover.

### P4b — IndexedDB Repository Adapter

Deliver durable semantic CRUD, atomic bootstrap, compound-index queries/cursors, durable quarantine, transaction semantics, and complete adapter tests. Keep `InMemoryTimelineRepository` for tests/explicit injection.

### P4c — Web Cutover & Reload Durability

Make Web composition use `IndexedDbTimelineRepository` by default. No silent memory fallback. Startup uses bounded/bootstrap flow rather than full-history preload. Add browser reload/delete/no-reseed coverage while preserving existing journeys.

### P4d — Bounded Product Reads

Move Timeline pagination and Dashboard latest-glucose/recent/day-range data access to bounded repository/read-model queries. Routine rendering no longer requires full historical arrays. Complete scale/regression audit.

## P4 Completion Gate

P4 is Feature Complete only when all are true:

1. Durable semantic repository is active by default on Web.
2. Save success equals committed transaction.
3. Bootstrap state machine is stable and no-reseed behavior is proven.
4. Corrupt rows are durably quarantined.
5. Routine Timeline/Dashboard reads are bounded.
6. No silent in-memory fallback exists.
7. Reload/delete/no-reseed regressions pass in a real browser.
8. Full validation is green.
9. Documentation matches runtime reality.

## Explicit Non-Scope

SQLite/native mobile storage; backend/API; authentication/authorization; `ownerId`; sync/outbox/retry/conflict resolution; tombstones; device integrations; cross-tab live synchronization; cloud backup/recovery; export/import backup UX; encryption/key management; Analytics/Reports/AI changes; caregiver/HCP access.

## Governing Decisions

- [ADR-0014 — Local-First Medical Event Persistence Architecture](../../adr/0014-local-first-medical-event-persistence-architecture.md)
- [ADR-0015 — Web IndexedDB Timeline Persistence Implementation](../../adr/0015-web-indexeddb-timeline-persistence-implementation.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Timeline Shared State](shared-state.md)

## Date

2026-08-09
