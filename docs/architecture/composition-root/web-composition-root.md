# Web Composition Root

## Purpose

Define the approved architecture for environment-specific Web Composition Root
and its relationship to Platform Runtime Foundation, thin Next.js bootstrap, and
future Presentation Integration Layer.

This document implements the physical placement decision permitted by
[ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md).
It does not change ADR-0011 semantics.

## Status

Approved — `@diabetes-universe/platform-web` implemented (CR-01C); thin Next.js
bootstrap Feature Complete (CR-02, user time zone policy per
[ADR-0012](../../adr/0012-user-time-zone-policy.md)); Presentation Context
Foundation Feature Complete (CR-03A); React Platform Provider Foundation
Feature Complete (CR-03B); route wiring and persistence (CR-03C) deferred

## Stage

**CR-01B — Web Composition Root Architecture**

## Architecture references

- [ADR-0009 — Localization Platform](../../adr/0009-localization-platform.md)
- [ADR-0010 — Platform Formatting Library](../../adr/0010-platform-formatting-library.md)
- [ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md)
- [Platform Readiness](../localization/platform-readiness.md)
- [@diabetes-universe/platform](../../../packages/platform/README.md) — Platform Runtime Foundation

---

## Layer model

```text
Infrastructure Adapters
        ↓
@diabetes-universe/platform-web
        ↓
Localization Platform + Platform Formatter
        ↓
createPlatformRuntime()
        ↓
PlatformRuntime
        ↓
Application Layer
        ↑
apps/web bootstrap (thin Next.js integration)
```

Presentation Integration Layer (future):

```text
PlatformRuntime
        ↓
React Provider + hooks
        ↓
UI components
```

---

## Platform Runtime Foundation

Package: `@diabetes-universe/platform` (`packages/platform`)

### Responsible for

- accepting already prepared `LocalizationPlatform` and `PlatformFormatter`;
- combining them through `createPlatformRuntime()`;
- returning an immutable `PlatformRuntime` aggregate;
- validating required injected dependencies.

### Not responsible for

- selecting Infrastructure Adapters;
- creating Localization Runtime;
- creating Formatting Runtime;
- Platform Readiness orchestration;
- environment configuration;
- Web, React, or Next.js integration.

### Constraints

- no dependency on Web, React, or Next.js;
- no dependency on Infrastructure Adapters;
- no business logic;
- no translation lookup or formatting logic.

---

## Web Composition Root

Future package: `@diabetes-universe/platform-web` (`packages/platform-web`) —
**implemented (CR-01C/CR-01D)**.

### Responsible for

- acting as the environment-specific Composition Root for Web;
- selecting Localization Infrastructure Adapters (for example
  `@diabetes-universe/i18n-locales`);
- creating `LocalizationPlatform` via `createLocalizationPlatform()`;
- creating `PlatformFormatter` via `createPlatformFormatter()`;
- ensuring Platform Readiness for the chosen initialization strategy;
- calling `createPlatformRuntime()` as the final aggregation step;
- returning a ready `PlatformRuntime` to upstream consumers.

### Not responsible for

- React Provider or hooks;
- Next.js request handling;
- business logic;
- fallback resolution at lookup time;
- translation lookup;
- ICU formatting;
- date, time, number, or measurement formatting;
- medical logic;
- feature orchestration.

### Constraints

- framework-agnostic TypeScript wiring only;
- no dependency on React;
- no dependency on Next.js;
- no global mutable runtime holding user-specific context on SSR.

---

## Thin Next.js Bootstrap

Location: `apps/web/lib/platform/`

### Responsible for

- using Next.js request APIs (headers, cookies, route context);
- resolving user presentation preferences (locale, time zone, hour cycle,
  numbering system, optional currency);
- building a plain configuration DTO for Web Composition Root;
- invoking Web Composition Root with that DTO;
- passing the assembled `PlatformRuntime` to Application or Presentation
  Integration Layer.

### Implemented (CR-02) — Feature Complete

- server-only `createRequestPlatformRuntime()` entry point;
- request-derived locale resolution (`cookie` when a scheme exists,
  `Accept-Language`, platform default);
- required explicit IANA time zone per
  [ADR-0012](../../adr/0012-user-time-zone-policy.md) — validated cookie as
  current server source; no server default, no locale-derived guess;
- `RequestPlatformBootstrapResult` discriminated contract (`ready` |
  `time-zone-required` + `ServerPresentationSeed`);
- immutable `WebPlatformConfig` assembly when explicit time zone is present;
- per-request / per-call `PlatformRuntime` via `createWebPlatformRuntime()` when
  explicit time zone is present;
- minimal `common` namespace preload for bootstrap translation-ready verification;
- SSR isolation covered by integration tests;
- hydration boundary documented (runtime stays server-side; serializable client
  snapshot deferred to CR-03);
- time-dependent SSR calculations forbidden until explicit user time zone is
  available.

### Deferred to CR-03

- cookie scheme wiring and browser IANA first-visit detection;
- React Provider, hooks, and client context snapshot API;
- production bootstrap invocation on live routes.

`ServerPresentationSeed` is now produced on `time-zone-required` bootstrap so
client presentation orchestration can combine canonical server locale resolution
with browser IANA detection without a separate non-canonical locale input.

### Not responsible for

- creating Infrastructure Adapters directly;
- fallback resolution;
- formatting logic;
- translation lookup;
- storing user context in global mutable module state on SSR.

---

## React boundary

| Layer                                       | Role                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Web Composition Root** (`platform-web`)   | TypeScript wiring; not a React Provider                                                    |
| **Thin Next.js bootstrap** (`apps/web`)     | Request → config DTO → CR invocation                                                       |
| **Presentation Integration Layer** (future) | React Provider receives ready `PlatformRuntime`; hooks expose contracts to UI              |
| **UI**                                      | Consumes Application or hooks; does not import Infrastructure Adapters or Composition Root |

Rules:

- Composition Root is **not** a React Provider.
- Provider receives an already assembled `PlatformRuntime`.
- Hooks belong to Presentation Integration Layer, not Composition Root.
- UI must not import Infrastructure Adapters.
- UI must not import `@diabetes-universe/platform-web` directly.

---

## Dependency rules

### Allowed dependency graph

```text
apps/web bootstrap
        ↓
@diabetes-universe/platform-web
        ↓
@diabetes-universe/platform
@diabetes-universe/i18n
@diabetes-universe/i18n-locales
@diabetes-universe/formatting
```

Additional notes:

- `@diabetes-universe/locales` is accessed by Infrastructure Adapters, not
  directly by UI.
- Application features may depend on `@diabetes-universe/platform` for
  `PlatformRuntime` types only after wiring; they must not create adapters.

### Forbidden dependencies and patterns

```text
❌ @diabetes-universe/platform → @diabetes-universe/platform-web
❌ @diabetes-universe/platform → Infrastructure Adapters
❌ UI → @diabetes-universe/platform-web
❌ Application features → Infrastructure Adapters
❌ @diabetes-universe/platform-web → React
❌ @diabetes-universe/platform-web → Next.js
❌ global mutable PlatformRuntime with user context on SSR
```

---

## Runtime lifecycle

Full sequence:

```text
Request / environment configuration
        ↓
Web configuration DTO
        ↓
Infrastructure Adapter creation
        ↓
Localization Platform creation
        ↓
Formatting Platform creation
        ↓
Platform Readiness preparation
        ↓
Platform Runtime aggregation (createPlatformRuntime)
        ↓
Application consumption
```

Composition Root must **not** move into itself:

- fallback resolution;
- translation lookup;
- ICU formatting;
- date / number / measurement formatting;
- medical logic;
- feature orchestration.

---

## Instance scope and isolation

### SSR

- `PlatformRuntime` is created **per request**.
- User-specific `locale`, `timeZone`, `hourCycle`, `numberingSystem`, and
  `currency` must not be stored in global mutable state.
- A runtime prepared for one user must not be reused by another request.

### Browser

- One `PlatformRuntime` per browser session is acceptable when user context is
  stable.
- When locale, time zone, or other context preferences change, a **new** runtime
  is created.
- Existing runtime instances are not mutated.

### Shared caches

- Immutable Intl formatter instance caches are allowed at process level.
- Translation resources may be reused only when reuse does not retain
  user-specific context across requests.
- Composition Root must not store medical data.

---

## Context ownership

### User presentation context

Used to construct:

- `LocaleContext`
- `FormattingContext`

May include:

- `language`
- `locale`
- `timeZone`
- `hourCycle`
- `numberingSystem`
- `calendar`
- optional `currency`

Resolved by thin Next.js bootstrap from request, cookies, or explicit user
preferences. Passed to Web Composition Root as plain configuration.

### Resource fallback policy

`FallbackPolicy`:

- governs translation **resource** resolution;
- is **not** a user preference;
- is not derived from `timeZone` or `currency`;
- is configured separately by Web Composition Root (static or environment
  config).

Do not mix user presentation context with translation resource policy.

---

## Platform Readiness

Per [Platform Readiness](../localization/platform-readiness.md):

- Web Composition Root owns the initialization strategy that achieves Platform
  Readiness.
- Supported strategies include eager, selective, route-based, and on-demand
  preparation.
- Full preload of all bundles is **not** mandatory.
- Before Application code uses sync runtime methods, the preconditions required
  by the chosen strategy must be satisfied.
- `@diabetes-universe/platform` does **not** implement readiness.

Composition Root prepares bundles; Localization Runtime performs sync lookup from
cache.

### Readiness levels (CR-01D)

| Level             | Owner                            | Notes                                 |
| ----------------- | -------------------------------- | ------------------------------------- |
| Runtime created   | `createPlatformRuntime()`        | Aggregate exists                      |
| Registry ready    | `LocalizationPlatform`           | `await localization.whenReady()`      |
| Bundle ready      | `LocalizationPlatform.getBundle` | Scoped per `(locale, namespace)` pair |
| Translation-ready | Composition Root + preload scope | Sync `translate()` for preloaded keys |

Empty `preload` arrays are configuration-valid but not translation-ready.
Application must not call sync translation until the required bundles are
prepared.

Web Composition Root readiness sequence:

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

---

## Future WebPlatformConfig (preliminary)

The following contract shape is implemented by `@diabetes-universe/platform-web`
and assembled by the thin Next.js bootstrap in `apps/web/lib/platform/`.

```typescript
interface WebPlatformConfig {
  readonly localeContext: LocaleContext;
  readonly formattingContext: FormattingContext;
  readonly fallbackPolicy: FallbackPolicy;
  readonly preload: {
    readonly namespaces: readonly Namespace[];
    readonly locales: readonly LocaleCode[];
  };
}
```

Rules:

- route-specific bootstrap determines `preload` scope;
- Web Composition Root executes preparation from `preload`;
- config is a plain DTO — no React types, Next.js `Request`, cookies, or
  headers;
- config contains no medical data.

Types referenced above come from Platform Contracts (`@diabetes-universe/i18n`,
`@diabetes-universe/formatting`).

---

## Future implementation boundaries

| Package / location                | Stage                                               |
| --------------------------------- | --------------------------------------------------- |
| `@diabetes-universe/platform`     | CR-01A — implemented                                |
| `@diabetes-universe/platform-web` | CR-01C — implemented                                |
| `apps/web` bootstrap              | CR-02 — Feature Complete                            |
| `apps/web` presentation           | CR-03A — Feature Complete                           |
| `apps/web` react integration      | CR-03B — Feature Complete (not wired to routes yet) |
| Route wiring + persistence        | CR-03C — deferred                                   |

Dashboard, Timeline, and Quick Add migration are out of scope for the initial
Web Composition Root implementation.

## Notes

- Physical monorepo placement of `@diabetes-universe/platform-web` follows this
  document; ADR-0011 does not prescribe a single global Composition Root package
  for all environments.
- Mobile and Backend will follow the same pattern with their own
  environment-specific Composition Root packages.
