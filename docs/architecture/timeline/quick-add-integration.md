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
   - `createActivityTimelineEvent`
   - `createNoteTimelineEvent`
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
- `title`: selected activity type
- `value`: duration
- `unit`: `мин`
- `note`: optional
- `dateTime`: ISO 8601 from approved temporal utility

### Note validation

- `text` is required after trim and limited to 500 characters.
- `title` is optional and limited to 80 characters.
- `time` is required.

Resulting event:

- `kind: note`
- `source: manual`
- `title`: user title or `Заметка`
- `value`: note text
- `note`: omitted to avoid duplicate body
- `dateTime`: ISO 8601 from approved temporal utility

### Responsive behavior

- Mobile category grid uses two columns with equal-height cards.
- Six categories fit without horizontal scroll; the panel scrolls vertically
  when needed.
- Footer and safe-area padding remain visible.
- FAB hides while Quick Add is open.

### Screen-specific behavior

Dashboard keeps its Quick Add opening lock and desktop/mobile triggers.
Timeline keeps its own FAB-triggered Quick Add instance.

Both screens write to the same `addEvent` API.
