# Platform Readiness

## Purpose

Define **Platform Readiness** for Localization Platform Runtime and clarify how
it relates to Composition Root initialization strategies.

## Status

Draft

## Responsibility

- Establish shared terminology for sync Runtime preconditions.
- Separate readiness as an operational state from specific preload mechanisms.
- Assign ownership of initialization strategy to Composition Root.

## Definition

**Platform Readiness** — состояние, при котором все предусловия, необходимые для
корректной работы синхронных методов Runtime, выполнены. Каким способом это
состояние достигается (eager preload, selective preload, route-based preload,
on-demand preparation и т.д.), определяется выбранной стратегией инициализации,
за которую отвечает Composition Root.

## Implications

### Sync Runtime model

`translate()` and `hasTranslation()` read from the in-memory bundle cache only.
They do not trigger bundle loading. Correct sync behavior therefore depends on
Composition Root ensuring the required bundles are loaded before Application code
calls these methods.

### Warmup is not a platform principle

Warmup (bundle preloading) is an **operational requirement** of the sync Runtime
model, not part of the public API or a platform-wide mandate. Whether full
preload, selective preload, route-based preload, or on-demand preparation is used
is an initialization strategy decision owned by Composition Root.

### Not mandatory full preload

Platform Readiness does not require eager loading of all locales and namespaces in
every deployment. The chosen strategy must match product constraints (SSR, mobile,
offline, route boundaries, etc.) while satisfying the preconditions needed for
sync calls in that context.

## Dependencies

- [ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md)
- [Localization Platform Overview](overview.md)

## Readiness levels

Composition Root and Application must distinguish these states explicitly:

| Level                 | Meaning                                                                  | How it is achieved                             |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| **Runtime created**   | `PlatformRuntime` aggregate exists                                       | `createPlatformRuntime()`                      |
| **Registry ready**    | `getDefaultLocale()`, `getSupportedLocales()`, `getNamespaces()` succeed | `await localization.whenReady()`               |
| **Bundle ready**      | A specific `(locale, namespace)` pair is available in the bundle cache   | Successful `getBundle()` for that pair         |
| **Translation-ready** | `translate()` / `hasTranslation()` succeed for keys in a declared scope  | Registry ready + bundle preload for that scope |

### Registry ready

After:

```ts
await localization.whenReady();
```

registry-dependent methods are guaranteed to work. `whenReady()` uses the single
lifecycle promise created by `LocalizationPlatform` during initialization. It does
not load translation bundles and does not trigger a second registry load.

### Bundle ready

After a successful `getBundle({ locale, namespace })`, that pair is available in
the runtime bundle cache. Bundle readiness is scoped per pair.

### Translation-ready

For a declared preload scope, Composition Root awaits `localization.whenReady()`,
preloads the required `(locale, namespace)` pairs, and only then returns
`PlatformRuntime`. Sync `translate()` is guaranteed only for keys within that
preloaded scope.

Empty `preload.locales` or `preload.namespaces` arrays are valid configuration
but do **not** make the runtime translation-ready. They are appropriate only when
Application will not call sync translation until a later preparation step adds
bundles.

Application must not treat a returned runtime as translation-ready unless the
preload scope covers the keys it will resolve synchronously.

## Notes

- Diagnostic improvements for cache-miss vs key-miss scenarios are desirable but
  do not change this definition.
