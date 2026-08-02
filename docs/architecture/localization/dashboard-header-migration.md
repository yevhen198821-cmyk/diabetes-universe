# Dashboard Header Localization Migration (I18N-02A)

## Status

Approved — Implementation Complete — Ready for Review

## Purpose

Prove the first vertical product migration from hardcoded Dashboard Header copy
to the approved Localization Platform and Formatting Platform stack through
`PlatformProvider` hooks.

## Scope

- `DashboardHeader` view and presentation model
- `dashboard-header-labels.ts` label resolution
- English canonical `dashboard` namespace keys
- selective production preload extension for `dashboard`
- Header date formatting via `useFormatter()`
- Header copy via `useLocalization()`
- presentation context locale/time zone for date assembly
- unit, integration, and E2E coverage for the Header vertical slice

## Out of scope

- remaining Dashboard blocks (Next Action, Day Summary, Last Glucose, etc.)
- Timeline and Quick Add product migration
- `uk`, `de`, `ru` professional translations
- locale switch UI, Settings, cookie persistence
- Dashboard layout or Header visual redesign
- platform package public API changes
- ICU MessageFormat interpolation

## Translation keys

| Key                                 | English value               |
| ----------------------------------- | --------------------------- |
| `dashboard.header.title`            | Diabetes Universe           |
| `dashboard.header.addEvent`         | Add event                   |
| `dashboard.header.avatar.label`     | User profile                |
| `dashboard.header.avatar.action`    | Open profile                |
| `dashboard.header.date.label`       | Current date                |
| `dashboard.header.date.unavailable` | Date unavailable            |
| `dashboard.header.loading`          | Loading header              |
| `dashboard.header.error.default`    | Could not load header data. |

Avatar labels with a display name compose as `{prefix}: {displayName}` in the
presentation model until parameterized translations are part of the approved
Localization Platform contract. See [Technical Debt](#technical-debt).

## Namespace

- namespace: `dashboard`
- canonical language: English (`packages/locales/src/resources/en/messages.ts`)
- draft locales inherit English placeholders via existing locale bundles

## Preload contract

Production bootstrap preloads:

- `common`
- `dashboard`

Configured in `WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES` and applied by:

- `createWebPlatformConfig()`
- `createWebPlatformConfigFromPresentationContext()`

Selective preload remains in effect. Timeline and Quick Add namespaces are not
preloaded.

See [Engineering Audit — Preload](#engineering-audit--preload) for the full
preload-policy review.

## Formatting contract

Header display date:

- source instant: current render reference time (`referenceTime` prop or mount time)
- locale/time zone: `usePresentationContext()`
- display formatting: `formatter.formatDate(date, { dateStyle: 'full' })`
- machine `dateTime`: `getTimelineCalendarDateKey(date.toISOString(), timeZone)`

No `Intl.*`, `toLocaleString()`, or manual month arrays in Header or its model.

## Model/view boundary

```text
useLocalization() / useFormatter() / usePresentationContext()
  ↓
resolveDashboardHeaderLabels() + createDashboardHeaderDate()
  ↓
createDashboardHeaderViewModel(labels, date, state, user)
  ↓
DashboardHeader JSX
```

The model remains pure and receives localized primitives only.

## Accessibility

Localized:

- product title (`h1`)
- add-event button visible text and `aria-label`
- avatar `aria-label`
- current-date `aria-label` on `<time>`
- loading `sr-only` status
- default error message

Unchanged:

- decorative brand mark `DU` (`aria-hidden`)
- route paths, test IDs, analytics identifiers

## Responsive constraints

No layout changes. Desktop action remains `lg:inline-flex`; mobile Quick Add
entry remains via Dashboard FAB outside Header scope.

## Fallback behavior

Uses existing Localization Platform fallback policy. Missing keys surface through
the platform contract; Header does not embed hardcoded fallback strings.

## Testing strategy

- resource key validation
- pure model tests with injected English labels and formatter dependencies
- label resolution against preloaded runtime
- React integration render inside `TestPlatformProvider`
- E2E vertical slice: `dashboard-header-i18n.spec.ts`
- regression: existing 23 E2E tests (Quick Add FAB selectors unchanged on Timeline)

## Regression guarantees

- Dashboard business logic unchanged
- Timeline and Quick Add source unchanged
- `ApplicationRuntimeGate` readiness policy unchanged
- provider order unchanged

## Future Dashboard migration

I18N-02B+ will migrate remaining Dashboard blocks using the same hook → pure model
→ view pattern established here.

## Definition of Done

- [x] Header strings migrated to `dashboard` namespace
- [x] English canonical resources added
- [x] selective preload extended
- [x] `useLocalization()` and `useFormatter()` wired in Header
- [x] model/view separation preserved
- [x] tests and architecture documentation
- [x] no Timeline / Quick Add product source changes

## Engineering Audit — Preload

### 1. Global or route-specific?

**Application-global.** `WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES` is
declared once in `apps/web/lib/platform/web-platform-defaults.ts`, embedded in a
single immutable `WebPlatformConfig`, and prepared by the root
`ApplicationRuntimeGate` before any route mounts. There is no per-route preload
configuration in `apps/web` today.

The architecture target — _route-specific bootstrap determines `preload` scope_
([Web Composition Root](../composition-root/web-composition-root.md)) — is not
yet implemented as a product orchestration mechanism.

### 2. Is `dashboard` loaded on Timeline, Quick Add, and other pages?

**Yes, in cache only.** The `(locale, dashboard)` bundle is preloaded during
root bootstrap and therefore sits in the Localization Platform bundle cache for
every route, including Timeline and Quick Add. No Dashboard Header code runs on
those routes and no `dashboard.*` keys are resolved there.

### 3. Why is this acceptable for I18N-02A?

- **Selective, not full preload.** Only `common` and `dashboard` are loaded;
  Timeline, Quick Add, and future product namespaces remain out of scope.
- **Sync `translate()` contract.** Header resolves copy synchronously via
  `useLocalization()`; the namespace must be in cache before first Header render.
- **Minimal footprint.** The `dashboard` namespace currently holds seven Header
  keys — a negligible network and memory cost relative to the rest of the app.
- **No product regression.** Timeline and Quick Add source, selectors, and
  namespaces are unchanged; preloading an unused bundle does not alter their
  behaviour.
- **Matches Platform Readiness v1.** Selective preload is an approved
  initialization strategy; full eager preload of all namespaces is explicitly
  not required.

### 4. Temporary step or long-term architecture?

**Transitional step of the first vertical migration**, not the final preload
shape. It is the pragmatic application-level selective preload until
route-aware bootstrap exists. As additional Dashboard blocks and other surfaces
migrate, preload scope will either move to route segments or consolidate further
namespaces at application level — whichever orchestration path is chosen when
route-based bootstrap is built.

### 5. Route-scoped preload without global `dashboard` load?

**Not feasible within I18N-02A scope without expanding orchestration scope.**

A route-scoped alternative would require new `apps/web` infrastructure, for
example:

- per-route `WebPlatformConfig` assembly with distinct `preload` scopes, or
- a route-level readiness gate that calls public `localization.getBundle()`
  before rendering localized subtrees.

Both options introduce bootstrap orchestration beyond this vertical slice and
are out of scope for I18N-02A. Platform public API already exposes everything
needed (`getBundle`, `WebPlatformConfig.preload`); the gap is product-side
route-aware composition, not a platform capability missing from the contract.

**No preload code change was made** after this audit.

### 6. Why this is not technical debt and does not require an ADR

| Concern                  | Assessment                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Technical debt?          | **No.** Behaviour matches the approved Platform Readiness model (selective preload). Cost is bounded and documented. Unused cache entries on non-Dashboard routes are an accepted trade-off of the current single-gate bootstrap, not a deferred fix.                                                                            |
| ADR required?            | **No.** No architectural decision changed. ADR-0009 and Platform Readiness already allow selective preload; Web Composition Root already documents route-based preload as a future orchestration option. This slice applies the existing contract at application scope.                                                          |
| Post-migration evolution | When route-aware bootstrap lands, Dashboard routes will declare `dashboard` (and later sibling namespaces) in their own `preload` scope; non-Dashboard routes will drop them. Until then, application-global selective preload grows incrementally with each migrated vertical slice — a deliberate, reversible staging pattern. |

## Technical Debt

| Item                                             | Status                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parameterized translations (ICU / interpolation) | **Open — platform capability**   | `TranslationParameters` exists on `TranslationRequest`, but `LocalizationPlatformImpl.translate()` does not apply parameters. ICU MessageFormat runtime is listed as not implemented in `packages/i18n/README.md`. Avatar accessible label composition (`{prefix}: {displayName}`) in `createDashboardHeaderViewModel` remains a temporary limitation until that capability is introduced. **Do not add interpolation infrastructure in I18N-02A.** |
| Route-aware preload orchestration                | **Open — product orchestration** | Not introduced in this slice. See [Engineering Audit — Preload](#engineering-audit--preload). Tracked as a future Web Composition Root enhancement, not as debt created by I18N-02A.                                                                                                                                                                                                                                                                |

Explicit limitation (avatar label):

> Parameterized translations (ICU/interpolation) are not yet part of the
> approved Localization Platform contract; avatar accessible label composition
> remains a temporary limitation until that capability is introduced.

## Known Limitations

- **Application-global `dashboard` preload.** The namespace is cached on all
  routes until route-aware bootstrap exists. Keys are not consumed outside
  Dashboard Header.
- **Manual string composition for dynamic accessible labels.** Avatar
  `aria-label` and current-date `aria-label` (`{label}: {value}`) are assembled in
  `dashboard-header-model.ts` because sync parameterized `translate()` is not
  available. Copy order and punctuation are fixed in code, not in message
  templates.
- **English canonical resources only.** `uk`, `de`, and `ru` professional
  translations are out of scope; draft locales inherit English placeholders.
- **Header vertical slice only.** Remaining Dashboard blocks still use legacy
  hardcoded copy and `DASHBOARD_LOCALE = 'ru-RU'` formatting paths.
- **No locale switch UI.** Presentation context locale is request-seeded; user
  locale switching and cookie persistence are future work.

## Architecture references

- [ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate](../../adr/0013-web-client-runtime-ownership.md)
- [Application Platform Integration](../presentation/application-platform-integration.md)
- [Dashboard Header Architecture](../dashboard/header.md)
- [Platform Readiness](../localization/platform-readiness.md)
- [Web Composition Root](../composition-root/web-composition-root.md)
