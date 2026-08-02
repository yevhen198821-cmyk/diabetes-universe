# Dashboard States

## Purpose

Define the approved screen-level and block-level state behavior for the
Dashboard.

## Status

Approved

## Responsibility

- Preserve approved block order in loading, empty, error, and ready states.
- Keep block-level failures local to their owning card.
- Keep Quick Add available unless its owner disables entry points during an open
  panel.
- Avoid fabricating health values when data is missing or failed.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Layout UI](../../ui/dashboard/layout.md)
- Block-specific architecture, specification, and UI documents

## Notes

- Each block exposes `loading`, `ready`, and approved `empty` or `error`
  presentations.
- Dashboard demo integration refreshes affected blocks only after successful
  Quick Add saves.
