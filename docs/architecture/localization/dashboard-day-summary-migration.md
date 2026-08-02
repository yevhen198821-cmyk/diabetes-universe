# Dashboard Day Summary Localization Migration (I18N-02B3)

## Status

Implementation Complete — Ready for Review

## Purpose

Audit the Dashboard Day Summary block before migrating it to the approved
Localization Platform, Formatting Platform, and Presentation Context stack.
Determine minimal implementation scope, translation keys, formatting
responsibilities, day-boundary semantics, pluralization needs, risks, and stop
conditions.

## Scope

- `DashboardDaySummary` view and presentation model
- `deriveDaySummary()` path in dashboard integration model
- `createDashboardDaySummaryDayLabel()` factory in model
- Dashboard root/container wiring
- shared timeline selectors used for today aggregation
- mock/demo data relevant to Day Summary derivation
- shared types used by the block (analysis only)
- existing unit/integration/E2E coverage touching Day Summary
- accessibility and responsive behaviour documentation

## Out of scope

- implementation (awaiting architectural approval)
- Dashboard Header (I18N-02A — Feature Complete)
- Next Action (I18N-02B1 — Feature Complete)
- Last Glucose (I18N-02B2 — Feature Complete)
- Recent Events, AI Insight (I18N-02B4+)
- Quick Add dialog/form copy
- Timeline product source
- locale switch, new languages, ICU/interpolation implementation
- route-aware preload, Platform public API changes
- medical unit conversion, target ranges, adherence scoring
- ADR Decision section changes
- Design System changes

---

## File map

| File                                                                    | Role                     | Day Summary? | Contains                                                                                                                       | Change at implementation                                                                         |
| ----------------------------------------------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/web/components/dashboard/dashboard-day-summary.tsx`               | View                     | **Yes**      | JSX, hardcoded `dashboardDaySummaryLabels`, `MetricList` dl/dt/dd                                                              | **Yes** — `useLocalization()` / labels resolver                                                  |
| `apps/web/components/dashboard/dashboard-day-summary-model.ts`          | Pure model + factory     | **Yes**      | View model, `dashboardDaySummaryLabels`, `createDashboardDaySummaryDayLabel()` with `Intl`, metric mapping, reminders template | **Yes** — inject labels; remove `Intl.*` from factory; keep validation                           |
| `apps/web/components/dashboard/dashboard-day-summary-model.test.mjs`    | Model tests              | **Yes**      | Russian fixtures, ready/empty/error, day label factory, no TIR/GMI                                                             | **Yes** — English label fixtures; formatting tests adjusted                                      |
| `apps/web/components/dashboard/dashboard-day-summary-labels.ts`         | Label resolver           | **No — new** | —                                                                                                                              | **Yes — create** (mirror Header / Next Action / Last Glucose)                                    |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`       | Integration / derivation | **Partial**  | `deriveDaySummary()`, `createDashboardDayLabel()`, `DashboardDerivedDaySummary`, totals via selectors + Quick Add formatters   | **Yes** — move day label formatting to formatter boundary; optional totals pass-through strategy |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.test.mjs` | Integration tests        | **Partial**  | `daySummary` totals and counts from events                                                                                     | **Yes** — day label / formatter expectations if derivation path changes                          |
| `apps/web/components/dashboard/dashboard-root.tsx`                      | Container                | **Partial**  | Wires `derivedBlocks.daySummary`, `DASHBOARD_LOCALE`, `dashboardTimeZone`, mock `remindersCompleted/Total`                     | **Minimal** — formatter callback for day label; no other block changes                           |
| `apps/web/lib/timeline/timeline-selectors.ts`                           | Shared selectors         | **Partial**  | `getTodayTimelineEvents`, `getTodayInsulinTotal`, `getTodayNutritionTotal`, `getTodayMedicationCount`, `isSameLocalDay`        | **No** — business selection unchanged                                                            |
| `apps/web/lib/timeline/timeline-selectors.test.mjs`                     | Selector tests           | **Partial**  | Today filters, timezone boundary, totals                                                                                       | **No** — preserve day-boundary contracts                                                         |
| `apps/web/lib/timeline/timeline-date-time.ts`                           | Shared time helper       | **Partial**  | `getTimelineCalendarDateKey()` used by today filter                                                                            | **No** for selector itself; Day Summary derivation should stop duplicating Intl where possible   |
| `apps/web/lib/quick-add/format-insulin.ts`                              | Quick Add formatter      | **No**       | `formatInsulinDose()` — `toLocaleString('ru-RU')`                                                                              | **No** — Quick Add scope; creates RU totals visible on EN Dashboard                              |
| `apps/web/lib/quick-add/format-nutrition.ts`                            | Quick Add formatter      | **No**       | `formatNutritionCarbs()` — `toLocaleString('ru-RU')`                                                                           | **No** — Quick Add scope                                                                         |
| `apps/web/lib/mocks/timeline.ts`                                        | Demo data                | **Partial**  | `timelineEvents` feed derivation; legacy `daySummary: DaySummary { timeInRange }` unused by Dashboard block                    | **Maybe** — remove or document legacy mock only; no presentation strings needed                  |
| `packages/types/src/timeline.ts`                                        | Shared contract          | **Analysis** | `TimelineEvent`; legacy `DaySummary { timeInRange }` unrelated to Dashboard block                                              | **No** — Dashboard uses `DashboardDaySummaryData`, not legacy type                               |
| `apps/web/components/dashboard/dashboard-shell.tsx`                     | Layout shell             | **No**       | Renders `daySummary` slot after Last Glucose                                                                                   | **No**                                                                                           |
| `packages/ui`                                                           | UI primitives            | **No**       | No Day Summary-specific components                                                                                             | **No**                                                                                           |
| `apps/web/e2e/dashboard-quick-add.spec.ts`                              | E2E                      | **Partial**  | Asserts `Сводка дня` region and insulin totals after Quick Add                                                                 | **Yes** — English region/metric selectors                                                        |
| `apps/web/e2e/dashboard-next-action-i18n.spec.ts`                       | E2E                      | **Partial**  | Day Summary region for insulin total assertion                                                                                 | **Yes** — selector updates                                                                       |
| `apps/web/e2e/application-platform-integration.spec.ts`                 | E2E                      | **Partial**  | Day Summary sync after Quick Add                                                                                               | **Yes** — selector updates                                                                       |
| `apps/web/e2e/timeline-event-details.spec.ts`                           | E2E                      | **Partial**  | Day Summary after delete (`0 ЕД`)                                                                                              | **Yes** — selector updates                                                                       |
| `docs/architecture/dashboard/day-summary.md`                            | Architecture             | **Yes**      | Boundaries, responsibilities                                                                                                   | **Yes** — note I18N-02B3 audit                                                                   |
| `docs/specs/dashboard/day-summary.md`                                   | Spec                     | **Yes**      | States, validation, Russian approved copy                                                                                      | **No logic change**                                                                              |
| `docs/ui/dashboard/day-summary.md`                                      | UI spec                  | **Yes**      | Layout, a11y, Russian copy references                                                                                          | **No visual change**                                                                             |

---

## Original strings

| File                             | Current text                         | Purpose                                     | Visible / assistive          | Source                                                       |
| -------------------------------- | ------------------------------------ | ------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `dashboard-day-summary-model.ts` | `Сводка дня`                         | Section title (ready + empty/error heading) | Visible + `aria-labelledby`  | `dashboardDaySummaryLabels.title`                            |
| `dashboard-day-summary-model.ts` | `Текущий день`                       | Ready-state eyebrow                         | Visible                      | `dashboardDaySummaryLabels.eyebrow`                          |
| `dashboard-day-summary-model.ts` | `Загрузка сводки дня`                | Loading `sr-only` status                    | Assistive                    | `dashboardDaySummaryLabels.loading`                          |
| `dashboard-day-summary-model.ts` | `Сводка дня недоступна.`             | Invalid ready input fallback                | Visible (empty presentation) | `dashboardDaySummaryLabels.unavailable`                      |
| `dashboard-day-summary-model.ts` | `Данные за сегодня пока недоступны.` | Default empty state                         | Visible                      | `dashboardDaySummaryLabels.defaultEmpty`                     |
| `dashboard-day-summary-model.ts` | `Не удалось загрузить сводку дня.`   | Default error state                         | Visible                      | `dashboardDaySummaryLabels.defaultError`                     |
| `dashboard-day-summary-model.ts` | `Измерения глюкозы`                  | Primary metric label                        | Visible (`dt`)               | `dashboardDaySummaryLabels.glucoseMeasurements`              |
| `dashboard-day-summary-model.ts` | `Суммарный инсулин`                  | Primary metric label                        | Visible (`dt`)               | `dashboardDaySummaryLabels.totalInsulin`                     |
| `dashboard-day-summary-model.ts` | `Суммарные углеводы`                 | Primary metric label                        | Visible (`dt`)               | `dashboardDaySummaryLabels.totalCarbohydrates`               |
| `dashboard-day-summary-model.ts` | `Приёмы лекарств`                    | Secondary metric label                      | Visible (`dt`)               | `dashboardDaySummaryLabels.medicationDoses`                  |
| `dashboard-day-summary-model.ts` | `Напоминания`                        | Secondary metric label                      | Visible (`dt`)               | `dashboardDaySummaryLabels.reminders`                        |
| `dashboard-day-summary.tsx`      | (same labels via import)             | Rendered copy                               | Visible / assistive          | Direct import of model constants                             |
| `deriveDaySummary` output        | `воскресенье, 2 августа` (example)   | Current-day display label                   | Visible in `<time>`          | `Intl.DateTimeFormat` via `createDashboardDayLabel`          |
| `deriveDaySummary` output        | `4 ЕД`, `42 г` (examples)            | Insulin / carbs display totals              | Visible (`dd`)               | `formatInsulinDose` + `formatNutritionCarbs` + manual suffix |
| Model ready metrics              | `4`, `2`, `1 / 3`                    | Count / reminders values                    | Visible (`dd`)               | `String(count)`, `formatReminders()`                         |
| E2E selectors                    | `Сводка дня`                         | Region accessible name from `h2` title      | Test contract                | Russian title                                                |

No separate “Today” / “Yesterday” strings in Day Summary — the block shows a full
localized weekday date label for the current summary day.

Numeric metric values and RU unit suffixes in totals are presentation output,
not translation keys in the current architecture.

---

## Data flow

```text
useTimelineStore().events
  ↓
dashboard-root:
  referenceTime = new Date()
  locale = DASHBOARD_LOCALE ('ru-RU')
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  remindersCompleted = 1, remindersTotal = 3  (demo constants)
  ↓
deriveDashboardQuickAddBlocks({ events }, options)
  ↓
deriveDaySummary(events, referenceTime, locale, timeZone, reminders*)
  ├─ createDashboardDayLabel(referenceTime, locale, timeZone)
  │    → dayDate (YYYY-MM-DD), displayDayLabel (Intl weekday date)
  ├─ getTodayTimelineEvents(events, referenceTime, timeZone)
  ├─ glucoseMeasurements = today glucose events.length
  ├─ medicationDoses = getTodayMedicationCount(...)
  ├─ totalInsulinUnits = getTodayInsulinTotal(...)
  ├─ totalCarbohydrateGrams = getTodayNutritionTotal(...)
  └─ presentation totals:
       totalInsulin = `${formatInsulinDose(units)} ЕД`
       totalCarbohydrates = `${formatNutritionCarbs(grams)} г`
  ↓
DashboardDaySummary state="ready" summary={derived}
  ↓
createDashboardDaySummaryViewModel(props)
  ├─ normalizeReadySummary (validation)
  ├─ createReadyMetrics (labels + values)
  └─ JSX MetricList dl/dt/dd
```

### Source of truth

| Data              | Source                                                    | Canonical vs presentation              |
| ----------------- | --------------------------------------------------------- | -------------------------------------- |
| Timeline events   | `useTimelineStore()` shared with Timeline / Quick Add     | Canonical `TimelineEvent[]`            |
| Today membership  | `isSameLocalDay` → `getTimelineCalendarDateKey`           | Business rule in selectors             |
| Glucose count     | Count of `kind === 'glucose'` in today events             | Canonical `number`                     |
| Medication count  | Count of `kind === 'medication'` in today events          | Canonical `number`                     |
| Insulin total     | Sum `parseLeadingNumber(event.value)` for today insulin   | Canonical `number` → RU display string |
| Carbs total       | Sum `parseLeadingNumber(event.value)` for today nutrition | Canonical `number` → RU display string |
| Reminders         | Hardcoded demo values in `dashboard-root`                 | Canonical numbers (not from Timeline)  |
| `dayDate`         | Calendar key for `referenceTime` in time zone             | Canonical `YYYY-MM-DD`                 |
| `displayDayLabel` | Intl-formatted `referenceTime`                            | Presentation string                    |

### Event kinds included

| Kind         | Included in Day Summary                                    | Metric             |
| ------------ | ---------------------------------------------------------- | ------------------ |
| `glucose`    | Yes                                                        | Count              |
| `insulin`    | Yes                                                        | Sum of dose values |
| `nutrition`  | Yes                                                        | Sum of carb grams  |
| `medication` | Yes                                                        | Count              |
| `activity`   | No                                                         | —                  |
| `note`       | No (except if coincidentally in today filter, not counted) | —                  |

### Invariants migration must preserve

- Event inclusion rules and today filter (`getTodayTimelineEvents`)
- Day-boundary calculation (`getTimelineCalendarDateKey` + supplied time zone)
- Totals algorithms (`getTodayInsulinTotal`, `getTodayNutritionTotal`, `getTodayMedicationCount`)
- Unit semantics (insulin units, carb grams) — no conversion
- Shared timeline store as source of truth
- Dashboard/Timeline synchronization via same store
- Quick Add behaviour unchanged
- Loading/empty/error downgrade rules in pure model

---

## Day-boundary semantics

### What “today” means

“Today” = calendar day of `referenceTime` in the supplied IANA `timeZone`,
compared to each event’s `dateTime` using the same time zone via
`getTimelineCalendarDateKey`.

```text
isSameLocalDay(event.dateTime, referenceDate, timeZone):
  getTimelineCalendarDateKey(event.dateTime, timeZone)
  === getTimelineCalendarDateKey(referenceDate.toISOString(), timeZone)
```

The visible day label (`displayDayLabel`) is also derived from `referenceTime`
(not from individual events) in the same locale/time zone.

### Time zone source today

| Layer                         | Time zone used                                                      |
| ----------------------------- | ------------------------------------------------------------------- |
| `dashboard-root`              | `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser client) |
| `deriveDaySummary`            | Passed through from root                                            |
| Selectors                     | Same passed `timeZone` argument                                     |
| Platform bootstrap (ADR-0012) | Explicit cookie/request time zone for `PlatformRuntime`             |

**Observation:** Day Summary derivation currently uses browser-resolved time zone
on the client and hardcoded `DASHBOARD_LOCALE = 'ru-RU'`, not
`usePresentationContext()`. This matches the pre-I18N-02B transitional pattern
also used for Recent Events derivation.

**ADR-0012 / ADR-0013 alignment:**

- Canonical storage remains ISO `dateTime` on events (UTC instants).
- Display day boundaries use explicit IANA zone when provided to selectors.
- Migration may switch **presentation formatting** (day label locale) to
  Platform formatter/context **without changing** `isSameLocalDay` or selector
  inputs, provided the same `timeZone` string continues to be passed.
- Changing which time zone defines “today” would be a business semantics change —
  **stop condition**.

### Midnight / offset behaviour

- Events crossing local midnight belong to different `dayDate` keys.
- `timeline-selectors.test.mjs` includes `respects timezone offsets for local day membership` (Asia/Tokyo vs UTC).
- Day Summary inherits this behaviour through `getTodayTimelineEvents`.

### `dayDate` formation

Two parallel implementations exist:

1. `createDashboardDayLabel` in integration model — uses
   `getTimelineCalendarDateKey(referenceTime.toISOString(), timeZone)`
2. `createDashboardDaySummaryDayLabel` in model — duplicates Intl
   `formatToParts` logic directly

Implementation should consolidate on one calendar-key strategy
(`getTimelineCalendarDateKey`) at the presentation boundary.

### Safe migration boundary

| Safe (presentation only)              | Stop condition                               |
| ------------------------------------- | -------------------------------------------- |
| Localize labels                       | Change `isSameLocalDay` algorithm            |
| `formatDate` for `displayDayLabel`    | Change which events count as “today”         |
| `formatNumber` for integer counts     | Change insulin/carbs summation               |
| Pass-through RU totals (transitional) | Switch time zone source without ADR approval |
| Inject labels into pure model         | Change `reminders` data source               |

---

## Business invariants

| Invariant                                                                              | Current behaviour                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------ |
| Ready requires valid `YYYY-MM-DD`, non-empty label/totals, non-negative integer counts | `normalizeReadySummary`                    |
| `remindersCompleted > remindersTotal` → empty downgrade                                | Preserved                                  |
| Zero counts allowed when owner supplies explicit zeros                                 | Tested                                     |
| No charts, TIR, GMI, AI fields                                                         | Tested                                     |
| Missing derivation → `state="empty"` in root (not fabricated zeros)                    | `derivedBlocks.daySummary ? ready : empty` |
| Activity/note events do not affect metrics                                             | Selector filters by kind                   |

---

## Formatting audit

| Value                 | Current implementation                                           | Where                                                          | Target responsibility                                                                                |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `displayDayLabel`     | `Intl.DateTimeFormat(locale, { weekday, month, day, timeZone })` | `createDashboardDayLabel`, `createDashboardDaySummaryDayLabel` | `useFormatter().formatDate(referenceTime, { dateStyle: 'full' })` at container/derivation boundary   |
| `dayDate`             | `getTimelineCalendarDateKey` / `formatToParts`                   | Integration model / model factory                              | Keep canonical key generation; reuse `getTimelineCalendarDateKey`                                    |
| `glucoseMeasurements` | `String(count)`                                                  | Model `formatCount`                                            | `formatNumber(count)` or pass-through integer string                                                 |
| `medicationDoses`     | `String(count)`                                                  | Model `formatCount`                                            | Same                                                                                                 |
| `totalInsulin`        | `formatInsulinDose(n)` + ` ЕД`                                   | `deriveDaySummary` via Quick Add helper                        | **Transitional pass-through** recommended (I18N-02B2 pattern) OR `formatNumber` + localized unit key |
| `totalCarbohydrates`  | `formatNutritionCarbs(n)` + ` г`                                 | `deriveDaySummary`                                             | **Transitional pass-through** recommended OR `formatNumber` + localized unit key                     |
| `reminders` display   | `` `${completed} / ${total}` ``                                  | Model `formatReminders`                                        | Neutral label + two `formatNumber` values; separator can stay ASCII `/`                              |
| Insulin dose number   | `toLocaleString('ru-RU')`                                        | `format-insulin.ts`                                            | Out of scope (Quick Add source)                                                                      |
| Carbs number          | `toLocaleString('ru-RU')`                                        | `format-nutrition.ts`                                          | Out of scope (Quick Add source)                                                                      |

### Numbers

| Metric           | Canonical type                     | Precision                 | Zero state      |
| ---------------- | ---------------------------------- | ------------------------- | --------------- |
| Glucose count    | `number` (integer)                 | Exact count               | `0` allowed     |
| Medication count | `number` (integer)                 | Exact count               | `0` allowed     |
| Insulin total    | `number` (summed) → display string | 0–1 decimal via RU locale | `0 ЕД` allowed  |
| Carbs total      | `number` (summed) → display string | 0–1 decimal via RU locale | `0 г` allowed   |
| Reminders        | integers                           | Exact                     | `0 / 0` allowed |

### Units

| Unit                 | Canonical  | Storage                          | Conversion |
| -------------------- | ---------- | -------------------------------- | ---------- |
| Insulin              | Units (ЕД) | Parsed from `event.value` string | None       |
| Carbohydrates        | Grams (г)  | Parsed from `event.value` string | None       |
| Glucose measurements | Count only | N/A                              | None       |
| Medication           | Count only | N/A                              | None       |

`formatMeasurement()` is **not required** for this block — no mmol/L or mg/dL in
Day Summary metrics.

---

## Pluralization / ICU audit

| Pattern                | Current                                  | ICU needed? | Recommended approach                                                   |
| ---------------------- | ---------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| Glucose measurements   | Static label + count value               | **No**      | `dashboard.daySummary.metrics.glucoseMeasurements` + `formatNumber(n)` |
| Medication doses       | Static label + count                     | **No**      | Same                                                                   |
| Insulin / carbs totals | Static label + presentation total string | **No**      | Label key + pass-through total                                         |
| Reminders              | Static label + `completed / total`       | **No**      | Label key + formatted numbers + `/` separator                          |

No count-inflected phrases like “3 injections” exist in production UI.

**ICU/plural rules: not required for Wave 1 minimal slice.**

---

## Medical safety

| Question                                | Answer                            |
| --------------------------------------- | --------------------------------- |
| Medical thresholds?                     | **No**                            |
| Target achievement / good-bad?          | **No**                            |
| Glucose range status?                   | **No**                            |
| Insulin totals clinical interpretation? | **No** — sum of logged doses only |
| Medication adherence scoring?           | **No** — count only               |
| TIR / GMI / charts?                     | **No** — explicitly excluded      |

Localization scope = labels and presentation formatting only. Totals and counts
are owner-calculated aggregates; migration must not alter arithmetic or
classification.

---

## Proposed translation keys

Existing `dashboard` namespace has `header.*`, `nextAction.*`, `lastGlucose.*`
only. No `dashboard.daySummary.*` yet. No suitable `common` keys.

### Recommended keys (11)

| Key                                                | English (canonical)                   | Purpose                |
| -------------------------------------------------- | ------------------------------------- | ---------------------- |
| `dashboard.daySummary.title`                       | Day summary                           | Section title          |
| `dashboard.daySummary.eyebrow`                     | Current day                           | Ready eyebrow          |
| `dashboard.daySummary.loading`                     | Loading day summary                   | Loading `sr-only`      |
| `dashboard.daySummary.unavailable`                 | Day summary unavailable.              | Invalid ready fallback |
| `dashboard.daySummary.empty.default`               | Today's summary is not available yet. | Default empty          |
| `dashboard.daySummary.error.default`               | Could not load the day summary.       | Default error          |
| `dashboard.daySummary.metrics.glucoseMeasurements` | Glucose measurements                  | Primary metric label   |
| `dashboard.daySummary.metrics.totalInsulin`        | Total insulin                         | Primary metric label   |
| `dashboard.daySummary.metrics.totalCarbohydrates`  | Total carbohydrates                   | Primary metric label   |
| `dashboard.daySummary.metrics.medicationDoses`     | Medication doses                      | Secondary metric label |
| `dashboard.daySummary.metrics.reminders`           | Reminders                             | Secondary metric label |

### Not proposed (no matching string today)

- `dashboard.daySummary.date.today` — block uses full date label, not “Today”
- Pluralized metric keys — static labels + separate numbers suffice
- Parameterized ICU strings — not required

---

## Namespace / preload

- **Namespace:** `dashboard` (existing)
- **Preload:** unchanged — `['common', 'dashboard']` via `WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES`
- Day Summary does not require Timeline namespace
- **Expected result:** preload without changes

---

## Integration architecture

Recommended pipeline (mirror I18N-02A/02B1/02B2):

```text
useTimelineStore().events
  ↓
dashboard-root:
  useFormatter() → formatDaySummaryDisplayDate(referenceTime)
  (optional) formatNumber for counts at derivation boundary
  ↓
deriveDaySummary(..., formatDaySummaryDisplayDate)
  → DashboardDerivedDaySummary
  ↓
DashboardDaySummary:
  useLocalization() → resolveDashboardDaySummaryLabels()
  ↓
createDashboardDaySummaryViewModel(props, labels)
  ↓
JSX
```

### Hooks decision

| Hook                       | Required?          | Usage                                                                                                                                                          |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLocalization()`        | **Yes**            | Labels in view                                                                                                                                                 |
| `useFormatter()`           | **Yes** (minimal)  | `formatDate` for `displayDayLabel`; optional `formatNumber` for counts                                                                                         |
| `usePresentationContext()` | **Only if needed** | Prefer context-bound formatter; if derivation keeps `dashboardTimeZone` from browser Intl, presentation context may not be needed for Day Summary specifically |

Pure model must not receive platform services.

---

## Model / view boundary

| Concern                                                     | Owner                                          |
| ----------------------------------------------------------- | ---------------------------------------------- |
| Canonical counts (`glucoseMeasurements`, `medicationDoses`) | Derivation / selectors                         |
| Canonical reminder integers                                 | Container demo constants (future: real source) |
| `dayDate` ISO key                                           | Derivation                                     |
| `displayDayLabel`, `totalInsulin`, `totalCarbohydrates`     | Derivation (presentation strings)              |
| Metric labels                                               | Localization resolver → injected into model    |
| State mapping loading/empty/error/ready                     | Pure model                                     |
| View model immutability                                     | Preserved                                      |

View receives ready display strings for totals; counts may be formatted at
derivation or model boundary — prefer single formatting owner per value.

---

## Accessibility

| Element   | Current                                    | Migration                                        |
| --------- | ------------------------------------------ | ------------------------------------------------ |
| Section   | `section` + `aria-labelledby` → `h2` title | Localize title                                   |
| Loading   | `aria-busy`, `sr-only` status              | Localize loading key                             |
| Empty     | `role="status"`, `aria-live="polite"`      | Localize message                                 |
| Error     | `role="alert"`, `aria-live="assertive"`    | Localize message                                 |
| Metrics   | `dl` / `dt` / `dd`                         | Localize `dt` labels; values unchanged semantics |
| Day label | `<time dateTime={dayDate}>`                | Keep machine date; localize visible label        |
| Icon      | `aria-hidden="true"`                       | No change                                        |

Units in values (`ЕД`, `г`) may remain RU in transitional mixed-language UI.

---

## Responsive constraints

Documented in `docs/ui/dashboard/day-summary.md`:

- Mobile: full width after Last Glucose
- Tablet: `sm:col-span-1` beside Last Glucose
- Desktop: `lg:col-span-5`
- Primary grid: 1 col mobile → 3 cols `sm+`
- Secondary grid: 1 col mobile → 2 cols `sm+`

English label considerations:

- “Total carbohydrates” longer than `Суммарные углеводы` — may wrap in `dt`; monitor on mobile
- “Glucose measurements” similar length to Russian
- German stress case not yet tested — note for implementation QA
- Numeric values (`120 г`, `12 ЕД`) width stable

No visual redesign at audit stage.

---

## Existing tests

| Test file                                        | Covers                                                                            | Update at implementation?                          | Preserve                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| `dashboard-day-summary-model.test.mjs`           | Ready/empty/error/loading, validation, day label factory, no TIR/GMI, zero counts | **Yes** — English labels; formatter boundary tests | Business rules, downgrade logic |
| `dashboard-quick-add-integration-model.test.mjs` | `daySummary` totals from today events                                             | **Yes** — if derivation formatting changes         | Selection/totals logic          |
| `timeline-selectors.test.mjs`                    | Today filter, timezone boundary, insulin/nutrition/medication totals              | **No**                                             | Day-boundary semantics          |
| `dashboard-quick-add.spec.ts`                    | Day Summary region + insulin sync                                                 | **Yes** — English region name                      |
| `dashboard-next-action-i18n.spec.ts`             | Day Summary insulin assertion                                                     | **Yes** — selectors                                |
| `application-platform-integration.spec.ts`       | Day Summary after Quick Add                                                       | **Yes** — selectors                                |
| `timeline-event-details.spec.ts`                 | Day Summary after delete                                                          | **Yes** — selectors                                |

### Baseline counts (main @ `531e20f`)

| Suite          | Count   |
| -------------- | ------- |
| Web unit tests | **326** |
| E2E            | **25**  |

Confirmed locally on audit branch.

---

## Proposed tests (implementation)

### Resources

- 11 keys exist, non-empty English, `dashboard` namespace, no duplicates

### Labels

- resolver returns canonical English; immutable snapshots

### Formatting

- `formatDate` for display day label at derivation boundary
- no direct `Intl.*` in migrated model/view/labels files
- counts use `formatNumber` or documented pass-through
- totals transitional pass-through documented
- correct time zone passed to derivation (unchanged semantics)

### Model

- ready/empty/error/loading unchanged
- invalid input downgrade unchanged
- reminders validation unchanged
- no TIR/GMI/chart fields introduced

### React integration

- `TestPlatformProvider` render with English labels
- loading `sr-only` announcement

### E2E vertical slice (new `dashboard-day-summary-i18n.spec.ts`)

1. Dashboard ready (`data-platform-status="ready"`)
2. English Day Summary title and metric labels
3. Demo totals visible (RU units acceptable)
4. Add insulin via Quick Add → total insulin updates
5. Add nutrition → carbs update
6. Timeline edit/delete → Dashboard sync
7. Day-boundary behaviour unchanged (rely on existing selector tests + manual spot check)

---

## Stop conditions

| Condition                                   | Result                                                    |
| ------------------------------------------- | --------------------------------------------------------- |
| Formatting Platform public API change       | **Not triggered** — `formatDate`, `formatNumber` exist    |
| Medical unit conversion                     | **Not triggered** — sums only, no conversion              |
| TimelineEvent domain model change           | **Not triggered**                                         |
| Change Day Summary selectors/business logic | **Would block** — out of scope                            |
| Change day-boundary semantics               | **Would block** — must preserve `isSameLocalDay`          |
| Diabetes Profile / target ranges            | **Not applicable**                                        |
| ICU/pluralization required                  | **Not triggered** — static labels + numbers               |
| New namespace                               | **Not triggered**                                         |
| Route-aware preload                         | **Not triggered**                                         |
| Timeline / Quick Add migration              | **Out of scope**                                          |
| ADR-0012/0013 Decision change               | **Not required** — presentation-only migration            |
| Ambiguous canonical metrics                 | **Not triggered** — counts are numbers, totals documented |
| PlatformFormatter insufficient              | **Not triggered**                                         |
| Layout redesign required                    | **Not triggered**                                         |

**No blockers** for recommended minimal slice.

---

## Risks

| Risk                                                                | Mitigation                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Mixed-language UI (EN labels + RU totals from Quick Add formatters) | Document transitional state (same as I18N-02B2)                              |
| Duplicate day-label Intl logic (model + integration)                | Consolidate during implementation                                            |
| `DASHBOARD_LOCALE = 'ru-RU'` for derivation vs EN presentation      | Switch day label to formatter locale; keep selector TZ pass-through          |
| Browser `Intl` time zone vs Platform cookie TZ divergence           | Document; align in future orchestration slice, not I18N-02B3 business change |
| Long English metric labels on mobile                                | Monitor wrapping; minimal CSS only if needed                                 |
| Legacy `DaySummary` type in mocks                                   | Cleanup candidate, not blocking                                              |

---

## Technical debt

| Item                                                                       | Notes                                                                       |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DASHBOARD_LOCALE = 'ru-RU'` in `dashboard-root`                           | Used for derivation; presentation should use formatter locale independently |
| `formatInsulinDose` / `formatNutritionCarbs` RU locale                     | Quick Add scope; produces RU totals on EN Dashboard                         |
| Duplicate `createDashboardDaySummaryDayLabel` vs `createDashboardDayLabel` | Consolidate with `getTimelineCalendarDateKey` + `formatDate`                |
| Reminders from hardcoded demo constants                                    | Not Timeline-backed; future product source                                  |
| Legacy `packages/types` `DaySummary { timeInRange }` mock                  | Unused by Dashboard block                                                   |
| Browser-resolved time zone in root                                         | ADR-0012 transitional client pattern                                        |

---

## Recommendation

**Proceed to implementation approval** with this minimal slice:

1. Localize all 11 block labels via `dashboard.daySummary.*`
2. Move `displayDayLabel` formatting to `useFormatter().formatDate()` at
   `dashboard-root` → `deriveDaySummary` boundary
3. Keep today selectors and totals arithmetic unchanged
4. Transitional pass-through for `totalInsulin` / `totalCarbohydrates` display
   strings (RU suffixes from Quick Add formatters) unless explicitly approved to
   add unit keys + `formatNumber`
5. `formatNumber` for integer metric counts (optional minimal addition)
6. Remove hardcoded `dashboardDaySummaryLabels` from model/view
7. Add labels resolver, resource tests, integration test, dedicated E2E
8. Preload unchanged

Defer full insulin/carbs re-formatting via localized unit composition until
Quick Add / Timeline structural contracts mature.

---

## Architecture Audit Report

### 1. General information

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Stage          | I18N-02B3 — Dashboard Day Summary Localization |
| Phase          | **Stage 1 — Architecture Audit Only**          |
| Base           | `main` @ `531e20f`                             |
| Branch         | `feature/i18n-dashboard-day-summary`           |
| Baseline tests | 326 web / 25 E2E                               |

### 2. Goal

Migrate Day Summary labels and day-label formatting to Platform stack; preserve
aggregation logic, day-boundary semantics, and medical neutrality.

### 3. Scope / out of scope

Confirmed per sections above.

### 4. File map

17 files analysed (see File map section).

### 5. All strings

11 Russian label constants + derived presentation values (day label, totals,
counts). No pluralized phrases.

### 6. Data flow

See Data flow section.

### 7. Source of truth

Shared `useTimelineStore()` events; today selectors in `timeline-selectors.ts`.

### 8. Day-boundary semantics

`referenceTime` + IANA `timeZone` + `getTimelineCalendarDateKey`. Browser TZ
from root today. Selector tests cover TZ offsets.

### 9. Business invariants

Preserved list in Business invariants section.

### 10–12. Formatting / metrics / units

See Formatting audit section.

### 13. Pluralization

Not required — static labels + formatted numbers.

### 14. Medical safety

Informational aggregates only; no clinical interpretation.

### 15. Translation keys

11 proposed `dashboard.daySummary.*` keys.

### 16. Preload

Unchanged `common` + `dashboard`.

### 17. Hooks decision

`useLocalization()` + `useFormatter()`; `usePresentationContext()` only if
formatter boundary insufficient.

### 18. Model/view boundary

Labels injected; canonical counts in derivation; presentation strings for totals.

### 19–20. Accessibility / responsive

Documented above; no visual redesign.

### 21–22. Existing tests / proposed test plan

Documented above.

### 23. Documentation

This document + navigation index updates.

### 24. Architecture compliance

Matches I18N-02A/02B1/02B2 vertical slice pattern. No Platform API change required.

### 25–27. Technical debt / limitations / risks

Documented above.

### 28. Stop-condition result

**No blockers** for recommended scope. Totals pass-through strategy should be
confirmed at implementation kickoff.

### 29. Git status

```
Branch: feature/i18n-dashboard-day-summary (audit docs only)
Production code: unchanged
Commit: not performed
```

### 30. Executive summary

Dashboard Day Summary is a current-day aggregation card with 11 Russian label
constants, `Intl`-based day label formatting in two places, integer counts
formatted as decimal strings, and insulin/carbs totals built from Quick Add
RU formatters with manual unit suffixes. Day membership uses shared today
selectors with explicit time zone. There is no pluralization, no clinical
interpretation, and no charts. Migration should follow the established
labels-resolver + hooks + pure model pattern: localize block copy, move day
label formatting to `useFormatter().formatDate()` at the container/derivation
boundary, and keep today selectors and totals arithmetic unchanged. Insulin and
carbohydrate display totals should remain transitional pass-through strings in
the first slice unless explicitly approved otherwise.

**Confirmed (audit stage):**

- Header, Next Action, Last Glucose, Recent Events, AI Insight — unchanged at audit
- Timeline, Quick Add — unchanged
- Platform API — unchanged
- I18N-02B4 — not started

---

## Localization integration (implemented)

```text
useTimelineStore().events
  ↓
dashboard-root:
  useFormatter() → formatDaySummaryDisplayDate(referenceTime)
  ↓
deriveDaySummary(..., formatDaySummaryDisplayDate)
  → getTimelineCalendarDateKey for dayDate (unchanged)
  → displayDayLabel from single formatDate call
  ↓
DashboardDaySummary:
  useLocalization() → resolveDashboardDaySummaryLabels()
  useFormatter() → formatNumber for integer counters
  ↓
createDashboardDaySummaryViewModel(props, labels, formattedMetrics)
  ↓
JSX
```

---

## Translation keys (implemented)

| Key                                                | English value                         |
| -------------------------------------------------- | ------------------------------------- |
| `dashboard.daySummary.title`                       | Day summary                           |
| `dashboard.daySummary.eyebrow`                     | Current day                           |
| `dashboard.daySummary.loading`                     | Loading day summary                   |
| `dashboard.daySummary.unavailable`                 | Day summary unavailable.              |
| `dashboard.daySummary.empty.default`               | Today's summary is not available yet. |
| `dashboard.daySummary.error.default`               | Could not load the day summary.       |
| `dashboard.daySummary.metrics.glucoseMeasurements` | Glucose measurements                  |
| `dashboard.daySummary.metrics.totalInsulin`        | Total insulin                         |
| `dashboard.daySummary.metrics.totalCarbohydrates`  | Total carbohydrates                   |
| `dashboard.daySummary.metrics.medicationDoses`     | Medication doses                      |
| `dashboard.daySummary.metrics.reminders`           | Reminders                             |

---

## Recommendation

**Ready for review** — implementation matches approved minimal presentation-only
slice.

Defer full insulin/carbohydrate `number + canonical unit` formatting until a
structural measurement contract exists.

---

## Engineering Audit (I18N-02B3)

### 1. General information

| Field      | Value                                          |
| ---------- | ---------------------------------------------- |
| Stage      | I18N-02B3 — Dashboard Day Summary Localization |
| Phase      | **Implementation Complete — Ready for Review** |
| Base       | `main` @ `531e20f`                             |
| Branch     | `feature/i18n-dashboard-day-summary`           |
| Unit tests | **342** web (+16)                              |
| E2E tests  | **26** (+1)                                    |

### 2. Goal

Migrate Day Summary labels, day-label formatting, and integer counter formatting
to Platform Localization + Formatting stack; preserve aggregation logic,
day-boundary semantics, and medical neutrality.

### 3. Scope / out of scope

Confirmed per sections above. Single vertical slice. Timeline, Quick Add, other
Dashboard blocks unchanged.

### 4. Changed files

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Create | `dashboard-day-summary-labels.ts`                                                                     |
| Create | `dashboard-day-summary-labels.test.mjs`                                                               |
| Create | `dashboard-day-summary-resources.test.mjs`                                                            |
| Create | `dashboard-day-summary.integration.test.mjs`                                                          |
| Create | `e2e/dashboard-day-summary-i18n.spec.ts`                                                              |
| Modify | `dashboard-day-summary.tsx`, `dashboard-day-summary-model.ts`, `dashboard-day-summary-model.test.mjs` |
| Modify | `dashboard-root.tsx` (`formatDaySummaryDisplayDate`)                                                  |
| Modify | `lib/dashboard/dashboard-quick-add-integration-model.ts` (+ test)                                     |
| Modify | `packages/locales/*` (11 keys)                                                                        |
| Modify | `e2e/dashboard-quick-add.spec.ts`, `e2e/dashboard-next-action-i18n.spec.ts`,                          |
|        | `e2e/application-platform-integration.spec.ts`, `e2e/timeline-event-details.spec.ts` (selectors)      |
| Docs   | this file, navigation index updates from audit                                                        |

### 5. Translation resources

11 new keys under `dashboard.daySummary.*` in `@diabetes-universe/locales`.
Canonical list updated in `canonical-translation-key.ts`.

### 6. Keys / namespace

`dashboard` namespace only. No overlap with `dashboard.header.*`,
`dashboard.nextAction.*`, or `dashboard.lastGlucose.*`.

### 7. Preload

Unchanged. `common` + `dashboard`. Resource tests confirm keys resolve from
preloaded namespace.

### 8. Localization integration

- `DashboardDaySummary`: `useLocalization()` → `resolveDashboardDaySummaryLabels()`
- `DashboardDaySummary`: `useFormatter()` → `formatNumber()` for integer counters
- `dashboard-root`: `formatDaySummaryDisplayDate` injected into
  `deriveDashboardQuickAddBlocks`
- Pure model receives labels + formatted metric display strings only

### 9. Formatting decision

- **Day label:** single `PlatformFormatter.formatDate(referenceTime, { dateStyle: 'full' })` at `dashboard-root` → `deriveDaySummary`; `dayDate` from `getTimelineCalendarDateKey` (unchanged)
- **Counters:** `formatNumber()` for glucose count, medication count, reminders completed/total (`${formattedCompleted} / ${formattedTotal}`)
- **Totals:** transitional pass-through `totalInsulin` / `totalCarbohydrates` from Quick Add formatters — **no** `formatMeasurement()`, **no** medical conversion
- **No ICU** — static labels + separate formatted numbers
- **No `Intl.*`** in migrated model/view/labels files
- **Platform API unchanged**

### 10. Transitional insulin/carbohydrate totals contract

| Field                | Contract                                                     |
| -------------------- | ------------------------------------------------------------ |
| `totalInsulin`       | Pass-through string from `formatInsulinDose` + ` ЕД`         |
| `totalCarbohydrates` | Pass-through string from `formatNutritionCarbs` + ` г`       |
| Conversion           | None                                                         |
| Mixed UI             | EN labels + RU totals from Quick Add — expected transitional |
| Deferred             | `formatMeasurement()` until structural measurement contract  |

### 11. Model / view architecture

Pure model receives `DashboardDaySummaryLabels`, formatted counter strings, and
summary primitives only. No `LocalizationPlatform`, `PlatformFormatter`,
`PlatformRuntime`, or React/browser objects in model.

### 12. Business logic invariants (preserved)

| Invariant                              | Status    |
| -------------------------------------- | --------- |
| `getTodayTimelineEvents`               | Unchanged |
| `isSameLocalDay`                       | Unchanged |
| `getTimelineCalendarDateKey`           | Unchanged |
| Event inclusion / time-zone source     | Unchanged |
| `referenceTime`                        | Unchanged |
| Totals calculation                     | Unchanged |
| Dashboard/Timeline sync                | Unchanged |
| Loading/empty/error semantics          | Unchanged |
| Invalid ready → unavailable empty      | Unchanged |
| `dayDate` independent of display label | Preserved |

### 13. Accessibility

| Element           | Source                                      |
| ----------------- | ------------------------------------------- |
| Section `h2`      | `labels.title` (English)                    |
| Ready eyebrow     | `labels.eyebrow`                            |
| Loading `sr-only` | `labels.loading` via view model             |
| Metric `dt`       | localized metric labels                     |
| Day label         | `<time dateTime={dayDate}>` + display label |
| Empty/error       | localized default messages                  |

### 14. Testing

| Suite                                            | Coverage                                             |
| ------------------------------------------------ | ---------------------------------------------------- |
| `dashboard-day-summary-resources.test.mjs`       | 11 canonical keys, preload unchanged                 |
| `dashboard-day-summary-labels.test.mjs`          | resolver + preload                                   |
| `dashboard-day-summary-model.test.mjs`           | states, validation, pass-through totals, zero counts |
| `dashboard-day-summary.integration.test.mjs`     | React render, formatDate once, formatNumber, no Intl |
| `dashboard-quick-add-integration-model.test.mjs` | today totals, injected day label formatter           |
| `dashboard-day-summary-i18n.spec.ts`             | vertical: add → timeline edit/delete → sync          |

### 15. Validation

| Command                                     | Result   |
| ------------------------------------------- | -------- |
| `pnpm format:check`                         | Pass     |
| `pnpm lint`                                 | Pass     |
| `pnpm typecheck`                            | Pass     |
| `pnpm --filter @diabetes-universe/web test` | 342 pass |
| `pnpm build`                                | Pass     |
| `pnpm test:e2e`                             | 26 pass  |

### 16. Technical debt

| Item                                            | Notes                                                     |
| ----------------------------------------------- | --------------------------------------------------------- |
| `DASHBOARD_LOCALE = 'ru-RU'` in root            | Recent Events derivation; Day Summary labels use Platform |
| `formatInsulinDose` / `formatNutritionCarbs` RU | Quick Add scope; produces RU totals on EN Dashboard       |
| Reminders from demo constants                   | Not Timeline-backed                                       |
| Mixed-language Dashboard                        | Recent Events, Quick Add, Timeline still RU               |

### 17. Stop conditions

- Platform API change — **not triggered**
- `formatMeasurement()` — **deferred** per transitional contract
- Day-boundary semantics change — **not triggered**
- I18N-02B4 — **not started**

### 18. Git status

```
Branch: feature/i18n-dashboard-day-summary
Commit / push / PR: not performed (per task instructions)
```

### 19. Executive summary

I18N-02B3 delivers English Day Summary block labels via 11 `dashboard.daySummary.*`
keys, a single `formatDate` owner for `displayDayLabel`, and `formatNumber` for
integer counters. Day-boundary semantics (`getTimelineCalendarDateKey`,
`getTodayTimelineEvents`, totals arithmetic) are unchanged. Insulin and
carbohydrate totals remain transitional RU pass-through strings. No ICU, no
Platform API changes, preload unchanged.

## Architecture references

- [I18N-02A — Dashboard Header Migration](dashboard-header-migration.md)
- [I18N-02B1 — Dashboard Next Action Migration](dashboard-next-action-migration.md)
- [I18N-02B2 — Dashboard Last Glucose Migration](dashboard-last-glucose-migration.md)
- [Dashboard Day Summary Architecture](../dashboard/day-summary.md)
- [ADR-0012 — User Time Zone Policy](../../adr/0012-user-time-zone-policy.md)
- [ADR-0013 — Web Client Runtime Ownership](../../adr/0013-web-client-runtime-ownership.md)
- [Formatting Platform](../../../packages/formatting/README.md)
