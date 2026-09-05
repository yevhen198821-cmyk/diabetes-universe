# Localization Platform Overview

## Purpose

Document architecture boundaries and operational concepts for the Localization
Platform (contracts, runtime, infrastructure adapters, and Composition Root
wiring).

## Status

Approved — Localization Platform closed for the four Web locales
(`en-GB`, `de-DE`, `uk-UA`, `ru-RU`). See
[Platform Localization Closure](../../implementation/platform-localization-closure.md).

## Responsibility

- Describe layer roles for localization without fixing physical package paths.
- Link runtime behavior to ADR-0011 layer model.
- Capture cross-cutting concepts such as Platform Readiness.
- Distinguish **platform foundation** (implemented) from **product-surface
  migration** (partial).

## Platform foundation (implemented)

| Package / area                    | Role                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `@diabetes-universe/i18n`         | Localization Platform contracts and runtime            |
| `@diabetes-universe/i18n-locales` | Concrete locale catalog, loaders, and fallback policy  |
| `@diabetes-universe/locales`      | Canonical translation resources                        |
| `apps/web/lib/platform/`          | Web Composition Root wiring, `PlatformProvider`, hooks |

Dashboard blocks I18N-02A–02B5 consume `useLocalization()` / `useFormatter()` in
production.

## Product-surface status

| Surface                         | Status                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| Locale authority + cookie + SSR | Closed — catalog, `du-web-locale`, request bootstrap                     |
| Profile language selection      | Closed — single-purpose `/account/language` surface                      |
| Dashboard blocks                | Feature Complete (I18N-02A–02B5)                                         |
| Timeline presentation dates     | Closed through `PlatformFormatter`                                       |
| Glucose / insulin Quick Add     | Localized form chrome; shared Quick Add host still has Russian leftovers |
| Nutrition / activity / notes    | Not a localization-closure target; number helpers now use the formatter  |
| Auth sign-in chrome             | Localized; identity-package error strings remain package-owned           |

## Layer roles

| Layer                               | Architectural role                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Localization Platform Contracts     | Interfaces, types, runtime API (`TranslationBundleLoader`, `LocalizationPlatform`, …) |
| Localization Data / Resources       | Canonical messages, metadata, namespaces                                              |
| Localization Infrastructure Adapter | Concrete loader implementations (e.g. in-memory adapters)                             |
| Composition Root                    | Adapter selection, `createLocalizationPlatform()` wiring, initialization strategy     |

See [ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md).

## Platform Readiness

Sync Runtime methods (`translate()`, `hasTranslation()`) require
[Platform Readiness](platform-readiness.md) before Application code can rely on
them. Composition Root owns how that state is achieved.

## Dependencies

- [ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md)
- [Platform Readiness](platform-readiness.md)

## Notes

- `getNamespaces()` in Runtime v1.0 returns only namespaces of bundles already
  loaded into the cache; it does not guarantee the full canonical platform list.
- Bundle-level fallback is handled by the Infrastructure loader; key-level
  fallback is handled by Runtime `translate()` over
  `requested locale → en-GB` only.
- Web locale preference is the first-party `du-web-locale` cookie. See
  [Platform Localization Closure](../../implementation/platform-localization-closure.md).
