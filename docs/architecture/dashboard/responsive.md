# Dashboard Responsive Behavior

## Purpose

Define the approved breakpoint behavior for Dashboard layout and Quick Add entry
points.

## Status

Approved

## Responsibility

- Preserve the same block order and meaning across 320 px, tablet, and desktop
  widths.
- Switch Quick Add entry from FAB below 1024 px to Header action at 1024 px and
  wider.
- Apply approved page padding, grid gaps, and column spans at each breakpoint.
- Prevent horizontal page scrolling at supported widths.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Layout UI](../../ui/dashboard/layout.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)

## Notes

- Breakpoints: 640 px and 1024 px.
- Mobile and tablet reserve bottom clearance for the FAB and safe-area insets.
- Desktop does not render a second FAB.
