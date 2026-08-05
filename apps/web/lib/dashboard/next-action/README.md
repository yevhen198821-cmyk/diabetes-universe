# Dynamic Next Action Engine

**Feature Slice:** SD-001  
**Lifecycle:** Architecture Draft  
**Status:** Not implemented — architecture only

## Purpose

Deterministic selection of exactly one Dashboard next action from existing
application data. Framework-independent rule engine consumed by `DashboardRoot`.

## Boundary

| In scope (planned)                          | Out of scope                       |
| ------------------------------------------- | ---------------------------------- |
| `next-action-types.ts` — domain contracts   | React components                   |
| `next-action-context.ts` — adapter types    | Localization resources             |
| `next-action-rules.ts` — rule registry      | Quick Add controller               |
| `next-action-engine.ts` — evaluator         | `packages/ui`, `packages/platform` |
| `next-action-mapper.ts` — structural bridge | Medical inference                  |

## Data flow

```text
Timeline data → createNextActionContext() → evaluateNextAction() → NextActionDecision
      → mapNextActionDecision() → labels layer → DashboardNextAction
```

## Supported rules (initial)

| Rule ID                    | Priority        | Status                               |
| -------------------------- | --------------- | ------------------------------------ |
| `parity-insulin-quick-add` | `recommended`   | Planned — preserves current demo CTA |
| `neutral-fallback`         | `informational` | Planned — always available           |

Unsupported until approved data exists: stale glucose, active reminders, device
attention.

## Documentation

Full architecture: [SD-001 — Dynamic Next Action](../../../../../docs/architecture/dashboard/sd-001-dynamic-next-action.md)

## Implementation

Production files in this directory are **not created** until Architecture
Approval and a subsequent implementation slice. Do not add engine logic during
Architecture Draft.
