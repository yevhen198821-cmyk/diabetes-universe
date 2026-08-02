# Dashboard Last Glucose Localization Migration (I18N-02B2)

## Status

Approved — Feature Complete (merged via PR #24)

## Purpose

Audit the Dashboard Last Glucose block before migrating it to the approved
Localization Platform, Formatting Platform, and Presentation Context stack.
Determine minimal implementation scope, translation keys, formatting
responsibilities, risks, and stop conditions.

No production code changes are made at this stage.

**Update (implementation):** minimal slice delivered per approved scope below.

## Scope

- `DashboardLastGlucose` view and presentation model
- `deriveLastGlucose()` selector path in dashboard integration model
- `createDashboardLastGlucoseMeasurement()` factory in model
- Dashboard root/container wiring
- mock/demo timeline data relevant to glucose derivation
- shared types used by the block
- existing unit tests and E2E coverage touching Last Glucose
- accessibility and responsive behaviour documentation

## Out of scope

- implementation (awaiting architectural approval)
- Dashboard Header (I18N-02A — Feature Complete)
- Next Action (I18N-02B1 — Feature Complete)
- Day Summary, Recent Events, AI Insight (I18N-02B3+)
- Quick Add form copy and `formatGlucoseValue()` (Quick Add product source)
- Timeline EventCard copy
- locale switch, new languages, ICU/interpolation
- route-aware preload, Platform public API changes
- medical unit conversion, target ranges, glucose classification
- ADR Decision section changes

---

## File map

| File                                                                    | Role                   | Last Glucose? | Contains                                                                                                                    | Change at implementation                                                                                         |
| ----------------------------------------------------------------------- | ---------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/web/components/dashboard/dashboard-last-glucose.tsx`              | View                   | **Yes**       | JSX, hardcoded `dashboardLastGlucoseLabels` in render                                                                       | **Yes** — `useLocalization()` / labels resolver; remove direct label import                                      |
| `apps/web/components/dashboard/dashboard-last-glucose-model.ts`         | Pure model + factory   | **Yes**       | View model, `dashboardLastGlucoseLabels`, `createDashboardLastGlucoseMeasurement()` with `Intl.DateTimeFormat`, stale logic | **Yes** — inject labels; remove `Intl.*` from factory (move formatting out)                                      |
| `apps/web/components/dashboard/dashboard-last-glucose-model.test.mjs`   | Model tests            | **Yes**       | Russian fixtures, stale/empty/error contracts                                                                               | **Yes** — English label fixtures; formatting tests adjusted                                                      |
| `apps/web/components/dashboard/dashboard-last-glucose-labels.ts`        | Label resolver         | **No — new**  | —                                                                                                                           | **Yes — create** (mirror Header / Next Action pattern)                                                           |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`       | Integration / selector | **Partial**   | `deriveLastGlucose()`, `DashboardDerivedLastGlucose`, `formatTimelineDisplayTime()` via `Intl`                              | **Yes** — move time formatting to formatter hook boundary; use presentation locale/timeZone                      |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.test.mjs` | Integration tests      | **Partial**   | `deriveLastGlucose` assertions                                                                                              | **Yes** — locale/time formatting expectations                                                                    |
| `apps/web/components/dashboard/dashboard-root.tsx`                      | Container              | **Partial**   | Wires `derivedBlocks.lastGlucose`, `DASHBOARD_LOCALE = 'ru-RU'`, `referenceTime`                                            | **Minimal** — presentation context locale/timeZone for derivation; no other block changes                        |
| `apps/web/lib/timeline/timeline-selectors.ts`                           | Shared selector        | **Partial**   | `getLatestGlucoseEvent()` — picks latest `kind === 'glucose'` by sort                                                       | **No** — business selection unchanged                                                                            |
| `apps/web/lib/timeline/timeline-date-time.ts`                           | Shared time helper     | **Partial**   | `formatTimelineDisplayTime()` uses `Intl.DateTimeFormat`                                                                    | **No** for selector itself; Last Glucose path should stop calling it after migration                             |
| `apps/web/lib/quick-add/format-glucose.ts`                              | Quick Add formatter    | **No**        | `formatGlucoseValue()` — `toLocaleString('ru-RU')` + `ммоль/л`                                                              | **No** — Quick Add scope                                                                                         |
| `apps/web/lib/quick-add/create-glucose-timeline-event.ts`               | Event creator          | **No**        | Creates glucose `TimelineEvent` with Russian title/value                                                                    | **No** — Quick Add scope                                                                                         |
| `apps/web/lib/mocks/timeline.ts`                                        | Demo data              | **Partial**   | `timelineEvents` glucose entries; legacy unused `lastGlucose: LastGlucose` mock                                             | **Maybe** — structural glucose event data only; remove unused legacy mock or stop exporting presentation strings |
| `packages/types/src/timeline.ts`                                        | Shared contract        | **Analysis**  | `TimelineEvent`, legacy `LastGlucose { value, time }`                                                                       | **No** — unless structural glucose fields added later (stop condition)                                           |
| `apps/web/components/dashboard/dashboard-shell.tsx`                     | Layout shell           | **No**        | Renders `lastGlucose` slot                                                                                                  | **No**                                                                                                           |
| `packages/ui`                                                           | UI primitives          | **No**        | `Button` not used; block uses Lucide `Droplets`                                                                             | **No**                                                                                                           |
| `apps/web/e2e/dashboard-quick-add.spec.ts`                              | E2E                    | **Partial**   | Asserts `Последняя глюкоза` region and glucose value after Quick Add                                                        | **Yes** — English section labels; mixed-language value acceptable                                                |
| `apps/web/e2e/timeline-event-details.spec.ts`                           | E2E                    | **Partial**   | Asserts Last Glucose region after edit                                                                                      | **Yes** — selector updates only                                                                                  |
| `docs/architecture/dashboard/last-glucose.md`                           | Architecture           | **Yes**       | Boundaries, responsibilities                                                                                                | **Yes** — note I18N-02B2 audit                                                                                   |
| `docs/specs/dashboard/last-glucose.md`                                  | Spec                   | **Yes**       | States, validation, Russian approved copy                                                                                   | **No logic change**                                                                                              |
| `docs/ui/dashboard/last-glucose.md`                                     | UI spec                | **Yes**       | Layout, a11y, Russian copy references                                                                                       | **No visual change**                                                                                             |

---

## Original strings

| File                                  | Current text                                | Purpose                                                        | Visible / assistive          | Source                                                      |
| ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `dashboard-last-glucose-model.ts`     | `Последняя глюкоза`                         | Section title (ready eyebrow area title + empty/error heading) | Visible + `aria-labelledby`  | `dashboardLastGlucoseLabels.title`                          |
| `dashboard-last-glucose-model.ts`     | `Последнее измерение`                       | Ready-state eyebrow                                            | Visible                      | `dashboardLastGlucoseLabels.eyebrow`                        |
| `dashboard-last-glucose-model.ts`     | `Загрузка последнего измерения глюкозы`     | Loading `sr-only` status                                       | Assistive                    | `dashboardLastGlucoseLabels.loading`                        |
| `dashboard-last-glucose-model.ts`     | `Измерение устарело.`                       | Stale ready note                                               | Visible                      | `dashboardLastGlucoseLabels.stale`                          |
| `dashboard-last-glucose-model.ts`     | `Последнее измерение недоступно.`           | Invalid ready input fallback                                   | Visible (empty presentation) | `dashboardLastGlucoseLabels.unavailable`                    |
| `dashboard-last-glucose-model.ts`     | `Измерений пока нет.`                       | Default empty state                                            | Visible                      | `dashboardLastGlucoseLabels.defaultEmpty`                   |
| `dashboard-last-glucose-model.ts`     | `Не удалось загрузить последнее измерение.` | Default error state                                            | Visible                      | `dashboardLastGlucoseLabels.defaultError`                   |
| `dashboard-last-glucose.tsx`          | (same labels via import)                    | Rendered copy                                                  | Visible / assistive          | Direct import of model constants                            |
| `deriveLastGlucose` / timeline events | `6,4 ммоль/л`, `8,8 ммоль/л`, etc.          | Ready glucose **value**                                        | Visible                      | **Not a label** — `TimelineEvent.value` presentation string |
| `deriveLastGlucose` / factory         | `08:00`, etc.                               | Display time                                                   | Visible in `<time>`          | Formatted via `Intl` (integration model / factory)          |
| `lib/mocks/timeline.ts`               | `lastGlucose.value = '6,4 ммоль/л'`         | Legacy mock                                                    | —                            | **Unused in production path** (dead export)                 |
| Model / integration tests             | Russian fixtures                            | Contract tests                                                 | Test-only                    | Reflect production Russian contracts today                  |

**Not present in block (do not create keys):**

- trend text
- low / inRange / high status labels
- target range copy
- tooltips, buttons, separate value label, unit-only label

---

## Data source and business logic

### Data flow (current)

```text
useTimelineStore().events
  → deriveDashboardQuickAddBlocks({ events }, { locale: DASHBOARD_LOCALE, timeZone, referenceTime })
      → getLatestGlucoseEvent(events)          // selector: latest glucose by dateTime sort
      → formatTimelineDisplayTime(dateTime)    // Intl time formatting
      → { value: event.value, displayTime, dateTime }
  → dashboard-root: derivedBlocks.lastGlucose
  → DashboardLastGlucose({ glucose, referenceTime, state: 'ready' })
  → createDashboardLastGlucoseViewModel()
  → JSX
```

Empty path: no glucose events → `DashboardLastGlucose state="empty"`.

### Business rules (must not change)

| Rule                     | Implementation                                                                       | Location                |
| ------------------------ | ------------------------------------------------------------------------------------ | ----------------------- |
| Latest glucose selection | `getLatestGlucoseEvent` → filter `kind === 'glucose'`, sort by `dateTime`, take last | `timeline-selectors.ts` |
| Source of truth          | Shared Timeline store events                                                         | `useTimelineStore()`    |
| No target range          | Explicit test + spec                                                                 | model/spec              |
| No classification        | No low/high/inRange logic exists                                                     | —                       |
| No unit conversion       | Value passed through as display string                                               | `deriveLastGlucose`     |
| Stale threshold          | 24h default (`DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS`)                                  | model                   |
| Invalid ready → empty    | `normalizeReadyMeasurement` downgrade                                                | model                   |
| Dashboard/Timeline sync  | Same event store; Quick Add `addEvent` updates both views                            | `dashboard-root`        |

### Canonical vs presentation data

| Field                    | Canonical                   | Current form                          | Notes                                       |
| ------------------------ | --------------------------- | ------------------------------------- | ------------------------------------------- |
| `TimelineEvent.dateTime` | ISO instant                 | string                                | Machine `dateTime` for `<time>`             |
| `TimelineEvent.value`    | **Presentation string**     | e.g. `6,4 ммоль/л`                    | Includes number + unit text; not structured |
| `TimelineEvent.unit`     | Optional field              | Usually absent on glucose demo events | Not used by Last Glucose today              |
| `displayTime`            | Presentation                | Formatted `HH:mm`                     | Derived at integration layer                |
| Glucose numeric          | Implicit in Quick Add entry | `valueMmol: number` at creation only  | Lost after `formatGlucoseValue()`           |

---

## Business invariants (migration must preserve)

- `getLatestGlucoseEvent` selection algorithm unchanged
- Event sort order unchanged
- Shared Timeline store as source of truth
- Stale detection math unchanged
- Ready/empty/error downgrade rules unchanged
- No new interactivity
- Quick Add behaviour unchanged
- No medical interpretation added

---

## Formatting audit

| Value                         | Current implementation                                                                                 | Where                                                                    | Target responsibility                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Display time (`08:00`)        | `Intl.DateTimeFormat(locale, { hour, minute, timeZone })`                                              | `formatTimelineDisplayTime`, `createDashboardLastGlucoseMeasurement`     | `useFormatter().formatTime()` in container/integration boundary with `usePresentationContext()` locale/timeZone |
| Glucose value (`6,4 ммоль/л`) | Owner-prepared string from `TimelineEvent.value`; Quick Add uses `toLocaleString('ru-RU')` + `ммоль/л` | `deriveLastGlucose` pass-through; `formatGlucoseValue` at event creation | **See glucose value contract below**                                                                            |
| Unit text                     | Embedded inside `value` string                                                                         | Timeline event                                                           | Not separate today                                                                                              |
| Stale age                     | `referenceTime - dateTime > staleAfterMs`                                                              | Pure model                                                               | Stays in model (not formatting)                                                                                 |
| Section labels                | Hardcoded Russian constants                                                                            | Model + view                                                             | `useLocalization()` → labels resolver                                                                           |

### Glucose value contract

| Aspect                    | Finding                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical type in block   | `string` (`DashboardLastGlucoseMeasurement.value`)                                                                                                                 |
| Number vs string          | **String** — spec accepts owner-prepared display strings                                                                                                           |
| Decimal precision         | Owner-defined (`6,4` comma or `115` dot)                                                                                                                           |
| Units                     | Embedded: `ммоль/л` (Russian) or `mg/dL` (English demo tests)                                                                                                      |
| Medical conversion        | **Not performed** — spec forbids                                                                                                                                   |
| `formatMeasurement()` fit | Requires `DisplayMeasurement { value: number, unit: 'mmol/L' \| 'mg/dL' }` — **not available from current `TimelineEvent.value` without parsing or domain change** |

**Recommendation:** Phase 1 migration localizes **labels + time** via platform hooks. Glucose **value** remains pass-through of `TimelineEvent.value` with documented transitional mixed-language UI (Russian-formatted values from Quick Add) until glucose events carry structural numeric+unit data (future Timeline/domain work). Re-formatting via `formatMeasurement()` is optional only if a Last-Glucose-only mapper can reliably parse existing demo strings without changing `TimelineEvent` — treat as technical debt, not required for approval.

**Risk:** If implementation mandates full `formatMeasurement()` without pass-through, stop and escalate (see stop conditions).

### Time contract

| Aspect               | Finding                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Display style        | Absolute `HH:mm` (24h in `formatTimelineDisplayTime`)                                                                                    |
| Source instant       | `TimelineEvent.dateTime` (ISO)                                                                                                           |
| Time zone            | `dashboard-root` → `Intl.DateTimeFormat().resolvedOptions().timeZone` passed to `deriveDashboardQuickAddBlocks`                          |
| Relative time        | **Not used**                                                                                                                             |
| `<time dateTime>`    | Machine ISO from measurement                                                                                                             |
| Formatter API        | `PlatformFormatter.formatTime(dateTime, { timeStyle: 'short' })` — **supported without Platform API change**                             |
| Presentation context | **Required** — replace hardcoded `DASHBOARD_LOCALE = 'ru-RU'` for Last Glucose derivation path with presentation context locale/timeZone |

### Unit contract

| Aspect                | Finding                                                               |
| --------------------- | --------------------------------------------------------------------- |
| Domain enum           | `MeasurementUnit = 'mmol/L' \| 'mg/dL'` exists in Formatting Platform |
| Storage               | Embedded in presentation string, not `TimelineEvent.unit`             |
| `formatMeasurement()` | Supported for structured `DisplayMeasurement` — not wired today       |
| Medical conversion    | Out of scope                                                          |

---

## Medical safety boundary

| Question                           | Answer                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Classification (low/inRange/high)? | **No** — block does not classify                                                             |
| Where computed?                    | N/A                                                                                          |
| Target ranges?                     | **No** — explicit spec + test                                                                |
| Diabetes Profile / thresholds?     | **Not used**                                                                                 |
| What can be localized?             | Section title, eyebrow, loading, empty, error, stale, unavailable messages only              |
| What must not change?              | Value meaning, selection of latest event, stale threshold duration, no conversion, no alerts |

Localization translates **presentation labels** only. The displayed glucose string and time remain faithful to upstream data.

---

## Proposed translation keys

Existing `dashboard` namespace: `dashboard.header.*`, `dashboard.nextAction.*` only. No `dashboard.lastGlucose.*` yet. No suitable `common` keys.

### Proposed keys (7 — all strings present in block today)

| Key                                   | Proposed English                     | Maps to                |
| ------------------------------------- | ------------------------------------ | ---------------------- |
| `dashboard.lastGlucose.title`         | Last glucose                         | Section title          |
| `dashboard.lastGlucose.eyebrow`       | Last measurement                     | Ready eyebrow          |
| `dashboard.lastGlucose.loading`       | Loading last glucose measurement     | Loading `sr-only`      |
| `dashboard.lastGlucose.stale`         | Measurement is outdated.             | Stale note             |
| `dashboard.lastGlucose.unavailable`   | Last measurement unavailable.        | Invalid ready fallback |
| `dashboard.lastGlucose.empty.default` | No measurements yet.                 | Default empty          |
| `dashboard.lastGlucose.error.default` | Could not load the last measurement. | Default error          |

**Not proposed** (no corresponding UI today):

- `dashboard.lastGlucose.status.low|inRange|high`
- `dashboard.lastGlucose.time.label`
- `dashboard.lastGlucose.value.label`
- trend keys

**ICU / interpolation:** Not required. No parameterized strings identified. If future copy needs `{value}` composition, defer to platform ICU capability (stop condition if mandatory).

---

## Namespace / preload

| Check                      | Result                              |
| -------------------------- | ----------------------------------- |
| Namespace                  | `dashboard` (existing) — sufficient |
| New namespace needed?      | **No**                              |
| Timeline namespace needed? | **No**                              |
| Preload change?            | **No** — `['common', 'dashboard']`  |
| Route-aware preload?       | **No**                              |

---

## Integration architecture (recommended)

```text
usePresentationContext() → locale, timeZone
useLocalization() → resolveDashboardLastGlucoseLabels()
useFormatter() → formatTime (in deriveLastGlucose or container mapper)

deriveLastGlucose(events, formatter, locale, timeZone)
  → { value: event.value, displayTime: formatter.formatTime(...), dateTime }

DashboardLastGlucose
  → createDashboardLastGlucoseViewModel(props, labels)
  → JSX
```

### Hooks decision

| Hook                       | Required? | Reason                                                       |
| -------------------------- | --------- | ------------------------------------------------------------ |
| `useLocalization()`        | **Yes**   | Block labels and state copy                                  |
| `useFormatter()`           | **Yes**   | Display time formatting (replace `Intl` in integration path) |
| `usePresentationContext()` | **Yes**   | Locale/timeZone for derivation and time formatting           |

Pure model receives: labels, formatted `DashboardLastGlucoseMeasurement`, stale options.

Remove `Intl.*` from:

- `dashboard-last-glucose-model.ts` (`createDashboardLastGlucoseMeasurement`)
- Last Glucose path in `deriveLastGlucose` (stop using `formatTimelineDisplayTime` for this block)

---

## Accessibility

| Element                     | Current                                         | Migration                                    |
| --------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `<section aria-labelledby>` | Points to `h2#dashboard-last-glucose-title`     | Unchanged structure; title becomes localized |
| Loading                     | `aria-busy`, `sr-only` title + status           | Localized title + loading message            |
| Ready value                 | Visible text, no separate `aria-label`          | Value pass-through unchanged                 |
| `<time dateTime>`           | ISO + display time                              | Unchanged semantics                          |
| Stale note                  | Visible text when stale                         | Localized stale message                      |
| Empty / error               | `role="status"` / `role="alert"`, `aria-live`   | Localized messages                           |
| Icon                        | `aria-hidden`                                   | Unchanged                                    |
| Color                       | No status color coding (no in-range indicators) | Unchanged                                    |

Assistive strings requiring translation keys: title, loading, stale, unavailable, empty default, error default. Eyebrow is visible text in ready state (also translated).

---

## Responsive constraints

Existing layout verified in docs:

- Mobile: full width after Next Action
- Tablet: `sm:col-span-1` beside Day Summary
- Desktop: `lg:col-span-7`
- `h-full` row alignment with Day Summary
- Value right-aligned; `tabular-nums` on time

Potential English considerations:

- Longer labels (`Last glucose measurement` loading text) — `sr-only` only
- `mg/dL` vs `ммоль/л` width — value area already `shrink-0 text-right`
- No visual redesign; minimal wrap corrections only if English eyebrow overflows

---

## Existing tests

| Test file                                        | Covers                                             | Update at implementation?                            | Preserve                                    |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `dashboard-last-glucose-model.test.mjs`          | Ready/empty/error/loading/stale, factory, no range | **Yes** — English labels; factory moves to formatter | Business rules, stale math, downgrade logic |
| `dashboard-quick-add-integration-model.test.mjs` | `deriveLastGlucose` from events                    | **Yes** — locale/time expectations                   | Selection logic, day summary untouched      |
| `timeline-selectors.test.mjs`                    | `getLatestGlucoseEvent`                            | **No**                                               | Selection algorithm                         |
| `timeline-store-model.test.mjs`                  | Store mutations                                    | **No**                                               | Store behaviour                             |
| `dashboard-quick-add.spec.ts`                    | Last Glucose region + value sync                   | **Yes** — English region name                        | Sync behaviour                              |
| `timeline-event-details.spec.ts`                 | Last Glucose after edit                            | **Yes** — region selector                            | Edit sync                                   |
| `timeline-pagination.spec.ts`                    | Glucose Quick Add (not Last Glucose block)         | **No**                                               | —                                           |

### Baseline counts (main @ `297e5d5`)

| Suite          | Count   |
| -------------- | ------- |
| Web unit tests | **312** |
| E2E            | **24**  |

---

## Proposed tests (implementation)

### Resources

- 7 keys exist, non-empty English, `dashboard` namespace, no duplicates

### Labels

- resolver returns canonical English; immutable output

### Formatting

- `formatTime` used for display time; no `Intl` in migrated files
- correct time zone from presentation context
- value pass-through or `formatMeasurement` per approved value strategy

### Model

- stale, empty downgrade, error, loading unchanged
- no range/classification fields introduced

### React integration

- `TestPlatformProvider` render with English labels
- loading `sr-only` announcement

### E2E vertical slice (new `dashboard-last-glucose-i18n.spec.ts`)

1. Dashboard ready
2. English section title / eyebrow
3. Formatted time visible
4. Add glucose via Quick Add (Russian form OK)
5. Last Glucose updates
6. Edit in Timeline → Dashboard sync
7. Delete latest → fallback to previous
8. Timeline still functional

---

## Stop conditions

| #   | Condition                                    | Audit result                                                                               |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Formatting Platform public API change        | **Not triggered** — `formatTime`, `formatMeasurement` exist                                |
| 2   | Medical unit conversion                      | **Not triggered** — out of scope; pass-through recommended                                 |
| 3   | TimelineEvent domain model change            | **Not triggered** if value pass-through; **triggered** if structural glucose required      |
| 4   | Selector/business logic change               | **Not triggered**                                                                          |
| 5   | Diabetes Profile architecture                | **Not triggered** — not present                                                            |
| 6   | ICU/interpolation                            | **Not triggered** — static labels only                                                     |
| 7   | New namespace                                | **Not triggered**                                                                          |
| 8   | Route-aware preload                          | **Not triggered**                                                                          |
| 9   | Timeline/Quick Add migration                 | **Not triggered** for labels+time slice; **triggered** if changing `formatGlucoseValue`    |
| 10  | ADR-0012/0013 change                         | **Not triggered**                                                                          |
| 11  | Ambiguous canonical glucose value            | **Flagged** — `TimelineEvent.value` is presentation string; document pass-through strategy |
| 12  | Cannot format time with presentation context | **Not triggered** — context available via CR-03A/B/C                                       |

**No stop condition blocks audit approval.** Implementation must confirm glucose value strategy before coding.

---

## Risks

| Risk                                                             | Mitigation                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| Mixed-language UI (EN labels + RU glucose values from Quick Add) | Document transitional state; same pattern as I18N-02B1   |
| `Intl` in model factory                                          | Remove during implementation; move to formatter boundary |
| Dead `lastGlucose` mock export                                   | Remove or structural-only cleanup in implementation      |
| Parsing glucose strings for `formatMeasurement`                  | Avoid unless explicitly approved; prefer pass-through    |
| E2E region name change (`Последняя глюкоза` → English)           | Update selectors in 2–3 specs                            |

---

## Technical debt

| Item                                                               | Notes                                                                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `TimelineEvent.value` as presentation string                       | Blocks full `formatMeasurement()` without domain or parser                                           |
| `DASHBOARD_LOCALE = 'ru-RU'` in `dashboard-root`                   | Used for Day Summary / other blocks; Last Glucose path should use presentation context independently |
| `formatGlucoseValue` uses `toLocaleString('ru-RU')`                | Quick Add scope; creates RU values visible on EN Dashboard                                           |
| Legacy `LastGlucose` type + unused mock                            | Cleanup candidate                                                                                    |
| `createDashboardLastGlucoseMeasurement` duplicates time formatting | Consolidate with integration-layer formatter                                                         |

---

## Approved implementation scope

- Localize all 7 block labels via `dashboard.lastGlucose.*`
- Replace `Intl` time formatting with `PlatformFormatter.formatTime()` via
  `useDashboardLastGlucosePresentation()` + `usePresentationContext()` time zone
- Pass through `TimelineEvent.value` as display string (no unit conversion, no
  classification)
- Remove hardcoded `dashboardLastGlucoseLabels` from model/view
- Preload unchanged (`common` + `dashboard`)

### Transitional glucose value contract

`TimelineEvent.value` remains a **presentation string** produced upstream (Quick
Add `formatGlucoseValue()` still uses `ru-RU`). Last Glucose displays that
string unchanged. English block labels + Russian glucose values on Dashboard is
expected until a structural glucose contract enables `formatMeasurement()`.

**Full measurement formatting is deferred** until Timeline/domain exposes
structured glucose fields (numeric value + unit), not in I18N-02B2.

---

## Localization integration (implemented)

```text
useTimelineStore().events
  ↓
dashboard-root: useDashboardLastGlucosePresentation()
  → formatLastGlucoseDisplayTime = formatter.formatTime(..., { timeStyle: 'short' })
  ↓
deriveDashboardQuickAddBlocks({ formatLastGlucoseDisplayTime })
  → deriveLastGlucose → { value: event.value, displayTime, dateTime }
  ↓
DashboardLastGlucose: useDashboardLastGlucosePresentation() → labels
  → createDashboardLastGlucoseViewModel(props, labels)
  ↓
JSX
```

---

## Translation keys (implemented)

| Key                                   | English value                        |
| ------------------------------------- | ------------------------------------ |
| `dashboard.lastGlucose.title`         | Last glucose                         |
| `dashboard.lastGlucose.eyebrow`       | Last measurement                     |
| `dashboard.lastGlucose.loading`       | Loading last glucose measurement     |
| `dashboard.lastGlucose.stale`         | Measurement is outdated.             |
| `dashboard.lastGlucose.unavailable`   | Last measurement unavailable.        |
| `dashboard.lastGlucose.empty.default` | No measurements yet.                 |
| `dashboard.lastGlucose.error.default` | Could not load the last measurement. |

---

## Recommendation

**Ready for review** — implementation matches approved minimal slice.

Defer full glucose value re-formatting via `formatMeasurement()` to a future
domain/Timeline structural glucose contract.

---

## Engineering Audit (I18N-02B2)

### 1. General information

| Field      | Value                                           |
| ---------- | ----------------------------------------------- |
| Stage      | I18N-02B2 — Dashboard Last Glucose Localization |
| Phase      | **Feature Complete** (merged via PR #24)        |
| Base       | `main` @ `297e5d5`                              |
| Branch     | `feature/i18n-dashboard-last-glucose`           |
| Unit tests | **324** web (+12)                               |
| E2E tests  | **25** (+1)                                     |

### 2. Goal

Migrate Last Glucose labels and time formatting to Platform Localization +
Formatting stack; preserve business logic, stale semantics, and medical
neutrality. Glucose values remain pass-through presentation strings.

### 3. Scope / out of scope

Confirmed per sections above. Single vertical slice. Quick Add, Timeline,
Day Summary, other Dashboard blocks unchanged.

### 4. Changed files

| Action | Path                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Create | `dashboard-last-glucose-labels.ts`                                                                       |
| Create | `use-dashboard-last-glucose-presentation.ts`                                                             |
| Create | `dashboard-last-glucose-labels.test.mjs`                                                                 |
| Create | `dashboard-last-glucose-resources.test.mjs`                                                              |
| Create | `dashboard-last-glucose.integration.test.mjs`                                                            |
| Create | `e2e/dashboard-last-glucose-i18n.spec.ts`                                                                |
| Modify | `dashboard-last-glucose.tsx`, `dashboard-last-glucose-model.ts`, `dashboard-last-glucose-model.test.mjs` |
| Modify | `dashboard-root.tsx` (presentation hook + `formatLastGlucoseDisplayTime`)                                |
| Modify | `lib/dashboard/dashboard-quick-add-integration-model.ts` (+ test)                                        |
| Modify | `packages/locales/*` (7 keys)                                                                            |
| Modify | `e2e/dashboard-quick-add.spec.ts`, `e2e/timeline-event-details.spec.ts` (selectors)                      |
| Docs   | this file, `docs/architecture/dashboard/last-glucose.md`                                                 |

### 5. Translation resources

7 new keys under `dashboard.lastGlucose.*` in `@diabetes-universe/locales`.
Canonical list updated in `canonical-translation-key.ts`.

### 6. Keys / namespace

`dashboard` namespace only. No overlap with `dashboard.header.*` or
`dashboard.nextAction.*`.

### 7. Preload

Unchanged. `common` + `dashboard`. Resource tests confirm keys resolve from
preloaded namespace.

### 8. Localization integration

- `useDashboardLastGlucosePresentation()` — `useLocalization()` +
  `useFormatter()` + `usePresentationContext()` (time zone)
- View: labels → `createDashboardLastGlucoseViewModel(props, labels)`
- Container: `formatLastGlucoseDisplayTime` injected into
  `deriveDashboardQuickAddBlocks`

### 9. Formatting decision

- **Time:** `PlatformFormatter.formatTime(dateTime, { timeStyle: 'short' })`
- **Value:** pass-through `TimelineEvent.value` — **no** `formatMeasurement()`
- **No `Intl.*`** in migrated model/view/labels/presentation hook files
- `deriveLastGlucose` no longer imports `formatTimelineDisplayTime`

### 10. Transitional glucose value contract

| Field          | Contract                                              |
| -------------- | ----------------------------------------------------- |
| `value`        | Opaque presentation string from Timeline event        |
| Conversion     | None                                                  |
| Classification | None (no low/inRange/high)                            |
| Mixed UI       | EN labels + RU values from Quick Add — expected       |
| Deferred       | `formatMeasurement()` until structural glucose fields |

### 11. Model / view architecture

Pure model receives `DashboardLastGlucoseLabels` and measurement primitives
only. No `LocalizationPlatform`, `PlatformFormatter`, `PlatformRuntime`, or
React/browser objects in model.

`createDashboardLastGlucoseMeasurement(measuredAt, value, formatDisplayTime)`
accepts injected formatter callback.

### 12. Business logic invariants (preserved)

| Invariant                         | Status    |
| --------------------------------- | --------- |
| `getLatestGlucoseEvent` selector  | Unchanged |
| Sort by `dateTime`                | Unchanged |
| Stale threshold 24h               | Unchanged |
| Loading/empty/error semantics     | Unchanged |
| Invalid ready → unavailable empty | Unchanged |
| No target range                   | Unchanged |
| Shared timeline store             | Unchanged |

### 13. Accessibility

| Element           | Source                                                 |
| ----------------- | ------------------------------------------------------ |
| Section `h2`      | `labels.title` (English)                               |
| Ready eyebrow     | `labels.eyebrow`                                       |
| Loading `sr-only` | `labels.loading` via view model                        |
| Stale note        | `labels.stale`                                         |
| Empty/error       | `labels.defaultEmpty` / `defaultError` / `unavailable` |

### 14. Testing

| Suite                                            | Coverage                                     |
| ------------------------------------------------ | -------------------------------------------- |
| `dashboard-last-glucose-resources.test.mjs`      | 7 canonical keys                             |
| `dashboard-last-glucose-labels.test.mjs`         | resolver + preload                           |
| `dashboard-last-glucose-model.test.mjs`          | states, stale, pass-through value            |
| `dashboard-last-glucose.integration.test.mjs`    | React render, formatter integration, no Intl |
| `dashboard-quick-add-integration-model.test.mjs` | injected time formatter                      |
| `dashboard-last-glucose-i18n.spec.ts`            | vertical: add → edit → delete → sync         |

### 15. Validation

| Command                                     | Result   |
| ------------------------------------------- | -------- |
| `pnpm format:check`                         | Pass     |
| `pnpm lint`                                 | Pass     |
| `pnpm typecheck`                            | Pass     |
| `pnpm --filter @diabetes-universe/web test` | 324 pass |
| `pnpm build`                                | Pass     |
| `pnpm test:e2e`                             | 25 pass  |

### 16. Technical debt

| Item                            | Notes                                          |
| ------------------------------- | ---------------------------------------------- |
| `TimelineEvent.value` as string | Blocks `formatMeasurement()`                   |
| `DASHBOARD_LOCALE = 'ru-RU'`    | Day Summary / other blocks — unchanged         |
| `formatGlucoseValue` RU locale  | Quick Add scope                                |
| Mixed-language Dashboard        | Day Summary, Recent Events, Quick Add still RU |

### 17. Stop conditions

- Platform API change — **not triggered**
- `formatMeasurement()` — **deferred** per transitional contract
- I18N-02B3 — **not started**

### 18. Git status

```
Branch: feature/i18n-dashboard-last-glucose
Commit / push / PR: not performed (per task instructions)
```

### 19. Executive summary

I18N-02B2 delivers English Last Glucose block labels via 7 `dashboard.lastGlucose.*`
keys, moves display-time formatting to `PlatformFormatter.formatTime()` at the
presentation hook boundary, and keeps glucose values as pass-through
`TimelineEvent.value` strings. Pure model stays platform-free; stale logic,
selector, and Dashboard/Timeline sync are unchanged. Full measurement
formatting remains deferred until a structural glucose contract exists.

---

## Architecture Audit Report (Stage 1 — historical)

### 1. General information

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Stage          | I18N-02B2 — Dashboard Last Glucose Localization |
| Phase          | **Stage 1 — Architecture Audit Only**           |
| Base           | `main` @ `297e5d5`                              |
| Branch         | `feature/i18n-dashboard-last-glucose`           |
| Baseline tests | 312 web / 24 E2E                                |

### 2–3. Goal / scope

Migrate Last Glucose labels and time formatting to Platform stack; preserve business logic and medical neutrality. Scope per sections above.

### 4. File map

See **File map** section (17 files analysed).

### 5. All strings

7 Russian label constants + presentation value/time from Timeline. No trend/status strings.

### 6. Data flow

See **Data source** section.

### 7. Source of truth

Shared `useTimelineStore()` events; `getLatestGlucoseEvent` selector.

### 8. Business invariants

Preserved list in **Business invariants** section.

### 9–12. Formatting / glucose / unit / time

See **Formatting audit** subsections.

### 13. Medical safety

No classification; localization of labels only.

### 14. Translation keys

7 proposed `dashboard.lastGlucose.*` keys.

### 15. Preload

Unchanged `common` + `dashboard`.

### 16. Hooks decision

`useLocalization()` + `useFormatter()` + `usePresentationContext()`.

### 17. Model/view boundary

Labels + formatted measurement in; no platform services in model.

### 18–19. Accessibility / responsive

Documented above; no visual redesign.

### 20–21. Existing tests / proposed test plan

Documented above.

### 22. Documentation

This document + navigation index updates.

### 23. Architecture compliance

Matches I18N-02A/02B1 vertical slice pattern. No Platform API change required for recommended scope.

### 24–26. Technical debt / limitations / risks

Documented above.

### 27. Stop-condition result

**No blockers** for recommended scope. Value formatting strategy must be confirmed at implementation kickoff.

### 28. Git status

```
Branch: feature/i18n-dashboard-last-glucose (audit docs only)
Production code: unchanged
Commit: not performed
```

### 29. Executive summary

Dashboard Last Glucose is a compact informational block with 7 Russian label constants, `Intl`-based time formatting in two places, and glucose values passed through as pre-formatted strings from Timeline events. There is no trend, status classification, or target range. Migration should follow the established labels-resolver + hooks + pure model pattern from I18N-02A/02B1, localize all block copy, move time formatting to `useFormatter()`, and use presentation context instead of `DASHBOARD_LOCALE` for the Last Glucose derivation path. Glucose values should remain pass-through in the first implementation slice unless architectural approval explicitly requires `formatMeasurement()` and accepts the domain/parser implications.

**Confirmed:**

- Production code not changed
- Header, Next Action, Day Summary, Recent Events, AI Insight, Timeline, Quick Add — unchanged
- Platform API — unchanged
- I18N-02B3 — not started

## Architecture references

- [I18N-02A — Dashboard Header Migration](dashboard-header-migration.md)
- [I18N-02B1 — Dashboard Next Action Migration](dashboard-next-action-migration.md)
- [Dashboard Last Glucose Architecture](../dashboard/last-glucose.md)
- [Platform Readiness](platform-readiness.md)
- [Formatting Platform](../../../packages/formatting/README.md)
