# Dashboard Recent Events Localization Migration (I18N-02B4)

## Status

Implementation Complete — Ready for Review

## Purpose

Audit the Dashboard Recent Events block before migrating it to the approved
Localization Platform, Formatting Platform, and Presentation Context stack.
Determine minimal implementation scope, translation keys, formatting
responsibilities, selector boundaries, sorting invariants, risks, and stop
conditions.

No production code changes are made at this stage.

> **Update (implementation):** The approved minimal presentation-only slice is
> implemented on branch `feature/i18n-dashboard-recent-events`. See
> [Localization integration (implemented)](#localization-integration-implemented)
> and [Engineering Audit (I18N-02B4)](#engineering-audit-i18n-02b4) below.

## Scope

- `DashboardRecentEvents` view and presentation model
- `selectDashboardRecentEvents()` selection logic
- `mapDashboardRecentEventToCard()` mapper
- `getRecentTimelineEvents()` / `mapRecentEvent()` derivation path
- `deriveDashboardQuickAddBlocks()` integration wiring
- Dashboard root/container wiring
- shared `EventCard` consumption (analysis only — no Design System change)
- mock/demo timeline data relevant to recent-event derivation
- existing unit/integration/E2E coverage touching Recent Events
- accessibility and responsive behaviour documentation

## Out of scope

- Dashboard Header (I18N-02A — Feature Complete)
- Next Action (I18N-02B1 — Feature Complete)
- Last Glucose (I18N-02B2 — Feature Complete)
- Day Summary (I18N-02B3 — Feature Complete)
- AI Insight (I18N-02B5+)
- Quick Add dialog/form copy
- Timeline page UI, filters, search, grouping labels (`Сегодня`, `Вчера`, etc.)
- `EventCard` status labels (`Выполнено`, `Запланировано`, …) in `@diabetes-universe/ui`
- locale switch, new languages, ICU/interpolation implementation
- route-aware preload, Platform public API changes
- medical unit conversion, target ranges, adherence scoring
- ADR Decision section changes
- relative-time introduction (`minutes ago`, `hours ago`) — **not present today**
- making Recent Events cards interactive / Timeline parity

---

## File map

| File                                                                    | Role                     | Recent Events? | Contains                                                                                                         | Change at implementation                                                                                   |
| ----------------------------------------------------------------------- | ------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `apps/web/components/dashboard/dashboard-recent-events.tsx`             | View                     | **Yes**        | JSX, hardcoded `dashboardRecentEventsLabels`, `EventCard` list, `Link` view-all                                  | **Yes** — `useLocalization()` / labels resolver                                                            |
| `apps/web/components/dashboard/dashboard-recent-events-model.ts`        | Pure model + selection   | **Yes**        | View model, `dashboardRecentEventsLabels`, `dashboardRecentEventCategoryLabels`, `selectDashboardRecentEvents()` | **Yes** — inject labels; remove hardcoded RU constants                                                     |
| `apps/web/components/dashboard/dashboard-recent-events-model.test.mjs`  | Model tests              | **Yes**        | Selection/sort/limit rules, Russian label fixtures                                                               | **Yes** — English label fixtures                                                                           |
| `apps/web/components/dashboard/dashboard-recent-events-card.mapper.ts`  | Card mapper              | **Yes**        | Maps model card → `EventCard` props (`subtitle` = category label)                                                | **No logic** — consumes injected `categoryLabel`                                                           |
| `apps/web/components/dashboard/dashboard-recent-events-labels.ts`       | Label resolver           | **No — new**   | —                                                                                                                | **Yes — create** (mirror Header / Next Action / Last Glucose / Day Summary)                                |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.ts`       | Integration / derivation | **Partial**    | `deriveDashboardQuickAddBlocks()` → `getRecentTimelineEvents()`                                                  | **Yes** — inject `formatRecentEventDisplayTime` callback from container                                    |
| `apps/web/lib/dashboard/dashboard-quick-add-integration-model.test.mjs` | Integration tests        | **Partial**    | Recent events derivation assertions                                                                              | **Yes** — formatter callback expectations                                                                  |
| `apps/web/lib/timeline/timeline-selectors.ts`                           | Shared selector          | **Partial**    | `getRecentTimelineEvents()`, `mapRecentEvent()`, category mapping, unit defaults                                 | **Maybe** — optional injected `formatDisplayTime` callback; **preserve sort/filter/limit semantics**       |
| `apps/web/lib/timeline/timeline-selectors.test.mjs`                     | Selector tests           | **Partial**    | Recent events ordering, category filter                                                                          | **Maybe** — formatter injection tests only; preserve selection contracts                                   |
| `apps/web/lib/timeline/timeline-date-time.ts`                           | Shared time helper       | **Partial**    | `formatTimelineDisplayTime()` uses `Intl.DateTimeFormat`                                                         | **No** for Timeline path; Recent Events Dashboard path should stop depending on it when formatter injected |
| `apps/web/components/dashboard/dashboard-root.tsx`                      | Container                | **Partial**    | Wires `derivedBlocks.recentEvents`, `DASHBOARD_LOCALE`, `dashboardTimeZone`                                      | **Minimal** — `formatRecentEventDisplayTime` via `useFormatter().formatTime()`                             |
| `apps/web/lib/mocks/timeline.ts`                                        | Demo data                | **Partial**    | `timelineEvents` feed derivation                                                                                 | **No** — event titles/values remain domain/demo RU strings                                                 |
| `packages/types/src/timeline.ts`                                        | Shared contract          | **Analysis**   | `TimelineEvent` kinds                                                                                            | **No**                                                                                                     |
| `packages/ui/src/components/event-card/EventCard.tsx`                   | Shared UI                | **Analysis**   | `EventCard` standard variant, Russian `statusLabels`                                                             | **No** — status not used by Dashboard Recent Events; out of I18N-02B4                                      |
| `apps/web/components/dashboard/dashboard-shell.tsx`                     | Layout shell             | **No**         | Renders `recentEvents` slot after Day Summary                                                                    | **No**                                                                                                     |
| `apps/web/e2e/*.spec.ts` (multiple)                                     | E2E                      | **Partial**    | `getByRole('link', { name: 'Все события' })` in 6+ specs                                                         | **Yes** — English view-all label when block migrates                                                       |
| `docs/architecture/dashboard/recent-events.md`                          | Architecture             | **Yes**        | Boundaries, responsibilities                                                                                     | **Yes** — note I18N-02B4 audit                                                                             |
| `docs/specs/dashboard/recent-events.md`                                 | Spec                     | **Yes**        | States, validation, Russian approved copy                                                                        | **No logic change**                                                                                        |
| `docs/ui/dashboard/recent-events.md`                                    | UI spec                  | **Yes**        | Layout, a11y, Russian copy references                                                                            | **No visual change**                                                                                       |

---

## Original strings

### Block chrome (presentation — migrate)

| Source                                     | Current text (RU)                        | Purpose                  | Visible / assistive          |
| ------------------------------------------ | ---------------------------------------- | ------------------------ | ---------------------------- |
| `dashboardRecentEventsLabels.title`        | `Недавние события`                       | Section `h2` title       | Visible + `aria-labelledby`  |
| `dashboardRecentEventsLabels.viewAll`      | `Все события`                            | View-all `Link` label    | Visible                      |
| `dashboardRecentEventsLabels.loading`      | `Загрузка недавних событий`              | Loading `sr-only` status | Assistive                    |
| `dashboardRecentEventsLabels.unavailable`  | `Недавние события недоступны.`           | Invalid ready fallback   | Visible (empty presentation) |
| `dashboardRecentEventsLabels.defaultEmpty` | `Недавних событий пока нет.`             | Default empty state      | Visible                      |
| `dashboardRecentEventsLabels.defaultError` | `Не удалось загрузить недавние события.` | Default error state      | Visible                      |

### Category subtitles (presentation — migrate)

| Source                                          | Current text (RU) | Maps to category |
| ----------------------------------------------- | ----------------- | ---------------- |
| `dashboardRecentEventCategoryLabels.insulin`    | `Инсулин`         | `insulin`        |
| `dashboardRecentEventCategoryLabels.nutrition`  | `Питание`         | `nutrition`      |
| `dashboardRecentEventCategoryLabels.medication` | `Лекарства`       | `medication`     |
| `dashboardRecentEventCategoryLabels.activity`   | `Активность`      | `activity`       |

Rendered on `EventCard` as `subtitle` via `mapDashboardRecentEventToCard()`.

### Event card content (domain / upstream presentation — pass-through)

| Field         | Example                             | Source                                                   | Classification                                                           |
| ------------- | ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `title`       | `NovoRapid`, `Завтрак`, `Метформин` | `TimelineEvent.title`                                    | **Domain / user content**                                                |
| `value`       | `4`, `42`, `500`                    | Derived in `mapRecentEvent()` from `TimelineEvent.value` | **Transitional presentation** (numeric extraction for insulin/nutrition) |
| `unit`        | `ЕД`, `г углеводов`, `мг`, `минут`  | `mapRecentEvent()` defaults + `TimelineEvent.unit`       | **Transitional presentation** (RU literals in selector)                  |
| `context`     | `Перед завтраком`                   | `TimelineEvent.context`                                  | **Domain / user content**                                                |
| `displayTime` | `08:05`                             | `formatTimelineDisplayTime()` → `Intl`                   | **Presentation** — migrate to `PlatformFormatter.formatTime()`           |

### Assistive strings (composed — not separate keys)

| Source                     | Composition                                | Notes                                                                                        |
| -------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `EventCard` `aria-label`   | `time, title, value, unit, context` joined | Built in `@diabetes-universe/ui`; uses already-formatted display strings                     |
| `EventCard` `statusLabels` | `Выполнено`, `Запланировано`, …            | **Not used** by Dashboard Recent Events (`status` defaults to `default`) — Timeline/UI scope |

### Strings explicitly **not** in Recent Events block

| Pattern                     | Where used instead                                              |
| --------------------------- | --------------------------------------------------------------- |
| `Сегодня` / `Today`         | Timeline day grouping (`formatTimelineDayGroupLabel`)           |
| `Вчера` / `Yesterday`       | Timeline day grouping                                           |
| `minutes ago` / `hours ago` | **Not present anywhere in Dashboard Recent Events path**        |
| Weekday / month date labels | Day Summary (`formatDate`), Timeline groups — not Recent Events |
| Glucose type labels         | Excluded category — Last Glucose block                          |
| Quick Add action labels     | Quick Add host — out of scope                                   |

---

## Domain vs presentation classification

| Data                                         | Classification                | Migration action                                            |
| -------------------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| Block title, view-all, loading/empty/error   | **Presentation**              | `dashboard.recentEvents.*` keys                             |
| Category subtitles (insulin, nutrition, …)   | **Presentation**              | `dashboard.recentEvents.categories.*` keys                  |
| `displayTime` (HH:mm)                        | **Presentation**              | `PlatformFormatter.formatTime()` at container boundary      |
| `title`, `context`                           | **Domain / user-entered**     | Pass-through from `TimelineEvent`                           |
| `value` (insulin/nutrition numeric string)   | **Transitional presentation** | Keep selector extraction; no `formatMeasurement()`          |
| `unit` (`ЕД`, `г углеводов`, `минут`)        | **Transitional presentation** | Pass-through from selector defaults; defer unit composition |
| Sort order, per-category latest, max 4 cards | **Business logic**            | **Do not change**                                           |
| Excluded kinds (`glucose`, `note`)           | **Business rule**             | **Do not change**                                           |

---

## Data flow

```text
useTimelineStore().events
  ↓
dashboard-root:
  locale = DASHBOARD_LOCALE ('ru-RU')          ← transitional derivation locale
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  referenceTime = new Date()
  ↓
deriveDashboardQuickAddBlocks({ events }, { locale, timeZone, ... })
  ↓
getRecentTimelineEvents(events, { locale, timeZone, limit: 4 })
  ├─ sort all events by dateTime desc (compareTimelineDateTime)
  ├─ mapRecentEvent(event, locale, timeZone)
  │    ├─ displayTime = formatTimelineDisplayTime(dateTime, locale, timeZone)  ← Intl today
  │    ├─ map kind → category; apply unit/value transforms
  │    └─ return null for glucose, note, invalid time
  └─ slice(0, limit) → DashboardDerivedRecentEvent[]
  ↓
DashboardRecentEvents (state="ready", events=derived, viewAllHref="/timeline")
  ↓
createDashboardRecentEventsViewModel(props)
  ↓
selectDashboardRecentEvents(props.events)
  ├─ normalize each source
  ├─ keep latest per category by dateTime
  ├─ sort remaining by dateTime desc
  └─ slice(0, DASHBOARD_RECENT_EVENTS_MAX_CARDS = 4)
  ↓
mapDashboardRecentEventToCard(event) → EventCard (standard, non-interactive)
```

### Two-stage selection (critical invariant)

1. **Selector stage** (`getRecentTimelineEvents`): chronological top-N (default 4)
   from all timeline events after kind filter.
2. **Model stage** (`selectDashboardRecentEvents`): latest-per-category dedupe +
   chronological sort + max 4 cards.

Both stages must remain behaviorally identical at implementation. Migration must
not collapse or reorder these steps.

---

## Source of truth

| Concern                           | Owner                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------- |
| Raw events                        | `useTimelineStore().events` (`TimelineEvent[]`)                               |
| Chronological candidate pool      | `getRecentTimelineEvents()`                                                   |
| Category filter / kind mapping    | `mapRecentEvent()` in `timeline-selectors.ts`                                 |
| Per-category latest + card cap    | `selectDashboardRecentEvents()` in model                                      |
| Block labels / category subtitles | Today: hardcoded RU in model — target: localization resolver                  |
| Display time formatting           | Today: `formatTimelineDisplayTime()` (`Intl`) — target: injected `formatTime` |

---

## Selector pipeline detail

### `getRecentTimelineEvents`

```text
events
  → [...events].sort(compareTimelineDateTime desc)
  → .map(mapRecentEvent)
  → .filter(non-null)
  → .slice(0, limit)
```

### `mapRecentEvent` kind mapping

| `TimelineEvent.kind`      | Category     | Value transform                        | Unit default                   |
| ------------------------- | ------------ | -------------------------------------- | ------------------------------ |
| `activity`                | `activity`   | pass-through `value`                   | `минут` if `event.unit` absent |
| `insulin`                 | `insulin`    | `parseLeadingNumber(value).toString()` | `ЕД`                           |
| `medication`              | `medication` | pass-through `value`                   | `event.unit ?? ''`             |
| `nutrition`               | `nutrition`  | `parseLeadingNumber(value).toString()` | `г углеводов`                  |
| `glucose`, `note`, others | —            | excluded (`null`)                      | —                              |

### `selectDashboardRecentEvents`

```text
sources
  → normalize + validate
  → Map<category, latest by dateTime>
  → sort values by dateTime desc
  → slice(0, 4)
  → attach categoryLabel from dashboardRecentEventCategoryLabels
```

---

## Business invariants (must preserve)

| Invariant                               | Implementation                                   |
| --------------------------------------- | ------------------------------------------------ |
| Approved categories only                | `activity`, `insulin`, `medication`, `nutrition` |
| Glucose excluded                        | `mapRecentEvent` `default → null`                |
| Note excluded                           | same                                             |
| Latest per category                     | `selectDashboardRecentEvents` Map logic          |
| Sort by `dateTime` desc                 | Both selector and model stages                   |
| Max 4 cards                             | `DASHBOARD_RECENT_EVENTS_MAX_CARDS`              |
| Activity omitted when absent            | No placeholder slot                              |
| Invalid events skipped                  | `normalizeRecentEventSource` returns null        |
| Empty ready → empty state               | No events after selection                        |
| Blank `viewAllHref` → unavailable empty | Model downgrade                                  |
| Cards non-interactive                   | No `onClick` on `EventCard`                      |
| No filter/search/edit/delete            | Model + view contract                            |

---

## Timeline / Quick Add synchronization

| Path                 | Behaviour                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| Shared store         | `useTimelineStore()` — same `events` array for Dashboard and Timeline                   |
| Quick Add add        | `addEvent()` → store update → `deriveDashboardQuickAddBlocks` recomputes `recentEvents` |
| Timeline edit/delete | Same store mutation → Dashboard re-derives on navigation back                           |
| Time zone            | `dashboard-root` browser-resolved IANA zone passed to selector                          |
| Locale for time      | `DASHBOARD_LOCALE = 'ru-RU'` passed to `getRecentTimelineEvents` today                  |

Synchronization is store-driven; Recent Events does not subscribe to Timeline UI
state (filters, search, pagination).

---

## Formatting audit

| Value                       | Current formatter                                                        | Location                    | Platform replacement                                             |
| --------------------------- | ------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------- |
| `displayTime`               | `Intl.DateTimeFormat(locale, { hour, minute, hour12: false, timeZone })` | `formatTimelineDisplayTime` | `PlatformFormatter.formatTime(dateTime, { timeStyle: 'short' })` |
| `value` (insulin/nutrition) | `parseLeadingNumber` + `toString()`                                      | `mapRecentEvent`            | **No change** — not locale formatting                            |
| `unit`                      | Hardcoded RU strings                                                     | `mapRecentEvent`            | **Transitional pass-through** — defer until measurement contract |
| Block/category labels       | Hardcoded RU constants                                                   | model                       | `localization.translate()`                                       |
| Event `title`/`context`     | Upstream Quick Add / demo                                                | `TimelineEvent`             | Pass-through                                                     |

### Relative / absolute time

| Type                                  | Used in Recent Events?           |
| ------------------------------------- | -------------------------------- |
| Absolute short time (`08:05`)         | **Yes** — sole time presentation |
| Relative (`minutes ago`)              | **No**                           |
| Day group labels (`Сегодня`, `Вчера`) | **No**                           |
| Full date labels                      | **No**                           |

**Conclusion:** `formatTime` only. No `formatDate`, no relative-time formatter, no
ICU time-ago strings required for the minimal slice.

### `formatMeasurement()` / medical conversion

**Not applicable.** Values are display strings or parsed numbers for card layout.
No clinical conversion or canonical unit formatting in this block.

---

## PresentationContext usage

| Block                      | Today                                                             | Recommendation                                                                  |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Recent Events view         | None                                                              | `useLocalization()` only                                                        |
| Recent Events container    | Browser `Intl` time zone in root; `DASHBOARD_LOCALE` for selector | Inject `formatRecentEventDisplayTime` from `useFormatter()` in `dashboard-root` |
| `usePresentationContext()` | Not used                                                          | **Not required** if formatter is context-bound (matches I18N-02B3 decision)     |

---

## Translation keys (proposed)

Namespace: existing `dashboard`. No `dashboard.recentEvents` keys exist today.

| Key                                            | Proposed English              | Purpose                |
| ---------------------------------------------- | ----------------------------- | ---------------------- |
| `dashboard.recentEvents.title`                 | Recent events                 | Section title          |
| `dashboard.recentEvents.viewAll`               | All events                    | View-all link          |
| `dashboard.recentEvents.loading`               | Loading recent events         | Loading `sr-only`      |
| `dashboard.recentEvents.unavailable`           | Recent events unavailable.    | Invalid ready fallback |
| `dashboard.recentEvents.empty.default`         | No recent events yet.         | Default empty          |
| `dashboard.recentEvents.error.default`         | Could not load recent events. | Default error          |
| `dashboard.recentEvents.categories.activity`   | Activity                      | Card subtitle          |
| `dashboard.recentEvents.categories.insulin`    | Insulin                       | Card subtitle          |
| `dashboard.recentEvents.categories.medication` | Medication                    | Card subtitle          |
| `dashboard.recentEvents.categories.nutrition`  | Nutrition                     | Card subtitle          |

**Total: 10 keys.**

### Not proposed

- Per-event-type glucose labels — glucose excluded from block
- Pluralized event counts — static list, no count phrase
- ICU parameterized strings — not required
- `dashboard.recentEvents.time.*` — absolute short time only via formatter
- Timeline view-all route copy — separate from block label but same key candidate

---

## Namespace / preload

| Item                | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| Namespace           | `dashboard` (existing)                                                                  |
| Preload             | unchanged — `['common', 'dashboard']` via `WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES` |
| Timeline namespace  | Not required                                                                            |
| **Expected result** | preload without changes                                                                 |

---

## Integration architecture (recommended)

Mirror I18N-02B2 (Last Glucose) + I18N-02B3 (Day Summary) pattern:

```text
useTimelineStore().events
  ↓
dashboard-root:
  useFormatter() → formatRecentEventDisplayTime(dateTime)
  ↓
deriveDashboardQuickAddBlocks(..., { formatRecentEventDisplayTime, locale, timeZone })
  ↓
getRecentTimelineEvents(events, { formatDisplayTime: formatRecentEventDisplayTime, timeZone })
  → DashboardDerivedRecentEvent[]
  ↓
DashboardRecentEvents:
  useLocalization() → resolveDashboardRecentEventsLabels()
  ↓
createDashboardRecentEventsViewModel(props, labels)
  ↓
selectDashboardRecentEvents(events, labels.categories)
  ↓
JSX → EventCard
```

### Hooks decision

| Hook                       | Required?          | Usage                                                             |
| -------------------------- | ------------------ | ----------------------------------------------------------------- |
| `useLocalization()`        | **Yes**            | Block + category labels in view                                   |
| `useFormatter()`           | **Yes** (minimal)  | `formatTime` for `displayTime` at container boundary              |
| `usePresentationContext()` | **Only if needed** | Prefer context-bound formatter; not required for labels-only view |

Pure model must not receive platform services.

---

## Model / view boundary

| Concern                                 | Owner                                        |
| --------------------------------------- | -------------------------------------------- |
| Raw `TimelineEvent[]`                   | Store                                        |
| Selector mapping / kind filter          | `getRecentTimelineEvents` / `mapRecentEvent` |
| Per-category selection / sort / cap     | `selectDashboardRecentEvents`                |
| `displayTime` string                    | Derivation (injected formatter)              |
| `title`, `value`, `unit`, `context`     | Pass-through from derivation                 |
| Block + category labels                 | Localization resolver → injected into model  |
| State mapping loading/empty/error/ready | Pure model                                   |
| `viewAllHref`                           | Container prop (`/timeline`)                 |

---

## Accessibility

| Element       | Current                                       | Migration                                                          |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Section       | `section` + `aria-labelledby` → `h2`          | Localize title                                                     |
| Loading       | `aria-busy`, `sr-only` status                 | Localize loading key                                               |
| Empty         | `role="status"`, `aria-live="polite"`         | Localize message                                                   |
| Error         | `role="alert"`, `aria-live="assertive"`       | Localize message                                                   |
| View-all link | Visible `Link` with `viewAllLabel`            | Localize label                                                     |
| Event cards   | `EventCard` `article` + composed `aria-label` | Labels use localized category subtitle; values remain pass-through |
| History icon  | `aria-hidden="true"`                          | No change                                                          |

**Known limitation (pre-existing):** `EventCard` sets `<time dateTime={time}>` where
`time` is display `HH:mm`, not ISO `dateTime`. Out of I18N-02B4 scope.

---

## Responsive constraints

Documented in `docs/ui/dashboard/recent-events.md`:

- Mobile: full width after Day Summary
- Tablet: `col-span-full`
- Desktop: `lg:col-span-8`
- Header wraps on narrow widths; cards stack vertically

English category labels ("Total carbohydrates" length N/A — shorter English labels
expected). Monitor "Medication" / "Nutrition" subtitle wrapping on mobile.

---

## Existing tests

| Test file                                        | Covers                                    | Update at implementation?                          | Preserve           |
| ------------------------------------------------ | ----------------------------------------- | -------------------------------------------------- | ------------------ |
| `dashboard-recent-events-model.test.mjs`         | Selection, sort, limit, states, labels    | **Yes** — English labels; inject labels into model | Business rules     |
| `dashboard-quick-add-integration-model.test.mjs` | `recentEvents` derivation order           | **Yes** — formatter injection                      | Derivation order   |
| `timeline-selectors.test.mjs`                    | `getRecentTimelineEvents` ordering/filter | **Maybe** — optional formatter spy                 | Selector semantics |
| `dashboard-quick-add.spec.ts`                    | Quick Add + view-all navigation           | **Yes** — English view-all link                    |
| `dashboard-header-i18n.spec.ts`                  | `Все события` link                        | **Yes**                                            |
| `dashboard-last-glucose-i18n.spec.ts`            | same                                      | **Yes**                                            |
| `dashboard-day-summary-i18n.spec.ts`             | same                                      | **Yes**                                            |
| `dashboard-next-action-i18n.spec.ts`             | same                                      | **Yes**                                            |
| `application-platform-integration.spec.ts`       | same                                      | **Yes**                                            |

### Baseline counts (main @ `af866d9`)

| Suite          | Count   |
| -------------- | ------- |
| Web unit tests | **342** |
| E2E            | **26**  |

Confirmed locally on audit branch.

---

## Proposed tests (implementation)

### Resources

- 10 keys exist, non-empty English, `dashboard` namespace, no duplicates

### Labels

- resolver returns canonical English; immutable snapshots; category map

### Formatting

- `formatTime` called per event at derivation boundary (or documented batch)
- no direct `Intl.*` in migrated model/view/labels files
- `displayTime` pass-through to model unchanged
- value/unit pass-through documented

### Model

- per-category latest, sort desc, max 4 — unchanged
- activity omission — unchanged
- invalid event rejection — unchanged
- ready/empty/error/loading — unchanged

### React integration

- `TestPlatformProvider` render with English block + category labels
- missing Provider fail-fast

### E2E vertical slice (new `dashboard-recent-events-i18n.spec.ts`)

1. Dashboard ready
2. English title + view-all + category subtitles
3. Demo event titles/values visible (RU pass-through acceptable)
4. Add insulin via Quick Add → recent events preview updates
5. Timeline edit/delete → Dashboard sync
6. View-all navigates to Timeline

---

## Stop conditions

| Condition                           | Result                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| Change `TimelineEvent` contract     | **Would block** — out of scope                                |
| Change ordering / sorting semantics | **Would block**                                               |
| Introduce relative-time semantics   | **Would block** — not in product today                        |
| Change per-category latest rule     | **Would block**                                               |
| Change max card count               | **Would block**                                               |
| Platform API change                 | **Not triggered** — `formatTime` exists                       |
| `formatMeasurement()` required      | **Not triggered** — defer                                     |
| ICU / pluralization required        | **Not triggered**                                             |
| New namespace                       | **Not triggered**                                             |
| Route-aware preload                 | **Not triggered**                                             |
| Timeline / Quick Add migration      | **Out of scope**                                              |
| `EventCard` status label migration  | **Out of scope** (unused here)                                |
| ADR Decision change                 | **Not required**                                              |
| New ADR                             | **Not required** — follows established vertical slice pattern |

**No blockers** for recommended minimal slice.

---

## Risks

| Risk                                                         | Mitigation                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Mixed-language UI (EN labels + RU event titles/values/units) | Document transitional state (same as I18N-02B2/02B3)                                        |
| Two-stage selection confusion during refactor                | Do not merge selector and model stages                                                      |
| `DASHBOARD_LOCALE = 'ru-RU'` vs EN presentation              | Formatter uses Platform locale; keep selector locale transitional until orchestration slice |
| Six E2E files reference `Все события`                        | Update selectors when view-all label migrates                                               |
| `parseLeadingNumber` strips RU formatting from values        | Pre-existing; not introduced by I18N                                                        |
| `EventCard` `<time dateTime>` uses display time              | Pre-existing a11y limitation; out of scope                                                  |

---

## Technical debt

| Item                                             | Notes                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `formatTimelineDisplayTime` shared with Timeline | Dashboard path should inject Platform formatter; Timeline remains on `Intl` until Timeline I18N |
| RU unit literals in `mapRecentEvent`             | `ЕД`, `г углеводов`, `минут` — defer unit keys                                                  |
| `DASHBOARD_LOCALE = 'ru-RU'` in root             | Used for derivation; presentation uses Platform formatter locale                                |
| `EventCard.statusLabels` Russian                 | Timeline scope; unused by Recent Events                                                         |
| Browser-resolved time zone in root               | ADR-0012 transitional client pattern                                                            |
| View-all label shared across Dashboard E2E       | Becomes English `All events` — coordinate selector updates                                      |

---

## Recommendation

**Proceed to implementation approval** with this minimal slice:

1. Localize 10 block + category labels via `dashboard.recentEvents.*`
2. Move `displayTime` formatting to `useFormatter().formatTime()` at
   `dashboard-root` → `deriveDashboardQuickAddBlocks` → `getRecentTimelineEvents`
   boundary (optional callback; preserve sort/filter/limit)
3. Keep `selectDashboardRecentEvents` business logic unchanged
4. Transitional pass-through for `title`, `value`, `unit`, `context`
5. Remove hardcoded `dashboardRecentEventsLabels` and
   `dashboardRecentEventCategoryLabels` from model
6. Add labels resolver, resource tests, integration test, dedicated E2E
7. Update shared E2E view-all selectors to English
8. Preload unchanged

Defer unit composition and `formatMeasurement()` until structural measurement
contract matures.

---

## Architecture Audit Report

### 1. General information

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| Stage          | I18N-02B4 — Dashboard Recent Events Localization    |
| Phase          | **Stage 1 — Architecture Audit Only**               |
| Base           | `main` @ `af866d9906f6d761fb788ea4ae41cc74e1f824b1` |
| Branch         | `feature/i18n-dashboard-recent-events`              |
| Baseline tests | 342 web / 26 E2E                                    |

### 2. Goal

Migrate Recent Events block labels and event `displayTime` formatting to Platform
Localization + Formatting stack; preserve selection logic, sorting, category
rules, and medical neutrality.

### 3. Scope / out of scope

Confirmed per sections above. Single vertical slice. AI Insight, Timeline UI,
Quick Add UI unchanged.

### 4. File map

18 files analysed (see File map section).

### 5. All strings

10 Russian presentation constants + 4 category labels + derived display fields.
No relative-time phrases. Event content from `TimelineEvent`.

### 6. Data flow

See Data flow section. Two-stage selection documented.

### 7. Source of truth

Shared `useTimelineStore()` events; `getRecentTimelineEvents` + `selectDashboardRecentEvents`.

### 8. Time semantics

Absolute short local time only (`HH:mm`). No Today/Yesterday/minutes-ago in block.

### 9. Business invariants

Preserved list in Business invariants section. Per-category latest + max 4 cards.

### 10–12. Formatting / metrics / units

`formatTime` for display time; pass-through values/units; no `formatMeasurement()`.

### 13. Pluralization / ICU

Not required — static labels + pre-formatted time strings.

### 14. Medical safety

Informational previews only; no clinical interpretation.

### 15. Translation keys

10 proposed `dashboard.recentEvents.*` keys.

### 16. Preload

Unchanged `common` + `dashboard`.

### 17. Hooks decision

`useLocalization()` + `useFormatter()`; `usePresentationContext()` not required.

### 18. Model/view boundary

Labels injected; selection logic in pure model; formatting at derivation boundary.

### 19–20. Accessibility / responsive

Documented above; no visual redesign.

### 21–22. Existing tests / proposed test plan

Documented above.

### 23. Documentation

This document + navigation index updates.

### 24. Architecture compliance

Matches I18N-02A/02B1/02B2/02B3 vertical slice pattern. No Platform API change required.

### 25–27. Technical debt / limitations / risks

Documented above.

### 28. Stop-condition result

**No blockers** for recommended scope. Optional formatter injection into
`getRecentTimelineEvents` should preserve ordering semantics.

### 29. Git status

```
Branch: feature/i18n-dashboard-recent-events (audit docs only)
Production code: unchanged
Commit: not performed
```

### 30. Executive summary

Dashboard Recent Events is a bounded preview block with 10 Russian label
constants, 4 hardcoded category subtitles, and absolute short event times
formatted via `Intl` in `getRecentTimelineEvents`. Event titles, values, and
context are pass-through from shared timeline store data (Russian in demo).
There is **no relative time** (`minutes ago`, `Today`, `Yesterday`) in this
block. Selection uses a two-stage pipeline: chronological top-N from selectors,
then latest-per-category dedupe in the pure model. Migration should follow the
established labels-resolver + hooks + pure model pattern: localize block copy
and category subtitles, move time formatting to `useFormatter().formatTime()` at
the container/derivation boundary, and keep selector selection and model sorting
unchanged. Value/unit strings remain transitional pass-through.

**Confirmed:**

- Production code not changed
- Header, Next Action, Last Glucose, Day Summary — unchanged
- AI Insight — unchanged
- Timeline, Quick Add — unchanged
- Platform API — unchanged
- I18N-02B5 — not started

---

## Localization integration (implemented)

```text
useTimelineStore().events
  ↓
dashboard-root:
  useFormatter() → formatRecentEventDisplayTime(dateTime)
  ↓
deriveDashboardQuickAddBlocks(..., formatRecentEventDisplayTime)
  → getRecentTimelineEvents (unchanged sort/filter/limit semantics)
  → formatTime once per mapped event → displayTime
  ↓
DashboardRecentEvents:
  useLocalization() → resolveDashboardRecentEventsLabels()
  ↓
createDashboardRecentEventsViewModel(props, labels)
  → selectDashboardRecentEvents (unchanged latest-per-category)
  ↓
JSX (pass-through title/context/value/unit; categoryLabel + displayTime from model)
```

**Formatting invariants:**

- **No relative time** — only short `HH:mm` via `formatTime(..., { timeStyle: 'short' })`
- **One formatter call per displayed event** — at `getRecentTimelineEvents` mapping boundary
- **No `Intl.*`** in Recent Events view/model/labels path
- **No ICU** — static labels only
- **Two-stage selector pipeline unchanged** — chronological top-N, then latest-per-category in pure model
- **Pass-through domain strings** — `title`, `context`, `value`, `unit` remain from Timeline/demo contracts
- **Platform API unchanged**

---

## Translation keys (implemented)

| Key                                            | English value                 |
| ---------------------------------------------- | ----------------------------- |
| `dashboard.recentEvents.title`                 | Recent events                 |
| `dashboard.recentEvents.viewAll`               | All events                    |
| `dashboard.recentEvents.loading`               | Loading recent events         |
| `dashboard.recentEvents.unavailable`           | Recent events unavailable.    |
| `dashboard.recentEvents.empty.default`         | No recent events yet.         |
| `dashboard.recentEvents.error.default`         | Could not load recent events. |
| `dashboard.recentEvents.categories.activity`   | Activity                      |
| `dashboard.recentEvents.categories.insulin`    | Insulin                       |
| `dashboard.recentEvents.categories.medication` | Medication                    |
| `dashboard.recentEvents.categories.nutrition`  | Nutrition                     |

Preload unchanged: `['common', 'dashboard']`.

---

## Recommendation

**Ready for review** — implementation matches approved minimal presentation-only
slice.

Defer full `title`/`context`/`value`/`unit` localization until Timeline and
Quick Add structural contracts migrate.

---

## Engineering Audit (I18N-02B4)

### 1. General information

| Field      | Value                                            |
| ---------- | ------------------------------------------------ |
| Stage      | I18N-02B4 — Dashboard Recent Events Localization |
| Phase      | **Implementation Complete — Ready for Review**   |
| Base       | `main` @ `af866d9`                               |
| Branch     | `feature/i18n-dashboard-recent-events`           |
| Commit/PR  | Not performed (per task instructions)            |
| Unit tests | **356** web (+14)                                |
| E2E tests  | **27** (+1)                                      |

### 2. Goal

Migrate Recent Events block chrome, state labels, and category subtitles to
Platform Localization; move event time formatting to `useFormatter().formatTime()`
at the container/derivation boundary; preserve two-stage selector pipeline and
latest-per-category model invariants.

### 3. Changed files

| Action | Path                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| Create | `dashboard-recent-events-labels.ts`                                                                         |
| Create | `dashboard-recent-events-labels.test.mjs`                                                                   |
| Create | `dashboard-recent-events-resources.test.mjs`                                                                |
| Create | `dashboard-recent-events.integration.test.mjs`                                                              |
| Create | `e2e/dashboard-recent-events-i18n.spec.ts`                                                                  |
| Modify | `dashboard-recent-events.tsx`, `dashboard-recent-events-model.ts`, `dashboard-recent-events-model.test.mjs` |
| Modify | `dashboard-root.tsx` (`formatRecentEventDisplayTime`)                                                       |
| Modify | `lib/dashboard/dashboard-quick-add-integration-model.ts` (+ test)                                           |
| Modify | `lib/timeline/timeline-selectors.ts` (injected `formatDisplayTime`; kind guard before format)               |
| Modify | `lib/platform/integration/tests/integration-dom-setup.mjs` (Link / idle callback polyfill)                  |
| Modify | `packages/locales/*` (10 keys)                                                                              |
| Modify | `e2e/dashboard-header-i18n.spec.ts`, `e2e/dashboard-last-glucose-i18n.spec.ts`,                             |
|        | `e2e/dashboard-day-summary-i18n.spec.ts`, `e2e/dashboard-next-action-i18n.spec.ts`,                         |
|        | `e2e/dashboard-quick-add.spec.ts`, `e2e/application-platform-integration.spec.ts` (`All events`)            |
| Docs   | this file, navigation index updates from audit                                                              |

### 4. Translation resources

10 new keys under `dashboard.recentEvents.*` in `@diabetes-universe/locales`.
Canonical list updated in `canonical-translation-key.ts`.

### 5. Formatting flow

```text
TimelineEvent.dateTime
  → getRecentTimelineEvents (sort desc, kind filter, limit 4 — unchanged)
  → formatTime(dateTime, { timeStyle: 'short' }) once per mapped event
  → displayTime on DashboardRecentEventSource
  → selectDashboardRecentEvents (latest-per-category, sort desc, max 4 — unchanged)
  → pure model → JSX (no re-formatting)
```

| Boundary                      | Responsibility                                    |
| ----------------------------- | ------------------------------------------------- |
| `dashboard-root.tsx`          | `useFormatter()` → `formatRecentEventDisplayTime` |
| `timeline-selectors.ts`       | Invokes injected callback once per mapped event   |
| `dashboard-recent-events.tsx` | `useLocalization()` only — no `useFormatter()`    |
| View/model                    | Consume `displayTime` as pass-through string      |

**Formatter call count:** exactly **one** `formatTime` per event that survives
`mapRecentEvent` (glucose/note excluded before model selection).

### 6. Selector / model invariants (preserved)

| Invariant                             | Status    |
| ------------------------------------- | --------- |
| `getRecentTimelineEvents` sort/filter | Unchanged |
| `selectDashboardRecentEvents`         | Unchanged |
| Latest-per-category dedupe            | Unchanged |
| Sort by `dateTime` desc               | Unchanged |
| Limit 4 cards                         | Unchanged |
| Glucose/note exclusion                | Unchanged |
| Dashboard/Timeline shared store sync  | Unchanged |
| Loading/empty/error semantics         | Unchanged |

### 7. Transitional pass-through contract

| Field     | Contract                                           |
| --------- | -------------------------------------------------- |
| `title`   | Pass-through from TimelineEvent / demo data        |
| `context` | Pass-through                                       |
| `value`   | Pass-through (parsed number for insulin/nutrition) |
| `unit`    | Pass-through / selector defaults                   |
| Mixed UI  | EN chrome + RU domain strings — expected           |

No `formatMeasurement()`. No `TimelineEvent` changes.

### 8. Testing

| Suite                                            | Coverage                                                   |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `dashboard-recent-events-resources.test.mjs`     | 5 tests — 10 keys, namespace, preload unchanged            |
| `dashboard-recent-events-labels.test.mjs`        | 3 tests — resolver, preload, immutable output              |
| `dashboard-recent-events-model.test.mjs`         | 13 tests — latest-per-category, ordering, limit, states    |
| `dashboard-recent-events.integration.test.mjs`   | 6 tests — render, formatTime once, no Intl, fail-fast      |
| `dashboard-quick-add-integration-model.test.mjs` | derivation + selection with category labels (updated)      |
| `dashboard-recent-events-i18n.spec.ts`           | 1 E2E — chrome, categories, time, Quick Add, timeline sync |

### 9. Technical debt

- Event `title`/`context`/`value`/`unit` remain Russian in demo — deferred to Timeline/Quick Add migration
- `getRecentTimelineEvents` retains `formatTimelineDisplayTime` fallback for non-Dashboard callers
- No relative time by design
- No ICU

### 10. Regression scope

Unchanged: Header, Next Action, Last Glucose, Day Summary, AI Insight, Timeline UI,
Quick Add UI, Platform API, day-boundary logic.

### 11. Validation

| Check                                       | Result     |
| ------------------------------------------- | ---------- |
| `pnpm format:check`                         | Pass       |
| `pnpm lint`                                 | Pass       |
| `pnpm typecheck`                            | Pass       |
| `pnpm --filter @diabetes-universe/web test` | Pass (356) |
| `pnpm build`                                | Pass       |
| `pnpm test:e2e`                             | Pass (27)  |

### 12. Git status

```
Branch: feature/i18n-dashboard-recent-events
Production code: modified (uncommitted)
Commit/PR: not performed
```

## Architecture references

- [I18N-02A — Dashboard Header Migration](dashboard-header-migration.md)
- [I18N-02B1 — Dashboard Next Action Migration](dashboard-next-action-migration.md)
- [I18N-02B2 — Dashboard Last Glucose Migration](dashboard-last-glucose-migration.md)
- [I18N-02B3 — Dashboard Day Summary Migration](dashboard-day-summary-migration.md)
- [Dashboard Recent Events Architecture](../dashboard/recent-events.md)
- [ADR-0012 — User Time Zone Policy](../../adr/0012-user-time-zone-policy.md)
- [ADR-0013 — Web Client Runtime Ownership](../../adr/0013-web-client-runtime-ownership.md)
- [Formatting Platform](../../../packages/formatting/README.md)
