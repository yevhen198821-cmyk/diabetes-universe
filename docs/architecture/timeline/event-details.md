# Timeline Event Details Architecture

## Purpose

Define how an existing Timeline event is opened and inspected without changing
the current route.

## Status

Approved

## Responsibility

Event details own:

- one selected Timeline event at a time;
- presentation-ready detail data from `TimelineEventDetailModel`;
- modal/sheet rendering;
- focus trap, Escape, backdrop close, and focus return;
- entry point to edit and delete flows.

Details do not own Timeline search/filter state, Dashboard selectors, inline card
actions, pagination, or API persistence.

## Notes

- Details open from interactive Timeline `EventCard` instances only.
- The URL remains `/timeline`; no details route is created.
- `TimelineShell` stores `selectedEventId`, and the event is read from the shared
  Timeline store to avoid stale copies after update/delete.
- Cards use `aria-haspopup="dialog"` semantics through button interaction and an
  explicit accessible label.
- Dashboard Recent Events remain presentation-only and do not open this dialog.
- Missing optional fields are hidden instead of rendered as empty rows or dashes.
