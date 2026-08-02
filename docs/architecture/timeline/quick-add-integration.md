# Timeline Quick Add Integration

## Purpose

Describe how Quick Add writes Timeline events into the shared demo store from
Dashboard and Timeline.

## Status

Approved

## Responsibility

Quick Add forms collect user input and create `TimelineEvent` records through
the approved create helpers. The shared Timeline store receives completed events
through `addEvent`.

The integration must preserve:

- shared `QuickAddHost` UI behavior;
- Dashboard opening lock behavior;
- haptics and focus return;
- independent Quick Add panel UI state per screen;
- a single shared event collection.

## Dependencies

- [Timeline Shared State](shared-state.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [UI Bible: Quick Add](../../ui-bible/003-quick-add.md)

## Notes

### Flow

1. User submits a supported Quick Add form.
2. The form emits a Quick Add entry.
3. The screen handler calls the matching create helper when the category has a
   save flow:
   - `createGlucoseTimelineEvent`
   - `createInsulinTimelineEvent`
   - `createNutritionTimelineEvent`
   - `createMedicationTimelineEvent`
4. The screen calls `addEvent(event)` from `useTimelineStore`.
5. The shared store sorts and deduplicates the event collection.
6. Dashboard and Timeline re-render from the same `events` array.

### Boundaries

- Create helpers remain the source of `TimelineEvent` construction.
- Timeline store stores events only.
- Timeline store does not store Quick Add open state.
- Quick Add exposes all six MVP categories in the action picker.
- Activity and note are valid domain kinds for display, search, filtering,
  details, edit, and delete.
- Activity and note Quick Add categories show the Stage 1 placeholder form and do
  not write to the shared store yet.

### Screen-specific behavior

Dashboard keeps its Quick Add opening lock and desktop/mobile triggers.
Timeline keeps its own FAB-triggered Quick Add instance.

Both screens write to the same `addEvent` API.
