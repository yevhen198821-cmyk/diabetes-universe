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

## Notes

- Runtime v1.0 does not expose a `whenReady()` API; readiness is enforced by
  Composition Root wiring and Application lifecycle.
- Diagnostic improvements for cache-miss vs key-miss scenarios are desirable but
  do not change this definition.
