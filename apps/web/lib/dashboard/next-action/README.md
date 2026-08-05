# Next Action Engine Foundation

**Feature Slice:** SD-001 — Next Action Engine Foundation  
**Lifecycle:** Repository Implementation  
**Status:** Implemented — preserves insulin Quick Add parity via governed engine

## Purpose

Framework-independent engine foundation for Dashboard next-action selection.
Preserves current insulin Quick Add behavior while enabling future contextual
rules.

**SD-001 does not yet provide clinically or contextually dynamic selection.**
User-visible dynamic behavior begins when a separately approved contextual rule
is implemented in a future slice.

## Decision model

SD-001 separates three concepts — **do not conflate them:**

| Concept                   | Role in SD-001                                                                   |
| ------------------------- | -------------------------------------------------------------------------------- |
| **Contextual rules**      | Registered evaluators; **empty registry** in initial implementation              |
| **Compatibility/default** | Governed insulin Quick Add decision when no rule matches — **not a rule**        |
| **Neutral fallback**      | Safe no-action presentation when default cannot be shown safely — **not a rule** |

```text
Contextual rules → winner?
  yes → decision
  no  → compatibility/default (insulin Quick Add)
        → presentation safe?
          yes → decision
          no  → neutral fallback
```

## Compatibility behavior (current product parity)

| Aspect   | Value                                             |
| -------- | ------------------------------------------------- |
| Action   | Quick Add `insulin`                               |
| Owner    | `requestOpen('next-action', 'insulin')`           |
| UI       | `DashboardNextAction` unchanged                   |
| Disabled | `actionDisabled={quickAddState.isOpen}` unchanged |

## Modules

```text
next-action-types.ts
next-action-context.ts
next-action-rules.ts              # contextual rules only (empty)
next-action-default.ts            # compatibility/default (not a rule)
next-action-fallback.ts           # neutral fallback (not a rule)
next-action-presentation-safety.ts
next-action-engine.ts
next-action-mapper.ts
next-action-priority-map.ts
next-action-availability.ts
next-action-engine.test.mjs
```

Dashboard composition: `apps/web/lib/dashboard/dashboard-next-action-integration.ts`

## Migration from static supply

**Before (removed from DashboardRoot):**

```text
nextStepSource (lib/mocks/timeline.ts)
  → resolveDashboardNextActionDemoStep(localization, source)
  → DashboardNextAction
```

**After:**

```text
createDashboardNextActionEngineInput(events, now)
  → evaluateNextAction() → compatibility/default
  → mapNextActionDecision()
  → resolveNextActionPresentation(localization, mapped)
  → DashboardNextAction
```

`resolveDashboardNextActionDemoStep` was retired; localization resolves engine
keys through `resolveNextActionPresentation`.

## Documentation

Full architecture:
[SD-001 — Next Action Engine Foundation](../../../../../docs/architecture/dashboard/sd-001-next-action-engine-foundation.md)

## Contextual rules

No contextual rules are registered in SD-001. Future rules require separate
approved slices with governed data and policies.
