# @diabetes-universe/i18n

## Purpose

Platform package for the Diabetes Universe Localization Platform — contracts and
Runtime v1.0 for translation lookup, bundle caching, and locale metadata.

## Responsibility

- Define immutable, framework-independent localization contracts.
- Provide shared types for languages, locales, time zones, bundles, loaders, and
  the public runtime API.
- Implement sync Runtime (`createLocalizationPlatform`, `translate`, bundle cache).
- Remain serializable and testable at the contract boundary.

Infrastructure adapter implementations live in
[`@diabetes-universe/i18n-locales`](../i18n-locales).

## Core concepts

- **Language**, **Locale**, and **Time Zone** are independent dimensions.
- `LocaleContext` carries formatting state only. It does not derive time zone
  from language or locale.
- **Fallback** is a platform resource policy (`FallbackPolicy`), not a user
  preference field inside `LocaleContext`.
- Translation bundle values are ICU message source strings (storage format per
  ADR-0009; ICU runtime formatting not yet implemented).

## Implemented (Runtime v1.0)

### Contracts

- `SupportedLanguageCode`, `LanguageCode`, `LocaleCode`, `Namespace`,
  `TranslationKey`, `HourCycle`
- `LocaleContext`, `FallbackPolicy`
- `TranslationBundle`
- `LocaleRegistry`, `LanguageLocaleDefault`
- `TranslationBundleLoader`, `LocaleRegistryLoader` (injected interfaces)

### Runtime API

- `LocalizationPlatform`, `LocalizationService`
- `createLocalizationPlatform(input)` — factory; wires injected loaders into
  `LocalizationPlatformImpl`
- `translate()` — sync lookup from in-memory bundle cache
- `hasTranslation()` — sync key presence check
- `getBundle()` — async bundle load; populates cache
- `getSupportedLocales()`, `getDefaultLocale()`, `getNamespaces()`
- `whenReady()` — resolves when locale registry is loaded; shared lifecycle promise
- Bundle cache with locale-chain key-level fallback

### Platform Readiness

Sync methods require [Platform Readiness](../../docs/architecture/localization/platform-readiness.md)
before Application code can rely on them. Composition Root owns initialization
strategy (preload, route-based, on-demand, etc.).

### Tests

- Runtime unit tests in `src/runtime/localization-platform.test.mjs` (15 tests)

## Not implemented yet

- ICU MessageFormat runtime (plural, select, interpolation)
- React Provider and hooks
- Next.js integration
- UI migration to Localization Platform
- locale switching / language switcher
- CDN / OTA remote bundles
- cache invalidation strategy

These are planned for future sprints.

## v1.0 language defaults

| Language | Default locale |
| -------- | -------------- |
| `en`     | `en-GB`        |
| `uk`     | `uk-UA`        |
| `de`     | `de-DE`        |
| `ru`     | `ru-RU`        |

## Architecture references

- [Localization Platform Overview](../../docs/architecture/localization/overview.md)
- [Platform Readiness](../../docs/architecture/localization/platform-readiness.md)
- [ADR-0009 — Localization Platform](../../docs/adr/0009-localization-platform.md)
- [ADR-0011 — Platform Infrastructure Layer](../../docs/adr/0011-platform-infrastructure-layer.md)

## Related packages

| Package                           | Role                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `@diabetes-universe/locales`      | Canonical messages and locale metadata (Data / Resources) |
| `@diabetes-universe/i18n-locales` | In-memory Infrastructure Adapters                         |
