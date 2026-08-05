# SD-001 — Dynamic Next Action

## Purpose

Design the architecture for deterministic Dynamic Next Action selection on the
existing Dashboard.

When the Dashboard opens, the system must determine and present exactly one most
relevant next action using existing application data and deterministic rules. The
user must understand what is most important now, why it matters, and what action
is available — without AI, prediction, or new medical logic.

This Feature Slice defines architecture only. Production engine implementation
is a subsequent lifecycle stage.

## Status

Architecture Draft — Ready for Architecture Audit

## Lifecycle

| Stage                     | Status        |
| ------------------------- | ------------- |
| Architecture Draft        | **Current**   |
| Architecture Approved     | Pending audit |
| Repository Implementation | Not started   |
| Feature Complete          | Not started   |

## Scope

### Included

- pure deterministic rule evaluation;
- one selected result per evaluation;
- governed priority resolution;
- safe neutral fallback result;
- mapping to the existing Dashboard Next Action UI contract;
- localization-ready content identifiers (message keys);
- accessibility-compatible presentation data;
- unit-testable, framework-independent engine architecture.

### Excluded

- AI or machine learning;
- prediction, diagnosis, or treatment recommendations;
- new database tables, APIs, or medical thresholds;
- new device integrations;
- Dashboard redesign;
- notification or automation implementation;
- extraction into a new shared package;
- production code in this Architecture Draft stage.

## Product Goal

Preserve the approved Feature Complete Dashboard and Next Action UI while
replacing the static demo `nextStepSource` with a deterministic engine that
selects one next action from existing data.

## Architectural Boundary

### Location

```text
apps/web/lib/dashboard/next-action/
├── README.md                      # module boundary (this slice)
├── next-action-types.ts           # planned — domain contracts
├── next-action-context.ts         # planned — context adapter types
├── next-action-rules.ts           # planned — rule registry
├── next-action-engine.ts          # planned — deterministic evaluator
├── next-action-mapper.ts          # planned — decision → presentation bridge
└── next-action-engine.test.mjs    # planned — unit tests
```

Files marked **planned** are not implemented in the Architecture Draft. Structure
may be adjusted if a simpler shape proves more consistent with repository
conventions. Do not add abstraction layers without clear responsibility.

### Must not contain engine logic

- React components (`apps/web/components/dashboard/`);
- `packages/ui`;
- `packages/platform`;
- `packages/platform-web`;
- localization resource files;
- Quick Add controller code.

The engine must be framework-independent: no React, browser APIs, routing, or
presentation dependencies.

## Existing Data Reuse

| Type / source                 | Package / location                            | Reuse in SD-001                                                  |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `TimelineEvent`               | `@diabetes-universe/types`                    | `recentTimelineEvents` in context                                |
| `LastGlucose`                 | `@diabetes-universe/types`                    | Optional `latestGlucose` via adapter                             |
| `QuickAddCategory`            | `@diabetes-universe/types`                    | Quick-add action intent                                          |
| `NextStep`                    | `@diabetes-universe/types`                    | Presentation mapper output (localized)                           |
| `NextStepSource`              | `@diabetes-universe/types`                    | Reference for migration parity; may extend                       |
| `NextStepActionType`          | `@diabetes-universe/types`                    | Currently `'insulin'` only — extend when rules add types         |
| `NextStepPriority`            | `@diabetes-universe/types`                    | UI legacy (`high` \| `normal`); engine uses richer priority enum |
| `DashboardDerivedLastGlucose` | `dashboard-quick-add-integration-model.ts`    | Adapter input for latest glucose                                 |
| `DashboardDerivedDaySummary`  | same                                          | Reminder counts only (mock today — not rule input)               |
| Timeline selectors            | `apps/web/lib/timeline/timeline-selectors.ts` | `getLatestGlucoseEvent`, `getRecentTimelineEvents`, etc.         |

### Not reused (unsupported in SD-001)

| Concept                       | Reason                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `ExistingReminderData` entity | No reminder model exists; only mock `remindersCompleted` / `remindersTotal` counts |
| `ExistingDeviceStatus`        | No device status type; only `TimelineEventSource = 'device'` on events             |
| Glucose thresholds            | No approved threshold configuration in repository                                  |
| Staleness rules               | No approved staleness definition for glucose or events                             |

Do not duplicate shared types. Extend `@diabetes-universe/types` only when an
approved implementation stage requires shared contracts beyond the web app.

## Supported Initial Rules

Rules assessed for first implementation. Unsupported rules are documented for
future slices — not fabricated in SD-001.

| Rule ID                    | Priority        | Supportable now | Rationale                                                                                                                                                                                            |
| -------------------------- | --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parity-insulin-quick-add` | `recommended`   | **Yes**         | Preserves current demo: structural insulin Quick Add CTA when engine has no higher-priority match. Uses existing `QuickAddCategory = 'insulin'` and `requestOpen('next-action', 'insulin')` pattern. |
| `neutral-fallback`         | `informational` | **Yes**         | Always-available safe fallback when no other rule matches or context is incomplete.                                                                                                                  |
| `missing-stale-glucose`    | —               | **No**          | No approved staleness threshold or time-since-last-reading rule exists.                                                                                                                              |
| `active-reminder`          | —               | **No**          | No `Reminder` entity or active-reminder signal; day-summary counts are demo mocks only.                                                                                                              |
| `device-attention`         | —               | **No**          | No device status model.                                                                                                                                                                              |

### Future rules (documented, not implemented)

- glucose logging prompt when approved staleness policy exists;
- reminder CTA when reminder domain model is Feature Complete;
- device sync attention when device status architecture is approved;
- additional Quick Add categories when product approves ranked prompts.

## Component and Domain Boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│ DashboardRoot (owner / composition)                          │
│  - builds NextActionContext via adapter                      │
│  - calls evaluateNextAction(context)                         │
│  - maps decision → NextStep + onAction via mapper + labels   │
│  - owns Quick Add requestOpen('next-action', category)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ apps/web/lib/dashboard/next-action/  (domain — no React)     │
│  context adapter │ rules │ engine │ mapper (structural only) │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ DashboardNextAction component (presentation — unchanged)     │
│  - receives state, NextStep, onAction, actionDisabled        │
│  - createDashboardNextActionViewModel (unchanged)            │
└─────────────────────────────────────────────────────────────┘
```

**Rule logic must not enter UI components.** Components continue to receive
owner-supplied props only. `DashboardNextAction` does not import the engine.

## Data Flow

```text
Timeline store events
        +
Dashboard derivation options (referenceTime, timeZone, formatters)
        ↓
createNextActionContext()          ← adapter (apps/web/lib/dashboard/next-action/)
        ↓
NextActionContext                  ← immutable, normalized, no localization
        ↓
NEXT_ACTION_RULES[]                ← registered rules with stable tieBreakRank
        ↓
evaluateNextAction(context)        ← deterministic: priority → tieBreak → ruleId
        ↓
NextActionDecision                 ← messageKey, action intent, no user strings
        ↓
mapNextActionDecision(...)         ← structural mapping + label key resolution
        ↓
resolveNextActionPresentation()    ← localization in labels layer (existing pattern)
        ↓
NextStep + onAction wiring         ← DashboardRoot
        ↓
<DashboardNextAction state="ready" … />
```

## Contracts

Architecture-level contracts for implementation. Equivalent shapes are acceptable
if simpler and repository-consistent.

### Priority

```typescript
type NextActionPriority =
  'critical' | 'important' | 'recommended' | 'informational';
```

Maps to presentation urgency without implying medical severity unless an
approved rule explicitly carries a governed clinical meaning (none in SD-001
initial set).

### Context

```typescript
type NextActionContext = Readonly<{
  now: Date;
  latestGlucose?: Readonly<{
    dateTime: string;
    value: string;
  }>;
  recentTimelineEvents: readonly TimelineEvent[];
  // activeReminders: unsupported — omitted until reminder model exists
  // deviceStatuses: unsupported — omitted until device model exists
}>;
```

Built by `createNextActionContext()` from timeline store + derivation helpers.
Single `now` value ensures deterministic tests. No medical inference in adapter.

### Decision

```typescript
type NextActionDecision = Readonly<{
  ruleId: NextActionRuleId;
  priority: NextActionPriority;
  messageKey: string;
  descriptionKey?: string;
  action:
    | Readonly<{ kind: 'quick-add'; category: QuickAddCategory }>
    | Readonly<{ kind: 'navigate'; destination: '/timeline' }>
    | Readonly<{ kind: 'none' }>;
}>;
```

No localized strings in engine output. Keys follow `dashboard.nextAction.*`
namespace or governed SD-001 extensions.

### Rule

```typescript
type NextActionRule = Readonly<{
  ruleId: NextActionRuleId;
  priority: NextActionPriority;
  tieBreakRank: number;
  evaluate: (context: NextActionContext) => NextActionDecision | null;
}>;
```

Each rule returns `null` when not applicable. Engine collects matches, resolves
priority, applies tie-break.

## Priority Resolution

Priority order (highest wins):

```text
critical → important → recommended → informational
```

Within the same priority:

1. lowest `tieBreakRank` wins (explicit, stable);
2. if still tied, lexicographic `ruleId` ordering;
3. never rely on array insertion order alone.

Exactly one `NextActionDecision` is returned per evaluation.

## Medical Safety

SD-001 must not invent clinical logic.

| Requirement                  | Enforcement                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| No treatment advice          | Rules emit action intents only; no dose or therapy copy          |
| No diagnosis                 | No rule interprets glucose as hypo/hyper without approved policy |
| No insulin dose calculation  | Quick-add opens form; engine does not compute doses              |
| No predictive claims         | Deterministic rules on existing data only                        |
| No color/icon safety signals | Decision carries keys; presentation uses existing a11y patterns  |
| No new glucose thresholds    | Staleness rule blocked until approved configuration exists       |

If approved configuration does not provide safe rule input, the rule remains
unsupported.

## Fallback Behavior

The engine **always** returns one valid decision.

Fallback rule: `neutral-fallback`

| Property           | Value                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Priority           | `informational`                                                                                        |
| Medical claim      | None                                                                                                   |
| Required action    | `kind: 'none'` or informational quick-add per product approval                                         |
| Copy               | Localization keys only — e.g. `dashboard.nextAction.fallback.title` (new keys in implementation stage) |
| Wording constraint | Must not claim user is medically safe or that "everything is good"                                     |

Neutral meaning: no next action is currently available; continue recording
relevant events. Final wording belongs to localization resources.

### State and failure handling

| Condition                 | Behavior                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| Complete context          | Normal rule evaluation                                             |
| Partial context           | Missing optional fields treated as absent; rules evaluate safely   |
| No context data           | Fallback only                                                      |
| Malformed data            | Rejected at adapter boundary; fallback if adapter cannot normalize |
| No rule matches           | Fallback                                                           |
| Multiple matches          | Priority + tie-break resolution                                    |
| Action target unavailable | Owner disables CTA; engine decision unchanged                      |
| Missing localization key  | Labels layer uses existing error/fallback patterns                 |

Engine must not throw on incomplete data during normal operation. Programming
errors (invalid rule registry) may fail fast in development per repository
standards.

## Localization Integration

| Layer                             | Responsibility                                              |
| --------------------------------- | ----------------------------------------------------------- |
| Engine                            | `messageKey`, `descriptionKey` only                         |
| Mapper                            | Maps keys to structural presentation intent                 |
| `dashboard-next-action-labels.ts` | Resolves keys via `LocalizationPlatform` (existing pattern) |
| Locale files                      | `packages/locales` — new keys added in implementation stage |

Existing keys (`dashboard.nextAction.title`, `.description`, `.action`) serve
parity-insulin rule. Fallback requires new keys — not embedded in engine.

`resolveDashboardNextActionDemoStep` is replaced by governed mapper functions;
demo mapper remains until migration completes for backward comparison.

## Quick Add Integration

| Decision action                                  | Owner behavior                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| `{ kind: 'quick-add', category: 'insulin' }`     | `requestOpen('next-action', 'insulin')` — existing pattern                 |
| `{ kind: 'quick-add', category: <other> }`       | `requestOpen('next-action', category)` when product approves               |
| `{ kind: 'navigate', destination: '/timeline' }` | Router navigation — future rule                                            |
| `{ kind: 'none' }`                               | Ready state with disabled action or empty-state transition per UX approval |

`actionDisabled={quickAddState.isOpen}` unchanged. Focus return via
`nextActionRef` and `lastOpenTrigger === 'next-action'` unchanged.

## Migration Path

### Current static supply

```text
apps/web/lib/mocks/timeline.ts → nextStepSource
        ↓
dashboard-root.tsx → resolveDashboardNextActionDemoStep(localization, nextStepSource)
        ↓
<DashboardNextAction state="ready" action={localizedNextStep} onAction={…} />
```

### Target supply

```text
timeline store + derivation → createNextActionContext()
        ↓
evaluateNextAction(context)
        ↓
mapNextActionDecision(decision) → structural keys
        ↓
resolveNextActionPresentation(localization, structural) → NextStep
        ↓
<DashboardNextAction … />  (unchanged component contract)
```

### Behavior preservation

With default/demo timeline data, `parity-insulin-quick-add` must produce
equivalent user-visible behavior to today's insulin demo CTA until product
approves additional rules.

### Phased rollout

1. Implement engine + tests behind adapter; feature-flag optional.
2. Wire `DashboardRoot` to engine; remove direct `nextStepSource` import.
3. Add rules only when backed by approved data and policies.
4. Retire `resolveDashboardNextActionDemoStep` when parity verified.

## Test Strategy

Unit tests in `next-action-engine.test.mjs` (Node test runner, existing app
pattern).

| Area                 | Coverage                                             |
| -------------------- | ---------------------------------------------------- |
| Each supported rule  | Applicable and non-applicable contexts               |
| Priority levels      | `recommended`, `informational` in initial set        |
| Tie-breaking         | Same priority, different `tieBreakRank` and `ruleId` |
| One-result guarantee | Always exactly one decision                          |
| Determinism          | Identical context + `now` → identical output         |
| Fallback             | Empty context, no matches, partial data              |
| Immutability         | Context not mutated by evaluation                    |
| No localized copy    | Assert keys only in engine output                    |
| Action intent        | quick-add category, none                             |
| No React/browser     | Pure Node imports                                    |

Use fixed `now` in all tests. Never call `new Date()` without injection.

## Foundation Changes Required

**No.**

SD-001 is contained within `apps/web`. Existing `@diabetes-universe/types`
contracts are sufficient for initial rules. No platform, UI package, or CI
changes required for Architecture Draft.

## Shared Package Extraction

Extraction to `packages/*` is **not justified** in SD-001.

Justify later only if:

- a second surface (e.g. Timeline, mobile) requires identical rule evaluation;
- rule count and test surface justify shared ownership;
- platform team approves extraction per document `02` governance.

Until then, keep engine in `apps/web/lib/dashboard/next-action/`.

## Risks

| Risk                         | Mitigation                                                             |
| ---------------------------- | ---------------------------------------------------------------------- |
| Accidental medical advice    | Rules limited to action intents; copy in locales only; audit checklist |
| Hard-coded thresholds        | Staleness rule blocked; no thresholds in SD-001                        |
| False-safe fallback          | Neutral fallback keys reviewed; prohibit "all good" semantics          |
| Rule conflicts               | Explicit priority + tieBreakRank + ruleId ordering                     |
| Non-determinism              | Single `now`; no randomness; fixed test clocks                         |
| Duplicated domain types      | Reuse `@diabetes-universe/types`; extend minimally                     |
| Coupling to Dashboard UI     | Engine in `lib/`; components unchanged                                 |
| Premature package extraction | Defer per above                                                        |
| Hidden time-zone assumptions | Adapter documents `timeZone`; rules use context `now` only             |
| Localization leakage         | Engine outputs keys only; labels layer translates                      |
| Excessive rule growth        | Governance: new rules require architecture approval                    |

## Dependencies

- [Dashboard Next Action Architecture](next-action.md) — Feature Complete UI boundary
- [Dashboard Next Action Specification](../../specs/dashboard/next-action.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)
- [Dashboard Overview](overview.md)
- [I18N-02B1 Next Action Migration](../localization/dashboard-next-action-migration.md)
- `@diabetes-universe/types` — `TimelineEvent`, `NextStep`, `QuickAddCategory`
- `apps/web/lib/timeline/timeline-selectors.ts`
- `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`

## Architecture Decisions Summary

| #   | Question                                    | Answer                                                                                             |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Which existing data types are reused?       | `TimelineEvent`, `LastGlucose`, `QuickAddCategory`, `NextStep`; derivation types for adapter input |
| 2   | Which initial rules are supportable now?    | `parity-insulin-quick-add`, `neutral-fallback` only                                                |
| 3   | Where is static Next Action supplied today? | `lib/mocks/timeline.ts` → `dashboard-root.tsx` → `resolveDashboardNextActionDemoStep`              |
| 4   | How will migration preserve behavior?       | Parity rule + unchanged component contract + same Quick Add wiring                                 |
| 5   | How are localization keys resolved?         | Engine emits keys; `dashboard-next-action-labels.ts` translates                                    |
| 6   | How does CTA integrate with Quick Add?      | `requestOpen('next-action', category)` from owner based on `action.kind`                           |
| 7   | What prevents rule logic in UI?             | Engine in `lib/dashboard/next-action/`; components receive props only                              |
| 8   | When justify shared package?                | Second consumer + governance approval — not in SD-001                                              |
| 9   | Foundation changes required?                | **No**                                                                                             |

## Notes

- Dashboard Next Action **component** and **view model** remain Feature Complete.
- This document does not mark SD-001 as Feature Complete.
- Implementation PRs follow Architecture Approval and governed lifecycle in
  document `01`.
