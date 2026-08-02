# Dashboard Overview

## Purpose

Describe the approved Dashboard screen composition and the responsibility split
between shell, blocks, and shared Quick Add integration.

## Status

Feature Complete

## Responsibility

- Present one screen with exactly seven approved functional blocks.
- Keep each block independently testable through model, component, and docs.
- Derive Dashboard demo updates from shared event state after successful Quick
  Add saves.
- Preserve Timeline as a separate screen with its own Quick Add host instance.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Header Architecture](header.md)
- [Dashboard Next Action Architecture](next-action.md)
- [Dashboard Last Glucose Architecture](last-glucose.md)
- [Dashboard Day Summary Architecture](day-summary.md)
- [Dashboard Recent Events Architecture](recent-events.md)
- [Dashboard AI Insight Architecture](ai-insight.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)

## Notes

- `DashboardRoot` is the client composition point for `/dashboard`.
- `DashboardShell` remains server-compatible and receives composed block nodes.
