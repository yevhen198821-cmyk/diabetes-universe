# Timeline Shared State and Repository Foundation

## Purpose

Define the approved application state and repository ownership for Timeline
events shared by Dashboard and Timeline.

## Status

Approved — reconciled with P4 durable Web persistence and Wave 3D-IV glucose
Quick Add save integrity closure.

## Responsibility

`TimelineStoreProvider` owns the React application projection used for rendering:

- `readonly SemanticTimelineEvent[]`;
- loading status;
- error status;
- safe application error message when one is provided;
- mutation facade methods exposed to existing consumers.

The provider delegates event mutations to `TimelineRepository` and refreshes
React state from `repository.getSnapshot()`. React state is therefore a
projection/cache for rendering, not a second canonical event collection.

On Web production, `IndexedDbTimelineRepository`
(`@diabetes-universe/timeline-web`) is the default adapter created through
`apps/web/lib/timeline/create-web-timeline-repository.ts`. User-created events
persist across reload and browser restart through IndexedDB. `InMemoryTimelineRepository`
remains available only for explicit test or development composition and is not
a silent production fallback.

Routine runtime does **not** lift legacy repository snapshots or maintain
migration sidecar/quarantine state. Migration utilities (`liftLegacyToSemantic`,
`liftRepositorySnapshot`) exist only for explicit import/migration paths and
regression tests.

The store does not own:

- Quick Add panel open/close state;
- search state;
- filter state;
- event detail UI state;
- pagination cursor state.

Backend/API transport, cloud sync, auth-bound multi-device durability, and outbox
remain out of scope.

## Dependencies

- [Timeline Overview](overview.md)
- [Timeline Quick Add Integration](quick-add-integration.md)
- [P4 — Durable Local Persistence](p4-durable-local-persistence.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Navigation Overview](../navigation/overview.md)

## Notes

### Implementation

- Provider: `TimelineStoreProvider`
- Hook: `useTimelineStore`
- Repository contract: `@diabetes-universe/timeline`
- Web production adapter: `IndexedDbTimelineRepository` via
  `createWebTimelineRepository()`
- Test/development adapter: `InMemoryTimelineRepository` (explicit composition
  only)
- Reducer/model: `apps/web/lib/timeline/timeline-store/timeline-store-model.ts`
- App placement: `TimelineStoreBoundary` in the app provider tree, mounted by
  `apps/web/app/layout.tsx`

The root layout remains a server component. A small client provider wrapper owns
the store, so navigation between `/` and `/timeline` does not reset events.

`TimelineStoreBoundary` creates the Web repository at the application/provider
boundary with semantic demo seed on first IndexedDB bootstrap only. It does not
create repositories inside Dashboard, Timeline, Quick Add, or presentation
components.

### Public API

```ts
interface TimelineStoreValue {
  readonly events: readonly SemanticTimelineEvent[];
  readonly status: 'loading' | 'ready' | 'error';
  readonly error?: string;

  readonly addEvent: (event: SemanticTimelineEvent) => void;
  readonly addEventAsync: (event: SemanticTimelineEvent) => Promise<void>;
  readonly updateEvent: (event: SemanticTimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly replaceEvents: (events: readonly SemanticTimelineEvent[]) => void;
}
```

Non-glucose Quick Add categories enqueue mutations through synchronous
`addEvent`. Glucose Quick Add uses awaited `addEventAsync` so success close
happens only after the IndexedDB transaction commits (Wave 3D save integrity).

### Reducer invariants

Repository mutation semantics live in `@diabetes-universe/timeline`.

The React reducer/model owns only application projection state:

- loading;
- ready semantic repository snapshot;
- error.

It does not independently perform add/update/delete business mutations.
Existing arrays and event objects are cloned before entering React state.

Routine diagnostics report zero migration/quarantine counts. Migration evidence
exists only in explicit import/migration utilities, not in normal app state.

### Selectors

Dashboard derived data is calculated by React-independent selectors in
`apps/web/lib/timeline/timeline-selectors.ts`.

Approved selectors:

- `getLatestGlucoseEvent`
- `getRecentTimelineEvents`
- `getTodayTimelineEvents`
- `getTodayInsulinTotal`
- `getTodayNutritionTotal`
- `getTodayMedicationCount`

Day Summary uses only events from the local current calendar day.

### Ordering

Repository, selectors, and Timeline UI share one semantic ordering contract:

1. `occurredAt` ascending/descending as required by the consumer;
2. `id` as deterministic tie-breaker.

### Timezone policy

Demo state stores `occurredAt` as ISO 8601. Grouping, summaries, and display
formatting use the user's browser-local timezone unless a test or caller passes
an explicit timezone. Account-level timezone settings are future scope.

### Persistence (current Web production)

**P4 — Durable Local Persistence: Feature Complete** for the approved Web scope.

Current:

- repository boundary implemented;
- Web production adapter is `IndexedDbTimelineRepository`;
- reload persistence is implemented through IndexedDB;
- successful save means the durable IndexedDB transaction committed;
- Web runtime does not silently fall back to in-memory persistence when IndexedDB
  is unavailable.

Future:

- mobile adapter such as SQLite/native storage;
- backend/cloud sync/auth/outbox only after separate approved work.

Future API/repository work should keep selectors as pure model logic where
possible and replace the provider's repository adapter rather than
reintroducing local screen state.

### Historical note (P2 / pre-P4)

Before P4, the approved Web adapter was `InMemoryTimelineRepository` and reload
persistence was not implemented. That state is recorded in migration notes inside
[Timeline Entity](../../data/entities/timeline.md) and superseded by the
current Web production adapter above.

### Known application-state debt

Timeline renders loading/error states through `TimelineListModel`. Dashboard
currently reads `events` and mutation methods from `useTimelineStore()` and does
not render Timeline repository loading/error states. Fixing Dashboard
loading/error handling remains follow-up work outside Wave 3D-IV.
