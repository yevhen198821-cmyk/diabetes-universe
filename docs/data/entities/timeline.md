# Timeline Entity

## Status

Approved

## Purpose

Define the canonical Timeline event contract shared by Dashboard derivations,
Timeline UI, demo data, repository storage, and future API integration.

## Current state (post-P3h)

- **`SemanticTimelineEvent`** is the canonical application and repository event
  model.
- **`TimelineRepository`** stores `SemanticTimelineEvent` natively through
  `InMemoryTimelineRepository`.
- The production demo seed in `apps/web/lib/mocks/timeline.ts` is semantic-native
  (`readonly SemanticTimelineEvent[]`).
- **Legacy `TimelineEvent`** remains in `@diabetes-universe/types` for
  migration and import utilities only (`liftLegacyToSemantic`,
  `liftRepositorySnapshot`).
- **Durable persistence** (IndexedDB, SQLite, backend, auth, sync) is **not**
  implemented.
- **P4** has **not** started (architecture design in
  `docs/architecture/timeline/p4-durable-local-persistence.md`).
- **P3 — Semantic Timeline Event Model: Feature Complete** (merged PR #67 @
  `44ca315`, 2026-08-09).

## SemanticTimelineEvent contract

`SemanticTimelineEvent` is a discriminated union of six approved kinds defined in
`@diabetes-universe/types`. Every variant shares `SemanticEventEnvelope` fields:

```ts
interface SemanticEventEnvelope {
  readonly id: string;
  readonly occurredAt: string; // ISO 8601 medical occurrence time
  readonly createdAt: string; // ISO 8601 local lifecycle metadata
  readonly updatedAt: string; // ISO 8601 local lifecycle metadata
  readonly schemaVersion: 1;
  readonly source: TimelineEventSource;
  readonly provenance?: EventProvenance;
}
```

Per-kind semantic payloads store canonical numeric values (for example
`concentrationMmolPerL`, `doseUnits`, `carbohydratesGrams`) and
`CanonicalUnitId` for medication doses. Presentation strings (`title`, `value`,
`unit` on legacy records) are **not** part of the semantic domain model except
for note `title?` and `body`, which are user-authored semantic content.

`occurredAt` is the single source of truth for event ordering and day grouping.
Display-only strings such as `displayTime`, `displayDate`, and relative labels
are derived in the presentation layer through `PlatformFormatter` and i18n
labels.

## Legacy TimelineEvent (migration-only)

Legacy `TimelineEvent` with presentation-oriented `dateTime`, `title`, `value`,
and `unit` fields is retained only for explicit migration and import paths. It is
**not** the routine application or repository model after P3h.

```ts
interface TimelineEvent {
  readonly id: string;
  readonly kind: TimelineEventKind;
  readonly dateTime: string;
  readonly title: string;
  readonly value: string;
  readonly unit?: string;
  readonly context?: string;
  readonly note?: string;
  readonly source?: TimelineEventSource;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
```

Preserved legacy demo data for regression lives in
`apps/web/lib/mocks/preserved-legacy-demo-timeline-events.ts`.

## TimelineEventKind

Approved kinds for the current architecture:

- `glucose`
- `insulin`
- `nutrition`
- `medication`
- `activity`
- `note`

`meal` is not a canonical kind. Historical demo data and UI mappings must use
`nutrition` only.

`reminder` and `ai_insight` are not `TimelineEventKind` values in the current
scope. Reminders belong to planning flows; AI insights are generated artifacts,
not user-authored journal entries.

## TimelineEventSource

```ts
type TimelineEventSource = 'manual' | 'demo' | 'device' | 'import';
```

- `manual` — created through Quick Add or future edit flows
- `demo` — seeded mock/demo data
- `device` — reserved for connected devices
- `import` — reserved for imported history

## Temporal model

- `occurredAt` must be ISO 8601 on every `SemanticTimelineEvent`.
- Sorting uses parsed `occurredAt` timestamps with `id` as deterministic
  tie-breaker, never raw `HH:mm` string comparison.
- Invalid `occurredAt` values sort after valid values and format to `--:--`.
- Invalid selected Quick Add time values throw during semantic event creation.
- Browser-local timezone is used on the demo stage unless a caller supplies an
  explicit `timeZone` to formatter utilities.
- Dashboard summaries and Timeline grouping use the user's local calendar day.
  Account-level timezone settings are future scope.

## Semantic field semantics

| Field           | Required | Meaning                                             |
| --------------- | -------- | --------------------------------------------------- |
| `id`            | yes      | Stable event identifier                             |
| `kind`          | yes      | Event category discriminator                        |
| `occurredAt`    | yes      | Canonical medical occurrence timestamp              |
| `schemaVersion` | yes      | Semantic schema generation (`1` in P3)              |
| `source`        | yes      | Origin of the record                                |
| `createdAt`     | yes      | Local first-seen timestamp (immutable after create) |
| `updatedAt`     | yes      | Local last-mutation timestamp                       |
| kind fields     | varies   | Canonical numeric/text payloads per variant         |

For `kind: 'note'`, journal content lives in optional `title` and required
`body`. These are user-authored semantic fields, not presentation DTO strings.

## Invariants

- Every persisted or demo Timeline event has a valid `kind` from the approved set.
- `nutrition` is the only canonical nutrition/meal kind.
- UI must not store presentation-only time strings on semantic domain objects.
- Dashboard recent-events preview excludes `glucose` and `note` by product rules,
  but both remain valid Timeline events.
- Type-specific medical payloads must not be flattened into unrelated optional
  fields on the base event.
- Migration evidence (`MigrationRecord`, quarantine records) is external to
  `SemanticTimelineEvent`; routine application state does not carry migration
  sidecar data.

## Relationships

- Dashboard derives Last Glucose, Day Summary, and Recent Events from
  `SemanticTimelineEvent[]`.
- Timeline renders the full journal from the same semantic contract.
- Event cards consume mapped presentation props derived from semantic events.
- During the demo stage, Dashboard and Timeline share one app-level in-memory
  Timeline store backed by a semantic repository.

## API readiness

The semantic contract is backend-agnostic and maps cleanly to future API responses:

- sort/filter/paginate by `occurredAt`
- patch/delete by `id`
- preserve `source`, `createdAt`, and `updatedAt` when the API provides them

No API transport layer is implemented in the current stage.

## Future pagination API

Future Timeline pagination should use an opaque cursor contract:

```http
GET /timeline/events?cursor=<cursor>&limit=20&kind=<kind>&query=<query>
```

```ts
interface TimelinePage {
  readonly items: readonly SemanticTimelineEvent[];
  readonly nextCursor?: string;
  readonly hasMore: boolean;
}
```

The server applies search/filter before pagination, sorts descending by
`occurredAt`, uses `id` as the stable tie-breaker, and owns cursor generation.
The client must not derive cursors from event fields.

## Editing semantics

Timeline editing operates on semantic events through edit drafts:

- editable per kind: numeric payloads, note body, activity type, insulin
  preparation, medication name, context fields, and `occurredAt` through date/time
  inputs;
- immutable: `id`, `kind`, `source`, `createdAt`;
- successful edits set `updatedAt`;
- `occurredAt` changes only when the user edits date/time inputs.

Quick Add and edit flows create or update `SemanticTimelineEvent` records
directly. Presentation formatting belongs to the presentation boundary (P3d).

## Migration notes

Historical lifecycle record. Sections below describe state **at that wave**, not
current architecture unless the P3h / current-state summary above says otherwise.

Stage 2 migration changes:

- removed legacy `time: HH:mm` from `TimelineEvent`
- removed `meal` from `TimelineEventKind`
- migrated demo `meal` records to `nutrition`
- added `activity` and `note` demo events
- introduced `TimelineEventSource`
- moved sorting/formatting to `apps/web/lib/timeline/timeline-date-time.ts`

Stage 3 migration changes:

- introduced a shared in-memory Timeline store;
- moved Dashboard and Timeline off local event arrays;
- added selectors for Dashboard derived data;
- Day Summary now counts only local-today events;
- duplicate `add` by ID replaces the existing event.

Stage 4 migration changes:

- Timeline list grouping moved into `TimelineListModel`;
- one group is created for every local calendar date;
- older events are no longer collapsed into one `Ранее` group;
- invalid `dateTime` values render in a stable fallback group.

Stage 6 migration changes:

- introduced event details without URL changes;
- introduced generic edit drafts with kind-specific validation;
- edit preserves `id`, `kind`, `source`, and `createdAt`;
- edit writes `updatedAt`;
- delete removes events through the shared Timeline store.

Stage 7 migration changes:

- introduced client-side demo pagination with Load More;
- page size is 20 events;
- search/filter happen before pagination;
- grouping happens after pagination;
- documented future cursor API without implementing backend transport.

P2 Repository Foundation changes (historical — superseded by P3h):

- introduced `@diabetes-universe/timeline` as the repository boundary package;
- introduced `InMemoryTimelineRepository` as the non-durable adapter;
- integrated `TimelineStoreProvider` with `TimelineRepository`;
- at this wave, `TimelineEvent` was the temporary repository compatibility type;
- reload persistence remains not implemented.

P3a Semantic Types Foundation changes (historical state at P3a):

- introduced `SemanticTimelineEvent` and per-kind semantic variants in
  `@diabetes-universe/types`;
- introduced P3 migration and diagnostics contracts (`MigrationRecord`,
  `MigrationResult`, `QuarantineRecord`, `TimelineDiagnosticsSnapshot`) as
  separate types outside the semantic domain event;
- at this wave, legacy `TimelineEvent` was still the active repository contract;
  semantic repository cutover followed in P3h.

P3b Legacy Migration Runtime changes (historical state at P3b):

- introduced `liftLegacyToSemantic()` in `@diabetes-universe/timeline`;
- pure legacy presentation lift into `SemanticTimelineEvent` with external
  `MigrationRecord` evidence and explicit quarantine results;
- at this wave, the application still used legacy `TimelineEvent` through the
  P2 repository; semantic application store followed in P3c; repository cutover
  in P3h.

## Semantic model reference (P3a+)

`SemanticTimelineEvent` is defined in `@diabetes-universe/types`. It uses a
single `kind` discriminator with per-variant fields and canonical numeric values
plus `CanonicalUnitId` where required.

`ownerId` and other persistence-envelope fields from ADR-0014 are intentionally
absent from `SemanticTimelineEvent`. Ownership belongs to a future persistence
record wrapper, not to the semantic domain event.

P3b added legacy lift runtime in `@diabetes-universe/timeline` via
`liftLegacyToSemantic()` for explicit import/migration paths only.

P3c Semantic Application Store changes (historical — superseded by P3h for
routine runtime):

- `TimelineStoreProvider` previously lifted P2 repository snapshots into
  `SemanticTimelineEvent[]` on initialization and after legacy repository
  mutations;
- migration sidecar (`MigrationRecord` by `eventId`) and quarantine registry
  were in-memory application stores;
- `useTimelineStore().events` exposes semantic events only;
- `useTimelineStore().diagnostics` exposes `TimelineDiagnosticsSnapshot`;
- legacy repository mutations remained through a temporary compatibility bridge
  until P3h;
- repository cutover completed in P3h.

P3f Dashboard Semantic Closure changes (historical state at P3f):

- Dashboard read/business derivations consume `SemanticTimelineEvent[]` only;
- presentation strings are produced at component/container boundaries;
- at this wave, the production demo seed was still legacy until P3g/P3h cutover.

P3g Demo Fixture & Migration Closure changes:

- preserved legacy demo dataset in
  `apps/web/lib/mocks/preserved-legacy-demo-timeline-events.ts` for migration
  regression only;
- deterministic regression coverage in
  `apps/web/lib/mocks/demo-fixture-migration-closure.test.mjs` validates
  `legacy demo v0 → liftLegacyToSemantic → semantic v1` matches the current
  semantic demo source;
- obsolete presentation-only demo exports (`lastGlucose`, `daySummary`) removed
  from the mock module;
- production demo seed cutover to native semantic records completed in P3h.

P3h Semantic Repository Cutover changes:

- `TimelineRepositoryEvent` is now `SemanticTimelineEvent` natively;
- `InMemoryTimelineRepository` stores semantic records with `occurredAt` ordering
  (`occurredAt`, then `id` tie-break);
- `TimelineStoreProvider` reads semantic repository snapshots directly without
  routine `liftRepositorySnapshot()` re-lift;
- removed temporary write projection (`projectSemanticEventForRepositoryWrite`,
  `projectSemanticToLegacyRepositoryEvent`, `temporary-semantic-repository-bridge`);
- removed `NativeSemanticEventSidecar` from routine runtime;
- routine store state no longer carries migration sidecar/quarantine state;
- production demo seed in `apps/web/lib/mocks/timeline.ts` is
  `readonly SemanticTimelineEvent[]`;
- `liftLegacyToSemantic()` and `liftRepositorySnapshot()` remain migration/import
  utilities only;
- legacy `TimelineEvent` remains in `@diabetes-universe/types` as a migration
  contract only;
- durable persistence (IndexedDB/SQLite/backend/sync) is **not** implemented;
- P4 has **not** started;
- P3 Feature Complete is **not** declared until a separate Final Audit.

## Out of scope

- reminder and `ai_insight` as Timeline events
- backend/API implementation
- durable persistence (IndexedDB, SQLite, backend, auth, sync) — P4 not started
- routine migration lift in application store (migration utilities remain for
  explicit import paths only)

## Quick Add mapping (semantic write path)

Quick Add creates `SemanticTimelineEvent` records directly through semantic
creators in `apps/web/lib/timeline/semantic-creators/`. Presentation strings are
not written to the repository.

### Activity

`ActivityQuickAddEntry` creates a semantic activity event:

| Semantic field    | Value                          |
| ----------------- | ------------------------------ |
| `kind`            | `activity`                     |
| `source`          | `manual`                       |
| `activityType`    | selected activity type         |
| `durationSeconds` | duration in seconds            |
| `note`            | optional user note             |
| `occurredAt`      | ISO 8601 from approved utility |

Validation: `activityType` required; `durationMinutes` integer in `1..1440`;
`time` required; `note` max 200 characters.

### Note

`NoteQuickAddEntry` creates a semantic note event:

| Semantic field | Value                          |
| -------------- | ------------------------------ |
| `kind`         | `note`                         |
| `source`       | `manual`                       |
| `title`        | user title or default label    |
| `body`         | note text                      |
| `occurredAt`   | ISO 8601 from approved utility |

Validation: trimmed `text` required; `text` max 500; `title` max 80; `time`
required.
