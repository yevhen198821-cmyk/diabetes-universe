# @diabetes-universe/platform

## Purpose

Platform Runtime Foundation for the Diabetes Universe platform. This package
provides the final runtime aggregate used by a future environment-specific
Composition Root.

It accepts already prepared `LocalizationPlatform` and `PlatformFormatter`
instances, combines them into a single immutable `PlatformRuntime` surface, and
returns that object to upstream wiring.

This package is **not** a full Composition Root per ADR-0011. It does not
select Infrastructure Adapters, create Localization or Formatting runtime
instances, orchestrate Platform Readiness, or perform environment-specific
wiring.

## Stage

**CR-01A — Platform Runtime Foundation**

## Architecture

```text
Infrastructure Adapters
        ↓
Environment Composition Root
        ↓
Localization Platform + Platform Formatter
        ↓
createPlatformRuntime()
        ↓
PlatformRuntime
        ↓
Application Layer
```

`@diabetes-universe/platform` implements the `createPlatformRuntime()` step
only. It does not create adapters or upstream platform services.

### ADR-0011 relationship

Per ADR-0011, the **Composition Root Only Principle** means that only an
environment-specific Composition Root may create Infrastructure Adapters and
wire platform services. That principle does **not** mean this aggregate package
is itself the Composition Root.

This package provides the final runtime aggregate consumed by Composition Root.
Adapter creation and adapter selection remain the responsibility of a future
environment-specific Composition Root layer.

## Platform Runtime Foundation

### Responsible for

- a single assembled runtime surface (`PlatformRuntime`);
- combining injected platform services;
- an immutable runtime object after creation;
- validation of required injected dependencies.

### Not responsible for

- creating Localization Platform;
- creating Platform Formatter;
- selecting Infrastructure Adapters;
- loading translation bundles;
- Platform Readiness warmup;
- environment configuration;
- Web / React integration.

## Future Composition Root

Web Composition Root is implemented in `@diabetes-universe/platform-web`. This
package remains the runtime aggregate step only. Mobile and Backend will follow
the same pattern with their own environment-specific Composition Root packages.

## Implemented (CR-01A)

### Contracts

- `PlatformRuntime` — assembled platform surface (`localization`, `formatter`)
- `PlatformRuntimeCreateInput` — dependency-injected platform services
- `PlatformRuntimeFactory` — factory contract aligned with
  `createPlatformRuntime()`

### Runtime

- `createPlatformRuntime(input)` — binds injected services into
  `PlatformRuntime`
- input validation for required injected services
- immutability and reference preservation guarantees

## Not implemented in this package

These responsibilities belong to environment-specific Composition Root or
Application layers, not to `@diabetes-universe/platform`:

- Infrastructure Adapter wiring (see `@diabetes-universe/platform-web` for Web)
- React Provider / hooks
- DI container
- Platform Readiness preload orchestration
- environment-specific configuration
- Next.js bootstrap
- Lint/CI enforcement of platform wiring single entry point

## Public API

All public exports are available only through the package root entry point:

```ts
import {
  createPlatformRuntime,
  type PlatformRuntime,
  type PlatformRuntimeCreateInput,
  type PlatformRuntimeFactory,
} from '@diabetes-universe/platform';
```

Deep imports (for example `@diabetes-universe/platform/runtime/...`) are not
supported.

## Architecture references

- [Web Composition Root](../../docs/architecture/composition-root/web-composition-root.md)
- [ADR-0009 — Localization Platform](../../docs/adr/0009-localization-platform.md)
- [ADR-0010 — Platform Formatting Library](../../docs/adr/0010-platform-formatting-library.md)
- [ADR-0011 — Platform Infrastructure Layer](../../docs/adr/0011-platform-infrastructure-layer.md)

## Related packages

| Package                           | Role                                                |
| --------------------------------- | --------------------------------------------------- |
| `@diabetes-universe/i18n`         | Localization Platform contracts and runtime         |
| `@diabetes-universe/formatting`   | Platform Formatting contracts and runtime           |
| `@diabetes-universe/i18n-locales` | Localization Infrastructure Adapter                 |
| `@diabetes-universe/platform-web` | Web Composition Root (adapter wiring and readiness) |
