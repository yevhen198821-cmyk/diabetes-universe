# @diabetes-universe/platform-web

## Purpose

Environment-specific Web Composition Root for the Diabetes Universe platform.
Accepts a plain `WebPlatformConfig` DTO, creates Infrastructure Adapters and
platform services, ensures Platform Readiness, and returns an isolated
`PlatformRuntime`.

## Stage

**CR-01 — Web Composition Root (CR-01C/CR-01D)**

## Responsibility

- environment-specific Web Composition Root wiring;
- Localization Infrastructure Adapter selection (`InMemory` loaders);
- `LocalizationPlatform` creation via `createLocalizationPlatform()`;
- `PlatformFormatter` creation via `createPlatformFormatter()`;
- Platform Readiness preparation (`await localization.whenReady()` + selective bundle preload);
- final aggregation via `createPlatformRuntime()`.

## Not responsible for

- Next.js request reading;
- React Provider;
- hooks;
- UI;
- business logic;
- medical data;
- translation lookup;
- formatting logic.

## Lifecycle

```text
WebPlatformConfig
        ↓
Infrastructure Adapters
        ↓
Localization Platform + Platform Formatter
        ↓
Platform Readiness
        ↓
createPlatformRuntime()
        ↓
PlatformRuntime
```

## Readiness levels

`createWebPlatformRuntime()` guarantees:

- a new isolated `PlatformRuntime` aggregate;
- registry readiness (`getDefaultLocale()`, `getSupportedLocales()`, `getNamespaces()`);
- requested `(locale, namespace)` pairs from `preload` are loaded into the
  localization bundle cache;
- sync `translate()` works for keys within the preloaded scope.

Readiness sequence:

```text
Localization runtime created
        ↓
await localization.whenReady()
        ↓
preload unique (locale, namespace) pairs
        ↓
createPlatformRuntime()
        ↓
PlatformRuntime
```

Empty `preload` arrays are valid but do not make the runtime translation-ready.
Registry-dependent methods still work after factory completion. Use empty preload
only when Application defers sync translation until later preparation.

## Instance scope

- one isolated `PlatformRuntime` per `createWebPlatformRuntime()` call;
- SSR: callers must invoke the factory per request;
- no module-level mutable runtime singleton;
- browser session reuse policy belongs to bootstrap / Application layer.

## Boundaries

- plain DTO input only (`WebPlatformConfig`);
- no React or Next.js types or dependencies;
- Application receives a `PlatformRuntime` whose readiness matches the declared
  `preload` scope (see Readiness levels above);
- does not mutate input configuration objects.

## Public API

```ts
import {
  createWebPlatformRuntime,
  type WebPlatformConfig,
  type WebPlatformPreloadConfig,
  type WebPlatformRuntimeFactory,
} from '@diabetes-universe/platform-web';
```

Deep imports are not supported.

## Architecture references

- [Web Composition Root](../../docs/architecture/composition-root/web-composition-root.md)
- [Platform Runtime Foundation](../platform/README.md)
- [ADR-0011 — Platform Infrastructure Layer](../../docs/adr/0011-platform-infrastructure-layer.md)

## Related packages

| Package                           | Role                                |
| --------------------------------- | ----------------------------------- |
| `@diabetes-universe/platform`     | Platform Runtime Foundation         |
| `@diabetes-universe/i18n`         | Localization Platform               |
| `@diabetes-universe/i18n-locales` | Localization Infrastructure Adapter |
| `@diabetes-universe/formatting`   | Platform Formatting                 |
