# Changelog

## Dashboard Last Glucose Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Last Glucose Localization Migration (I18N-02B2) — `apps/web/components/dashboard/dashboard-last-glucose*`
- третий вертикальный Dashboard migration slice: `useLocalization()` (view) + `useFormatter()` (container)
- English canonical `dashboard.lastGlucose.*` keys (7) в `@diabetes-universe/locales`
- display time via single `PlatformFormatter.formatTime()` call at `dashboard-root` → `deriveLastGlucose` boundary
- transitional glucose value contract: `TimelineEvent.value` pass-through (no `formatMeasurement()`)
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-last-glucose-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #24 (`5bf6925` → `ef9a7e0` on `main`)
- web tests: 326 total; E2E: 25 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — Feature Complete)
- Dashboard Next Action (I18N-02B1 — Feature Complete)
- Day Summary, Recent Events, AI Insight (I18N-02B3+)
- Timeline и Quick Add product source migration
- `formatMeasurement()` / structural glucose contract
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Last Glucose Localization (I18N-02B2) — Feature Complete ✅

## Dashboard Next Action Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Next Action Localization Migration (I18N-02B1) — `apps/web/components/dashboard/dashboard-next-action*`
- второй вертикальный Dashboard migration slice на `useLocalization()`
- structural `NextStepSource` demo data (`type: 'insulin'`, `priority: 'high'`) без presentation strings в mocks
- localized presentation via `resolveDashboardNextActionDemoStep()` в container boundary
- English canonical `dashboard.nextAction.*` keys (8) в `@diabetes-universe/locales`
- additive product contract: `NextStepSource`, `NextStepActionType`, `NextStepPriority` в `@diabetes-universe/types`
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-next-action-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #23 (`88308ee` → `2679af8` on `main`)
- web tests: 312 total; E2E: 24 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — уже Feature Complete)
- Last Glucose, Day Summary, Recent Events, AI Insight (I18N-02B2+)
- Timeline и Quick Add product source migration
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Next Action Localization (I18N-02B1) — Feature Complete ✅

## Dashboard Header Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Header Localization Migration (I18N-02A) — `apps/web/components/dashboard/dashboard-header*`
- первый вертикальный product migration slice на `useLocalization()`, `useFormatter()`, `usePresentationContext()`
- English canonical `dashboard` namespace (7 Header keys) в `@diabetes-universe/locales`
- selective application preload: `common` + `dashboard`
- `dashboard-header-labels.ts` и pure presentation model boundary
- unit, integration, and E2E coverage (`dashboard-header-i18n.spec.ts`)
- architecture documentation и Engineering Audit (preload, technical debt, known limitations)
- merge: PR #22 (`411a40b` → `117967c` on `main`)
- web tests: 303 total; E2E: 23 total

Не входит в этот этап:

- remaining Dashboard blocks (I18N-02B+)
- Timeline и Quick Add product source migration
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Header Localization (I18N-02A) — Feature Complete ✅

## Application Platform Integration — Feature Complete

Дата: 2026-08-02

Завершено:

- Application Platform Integration (CR-03C) — `apps/web/lib/platform/integration/`
- ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate
- `ApplicationRuntimeGate` — client-realm runtime assembly and product single-mount policy
- serializable `ApplicationPlatformBootstrap` server → client boundary
- readiness marker `data-platform-status="ready"` for E2E/lifecycle contracts
- root layout server bootstrap invocation and `<html lang>` from snapshot/seed
- integration tests: 28; web tests: 298 total; E2E: 22 total

Не входит в этот этап:

- cookie persistence adapter and `PresentationPersistence` wiring
- Dashboard, Timeline, Quick Add hook migration (I18N-02)
- locale switch UI

Статус:

Application Platform Integration — Feature Complete ✅

## React Platform Provider Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- React Platform Provider Foundation (CR-03B) — `apps/web/lib/platform/react/`
- `PlatformProvider` — supplies an already assembled `PlatformRuntime` via React Context
- read-only hooks: `usePlatformRuntime`, `useLocalization`, `useFormatter`, `usePresentationContext`
- internal fail-fast missing-provider guard (plain `Error`, not exported)
- Option A nested-provider policy (nearest provider wins; no nested guard)
- test utilities: `createTestPlatformRuntime`, `TestPlatformProvider`
- architecture documentation (`react-platform-provider.md`)
- react provider tests: 26; web tests: 268 total

Не входит в этот этап:

- route integration and `PlatformProvider` wiring in `app/layout.tsx`
- server bootstrap invocation on routes
- persistence, cookie adapter, and browser bootstrap consumers
- Dashboard, Timeline, Quick Add migration
- platform package public API changes

Статус:

React Platform Provider Foundation — Feature Complete ✅

## Presentation Context Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Presentation Context Foundation (CR-03A) — `apps/web/lib/platform/presentation/`
- `ServerPresentationSeed` в `RequestPlatformBootstrapResult` при `time-zone-required`
- `PresentationContext` (alias `LocaleContext`) и `PresentationSnapshot` (version 1)
- client-only `resolveBrowserTimeZone()` и `createClientPresentationBootstrapResult()`
- validated snapshot create/restore и `PresentationPersistence` contract
- consolidated IANA time zone validation (`is-valid-iana-time-zone.ts`)
- split public API: isomorphic `presentation/index.ts`, client-only `presentation/client.ts`
- architecture documentation и ADR-0012 implementation contract update
- presentation tests: 33; web tests: 242 total

Не входит в этот этап:

- React Provider и hooks (CR-03B)
- route integration и cookie persistence
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- production UI wiring

Статус:

Presentation Context Foundation — Feature Complete ✅

## Thin Next.js Platform Bootstrap — Feature Complete

Дата: 2026-08-02

Завершено:

- Thin Next.js Platform Bootstrap (CR-02) — `apps/web/lib/platform/`
- ADR-0012 — User Time Zone Policy (Option C: required explicit IANA time zone)
- `createRequestPlatformRuntime()` — server-only canonical entry point
- `RequestPlatformBootstrapResult` — discriminated contract (`ready` | `time-zone-required`)
- request-derived locale resolution (Wave 1: `en-GB`, `uk-UA`, `de-DE`, `ru-RU`)
- plain `WebPlatformConfig` assembly and per-call `createWebPlatformRuntime()` delegation
- SSR isolation tests and hydration boundary documentation
- bootstrap tests: 35 (205 total web tests)

Не входит в этот этап:

- React Provider и hooks (CR-03)
- cookie scheme wiring и browser IANA first-visit detection
- production route invocation
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- full translations integration across UI

Статус:

Thin Next.js Platform Bootstrap — Feature Complete ✅

## Platform Runtime & Web Composition Root Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Platform Runtime Foundation (CR-01A) — `@diabetes-universe/platform`
- Web Composition Root (CR-01C/CR-01D) — `@diabetes-universe/platform-web`
- `createPlatformRuntime()` — immutable `PlatformRuntime` aggregate
- `createWebPlatformRuntime()` — framework-independent Web Composition Root
- `LocalizationPlatform.whenReady()` — registry readiness contract
- selective bundle preload via `WebPlatformConfig.preload`
- SSR-safe per-call runtime isolation
- integration: Localization + Formatting + Platform Runtime
- runtime tests: platform (6), platform-web (38), i18n (15, including `whenReady()`)

Не входит в этот этап:

- cookies и URL locale detection (beyond Composition Root contracts)
- React Provider и hooks
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- remote/CDN/OTA adapters
- Backend Composition Root
- Mobile Composition Root

Статус:

Platform Runtime & Web Composition Root Foundation — Feature Complete ✅

## Platform Formatting Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Platform Formatting Foundation (FMT-01)
- Пакет: `@diabetes-universe/formatting`
- Platform Contracts
- PlatformFormatter Runtime implementation
- `createPlatformFormatter()`
- Date / Time / DateTime formatting
- Number formatting
- Percentage formatting
- Currency formatting
- Relative Time formatting
- Duration formatting
- Range formatting
- Measurement formatting
- Runtime cache (Intl formatter instances only)
- Runtime tests (170)

Не входит в этот этап:

- Date/time parsing beyond `DateLike` contract validation
- Medical unit conversion
- Formatting Infrastructure Adapter
- Composition Root wiring
- React hooks и UI integration
- Lint/CI enforcement of the formatting single entry point

Статус:

Platform Formatting Foundation — Feature Complete ✅

## Localization Platform Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Localization Platform Foundation (Platform Foundation v1.0)
- Пакеты: `@diabetes-universe/i18n`, `@diabetes-universe/locales`,
  `@diabetes-universe/i18n-locales`
- ADR-0009 (Localization Platform), ADR-0010 (Platform Formatting Library),
  ADR-0011 (Platform Infrastructure Layer)
- Runtime v1.0: `createLocalizationPlatform()`, `translate()`, `hasTranslation()`,
  bundle cache, injected loader interfaces
- Platform Readiness (архитектурное определение)
- Infrastructure adapters вынесены из contract layer (I18N-06)
- Runtime tests (15) и adapter tests (5)

Не входит в этот этап:

- ICU MessageFormat runtime
- React Provider, hooks, Next.js integration
- UI migration приложения на Localization Platform
- locale switching
- CDN / OTA

Статус:

Localization Platform Foundation — Feature Complete ✅

## Timeline Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard и Timeline разделены
- Shared Timeline Store
- TimelineEvent entity model
- ISO dateTime
- Multi-day grouping
- Search
- Filters
- Event Details
- Editing
- Deletion
- Load More
- Dashboard synchronization
- Quick Add:
  - Глюкоза
  - Инсулин
  - Питание
  - Лекарство
  - Активность
  - Заметка
- Next Action → прямое открытие формы инсулина
- Responsive layouts
- Accessibility
- Unit tests
- Playwright E2E
- Final Preview audit

Статус:

Feature Complete ✅

## Dashboard Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Architecture
- Dashboard UI Specification
- Dashboard implementation
- Quick Add integration
- Dashboard documentation
- Unit tests
- Playwright E2E
- Accessibility
- Responsive layouts
- Final audit

Статус:

✅ Feature Complete

## Added

## Changed

## Fixed
