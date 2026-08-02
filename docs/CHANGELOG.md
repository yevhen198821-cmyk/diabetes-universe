# Changelog

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
- Runtime tests (9) и adapter tests (5)

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
