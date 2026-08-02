# Dashboard Layout

## Purpose

Define the screen-level composition, block order, responsive grid, and spacing
contract for the Dashboard.

## Status

Approved

## Responsibility

- Compose the approved Dashboard blocks in a single vertical reading order.
- Center content within a maximum width of 1152 px.
- Apply the mobile, tablet, and desktop grid rules without duplicating block
  internals.
- Reserve safe-area clearance for the Header, content, and mobile/tablet FAB.
- Keep Quick Add outside the card grid as a viewport-specific entry point.

## Layout Goals

- Next Action is the first and only dominant content card.
- Last Glucose and Day Summary share a row only when space permits.
- Recent Events and AI Insight remain in approved order and desktop spans.
- One document scroll; no nested card scrolling.

## Dependencies

- [Dashboard Layout UI](../../ui/dashboard/layout.md)
- [Dashboard Responsive Architecture](responsive.md)
- [Dashboard States Architecture](states.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)

## Notes

- The UI layout specification is the detailed layout contract.
- `DashboardShell` owns the server-compatible page container and grid placement.
