# Localization Platform Overview

## Purpose

Document architecture boundaries and operational concepts for the Localization
Platform (contracts, runtime, infrastructure adapters, and Composition Root
wiring).

## Status

Approved — platform foundation implemented; product-surface migration partial

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
| `@diabetes-universe/i18n-locales` | In-memory Infrastructure adapters                      |
| `@diabetes-universe/locales`      | Canonical translation resources                        |
| `apps/web/lib/platform/`          | Web Composition Root wiring, `PlatformProvider`, hooks |

Dashboard blocks I18N-02A–02B5 consume `useLocalization()` / `useFormatter()` in
production.

## Product-surface migration (partial)

| Surface                  | Status                                   |
| ------------------------ | ---------------------------------------- |
| Dashboard blocks         | Feature Complete (I18N-02A–02B5)         |
| Timeline                 | Not migrated — Russian UI strings remain |
| Quick Add                | Not migrated — Russian UI strings remain |
| Runtime locale switching | Not production-ready                     |

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
  fallback is handled by Runtime `translate()` over the locale chain.
