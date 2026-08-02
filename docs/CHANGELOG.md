# Changelog

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
