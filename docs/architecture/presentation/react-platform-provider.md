# React Platform Provider Foundation

## Status

Approved — CR-03B implemented

## Purpose

Define the React Presentation Integration Foundation between CR-03A presentation
contracts and future product UI wiring (CR-03C).

`PlatformProvider` receives an already assembled `PlatformRuntime` and exposes it
to React hooks without recreating platform services.

## Responsibilities

- single internal React context storing `PlatformRuntime`;
- `PlatformProvider` for runtime distribution;
- read-only typed hooks:
  - `usePlatformRuntime()`
  - `useLocalization()`
  - `useFormatter()`
  - `usePresentationContext()`
- fail-fast behaviour without a provider;
- test utilities for future UI integration.

## Non-responsibilities

- creating `PlatformRuntime`;
- calling `createPlatformRuntime`, `createWebPlatformRuntime`, or
  `createRequestPlatformRuntime`;
- loading translation bundles;
- creating formatters;
- browser API access;
- cookie access;
- persistence or hydration snapshot wiring;
- route/layout integration;
- Dashboard, Timeline, or Quick Add migration;
- locale switch UI;
- loading/error UI state in context;
- telemetry or logging of runtime state.

## Context ownership

```text
PlatformRuntime
      ↓
PlatformProvider
      ↓
React Context (PlatformRuntime | null)
      ↓
Hooks
      ↓
Future UI consumers
```

`PlatformRuntimeContext` is internal. The context value is exactly the `runtime`
prop reference passed to `PlatformProvider`.

## Provider contract

```typescript
interface PlatformProviderProps {
  readonly runtime: PlatformRuntime;
  readonly children: React.ReactNode;
}
```

Rules:

- receives an already assembled `PlatformRuntime`;
- context value is exactly the supplied `runtime` reference;
- does not use `useState`, `useEffect`, or side effects for runtime storage;
- does not clone, transform, or mutate runtime or props;
- client component (`'use client'`);
- no production bootstrap logic.

## Hook contracts

| Hook                       | Returns                | Source                               |
| -------------------------- | ---------------------- | ------------------------------------ |
| `usePlatformRuntime()`     | `PlatformRuntime`      | context value                        |
| `useLocalization()`        | `LocalizationPlatform` | `runtime.localization`               |
| `useFormatter()`           | `PlatformFormatter`    | `runtime.formatter`                  |
| `usePresentationContext()` | `PresentationContext`  | `runtime.localization.localeContext` |

Hooks:

- read context only;
- no effects or local state;
- no silent fallback;
- no browser or Next.js dependencies.

`PresentationContext` is the CR-03A alias of `LocaleContext`. Hooks do not store
a separate presentation copy and do not use `PresentationSnapshot` as runtime
state.

## Missing-provider behaviour

All hooks use one internal guard (`useRequiredPlatformRuntime`).

Outside `PlatformProvider`, hooks throw:

```text
PlatformProvider is required to use the platform React integration.
```

No fallback runtime, formatter, localization, `undefined`, or `null` return.

## Nested-provider policy

**Option A — standard React Context behaviour (approved).**

- Nested `PlatformProvider` is technically allowed.
- The nearest provider wins for its subtree.
- Production application trees should contain one `PlatformProvider`.
- Documentation forbids nested providers in production.
- No global singleton is used for nesting detection.
- Isolated tests and Storybook overrides may nest providers intentionally.

Option B (fail-fast nested guard) was **not** selected.

## Server/client boundary

| Module                         | Boundary                                 |
| ------------------------------ | ---------------------------------------- |
| `PlatformProvider` + hooks     | client-only (`'use client'`)             |
| `platform-context.ts`          | imported only by client modules          |
| `createTestPlatformRuntime`    | test-only (uses Composition Root)        |
| `createRequestPlatformRuntime` | server-only; must not import React layer |

Production routes do not mount `PlatformProvider` in CR-03B.

Browser time-zone resolver (`presentation/client.ts`) is not part of the CR-03B
runtime path.

## Testing strategy

- Node test runner + `renderToString` for SSR-safe hook/provider behaviour;
- `createTestPlatformRuntime()` builds real runtime via public Composition Root
  contracts;
- `TestPlatformProvider` wraps children for component tests;
- explicit assertions instead of snapshot tests;
- boundary tests via source inspection.

## Public API

Production entry: `apps/web/lib/platform/react/index.ts`

- `PlatformProvider`, `PlatformProviderProps`
- `usePlatformRuntime`, `useLocalization`, `useFormatter`, `usePresentationContext`

Testing entry: `apps/web/lib/platform/react/testing/index.ts`

- `createTestPlatformRuntime`, `CreateTestPlatformRuntimeOptions`
- `TestPlatformProvider`, `TestPlatformProviderProps`

Internal only:

- `PlatformRuntimeContext`
- `useRequiredPlatformRuntime`

## Dependency rules

```text
apps/web/lib/platform/react
        ↓
@diabetes-universe/platform (PlatformRuntime)
@diabetes-universe/i18n (LocalizationPlatform, LocaleContext)
@diabetes-universe/formatting (PlatformFormatter)
apps/web/lib/platform/presentation (PresentationContext type only)
```

Forbidden in provider/hooks:

- `@diabetes-universe/platform-web` runtime factory imports;
- server bootstrap modules;
- `presentation/client.ts`;
- Dashboard, Timeline, Quick Add;
- module-level mutable runtime cache.

## Security / privacy

Provider and hooks do not:

- log runtime, locale, or time zone;
- store PII, medical data, or auth tokens;
- serialize runtime;
- use cookies, `localStorage`, or telemetry.

`PlatformRuntime` is passed only within the React tree.

## Future CR-03C integration

CR-03C will wire server bootstrap, client presentation bootstrap, persistence,
and `PlatformProvider` into Next.js routes without redesigning CR-03B hooks.

## Definition of Done

- [x] `PlatformProvider` and hooks implemented
- [x] fail-fast missing-provider contract
- [x] Option A nested-provider policy
- [x] test utilities and unit tests
- [x] architecture documentation
- [x] no route/product wiring
- [x] no platform package public API changes

## Architecture references

- [Presentation Context Foundation](presentation-context.md)
- [Web Composition Root](../composition-root/web-composition-root.md)
- [ADR-0011 — Platform Infrastructure Layer](../../adr/0011-platform-infrastructure-layer.md)
