# Timeline Quick Add Integration

## Purpose

Describe how Quick Add writes `SemanticTimelineEvent` records into the shared
Timeline store and durable Web repository from Dashboard and Timeline.

## Status

Approved — reconciled with Wave 3D-IV Glucose Quick Add save integrity closure.

## Responsibility

Quick Add forms collect user input and create semantic Timeline events through
approved semantic creators. The shared Timeline store receives events through
`addEvent` or `addEventAsync`, delegates to `TimelineRepository`, and persists
via the Web IndexedDB adapter (`createIndexedDbTimelineRepository`).

The integration must preserve:

- shared `QuickAddHost` UI behavior;
- Dashboard opening lock behavior;
- haptics and focus return;
- independent Quick Add panel UI state per screen;
- a single shared semantic event collection;
- glucose-specific save integrity (Wave 3D).

## Dependencies

- [Timeline Shared State](shared-state.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [P4 — Durable Local Persistence](p4-durable-local-persistence.md)
- [UI Bible: Quick Add](../../ui-bible/003-quick-add.md)

## Notes

### Glucose production path (Wave 3D save integrity)

Glucose Quick Add uses an awaited persistence contract. Dashboard and Timeline
share the same handler shape.

```text
GlucoseQuickAddForm
  → prepareGlucoseQuickAddSubmit (validate + stable full event ID)
  → [valid only] pending state + host dismiss lock (onSubmittingChange)
  → persistPreparedGlucoseQuickAddSubmit
  → QuickAddHost.handleGlucoseSubmit → finalizeGlucoseQuickAddSubmit
  → screen onGlucoseSubmit (Dashboard + Timeline)
  → createSemanticGlucoseTimelineEvent(entry, { id: eventId })
  → TimelineStore.addEventAsync
  → TimelineRepository.addEvent (IndexedDB)
  → applied result
  → releaseGlucoseSubmitPending → closeQuickAdd('success') + focus return
```

Glucose invariants:

| Invariant         | Behavior                                                                               |
| ----------------- | -------------------------------------------------------------------------------------- |
| Invalid input     | Never enters pending; no event ID allocated                                            |
| Stable identity   | One full event ID retained for a logical submit and all retries                        |
| Persistence       | `addEventAsync` is awaited before success close                                        |
| Single-flight     | Duplicate submit ignored while pending                                                 |
| Dismiss guard     | Escape, backdrop, header Back, Cancel, and mutable controls blocked during persistence |
| Failure           | Form and entered values remain; pending/dismiss lock released; same event ID for retry |
| Success           | Retry identity cleared; panel closes once                                              |
| Canonical payload | `concentrationMmolPerL` with `source: "manual"`; optional `context` remains optional   |

Implementation references:

- `apps/web/components/quick-add/glucose-quick-add-form.tsx`
- `apps/web/lib/quick-add/glucose-quick-add-submit-controller.ts`
- `apps/web/lib/quick-add/glucose-quick-add-submit-model.ts`
- `apps/web/components/quick-add/quick-add-host.tsx`
- `apps/web/lib/timeline/semantic-creators/create-semantic-glucose-timeline-event.ts`

### Other categories (unchanged)

Insulin, nutrition, medication, activity, and note still use synchronous
`addEvent` with immediate success close after the store enqueues the repository
mutation. They create `SemanticTimelineEvent` records through semantic creators:

- `createSemanticInsulinTimelineEvent`
- `createSemanticNutritionTimelineEvent`
- `createSemanticMedicationTimelineEvent`
- `createSemanticActivityTimelineEvent`
- `createSemanticNoteTimelineEvent`

### Non-glucose flow

1. User submits a supported Quick Add form (non-glucose).
2. The form emits a Quick Add entry.
3. The screen handler calls the matching semantic creator.
4. The screen calls `addEvent(event)` from `useTimelineStore`.
5. The repository persists the event; the store projection updates.
6. Dashboard and Timeline re-render from the same `events` array.

### Boundaries

- Semantic creators remain the source of `SemanticTimelineEvent` construction.
- Legacy `TimelineEvent` is migration/import-only; Quick Add does not write it.
- Timeline store stores semantic events only.
- Timeline store does not store Quick Add open state.
- Quick Add exposes all six MVP categories in the action picker.
- Activity and note are valid domain kinds for display, search, filtering,
  details, edit, and delete.
- Dashboard Next Action can open Quick Add with a preselected category through
  the shared controller `openCategory` API.

### Activity validation

- `activityType` is required.
- `durationMinutes` must be an integer greater than 0 and not more than 1440.
- `time` is required.
- `note` is optional and limited to 200 characters.

Resulting event:

- `kind: activity`
- `source: manual`
- `activityType`: selected activity type
- `durationSeconds`: duration converted to seconds
- `note`: optional
- `occurredAt`: ISO 8601 from approved temporal utility

### Note validation

- `text` is required after trim and limited to 500 characters.
- `title` is optional and limited to 80 characters.
- `time` is required.

Resulting event:

- `kind: note`
- `source: manual`
- `title`: user title or default label
- `body`: note text
- `occurredAt`: ISO 8601 from approved temporal utility

### Responsive behavior

- Mobile category grid uses two columns with equal-height cards.
- Six categories fit without horizontal scroll; the panel scrolls vertically
  when needed.
- Footer and safe-area padding remain visible.
- FAB hides while Quick Add is open.

### Screen-specific behavior

Dashboard keeps its Quick Add opening lock and desktop/mobile triggers.
Timeline keeps its own FAB-triggered Quick Add instance.

Both screens write to the same Timeline store and repository. Glucose uses
`addEventAsync`; other categories use `addEvent`.
