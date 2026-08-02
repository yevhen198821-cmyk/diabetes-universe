# Timeline Shared State

## Purpose

Define the approved demo-stage state owner for Timeline events shared by
Dashboard and Timeline.

## Status

Approved

## Responsibility

The shared Timeline store owns the in-memory collection of `TimelineEvent`
records before Backend/API integration exists.

The store owns:

- `readonly TimelineEvent[]`;
- demo loading status;
- demo error message;
- add/update/delete/replace event operations.

The store does not own:

- Quick Add panel open/close state;
- search state;
- filter state;
- event detail UI state;
- pagination cursor state.

## Dependencies

- [Timeline Overview](overview.md)
- [Timeline Quick Add Integration](quick-add-integration.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Navigation Overview](../navigation/overview.md)

## Notes

### Implementation

- Provider: `TimelineStoreProvider`
- Hook: `useTimelineStore`
- Reducer/model: `apps/web/lib/timeline/timeline-store/timeline-store-model.ts`
- App placement: `apps/web/app/providers.tsx`, mounted by `apps/web/app/layout.tsx`

The root layout remains a server component. A small client provider wrapper owns
the store, so navigation between `/` and `/timeline` does not reset events.

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

- Events are always sorted by `dateTime`.
- Event IDs are unique.
- `add` with an existing ID replaces the existing event.
- `update` with an unknown ID is a no-op.
- `delete` with an unknown ID is a no-op.
- `replace` deduplicates by ID and sorts.
- Existing arrays and event objects are not mutated.
- Invalid `dateTime` values follow the temporal fallback from the Timeline
  entity contract: they sort after valid events.

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

The store is a temporary in-memory demo implementation. Future API/repository
work should keep the reducer/selectors as pure model logic where possible and
replace the provider's data source rather than reintroducing local screen state.
