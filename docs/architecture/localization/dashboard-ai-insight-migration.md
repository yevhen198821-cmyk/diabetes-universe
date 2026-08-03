# Dashboard AI Insight Localization Migration (I18N-02B5)

## Status

Implementation Complete — Ready for Review

## Purpose

Audit the Dashboard AI Insight block before migrating it to the approved
Localization Platform, Formatting Platform, and Presentation Context stack.
Determine minimal implementation scope, translation keys, formatting
responsibilities, medical-safety validation boundaries, risks, and stop
conditions.

> **Update (implementation):** The approved minimal presentation-only slice is
> implemented on branch `feature/i18n-dashboard-ai-insight`. See
> [Localization integration (implemented)](#localization-integration-implemented)
> and [Engineering Audit (I18N-02B5)](#engineering-audit-i18n-02b5) below.

## Scope

- `DashboardAiInsight` view and presentation model
- `createDashboardAiInsightViewModel()` normalization and safety rules
- `containsForbiddenAiInsightContent()` prohibited-language guard
- `formatRelatedEventsLabel()` composed label logic
- `mapDashboardAiInsightToCard()` mapper
- `deriveDashboardQuickAddBlocks()` integration pass-through (`aiInsight`)
- Dashboard root/container wiring (`mockAiInsight`)
- shared `EventCard` consumption (analysis only — no Design System change)
- exported `DashboardAiInsightEngine` contract (analysis only)
- existing unit test coverage
- accessibility and responsive behaviour documentation

## Out of scope

- Dashboard Header (I18N-02A — Feature Complete)
- Next Action (I18N-02B1 — Feature Complete)
- Last Glucose (I18N-02B2 — Feature Complete)
- Day Summary (I18N-02B3 — Feature Complete)
- Recent Events (I18N-02B4 — Feature Complete)
- Quick Add dialog/form copy
- Timeline page UI, filters, search, grouping labels
- `EventCard` status labels (`Выполнено`, `Запланировано`, …) in `@diabetes-universe/ui`
- `DashboardAiInsightEngine` implementation / AI runtime integration
- locale switch, new languages (`uk`, `de`, `ru` professional translations)
- ICU MessageFormat interpolation (unless stop condition triggered — see below)
- route-aware preload, Platform public API changes
- ADR Decision section changes
- making AI Insight cards interactive / Timeline parity
- resolving `relatedEventIds` to event titles (v1.0 informational count only)

---

## Executive Summary

Dashboard AI Insight is the **sixth and final** Dashboard block pending
localization. It is a self-contained, presentation-only block with:

- **8 hardcoded Russian label constants** in `dashboardAiInsightLabels`
- **2 composed related-events label patterns** (count > 0 / count = 0)
- **Pass-through domain content** (`title`, `summary`) from owner-supplied data
- **Pre-formatted `displayTime`** in mock data (not platform-formatted today)
- **No `useLocalization()` / `useFormatter()`** in AI Insight files
- **No `packages/locales` keys** for `dashboard.aiInsight.*`
- **13 unit tests** on pure model; **no integration, resource, React, or E2E tests**
- **No Timeline derivation** — `aiInsight` is pass-through from container options
- **Medical-safety downgrade** via `containsForbiddenAiInsightContent()` — must remain unchanged

**Stop conditions: none triggered.** A minimal presentation-only slice mirroring
I18N-02A–02B4 is recommended:

1. Add `dashboard-ai-insight-labels.ts` resolver + 10 English canonical keys
2. Inject labels into pure model; move composed related-events label logic to use
   localized base label + `formatNumber(count)` (no ICU)
3. Add `useLocalization()` in view only
4. Add `formatAiInsightDisplayTime` via `useFormatter().formatTime()` at
   `dashboard-root` boundary from `generatedAt`
5. Preserve forbidden-content validation, state machine, and EventCard mapping
6. Preload unchanged (`common` + `dashboard`)
7. Add resource, integration, and dedicated E2E coverage

---

## File Map

| File                                                                      | Role              | AI Insight?  | Contains                                                       | Change at implementation                                             |
| ------------------------------------------------------------------------- | ----------------- | ------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/web/components/dashboard/dashboard-ai-insight.tsx`                  | View              | **Yes**      | JSX, hardcoded `dashboardAiInsightLabels`, `EventCard`         | **Yes** — `useLocalization()` / labels resolver                      |
| `apps/web/components/dashboard/dashboard-ai-insight-model.ts`             | Pure model        | **Yes**      | Types, labels, view model, forbidden patterns, engine contract | **Yes** — inject labels; remove hardcoded RU constants               |
| `apps/web/components/dashboard/dashboard-ai-insight-model.test.mjs`       | Model tests       | **Yes**      | 13 tests: states, safety, labels                               | **Yes** — English label fixtures                                     |
| `apps/web/components/dashboard/dashboard-ai-insight-card.mapper.ts`       | Card mapper       | **Yes**      | Maps ready VM → `EventCard` props                              | **No logic** — consumes pass-through fields                          |
| `apps/web/components/dashboard/dashboard-ai-insight-labels.ts`            | Label resolver    | **No — new** | —                                                              | **Yes — create** (mirror 02A–02B4)                                   |
| `apps/web/components/dashboard/dashboard-ai-insight-labels.test.mjs`      | Labels tests      | **No — new** | —                                                              | **Yes — create**                                                     |
| `apps/web/components/dashboard/dashboard-ai-insight-resources.test.mjs`   | Resource tests    | **No — new** | —                                                              | **Yes — create**                                                     |
| `apps/web/components/dashboard/dashboard-ai-insight.integration.test.mjs` | Integration tests | **No — new** | —                                                              | **Yes — create**                                                     |
| `apps/web/components/dashboard/dashboard-root.tsx`                        | Container         | **Partial**  | `mockAiInsight`, wires `<DashboardAiInsight>`                  | **Minimal** — `formatAiInsightDisplayTime` via `useFormatter()`      |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`         | Integration       | **Partial**  | `aiInsight: options.aiInsight ?? null` pass-through            | **Maybe** — accept formatted insight or `formatDisplayTime` callback |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.test.mjs`   | Integration tests | **Partial**  | No `aiInsight` assertions today                                | **Yes** — pass-through / formatter wiring                            |
| `apps/web/components/dashboard/dashboard-shell.tsx`                       | Layout shell      | **No**       | Renders `aiInsight` slot after `recentEvents`                  | **No**                                                               |
| `packages/ui/src/components/event-card/EventCard.tsx`                     | Shared UI         | **Analysis** | Composes `aria-label` from card fields                         | **No** — status not used by AI Insight                               |
| `packages/ui/src/theme/event-type-appearance.ts`                          | Shared UI         | **Analysis** | `ai_insight` teal accent                                       | **No**                                                               |
| `packages/locales/src/resources/en/messages.ts`                           | Locales           | **No**       | No `dashboard.aiInsight.*` keys                                | **Yes** — add 10 keys                                                |
| `packages/locales/src/contracts/canonical-translation-key.ts`             | Locales contract  | **No**       | —                                                              | **Yes** — register keys                                              |
| `apps/web/e2e/dashboard-ai-insight-i18n.spec.ts`                          | E2E               | **No — new** | —                                                              | **Yes — create**                                                     |
| `docs/architecture/dashboard/ai-insight.md`                               | Architecture      | **Yes**      | Boundaries                                                     | **Note** I18N-02B5 at implementation                                 |
| `docs/specs/dashboard/ai-insight.md`                                      | Spec              | **Yes**      | Approved Russian copy                                          | **No logic change**                                                  |
| `docs/ui/dashboard/ai-insight.md`                                         | UI spec           | **Yes**      | States, a11y                                                   | **No visual change**                                                 |

### Production files (complete list)

| #   | Path                                                                | Classification           |
| --- | ------------------------------------------------------------------- | ------------------------ |
| 1   | `apps/web/components/dashboard/dashboard-ai-insight.tsx`            | View                     |
| 2   | `apps/web/components/dashboard/dashboard-ai-insight-model.ts`       | Model                    |
| 3   | `apps/web/components/dashboard/dashboard-ai-insight-card.mapper.ts` | Mapper                   |
| 4   | `apps/web/components/dashboard/dashboard-root.tsx`                  | Container wiring         |
| 5   | `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`   | Integration pass-through |
| 6   | `apps/web/components/dashboard/dashboard-shell.tsx`                 | Layout slot              |

### Non-production references

| Path                                                                 | Role                                |
| -------------------------------------------------------------------- | ----------------------------------- |
| `apps/web/components/dashboard/dashboard-ai-insight-model.test.mjs`  | Unit tests                          |
| `apps/web/components/dashboard/dashboard-day-summary-model.test.mjs` | Negative: `aiInsight` ∉ day summary |
| `apps/web/package.json`                                              | `test:dashboard-ai-insight` script  |
| `docs/architecture/dashboard/ai-insight.md`                          | Architecture                        |
| `docs/specs/dashboard/ai-insight.md`                                 | Functional spec                     |
| `docs/ui/dashboard/ai-insight.md`                                    | UI spec                             |
| `docs/data/entities/ai-insight.md`                                   | Stub (empty)                        |

---

## Data Flow

```
mockAiInsight (dashboard-root.tsx)
  id, title, summary, displayTime, generatedAt, relatedEventIds
  ↓
deriveDashboardQuickAddBlocks({ events }, { aiInsight: mockAiInsight, ... })
  → aiInsight: options.aiInsight ?? null    [PASS-THROUGH — no timeline derivation]
  ↓
dashboard-root.tsx:
  derivedBlocks.aiInsight ?
    <DashboardAiInsight state="ready" insight={derivedBlocks.aiInsight} />
  : <DashboardAiInsight state="empty" />
  ↓
createDashboardAiInsightViewModel(props, labels)
  ├─ loading  → skeleton + sr-only status (labels.loading)
  ├─ ready    → normalizeReadyInsight()
  │    ├─ trim/validate id, title, summary, displayTime, generatedAt (ISO)
  │    ├─ normalizeRelatedEventIds()
  │    ├─ containsForbiddenAiInsightContent(title + summary) → downgrade empty
  │    └─ attach disclaimer + relatedEventsLabel (composed from labels)
  ├─ empty    → labels.defaultEmpty
  └─ error    → labels.defaultError
  ↓
mapDashboardAiInsightToCard(viewModel.insight)
  → EventCard: type='ai_insight', time=displayTime, title, subtitle=summary,
               context=relatedEventsLabel, value=title, unit=''
  ↓
<EventCard variant="standard" /> (non-interactive <article>)
```

### Recommended data flow at implementation

```
generatedAt (ISO, owner-supplied)
  ↓
dashboard-root: formatAiInsightDisplayTime = formatter.formatTime(generatedAt, { timeStyle: 'short' })
  ↓
insight with platform-formatted displayTime passed to DashboardAiInsight
  ↓
model validates displayTime non-empty (unchanged contract)
```

---

## Business Flow

1. Dashboard renders AI Insight **after Recent Events** in `DashboardShell`.
2. Container supplies one confirmed insight (today: `mockAiInsight`) or empty state.
3. User sees block chrome: eyebrow, title, disclaimer (ready only).
4. User reads one `EventCard` preview with title, summary, time, related-events reference.
5. Invalid/prohibited ready input downgrades to unavailable empty (no throw).
6. Loading / empty / error states are local to the block; other Dashboard blocks unaffected.
7. Block is **non-interactive** in v1.0 — no navigation, edit, or AI controls.

### Business invariants (must preserve)

| Invariant                                   | Current behaviour                      | Migration impact                  |
| ------------------------------------------- | -------------------------------------- | --------------------------------- |
| Exactly one insight in ready state          | Single `DashboardAiInsightData`        | **None**                          |
| Medical-safety downgrade                    | Forbidden patterns → empty/unavailable | **None** — patterns stay in model |
| No diagnosis/treatment/dose/forecast fields | Not exposed in view model              | **None**                          |
| `relatedEventIds` count-only                | IDs not resolved to titles             | **None**                          |
| Non-interactive block                       | No `onClick` on EventCard              | **None**                          |
| Invalid ready never throws                  | Returns empty view model               | **None**                          |
| `generatedAt` ISO validation                | `Date.parse` check                     | **None**                          |
| Disclaimer only in ready state              | Attached in `normalizeReadyInsight`    | **None** — label from resolver    |

---

## Formatting Audit

| API / pattern         | In AI Insight path today? | Location                            | Migration recommendation                                                                |
| --------------------- | ------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `Intl.DateTimeFormat` | **No**                    | —                                   | **Do not add** in model/view                                                            |
| `formatDate`          | **No**                    | —                                   | **Not needed**                                                                          |
| `formatTime`          | **No**                    | Mock `displayTime: '10:20'` literal | **Yes** — `useFormatter().formatTime(generatedAt, { timeStyle: 'short' })` at container |
| `formatNumber`        | **No**                    | Count composed as raw `${count}`    | **Yes** — for related-events count display                                              |
| `formatMeasurement`   | **No**                    | —                                   | **Not needed**                                                                          |
| `Date.parse`          | **Yes**                   | `isValidIsoDateTime()` in model     | **Keep** — validation only                                                              |

### Formatting points

| #   | Field                | Current source                 | Classification      | Action                                       |
| --- | -------------------- | ------------------------------ | ------------------- | -------------------------------------------- |
| 1   | `displayTime`        | Mock literal / upstream string | Presentation        | Format at container from `generatedAt`       |
| 2   | Related events count | `` `${label}: ${count}` ``     | Presentation        | `formatNumber(count)` + localized base label |
| 3   | `title`              | Owner-supplied                 | Domain pass-through | **No format**                                |
| 4   | `summary`            | Owner-supplied                 | Domain pass-through | **No format**                                |
| 5   | `generatedAt`        | Owner-supplied ISO             | Validation only     | **No display format** in block               |

### EventCard value-column quirk (documented, not blocking)

Mapper sets `value: insight.title` and `unit: ''`, duplicating title in the
value column. This is existing product behaviour; I18N-02B5 does not change
EventCard structure.

---

## Localization Audit

### Block chrome (presentation — migrate)

| Source                                  | Current text (RU)                                | Purpose                  | Visible / assistive         |
| --------------------------------------- | ------------------------------------------------ | ------------------------ | --------------------------- |
| `dashboardAiInsightLabels.title`        | `ИИ-объяснение`                                  | Section `h2` title       | Visible + `aria-labelledby` |
| `dashboardAiInsightLabels.eyebrow`      | `Автоматическое объяснение`                      | Ready-state eyebrow      | Visible                     |
| `dashboardAiInsightLabels.disclaimer`   | `Не является диагнозом или назначением лечения.` | Ready-state disclaimer   | Visible                     |
| `dashboardAiInsightLabels.loading`      | `Загрузка ИИ-объяснения`                         | Loading `sr-only` status | Assistive                   |
| `dashboardAiInsightLabels.unavailable`  | `ИИ-объяснение недоступно.`                      | Invalid ready fallback   | Visible (empty)             |
| `dashboardAiInsightLabels.defaultEmpty` | `ИИ-объяснение пока недоступно.`                 | Default empty state      | Visible                     |
| `dashboardAiInsightLabels.defaultError` | `Не удалось загрузить ИИ-объяснение.`            | Default error state      | Visible                     |

### Composed labels (presentation — migrate)

| Pattern                    | Current text (RU)                              | Composition                                          |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Related events (count > 0) | `Связанные записи: 2`                          | `` `${relatedEvents}: ${count}` ``                   |
| Related events (count = 0) | `Связанные записи: нет подтверждённых записей` | `` `${relatedEvents}: нет подтверждённых записей` `` |

### Domain content (pass-through — do not localize in block)

| Field         | Example                                        | Source                                     |
| ------------- | ---------------------------------------------- | ------------------------------------------ |
| `title`       | `После завтрака`                               | `mockAiInsight` / future engine            |
| `summary`     | `После завтрака значение глюкозы было выше...` | Owner-supplied                             |
| `displayTime` | `10:20`                                        | Platform formatter output (post-migration) |

### Forbidden-content patterns (validation — do not migrate as UI strings)

Regex patterns in `forbiddenInsightPatterns` (RU + EN) are **business-safety
guards**, not user-facing copy. They remain in the pure model unchanged.

### English strings in production

**None today.** All block chrome is Russian.

---

## Translation Key Proposal

Namespace: `dashboard` (existing preload — no new namespace).

| Key                                       | Proposed English                           | Replaces                                                               |
| ----------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `dashboard.aiInsight.title`               | AI insight                                 | `dashboardAiInsightLabels.title`                                       |
| `dashboard.aiInsight.eyebrow`             | Automatic explanation                      | `dashboardAiInsightLabels.eyebrow`                                     |
| `dashboard.aiInsight.disclaimer`          | Not a diagnosis or treatment prescription. | `dashboardAiInsightLabels.disclaimer`                                  |
| `dashboard.aiInsight.loading`             | Loading AI insight                         | `dashboardAiInsightLabels.loading`                                     |
| `dashboard.aiInsight.unavailable`         | AI insight unavailable.                    | `dashboardAiInsightLabels.unavailable`                                 |
| `dashboard.aiInsight.empty.default`       | AI insight is not available yet.           | `dashboardAiInsightLabels.defaultEmpty`                                |
| `dashboard.aiInsight.error.default`       | Could not load AI insight.                 | `dashboardAiInsightLabels.defaultError`                                |
| `dashboard.aiInsight.relatedEvents.label` | Related records                            | `dashboardAiInsightLabels.relatedEvents`                               |
| `dashboard.aiInsight.relatedEvents.none`  | Related records: no confirmed records      | Zero-count composed string                                             |
| `dashboard.aiInsight.relatedEvents.count` | Related records: {count}                   | **Not used as ICU** — compose `` `${label}: ${formatNumber(count)}` `` |

**Total: 10 canonical keys** (count pattern uses `formatNumber`, not ICU).

Keys explicitly **not** proposed:

- `dashboard.aiInsight.time.*` — absolute short time via formatter only
- Domain `title` / `summary` keys — pass-through content
- Forbidden-pattern strings — validation logic, not translations

---

## Hooks Audit

### Current usage

| Hook                       | `dashboard-ai-insight.*` | `dashboard-root.tsx` (AI Insight)                 |
| -------------------------- | ------------------------ | ------------------------------------------------- |
| `useLocalization()`        | **No**                   | Used for Next Action only                         |
| `useFormatter()`           | **No**                   | Used for Last Glucose, Day Summary, Recent Events |
| `usePresentationContext()` | **No**                   | Not imported                                      |

### Recommended at implementation

| Hook                       | File                       | Purpose                                                      |
| -------------------------- | -------------------------- | ------------------------------------------------------------ |
| `useLocalization()`        | `dashboard-ai-insight.tsx` | Resolve block labels via `resolveDashboardAiInsightLabels()` |
| `useFormatter()`           | `dashboard-root.tsx`       | `formatAiInsightDisplayTime` callback only                   |
| `usePresentationContext()` | —                          | **Not needed**                                               |

### Boundary rules (mirror 02A–02B4)

- Model remains pure — labels injected as parameter
- View is the only AI Insight file calling `useLocalization()`
- Container is the only place calling `useFormatter()` for AI Insight time
- No `Intl` in model, view, labels resolver, or mapper

---

## Preload Analysis

| Concern             | Current                        | I18N-02B5 impact                    |
| ------------------- | ------------------------------ | ----------------------------------- |
| Application preload | `['common', 'dashboard']`      | **Unchanged**                       |
| New namespace       | —                              | **Not required**                    |
| Route-aware preload | Not implemented                | **Not required**                    |
| Key registration    | `canonical-translation-key.ts` | Add 10 `dashboard.aiInsight.*` keys |

All proposed keys fit under the existing `dashboard` namespace already
preloaded for Header, Next Action, Last Glucose, Day Summary, and Recent Events.

---

## Testing Baseline

### Current coverage

| Layer               | File                                             | Tests | AI Insight coverage                 |
| ------------------- | ------------------------------------------------ | ----- | ----------------------------------- |
| Unit                | `dashboard-ai-insight-model.test.mjs`            | 13    | States, safety, labels, engine stub |
| Integration         | `dashboard-quick-add-integration-model.test.mjs` | —     | **No `aiInsight` assertions**       |
| Resource            | —                                                | 0     | **Missing**                         |
| React / integration | —                                                | 0     | **Missing**                         |
| E2E                 | —                                                | 0     | **No spec references AI Insight**   |

### Baseline counts (audit branch)

| Suite          | Count   |
| -------------- | ------- |
| Web unit tests | **364** |
| E2E tests      | **27**  |

### Proposed test additions at implementation

| File                                             | Purpose                                                  |
| ------------------------------------------------ | -------------------------------------------------------- |
| `dashboard-ai-insight-labels.test.mjs`           | Resolver + preloaded namespace                           |
| `dashboard-ai-insight-resources.test.mjs`        | Keys exist in `en` messages                              |
| `dashboard-ai-insight.integration.test.mjs`      | View renders English chrome                              |
| `dashboard-ai-insight-model.test.mjs`            | Update fixtures to English labels                        |
| `dashboard-quick-add-integration-model.test.mjs` | `aiInsight` pass-through + formatted time                |
| `e2e/dashboard-ai-insight-i18n.spec.ts`          | English chrome, short time, safety downgrade, responsive |

### E2E specs potentially affected (indirect)

No existing E2E spec asserts AI Insight strings. New dedicated spec required.
Other Dashboard I18N E2E specs (`header`, `next-action`, `last-glucose`,
`day-summary`, `recent-events`) are **not** expected to break unless shared
Dashboard layout changes (not anticipated).

---

## Stop Conditions

| Condition                                | Triggered? | Analysis                                                                                            |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| New ADR required                         | **No**     | Same presentation-only vertical slice as 02A–02B4                                                   |
| Platform API change required             | **No**     | Existing `LocalizationPlatform` + `PlatformFormatter` sufficient                                    |
| ICU / MessageFormat required             | **No**     | Related-events count via `formatNumber` + string composition; zero-state as full phrase key         |
| New namespace required                   | **No**     | Keys under existing `dashboard` namespace                                                           |
| Route-aware preload required             | **No**     | Dashboard route already preloads `dashboard`                                                        |
| AI contract change required              | **No**     | `DashboardAiInsightEngine` already accepts `locale`; presentation migration does not alter contract |
| Dashboard architecture change required   | **No**     | Same container → view → model pattern; optional thin display-time formatting at root                |
| Timeline selector change required        | **No**     | No timeline derivation for AI Insight                                                               |
| Design System change required            | **No**     | `EventCard` consumed as-is                                                                          |
| Medical-safety logic relocation required | **No**     | `containsForbiddenAiInsightContent` stays in model                                                  |

**Verdict: no stop conditions. Proceed to implementation approval.**

---

## Recommended Implementation Slice

### Minimal presentation-only scope

1. **Create** `dashboard-ai-insight-labels.ts` with `resolveDashboardAiInsightLabels()`
2. **Add** 10 `dashboard.aiInsight.*` keys to `packages/locales`
3. **Modify** `dashboard-ai-insight-model.ts`:
   - Accept `DashboardAiInsightLabels` parameter
   - Remove `dashboardAiInsightLabels` export
   - `formatRelatedEventsLabel(count, labels, formatCount)` using localized keys + `formatNumber`
   - **Preserve** `containsForbiddenAiInsightContent` and all validation unchanged
4. **Modify** `dashboard-ai-insight.tsx`:
   - Add `useLocalization()` + `useMemo` labels resolver
   - Replace hardcoded label references
5. **Modify** `dashboard-root.tsx`:
   - Add `formatAiInsightDisplayTime` via `useFormatter().formatTime(generatedAt, { timeStyle: 'short' })`
   - Apply when passing insight to `<DashboardAiInsight>` (map `generatedAt` → `displayTime`)
6. **Optional thin derivation** (if cleaner than inline root mapping):
   - `normalizeDashboardAiInsightDisplayTime(insight, formatDisplayTime)` in integration layer
7. **Do not change**:
   - `dashboard-ai-insight-card.mapper.ts` logic
   - `DashboardAiInsightEngine` contract
   - `dashboard-shell.tsx`
   - `EventCard` / `@diabetes-universe/ui`
   - Forbidden-content regex patterns
   - Preload namespaces
8. **Add tests** per Testing Baseline section
9. **Add E2E** `dashboard-ai-insight-i18n.spec.ts`

### Formatter flow (target)

```
DashboardAiInsightData.generatedAt (ISO)
  ↓
dashboard-root: formatAiInsightDisplayTime = formatter.formatTime(..., { timeStyle: 'short' })
  ↓
insight.displayTime (platform-formatted)
  ↓
createDashboardAiInsightViewModel (validates non-empty displayTime)
  ↓
mapDashboardAiInsightToCard → EventCard time + composed aria-label
```

---

## Scope Confirmation

### In scope (I18N-02B5)

- Block chrome labels (title, eyebrow, disclaimer, loading, empty, error, unavailable)
- Related-events composed labels (count + zero-state)
- `displayTime` platform formatting at container boundary
- Labels resolver + locale keys + tests + E2E

### Out of scope (confirmed unchanged)

| Area                               | Status                         |
| ---------------------------------- | ------------------------------ |
| Dashboard Header                   | Feature Complete — not touched |
| Next Action                        | Feature Complete — not touched |
| Last Glucose                       | Feature Complete — not touched |
| Day Summary                        | Feature Complete — not touched |
| Recent Events                      | Feature Complete — not touched |
| Timeline UI                        | Not migrated                   |
| Quick Add UI                       | Not migrated                   |
| Platform API                       | Not changed                    |
| AI Engine implementation           | Not started                    |
| `EventCard` status labels          | Not migrated                   |
| Domain `title` / `summary` content | Pass-through                   |

---

## Risks

| Risk                                                          | Severity | Mitigation                                                            |
| ------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| Medical-safety regex accidentally modified                    | High     | Unit tests lock forbidden patterns; no label changes in guard         |
| `displayTime` / `generatedAt` drift after formatter injection | Medium   | Integration test asserts formatted time from ISO input                |
| Related-events label regression (zero vs count)               | Low      | Dedicated model tests for both branches                               |
| Mock `displayTime` literal removed before formatter wired     | Medium   | Format in root before passing to component                            |
| EventCard duplicate title in value column confuses a11y       | Low      | Pre-existing; aria-label includes title twice today — document, defer |
| No E2E baseline today                                         | Medium   | New `dashboard-ai-insight-i18n.spec.ts` required at implementation    |

---

## Technical Debt

| Item                                                      | Notes                                              |
| --------------------------------------------------------- | -------------------------------------------------- |
| `mockAiInsight` hardcoded in `dashboard-root`             | Demo data; domain RU strings remain pass-through   |
| `displayTime` pre-formatted in mock                       | Replace with formatter-derived from `generatedAt`  |
| `DASHBOARD_LOCALE = 'ru-RU'` in root                      | Transitional; engine contract already has `locale` |
| `DashboardAiInsightEngine` unimplemented                  | Future slice; contract already locale-aware        |
| `relatedEventIds` not resolved to event titles            | v1.0 by design                                     |
| `EventCard` `dateTime={time}` uses display string not ISO | Pre-existing EventCard behaviour                   |

---

## Accessibility Audit

| Element                    | Attribute                      | Migration notes                                                                |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `<section>`                | `aria-busy`, `aria-labelledby` | Unchanged                                                                      |
| Loading `<h2>`             | `sr-only`, `id=titleId`        | Title from localized labels                                                    |
| Loading `<span>`           | `role="status"`, `sr-only`     | Message from `labels.loading`                                                  |
| Ready `<h2>`               | visible title                  | Localized `labels.title`                                                       |
| Ready eyebrow / disclaimer | visible text                   | Localized                                                                      |
| Empty/error container      | `role`, `aria-live`            | Unchanged semantics                                                            |
| `EventCard`                | composed `aria-label`          | Inherits formatted `time`, pass-through `title`/`summary`, localized `context` |
| `Sparkles` icon            | `aria-hidden`                  | Unchanged                                                                      |

No new `aria-label` attributes required on the section landmark.

---

## Architecture Audit Report

### 1. General information

| Field      | Value                                         |
| ---------- | --------------------------------------------- |
| Stage      | I18N-02B5 — Dashboard AI Insight Localization |
| Phase      | **Stage 1 — Architecture Audit Only**         |
| Base       | `main` @ `a275b22`                            |
| Branch     | `feature/i18n-dashboard-ai-insight`           |
| Commit/PR  | Not performed (per task instructions)         |
| Unit tests | **364** web                                   |
| E2E tests  | **27**                                        |

### 2. Goal

Migrate AI Insight block chrome, state labels, disclaimer, and related-events
reference labels to Platform Localization; move `displayTime` formatting to
`useFormatter().formatTime()` at the container boundary; preserve medical-safety
validation, single-insight invariant, and non-interactive behaviour.

### 3. Production file inventory

6 production files (see File Map). 3 dedicated AI Insight component files +
container wiring + integration pass-through + layout shell slot.

### 4. Data flow summary

Pass-through mock → integration → container → pure model → mapper → EventCard.
No Timeline store involvement.

### 5. Business flow summary

Single confirmed insight preview with disclaimer; safety downgrade on prohibited
content; local loading/empty/error states.

### 6. User-facing strings

8 label constants + 2 composed patterns + pass-through domain content (see
Localization Audit).

### 7. Formatting audit summary

One formatting point: `displayTime` from `generatedAt` via `formatTime`. One
optional: `formatNumber` for related-events count.

### 8. Hooks audit summary

No platform hooks today. Target: `useLocalization` in view, `useFormatter` in
root only.

### 9. Translation keys

10 proposed `dashboard.aiInsight.*` keys (see Translation Key Proposal).

### 10. Preload

Unchanged: `['common', 'dashboard']`.

### 11. Timeline dependencies

**None.** `ai_insight` is not a `TimelineEventKind`. `useTimelineStore` in root
does not feed AI Insight.

### 12. Dashboard dependencies

`DashboardShell` slot, `deriveDashboardQuickAddBlocks` pass-through,
`dashboard-root` container wiring.

### 13. AI runtime dependencies

`DashboardAiInsightEngine` interface exported but **not implemented**. Contract
includes `locale`, `referenceTime`, `timeZone` — compatible with future engine
without I18N-02B5 contract changes.

### 14. Existing tests

13 model unit tests. No integration, resource, React, or E2E tests.

### 15. E2E impact

No existing E2E coverage. New dedicated spec required at implementation.

### 16. Stop conditions

None triggered (see Stop Conditions table).

### 17. Recommended slice

Presentation-only; mirror I18N-02A–02B4 patterns (see Recommended Implementation
Slice).

### 18. ADR impact

None.

### 19. Platform API impact

None.

### 20. ICU impact

None — avoid via `formatNumber` + phrase keys.

### 21. Namespace impact

None — use existing `dashboard` namespace.

### 22. AI contract impact

None.

### 23. Dashboard architecture impact

None — optional display-time formatting at container boundary only.

### 24. Medical-safety invariant

`containsForbiddenAiInsightContent()` must remain in pure model, unchanged
patterns, unchanged downgrade behaviour.

### 25. EventCard dependency

Ready state only; `ai_insight` type; no status labels; composed aria-label from
card fields.

### 26. Responsive constraints

`col-span-full lg:col-span-4`; no layout changes anticipated.

### 27. Risks

See Risks table.

### 28. Technical debt

See Technical Debt table.

### 29. Scope confirmation

Final Dashboard localization block. All other Dashboard blocks Feature Complete.

### 30. Next step

**Ready for review** — implementation matches approved minimal presentation-only
slice.

---

## Localization integration (implemented)

```text
DashboardAiInsightEngineInsight (generatedAt ISO, domain title/summary)
  ↓
dashboard-root:
  formatTime(generatedAt, { timeStyle: 'short' }) once → displayTime
  count > 0: relatedEventsLabel + ": " + formatNumber(count)
  count = 0: relatedEvents.none key (no formatNumber)
  ↓
prepareDashboardAiInsightPresentation → DashboardAiInsightData
  ↓
DashboardAiInsight (useLocalization → labels)
  ↓
createDashboardAiInsightViewModel (labels injected; safety guard unchanged)
  ↓
mapDashboardAiInsightToCard → EventCard (pass-through title/summary)
```

| Boundary                               | Responsibility                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `dashboard-root.tsx`                   | `useFormatter()` → `formatTime` + `formatNumber`; `resolveDashboardAiInsightLabels` for related-events composition only |
| `dashboard-ai-insight-presentation.ts` | Pure presentation assembly with injected formatters                                                                     |
| `dashboard-ai-insight.tsx`             | `useLocalization()` only — no `useFormatter()`                                                                          |
| Model / mapper                         | Consume pre-formatted `displayTime` and `relatedEventsLabel`; no `Intl`                                                 |

---

## Engineering Audit (I18N-02B5)

### 1. General information

| Field      | Value                                          |
| ---------- | ---------------------------------------------- |
| Stage      | I18N-02B5 — Dashboard AI Insight Localization  |
| Phase      | **Implementation Complete — Ready for Review** |
| Base       | `main` @ `a275b22`                             |
| Branch     | `feature/i18n-dashboard-ai-insight`            |
| Commit/PR  | Not performed (per task instructions)          |
| Unit tests | **381** web (+17)                              |
| E2E tests  | **29** (+2)                                    |

### 2. Goal

Migrate AI Insight block chrome, state labels, disclaimer, and related-events
reference labels to Platform Localization; move `displayTime` and related-events
count formatting to `useFormatter()` at the `dashboard-root` boundary;
preserve medical-safety validation and non-interactive behaviour.

### 3. Changed files

| Action | Path                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| Create | `dashboard-ai-insight-labels.ts`                                                                   |
| Create | `dashboard-ai-insight-labels.test.mjs`                                                             |
| Create | `dashboard-ai-insight-resources.test.mjs`                                                          |
| Create | `dashboard-ai-insight.integration.test.mjs`                                                        |
| Create | `lib/dashboard/dashboard-ai-insight-presentation.ts` (+ test)                                      |
| Create | `e2e/dashboard-ai-insight-i18n.spec.ts`                                                            |
| Modify | `dashboard-ai-insight.tsx`, `dashboard-ai-insight-model.ts`, `dashboard-ai-insight-model.test.mjs` |
| Modify | `dashboard-root.tsx` (`formatAiInsightDisplayTime`, `formatAiInsightRelatedEventsCount`)           |
| Modify | `lib/dashboard/dashboard-quick-add-integration-model.ts` (remove `displayTime` from derived type)  |
| Modify | `packages/locales/*` (9 keys)                                                                      |
| Docs   | this file                                                                                          |

### 4. Translation resources

9 new keys under `dashboard.aiInsight.*` in `@diabetes-universe/locales`.

| Key                                       | English                                    |
| ----------------------------------------- | ------------------------------------------ |
| `dashboard.aiInsight.title`               | AI insight                                 |
| `dashboard.aiInsight.eyebrow`             | Automatic explanation                      |
| `dashboard.aiInsight.disclaimer`          | Not a diagnosis or treatment prescription. |
| `dashboard.aiInsight.loading`             | Loading AI insight                         |
| `dashboard.aiInsight.unavailable`         | AI insight unavailable.                    |
| `dashboard.aiInsight.empty.default`       | AI insight is not available yet.           |
| `dashboard.aiInsight.error.default`       | Could not load AI insight.                 |
| `dashboard.aiInsight.relatedEvents.label` | Related records                            |
| `dashboard.aiInsight.relatedEvents.none`  | Related records: no confirmed records      |

### 5. Formatting flow

| Call                                              | Owner            | When                                         |
| ------------------------------------------------- | ---------------- | -------------------------------------------- |
| `formatTime(generatedAt, { timeStyle: 'short' })` | `dashboard-root` | Once per insight                             |
| `formatNumber(count)`                             | `dashboard-root` | Only when `count > 0`                        |
| Zero-state related events                         | `dashboard-root` | `relatedEvents.none` key — no `formatNumber` |

Model and view do not call formatters or `Intl`.

### 6. Invariants (preserved)

| Invariant                                       | Status    |
| ----------------------------------------------- | --------- |
| `containsForbiddenAiInsightContent()` unchanged | Preserved |
| Prohibited content → unavailable empty          | Preserved |
| `title` / `summary` pass-through                | Preserved |
| EventCard mapper semantics                      | Preserved |
| Loading / empty / error behaviour               | Preserved |
| Dashboard layout / preload                      | Unchanged |
| Platform API                                    | Unchanged |
| `usePresentationContext()`                      | Not added |

### 7. Validation results

| Command                                     | Result      |
| ------------------------------------------- | ----------- |
| `pnpm format:check`                         | PASS        |
| `pnpm lint`                                 | PASS        |
| `pnpm typecheck`                            | PASS        |
| `pnpm --filter @diabetes-universe/web test` | **381/381** |
| `pnpm build`                                | PASS        |
| `pnpm test:e2e`                             | **29/29**   |

### 8. Regression scope

| Block                                                         | Touched? |
| ------------------------------------------------------------- | -------- |
| Header, Next Action, Last Glucose, Day Summary, Recent Events | No       |
| Timeline UI, Quick Add UI                                     | No       |
| Platform API                                                  | No       |

---

## Git Status

```
Branch: feature/i18n-dashboard-ai-insight (from main @ a275b22)
Working tree: modified (implementation + migration doc)
Commit: not performed (per task instructions)
Push: not performed (per task instructions)
PR: not created (per task instructions)
```
