# Dashboard Overview

## Purpose

Describe the approved Dashboard screen composition and the responsibility split
between shell, blocks, and shared Quick Add integration.

## Status

Feature Complete

## Responsibility

- Serve as the home screen at `/`.
- Present one screen with exactly seven approved functional blocks.
- Keep each block independently testable through model, component, and docs.
- Derive Dashboard demo updates from shared event state after successful Quick
  Add saves.
- Read Timeline events from the app-level Timeline store instead of owning a
  local event copy.
- Link to Timeline at `/timeline` for the full event journal.
- Preserve Timeline as a separate screen with its own Quick Add host instance.

Dashboard aggregates current state. It is not the event journal.

## Dependencies

- [Navigation Overview](../navigation/overview.md)
- [Timeline Overview](../timeline/overview.md)
- [Timeline Shared State](../timeline/shared-state.md)
- [Dashboard Layout Architecture](layout.md)
- [Dashboard Header Architecture](header.md)
- [Dashboard Next Action Architecture](next-action.md)
- [Dashboard Last Glucose Architecture](last-glucose.md)
- [Dashboard Day Summary Architecture](day-summary.md)
- [Dashboard Recent Events Architecture](recent-events.md)
- [Dashboard AI Insight Architecture](ai-insight.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)

## Notes

- `DashboardRoot` is the client composition point for `/`.
- `/dashboard` redirects to `/` for backward compatibility.
- `DashboardShell` remains server-compatible and receives composed block nodes.
- **Все события** in Recent Events navigates to `/timeline`.
- Timeline does not render Dashboard blocks (Next Action, Last Glucose, Day
  Summary).
- Last Glucose, Day Summary, and Recent Events are derived from the shared
  Timeline store.
- Day Summary counts only events in the user's local current calendar day.
