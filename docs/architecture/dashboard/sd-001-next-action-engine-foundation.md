# SD-001 — Next Action Engine Foundation

_Subtitle: architecture for future context-aware Dashboard next-action selection.
SD-001 does not yet deliver clinically or contextually dynamic product behavior._

## Purpose

Establish the deterministic **Next Action Engine Foundation** for the existing
Dashboard while preserving the current insulin Quick Add behavior.

SD-001 defines framework-independent architecture — evaluation pipeline, contracts,
priority mapping, compatibility default, and neutral fallback — so that future
**contextual rules** can be added without redesigning the Dashboard or Next Action
UI.

This Feature Slice is an **engine-foundation slice**, not a product-behavior slice
that changes what the user sees today beyond structural migration from static
mock supply to governed engine output.

Production engine implementation is complete in
`apps/web/lib/dashboard/next-action/`. Contextual rules remain deferred to future
slices.

## Status

Architecture Approved — Feature Slice Complete

## Lifecycle

| Stage                     | Status     |
| ------------------------- | ---------- |
| Architecture Draft        | Superseded |
| Architecture Revision     | Complete   |
| Architecture Approved     | Complete   |
| Repository Implementation | Complete   |
| Engineering Review        | Complete   |
| Final Review              | Complete   |
| Feature Slice Complete    | Complete   |

## Scope Clarification

### What SD-001 delivers

| Delivered by SD-001                                  | Not delivered by SD-001                        |
| ---------------------------------------------------- | ---------------------------------------------- |
| Engine architecture and contracts                    | Clinically dynamic selection                   |
| Deterministic evaluation pipeline                    | Context-aware ranking from live data           |
| Compatibility/default insulin Quick Add decision     | New medical thresholds                         |
| Neutral fallback when default cannot be shown safely | Reminder or device rules                       |
| Priority mapping to existing `NextStepPriority`      | User-visible behavior change (parity required) |
| Migration path from static `nextStepSource`          | Contextual rules in initial implementation     |

### What is dynamic in SD-001?

**Nothing in user-visible product behavior is dynamic in SD-001.**

SD-001 is dynamic only in the sense that it replaces ad-hoc static mock wiring
with a **governed, extensible engine**. The user still sees the same insulin
Quick Add CTA under normal conditions.

User-visible dynamic behavior begins only when at least one **contextual rule**
is separately approved, implemented, and backed by approved data and policies in
a future slice.

### Future contextual rule slices

Contextual rules are documented candidates — not part of SD-001 implementation:

| Candidate rule                      | Blocked until                               |
| ----------------------------------- | ------------------------------------------- |
| Stale/missing glucose prompt        | Approved staleness policy and configuration |
| Active reminder CTA                 | `Reminder` domain model Feature Complete    |
| Device attention                    | Device status architecture approved         |
| Additional ranked Quick Add prompts | Product approval per category               |

Each future rule requires its own governed slice; SD-001 only provides the
engine into which approved rules register.

## Product Goal

Preserve the approved Feature Complete Dashboard and Next Action UI while
introducing engine infrastructure that:

1. outputs exactly one decision per evaluation;
2. preserves current insulin Quick Add CTA via compatibility/default decision;
3. enables future contextual rules without UI or Foundation changes.

The user must continue to understand what action is available. SD-001 does not
yet optimize for "what is most important now" from live clinical context.

## Architectural Boundary

### Location

```text
apps/web/lib/dashboard/next-action/
├── README.md                      # module boundary
├── next-action-types.ts           # domain contracts
├── next-action-context.ts         # context adapter
├── next-action-rules.ts           # contextual rule registry only (empty)
├── next-action-default.ts         # compatibility/default decision (not a rule)
├── next-action-fallback.ts        # neutral fallback (not a rule)
├── next-action-presentation-safety.ts
├── next-action-engine.ts          # evaluation pipeline
├── next-action-mapper.ts          # decision → presentation bridge
├── next-action-priority-map.ts    # engine → NextStepPriority mapping
├── next-action-availability.ts
└── next-action-engine.test.mjs    # unit tests
```

Structure may be consolidated if a simpler shape is repository-consistent. Do not
add abstraction without clear responsibility.

### Must not contain engine logic

- React components (`apps/web/components/dashboard/`);
- `packages/ui`, `packages/platform`, `packages/platform-web`;
- localization resource files;
- Quick Add controller code.

The engine must be framework-independent: no React, browser APIs, routing, or
presentation dependencies.

## Decision Model

SD-001 separates three concepts. **Do not model compatibility/default or neutral
fallback as ordinary registered contextual rules.**

### 1. Contextual rules

Registered rules that evaluate `NextActionContext` and return a decision when
applicable.

- participate in priority and tie-break resolution;
- require approved data and policies before registration;
- **initial SD-001 implementation: zero contextual rules** (empty registry).

```typescript
type NextActionRulePayload = Readonly<{
  action: NextActionIntent;
  messageKey: string;
  descriptionKey?: string;
}>;

type NextActionRule = Readonly<{
  ruleId: NextActionRuleId;
  priority: NextActionPriority;
  tieBreakRank: number;
  evaluate: (context: NextActionContext) => NextActionRulePayload | null;
}>;
```

`NextActionRule` is the sole owner of ranking priority. Rule evaluation returns
an applicable payload without `priority`, `source`, or `ruleId`. The engine
constructs the final contextual `NextActionDecision` from rule metadata plus
payload — priority cannot drift between rule and decision.

### 2. Compatibility/default decision

A **governed constant decision** — not evaluated as a contextual rule.

- applied when no contextual rule matches;
- preserves current product behavior: insulin Quick Add CTA;
- does not inspect glucose, reminders, devices, or staleness;
- **must not be called a dynamic rule.**

```typescript
type NextActionDefaultDecision = Readonly<{
  kind: 'compatibility-default';
  priority: NextActionPriority; // 'recommended'
  messageKey: string; // existing dashboard.nextAction.* keys
  descriptionKey?: string;
  action: Readonly<{ kind: 'quick-add'; category: 'insulin' }>;
}>;
```

### 3. Neutral fallback

A **governed safe decision** — not in the contextual rule registry.

- used only when the compatibility/default decision **cannot be presented safely**;
- informational priority; no medical claim; no required action;
- must not claim the user is medically safe or that "everything is good."

```typescript
type NextActionNeutralFallback = Readonly<{
  kind: 'neutral-fallback';
  priority: NextActionPriority; // 'informational'
  messageKey: string;
  descriptionKey?: string;
  action: Readonly<{ kind: 'none' }>;
}>;
```

## Evaluation Pipeline

```text
createNextActionContext()
        ↓
Evaluate contextual rules → collect matches
        ↓
Deterministic winner resolution (priority → tieBreakRank → ruleId)
        ↓
If winner exists → NextActionDecision (from contextual rule)
        ↓
If no winner → compatibility/default decision
        ↓
Presentation safety check (localization, Quick Add availability)
        ↓
If default cannot be presented safely → neutral fallback
        ↓
Exactly one NextActionDecision
```

**When no contextual rule matches:** use compatibility/default — **not** neutral
fallback.

**When neutral fallback occurs:** only when default presentation is unsafe (see
Failure Behavior).

## Compatibility Behavior

SD-001 preserves current Dashboard Next Action behavior via compatibility/default
decision — not via a contextual rule.

| Aspect             | Preserved behavior                                                    |
| ------------------ | --------------------------------------------------------------------- |
| Action intent      | Quick Add `insulin` (`QuickAddCategory = 'insulin'`)                  |
| Owner wiring       | `requestOpen('next-action', 'insulin')`                               |
| Action disabled    | `actionDisabled={quickAddState.isOpen}` unchanged                     |
| Focus return       | `nextActionRef` + `lastOpenTrigger === 'next-action'` unchanged       |
| UI component       | `DashboardNextAction` contract unchanged                              |
| Localized copy     | Existing `dashboard.nextAction.title`, `.description`, `.action` keys |
| Visual composition | Approved full-width card position unchanged                           |

Previous static supply (replaced at composition layer only):

```text
apps/web/lib/mocks/timeline.ts → nextStepSource
        ↓
dashboard-root.tsx → resolveDashboardNextActionDemoStep(localization, nextStepSource)
        ↓
<DashboardNextAction state="ready" action={…} onAction={…} />
```

Implemented supply:

```text
createNextActionContext() → evaluateNextAction() → compatibility/default (no contextual rules)
        ↓
map + typed localization resolver → equivalent NextStep + onAction
        ↓
<DashboardNextAction … />  (unchanged)
```

## Existing Data Reuse

| Type               | Source                     | SD-001 use                                             |
| ------------------ | -------------------------- | ------------------------------------------------------ |
| `TimelineEvent`    | `@diabetes-universe/types` | Context adapter input (future contextual rules)        |
| `LastGlucose`      | `@diabetes-universe/types` | Context adapter input (unsupported by rules in SD-001) |
| `QuickAddCategory` | `@diabetes-universe/types` | Default and future rule actions                        |
| `NextStep`         | `@diabetes-universe/types` | Mapper output                                          |
| `NextStepPriority` | `@diabetes-universe/types` | `'high' \| 'normal'` — presentation mapping target     |
| Timeline selectors | `timeline-selectors.ts`    | Adapter helpers                                        |

### Not reused (no contextual rules in SD-001)

| Concept                        | Reason                     |
| ------------------------------ | -------------------------- |
| Reminder entities              | No model; mock counts only |
| Device status                  | No model                   |
| Glucose thresholds / staleness | No approved policy         |

## Contracts

### Engine priority

```typescript
type NextActionPriority =
  'critical' | 'important' | 'recommended' | 'informational';
```

### Priority mapping (exhaustive)

Engine priority maps to existing `NextStepPriority` for presentation metadata.
Mapping is **total** — every engine priority must map; implementation must use
an exhaustive switch so silent drops are impossible.

| `NextActionPriority` | `NextStepPriority` | Rationale                                                  |
| -------------------- | ------------------ | ---------------------------------------------------------- |
| `critical`           | `high`             | Highest presentation urgency                               |
| `important`          | `high`             | Elevated urgency, below critical in engine resolution only |
| `recommended`        | `normal`           | Standard CTA — compatibility/default uses this row         |
| `informational`      | `normal`           | Low urgency; neutral fallback uses this row                |

```typescript
function mapEnginePriorityToNextStepPriority(
  priority: NextActionPriority,
): NextStepPriority {
  switch (priority) {
    case 'critical':
    case 'important':
      return 'high';
    case 'recommended':
    case 'informational':
      return 'normal';
    default: {
      const exhaustive: never = priority;
      throw new Error(`Unhandled NextActionPriority: ${String(exhaustive)}`);
    }
  }
}
```

Future UI that distinguishes four engine levels may extend presentation without
changing engine resolution order.

### Context

```typescript
type NextActionContext = Readonly<{
  now: Date;
  latestGlucose?: Readonly<{ dateTime: string; value: string }>;
  recentTimelineEvents: readonly TimelineEvent[];
  quickAddAvailability: Readonly<{
    availableCategories: readonly QuickAddCategory[];
  }>;
}>;
```

`quickAddAvailability` enables presentation safety checks without medical inference.

### Decision (unified output)

```typescript
type NextActionDecision = Readonly<{
  source: 'contextual-rule' | 'compatibility-default' | 'neutral-fallback';
  ruleId?: NextActionRuleId;
  priority: NextActionPriority;
  messageKey: string;
  descriptionKey?: string;
  action:
    | Readonly<{ kind: 'quick-add'; category: QuickAddCategory }>
    | Readonly<{ kind: 'navigate'; destination: '/timeline' }>
    | Readonly<{ kind: 'none' }>;
}>;
```

No localized strings in engine or mapper structural output.

## Priority Resolution (contextual rules only)

When one or more contextual rules match:

```text
critical → important → recommended → informational
```

Within same priority: lowest `tieBreakRank` → lexicographic `ruleId`.

**SD-001 initial implementation:** contextual rule registry is empty; this stage
is never reached until a future slice adds rules.

## Failure Behavior

| Condition                              | Behavior                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| No applicable contextual rule          | **Compatibility/default decision** (insulin Quick Add)                        |
| Default Quick Add category unavailable | **Neutral fallback** — no broken CTA                                          |
| Missing localization key (development) | Fail fast with diagnostic per repository conventions                          |
| Missing localization key (production)  | Production-safe approved fallback copy; **never render raw key strings**      |
| Action mapping failure                 | Neutral fallback or `empty` presentation state per owner policy               |
| Partial / empty context                | Contextual rules evaluate safely; default still applies when no match         |
| Malformed data at adapter              | Normalize or reject; default if adapter completes; fallback if default unsafe |
| Multiple contextual matches            | Priority + tie-break → one winner                                             |

### When neutral fallback actually occurs

Neutral fallback is **rare** in SD-001. It applies only when compatibility/default
cannot be presented safely:

1. `insulin` not in `quickAddAvailability.availableCategories`;
2. localization resolution for default keys fails in production mapping layer;
3. presentation mapper determines insulin CTA cannot be shown without misleading
   the user.

Neutral fallback does **not** run merely because no contextual rule matched.

### Engine throwing

- Normal incomplete data: **no throw** — pipeline reaches default or fallback.
- Invalid rule registry, unmapped priority, programming errors: **fail fast** in
  development per repository standards.

## Localization Integration

| Layer                             | Responsibility                       |
| --------------------------------- | ------------------------------------ |
| Engine / default / fallback       | `messageKey`, `descriptionKey` only  |
| Mapper                            | Structural intent + priority mapping |
| `dashboard-next-action-labels.ts` | `LocalizationPlatform.translate()`   |
| Locale files                      | `packages/locales`                   |

Default uses existing keys: `dashboard.nextAction.title`, `.description`, `.action`.
Fallback requires new keys in implementation stage — never embedded in engine.

Missing key policy:

- **Development:** throw or assert with key name in diagnostic message.
- **Production:** use approved safe fallback strings; log missing key; never
  display `dashboard.nextAction.*` raw key to user.

## Quick Add Integration

| Decision source          | Action                                       | Owner behavior                                           |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------- |
| Compatibility/default    | `{ kind: 'quick-add', category: 'insulin' }` | `requestOpen('next-action', 'insulin')`                  |
| Contextual rule (future) | per rule                                     | `requestOpen('next-action', category)`                   |
| Neutral fallback         | `{ kind: 'none' }`                           | No CTA — `empty` state or disabled ready per UX approval |

Unavailable category: mapper or owner must not render a broken button; route to
neutral fallback or `empty` state.

## Component and Domain Boundaries

```text
DashboardRoot (composition)
  → createNextActionContext()
  → evaluateNextAction()          # lib/dashboard/next-action/
  → mapNextActionDecision()
  → resolveNextActionReadyStep() / resolveNextActionInformationalContent()
  → DashboardNextAction (unchanged)
```

Rule logic must not enter UI components.

## Data Flow

```text
Timeline store + Quick Add availability
        ↓
createNextActionContext()
        ↓
evaluateContextualRules(context)     → 0 matches in SD-001
        ↓
resolveCompatibilityDefault()        → insulin Quick Add decision
        ↓
assertPresentationSafety(decision)   → fallback if unsafe
        ↓
NextActionDecision
        ↓
mapEnginePriorityToNextStepPriority()
        ↓
typed Dashboard localization resolver → NextStep or informational content
        ↓
DashboardNextAction
```

## Medical Safety

No treatment advice, diagnosis, dose calculation, prediction, new thresholds, or
color-only safety signals. Contextual rules blocked without approved policy.
Compatibility/default is a product parity constant — not a clinical recommendation.

## Test Strategy

| Area                           | Coverage                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| Empty contextual registry      | Default decision returned                                     |
| Default decision content       | Insulin quick-add intent, correct keys                        |
| Neutral fallback trigger       | Unavailable insulin category; failed localization (prod path) |
| Priority mapping               | All four engine priorities → `NextStepPriority`               |
| Exhaustive mapping             | Unknown priority throws                                       |
| No contextual match ≠ fallback | Default returned, not fallback                                |
| Determinism                    | Fixed `now`, identical output                                 |
| No localized strings in engine | Keys only                                                     |
| Immutability                   | Context not mutated                                           |
| No React/browser               | Pure Node tests                                               |

## Migration Path

| Phase                 | Work                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| SD-001 implementation | Engine + default + fallback; empty contextual registry; parity with static demo — **complete**         |
| SD-001 validation     | E2E and unit tests confirm identical user-visible insulin CTA                                          |
| Future slice N        | Register first contextual rule when approved data exists                                               |
| Retirement            | `nextStepSource` and `resolveDashboardNextActionDemoStep` removed from Dashboard supply — **complete** |

## Foundation Changes Required

**No.**

## Shared Package Extraction

**Not justified** in SD-001. Revisit when a second surface requires the same engine.

## Architecture Questions

| #   | Question                                                       | Answer                                                                                                                                            |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Is SD-001 a product-behavior slice or engine-foundation slice? | **Engine-foundation slice.** Preserves current behavior; enables future rules.                                                                    |
| 2   | What exactly is dynamic in SD-001?                             | **Nothing user-visible.** Architecture is extensible; behavior is parity/default.                                                                 |
| 3   | Which decisions are rules, defaults, and fallbacks?            | **Rules:** contextual only (none in SD-001). **Default:** compatibility insulin CTA. **Fallback:** neutral safe presentation when default unsafe. |
| 4   | When can neutral fallback occur?                               | Only when default cannot be presented safely — not on "no rule match."                                                                            |
| 5   | How are four engine priorities mapped to UI priority?          | `critical`/`important` → `high`; `recommended`/`informational` → `normal`; exhaustive mapping required.                                           |
| 6   | What if localization or action mapping fails?                  | Dev: fail-fast diagnostic. Prod: safe fallback copy, no raw keys; unavailable category → neutral fallback or empty.                               |
| 7   | What future evidence justifies the first contextual rule?      | Approved staleness policy + config; or Reminder FC; or device status architecture — each in separate slice.                                       |

## Risks

| Risk                        | Mitigation                                                    |
| --------------------------- | ------------------------------------------------------------- |
| Misleading "dynamic" scope  | Title revised; explicit non-dynamic behavior statement        |
| Default modeled as rule     | Separate `compatibility-default` module, not in rule registry |
| Fallback on every no-match  | Pipeline mandates default before fallback                     |
| False-safe fallback wording | Neutral keys reviewed; no "all good" semantics                |
| Priority mapping gaps       | Exhaustive switch with `never`                                |
| Raw keys in UI              | Prod localization policy                                      |
| Broken CTA                  | Availability check before rendering                           |
| Accidental medical rules    | Empty contextual registry in SD-001                           |

## Dependencies

- [Dashboard Next Action Architecture](next-action.md)
- [Dashboard Next Action Specification](../../specs/dashboard/next-action.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)
- `@diabetes-universe/types`
- `apps/web/lib/timeline/timeline-selectors.ts`

## Notes

- Dashboard Next Action component remains Feature Complete.
- SD-001 identifier retained; title revised to **Next Action Engine Foundation**.
- Implementation PRs follow Architecture Approval per document `01`.
