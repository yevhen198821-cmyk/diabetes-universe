# Next Action Engine Foundation

**Feature Slice:** SD-001 — Next Action Engine Foundation  
**Lifecycle:** Architecture Revision  
**Status:** Not implemented — architecture only

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

## Planned modules

```text
next-action-types.ts
next-action-context.ts
next-action-rules.ts          # contextual rules only
next-action-default.ts        # compatibility/default (not a rule)
next-action-fallback.ts       # neutral fallback (not a rule)
next-action-engine.ts
next-action-mapper.ts
next-action-priority-map.ts
next-action-engine.test.mjs
```

## Documentation

Full architecture:
[SD-001 — Next Action Engine Foundation](../../../../../docs/architecture/dashboard/sd-001-next-action-engine-foundation.md)

## Implementation

No production engine code until Architecture Approval. Contextual rules require
separate approved data and policies in future slices.
