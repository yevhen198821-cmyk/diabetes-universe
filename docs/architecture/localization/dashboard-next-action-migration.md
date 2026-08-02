# Dashboard Next Action Localization Migration (I18N-02B1)

## Status

Approved — Feature Complete (merged via PR #23)

## Purpose

Migrate only the Dashboard Next Action block from hardcoded Russian copy to the
approved Localization Platform stack through production `PlatformProvider` hooks,
following the vertical slice pattern established in I18N-02A (Dashboard Header).

## Scope

- `DashboardNextAction` view and presentation model
- `dashboard-next-action-labels.ts` label and demo-step resolution
- structural `NextStepSource` demo data (no presentation strings in mocks)
- English canonical `dashboard.nextAction.*` keys
- `useLocalization()` in view and container boundaries
- model/view separation preservation
- unit, integration, resource, preload, and E2E coverage

## Out of scope

- Dashboard Header (I18N-02A — Feature Complete)
- Last Glucose, Day Summary, Recent Events, AI Insight (I18N-02B2+)
- Quick Add dialog/form copy
- Timeline product source
- `uk`, `de`, `ru` professional translations
- locale switch UI, ICU/interpolation, route-aware preload
- Platform package public API changes

---

## Original block audit

### Structural data vs presentation

Demo next-step data in `lib/mocks/timeline.ts` now exports only structural
`NextStepSource`:

```typescript
export const nextStepSource: NextStepSource = {
  type: 'insulin',
  priority: 'high',
};
```

Localized presentation (`Next action`, `Add insulin`, `Add`) is resolved
exclusively via `resolveDashboardNextActionDemoStep(localization, source)` in
`dashboard-root.tsx`. Mocks do not contain human-readable copy.

### File map (implemented)

| File                              | Change                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `dashboard-next-action.tsx`       | `useLocalization()` + labels → model                                            |
| `dashboard-next-action-model.ts`  | inject `DashboardNextActionLabels`; remove `dashboardNextActionLabels` constant |
| `dashboard-next-action-labels.ts` | **new** — resolver + demo step mapper                                           |
| `dashboard-root.tsx`              | `resolveDashboardNextActionDemoStep(localization, nextStepSource)`              |
| `lib/mocks/timeline.ts`           | `nextStep` → `nextStepSource` (structural only)                                 |
| `packages/types/timeline.ts`      | **new** `NextStepSource`, `NextStepActionType`, `NextStepPriority`              |
| `packages/locales`                | 8 new `dashboard.nextAction.*` keys                                             |

---

## Translation keys

| Key                                      | English value                 |
| ---------------------------------------- | ----------------------------- |
| `dashboard.nextAction.title`             | Next action                   |
| `dashboard.nextAction.description`       | Add insulin                   |
| `dashboard.nextAction.action`            | Add                           |
| `dashboard.nextAction.loading`           | Loading next action           |
| `dashboard.nextAction.empty.title`       | No actions available          |
| `dashboard.nextAction.empty.description` | New actions will appear here. |
| `dashboard.nextAction.error.title`       | Action unavailable            |
| `dashboard.nextAction.error.description` | Please try again later.       |

---

## Namespace / preload

- **Namespace:** `dashboard` (existing)
- **Preload:** unchanged — `['common', 'dashboard']`
- **No new namespace; no preload config change**

---

## Localization integration

```text
nextStepSource (structural mock)
  ↓
dashboard-root: resolveDashboardNextActionDemoStep(localization, source) → NextStep
  ↓
DashboardNextAction: useLocalization() → resolveDashboardNextActionLabels()
  ↓
createDashboardNextActionViewModel(props, labels)
  ↓
JSX
```

---

## Formatting decision

**Not required.** No `useFormatter()` in Next Action. No `Intl.*` in migrated
files.

---

## Model / view boundary

Pure model receives `DashboardNextActionLabels` and presentation primitives only.
No `LocalizationPlatform`, `PlatformFormatter`, or `PlatformRuntime` in model.

---

## Business logic invariants (preserved)

| Invariant              | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| CTA callback           | `requestOpen('next-action', 'insulin')`                  |
| Category               | `'insulin'`                                              |
| Opening lock           | `createQuickAddOpeningLock`                              |
| Focus return           | `nextActionRef` when `lastOpenTrigger === 'next-action'` |
| Disabled while QA open | `actionDisabled={quickAddState.isOpen}`                  |

---

## Transitional mixed-language state

| Area                            | Language |
| ------------------------------- | -------- |
| Header + Next Action            | English  |
| Last Glucose, Day Summary, etc. | Russian  |
| Quick Add dialog                | Russian  |

E2E asserts English Next Action + Russian Quick Add insulin dialog.

---

## Testing strategy

- resource key validation (`dashboard-next-action-resources.test.mjs`)
- label resolver + demo step mapper (`dashboard-next-action-labels.test.mjs`)
- pure model tests with English fixtures
- React integration inside `TestPlatformProvider`
- E2E vertical slice: `dashboard-next-action-i18n.spec.ts`
- regression: 24 E2E (updated selectors in `dashboard-quick-add.spec.ts`)

---

## Technical debt

| Item                                      | Notes                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Demo insulin-only mapper                  | `resolveDashboardNextActionDemoStep` switches on `source.type`; production will supply localized `NextStep` from data layer |
| Empty/error not wired in `dashboard-root` | Localized helpers exist; owner wiring is future work                                                                        |
| Mixed-language Dashboard                  | Expected until I18N-02B2+                                                                                                   |

---

## Future I18N-02B2

Migrate Last Glucose, Day Summary, Recent Events, AI Insight.

---

## Definition of Done

- [x] All Next Action user-visible strings migrated to `dashboard.nextAction.*`
- [x] Structural mock separated from presentation copy
- [x] English canonical resources added
- [x] `useLocalization()` wired; no `useFormatter()`
- [x] `dashboardNextActionLabels` removed from model
- [x] `dashboard-root` uses localized demo `NextStep` from structural source
- [x] model/view separation preserved
- [x] resource, label, model, integration, E2E tests
- [x] preload not extended
- [x] no Timeline / Quick Add / other block source changes

---

## Engineering audit (I18N-02B1)

### 1. General information

| Field  | Value                                          |
| ------ | ---------------------------------------------- |
| Stage  | I18N-02B1 — Dashboard Next Action Localization |
| Base   | `main` @ `ef72376`                             |
| Branch | `feature/i18n-dashboard-next-action`           |
| Phase  | Implementation complete — no commit/push/PR    |

### 2. Goal

Migrate Next Action copy to Platform Localization; preserve business logic and
Quick Add integration; separate structural demo data from presentation.

### 3. Scope / out of scope

Confirmed per sections above. Single vertical slice only.

### 4. Changed files (20)

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Create | `dashboard-next-action-labels.ts`                                                                     |
| Create | `dashboard-next-action-labels.test.mjs`                                                               |
| Create | `dashboard-next-action-resources.test.mjs`                                                            |
| Create | `dashboard-next-action.integration.test.mjs`                                                          |
| Create | `e2e/dashboard-next-action-i18n.spec.ts`                                                              |
| Modify | `dashboard-next-action.tsx`, `dashboard-next-action-model.ts`, `dashboard-next-action-model.test.mjs` |
| Modify | `dashboard-root.tsx` (minimal)                                                                        |
| Modify | `lib/mocks/timeline.ts`                                                                               |
| Modify | `packages/types/src/timeline.ts`, `packages/types/src/index.ts`                                       |
| Modify | `packages/locales/*`                                                                                  |
| Modify | `e2e/dashboard-quick-add.spec.ts` (selectors only)                                                    |
| Docs   | this file, INDEX, architecture README, `apps/web/README.md`, `dashboard/next-action.md`               |

### 5. Translation resources

8 new keys under `dashboard.nextAction.*` in `@diabetes-universe/locales`.

### 6. Keys / namespace

`dashboard` namespace only. No duplicates of `dashboard.header.*`.

### 7. Preload

Unchanged. `common` + `dashboard`. Tests confirm keys resolve from preloaded
namespace.

### 8. Localization integration

- View: `useLocalization()` → `resolveDashboardNextActionLabels()`
- Container: `resolveDashboardNextActionDemoStep(localization, nextStepSource)`
- Mock: structural `NextStepSource` only

### 9. Formatting decision

Not required. Documented and verified (no `Intl.*` in migrated block).

### 10. Presentation context usage

Not required.

### 11. Model / view architecture

`createDashboardNextActionViewModel(props, labels)` — pure model, injected
labels for loading; ready state receives localized `NextStep` from container.

### 12. Business logic invariants

All preserved. CTA, trigger, category, lock, focus return unchanged.

### 13. Accessibility

| Element              | Source                             |
| -------------------- | ---------------------------------- |
| Ready eyebrow        | `NextStep.title` (localized)       |
| Ready heading (`h2`) | `NextStep.description` (localized) |
| CTA button           | `NextStep.actionLabel` (localized) |
| Loading `sr-only`    | `labels.loading`                   |

### 14. Responsive / long-text

Layout unchanged. English copy fits existing responsive classes.

### 15. Data flow

```text
nextStepSource { type: 'insulin', priority: 'high' }
  → resolveDashboardNextActionDemoStep() → NextStep (EN)
  → DashboardNextAction → useLocalization() → labels
  → model → view
  → onAction → requestOpen('next-action', 'insulin')
  → QuickAddHost (RU copy, unchanged)
```

### 16. Public API impact

**Platform packages:** unchanged.

**`@diabetes-universe/types`:** additive `NextStepSource`, `NextStepActionType`,
`NextStepPriority` — structural product contract, not Platform Runtime API.

### 17. Security / medical safety

Copy-only migration. No dosing logic, ranking, or medical calculation changes.

### 18. Documentation

This document + index updates.

### 19. Tests

| Suite                        | Count                 |
| ---------------------------- | --------------------- |
| Web unit/integration (total) | **312** (+9 from 303) |
| E2E (total)                  | **24** (+1 from 23)   |

New tests: resources (3), labels (4), integration (2), E2E (1).

### 20. Automated checks

| Check                                       | Result     |
| ------------------------------------------- | ---------- |
| `pnpm format:check`                         | ✅         |
| `pnpm lint`                                 | ✅         |
| `pnpm typecheck`                            | ✅         |
| `pnpm --filter @diabetes-universe/web test` | ✅ 312/312 |
| `pnpm build`                                | ✅         |
| `pnpm test:e2e`                             | ✅ 24/24   |

### 21. Regression

All existing E2E pass. Timeline, Quick Add, Header unchanged.

### 22. Architecture compliance

| Rule                        | Status |
| --------------------------- | ------ |
| No Platform API change      | ✅     |
| No ICU                      | ✅     |
| No route-aware preload      | ✅     |
| No Quick Add migration      | ✅     |
| No Timeline migration       | ✅     |
| Mock = structural data only | ✅     |
| Model/view separation       | ✅     |

### 23. Technical debt

See **Technical debt** section.

### 24. Known limitations

- Mixed-language Dashboard until I18N-02B2+
- Demo maps only `type: 'insulin'`
- Empty/error localized helpers exist; `dashboard-root` uses `ready` only

### 25. Risks

| Risk                          | Mitigation                                      |
| ----------------------------- | ----------------------------------------------- |
| E2E mixed-language selectors  | Dedicated i18n E2E + minimal regression updates |
| Future `NextStepSource` types | Exhaustive switch in resolver                   |

### 26. Git status

```
Branch: feature/i18n-dashboard-next-action
Changes: unstaged (no commit per instructions)
Working tree: modified + untracked implementation files
```

### 27. Executive summary

I18N-02B1 migrates Dashboard Next Action to Platform Localization with structural
demo data (`NextStepSource`) separated from presentation. Human-readable strings
flow exclusively through `resolveDashboardNextActionDemoStep()` and
`resolveDashboardNextActionLabels()`. Business integration (insulin direct open,
opening lock, focus return) is unchanged. All validation suites green.

**Confirmed:**

- Next Action has no hardcoded user-visible strings in production code
- CTA opens insulin form directly — unchanged
- Opening lock and focus return — unchanged
- Business logic — unchanged
- Dashboard Header, other blocks, Timeline, Quick Add — unchanged
- Platform public API — unchanged
- ICU — not introduced
- I18N-02B2 — not started

## Architecture references

- [I18N-02A — Dashboard Header Migration](dashboard-header-migration.md)
- [Dashboard Next Action Architecture](../dashboard/next-action.md)
- [Platform Readiness](platform-readiness.md)
