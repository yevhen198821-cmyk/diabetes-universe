# Timeline Event Editing Architecture

## Purpose

Define how an existing Timeline event is edited through the details dialog.

## Status

Approved

## Responsibility

Editing owns:

- creating an edit draft from a `TimelineEvent`;
- validating the draft by event kind;
- converting local date/time inputs back to ISO `dateTime`;
- producing an immutable updated `TimelineEvent`;
- calling shared store `updateEvent` through `TimelineShell`.

Editing does not change `id`, `kind`, `source`, or `createdAt`. It sets
`updatedAt` on successful save.

## Notes

- Quick Add remains creation-only and is not reused as an edit form.
- The generic edit form supports date, time, title, value, unit, context, and
  note.
- Search/filter criteria remain local Timeline state and are preserved after
  save.
- If the saved event no longer matches active criteria, details close and focus
  moves to the Timeline toolbar/search area.
- Dashboard updates through shared store selectors, not through direct coupling
  to the edit dialog.
