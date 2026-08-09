# Timeline Shared State and Repository Foundation

## Purpose

Define the approved application state and repository ownership for Timeline
events shared by Dashboard and Timeline.

## Status

Approved

## Responsibility

`InMemoryTimelineRepository` owns the current persistence-facing in-memory
collection of `TimelineEvent` records before durable local storage, Backend/API,
or sync integration exists.

`TimelineStoreProvider` owns the React application projection used for rendering:

- `readonly TimelineEvent[]`;
- loading status;
- error status;
- safe application error message when one is provided;
- mutation facade methods exposed to existing consumers.

The provider delegates event mutations to `TimelineRepository` and refreshes
React state from `repository.getSnapshot()`. React state is therefore a
projection/cache for rendering, not a second canonical event collection.

The store does not own:

- Quick Add panel open/close state;
- search state;
- filter state;
- event detail UI state;
- pagination cursor state.
- durable reload persistence;
- IndexedDB, SQLite, backend, auth, sync, outbox, or device integrations.

## Dependencies

- [Timeline Overview](overview.md)
- [Timeline Quick Add Integration](quick-add-integration.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Navigation Overview](../navigation/overview.md)

## Notes

### Implementation

- Provider: `TimelineStoreProvider`
- Hook: `useTimelineStore`
- Repository contract: `@diabetes-universe/timeline`
- Current adapter: `InMemoryTimelineRepository`
- Reducer/model: `apps/web/lib/timeline/timeline-store/timeline-store-model.ts`
- App placement: `apps/web/app/providers.tsx`, mounted by `apps/web/app/layout.tsx`

The root layout remains a server component. A small client provider wrapper owns
the store, so navigation between `/` and `/timeline` does not reset events.

`TimelineStoreProvider` creates the demo repository at the application/provider
boundary from `demoTimelineEvents`. It does not create repositories inside
Dashboard, Timeline, Quick Add, or presentation components.

### Public API

```ts
interface TimelineStoreValue {
  readonly events: readonly TimelineEvent[];
  readonly status: 'loading' | 'ready' | 'error';
  readonly error?: string;

  readonly addEvent: (event: TimelineEvent) => void;
  readonly updateEvent: (event: TimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly replaceEvents: (events: readonly TimelineEvent[]) => void;
}
```

### Reducer invariants

Repository mutation semantics live in `@diabetes-universe/timeline`.

The React reducer/model owns only application projection state:

- loading;
- ready repository snapshot;
- error.

It does not independently perform add/update/delete business mutations.
Existing arrays and event objects are cloned before entering React state.

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

### Timezone policy

Demo state stores `dateTime` as ISO 8601. Grouping, summaries, and display
formatting use the user's browser-local timezone unless a test or caller passes
an explicit timezone. Account-level timezone settings are future scope.

### API readiness

Repository Foundation is implemented with `InMemoryTimelineRepository`.

Current:

- repository boundary implemented;
- current adapter is in-memory only;
- reload persistence is **not implemented**.

Future:

- durable Web adapter such as IndexedDB;
- mobile adapter such as SQLite/native storage;
- sync/backend/auth only after separate approved work.

Future API/repository work should keep selectors as pure model logic where
possible and replace the provider's repository adapter rather than
reintroducing local screen state.

### Known application-state debt

Timeline renders loading/error states through `TimelineListModel`. Dashboard
currently reads `events` and `addEvent` from `useTimelineStore()` and does not
render Timeline repository loading/error states. Fixing Dashboard loading/error
handling is outside P2 Phase C.
