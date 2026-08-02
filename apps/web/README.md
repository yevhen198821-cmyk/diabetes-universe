# @diabetes-universe/web

Next.js application for Diabetes Universe.

## Platform bootstrap (CR-02) — Feature Complete ✅

Thin server-only bootstrap in `lib/platform/` wires Next.js request context to
`@diabetes-universe/platform-web`:

```text
Next.js request context
        ↓
createRequestPlatformRuntime()
        ↓
RequestPlatformBootstrapResult
        ↓
plain WebPlatformConfig (when ready)
        ↓
createWebPlatformRuntime()
        ↓
PlatformRuntime (per request / per call)
```

### Canonical entry point

`createRequestPlatformRuntime()` in `lib/platform/create-request-platform-runtime.ts`
is the server-only public boundary. It resolves locale and explicit time zone from
request presentation context and returns a discriminated
`RequestPlatformBootstrapResult`.

Per [ADR-0012](../../docs/adr/0012-user-time-zone-policy.md):

- `{ status: 'ready', runtime }` when a valid explicit IANA time zone is present;
- `{ status: 'time-zone-required', seed }` on first visit or invalid cookie input;
- infrastructure/configuration errors still reject the returned promise.

`ServerPresentationSeed` carries immutable server-resolved locale preferences from
the same canonical locale resolution used by the ready flow. It does not contain
time zone, runtime, or browser objects.

Bootstrap does not guess time zone and does not create partial `PlatformRuntime`
instances.

### Request context resolution

| Dimension | Priority                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------- |
| Locale    | valid existing cookie (when a cookie scheme exists), `Accept-Language`, platform default (`en-GB`) |
| Time zone | validated explicit IANA time zone only — **no server default**                                     |

#### Time zone sources (ADR-0012)

| Source                 | Role                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| Account profile        | Future primary source                                                   |
| Validated cookie       | Current approved server source (`cookieTimeZone` when wired)            |
| Browser IANA detection | First-client-visit source (CR-03)                                       |
| UTC                    | Canonical storage / technical systems only — not user display time zone |

Wave 1 locales: `en-GB`, `uk-UA`, `de-DE`, `ru-RU`. Time zone is never derived
from locale, `Accept-Language`, server host, or deployment region.

### Time-dependent SSR restrictions

Until explicit user time zone is available, bootstrap returns
`time-zone-required` and time-dependent SSR calculations remain forbidden
(today/yesterday, Day Summary, Timeline day grouping, relative time, local event
time, calendar filters).

### Integration status

Bootstrap is covered by integration tests in `lib/platform/tests/` and
`lib/platform/integration/tests/`. Root layout invokes server bootstrap and
mounts `ApplicationRuntimeGate` per CR-03C (ADR-0013).

### Implemented (CR-02)

- thin Next.js server bootstrap
- locale resolution
- required explicit time zone policy (ADR-0012)
- `RequestPlatformBootstrapResult` discriminated contract
- plain `WebPlatformConfig` assembly
- per-request runtime creation via `createWebPlatformRuntime()` when ready
- SSR isolation tests
- hydration boundary documentation
- `ServerPresentationSeed` on `time-zone-required` bootstrap

### Not implemented

- cookie scheme wiring
- route integration and cookie persistence
- UI migration (Dashboard, Timeline, Quick Add)
- locale switcher
- full translations integration across UI

## Presentation context foundation (CR-03A) — Feature Complete ✅

Location: `lib/platform/presentation/`

Provides immutable `PresentationContext`, serializable `PresentationSnapshot`,
client-only browser time zone resolution, first-visit orchestration, and future
persistence contract. UI pages do not consume this layer yet.

Public API:

- isomorphic: `lib/platform/presentation/index.ts`
- client-only: `lib/platform/presentation/client.ts`
- bootstrap seed: `ServerPresentationSeed` in `lib/platform/index.ts`

Client bootstrap consumes `RequestPlatformBootstrapResult.seed` on first visit;
it does not accept a separate server locale input.

### Not implemented (CR-03C+)

- cookie persistence adapter
- UI migration (Dashboard, Timeline, Quick Add)

## React platform provider foundation (CR-03B) — Feature Complete ✅

Location: `lib/platform/react/`

Provides `PlatformProvider` and read-only hooks for consuming an already
assembled `PlatformRuntime`.

Public API: `lib/platform/react/index.ts`

Test utilities: `lib/platform/react/testing/`

## Application platform integration (CR-03C) — Feature Complete ✅

Location: `lib/platform/integration/`

Root layout invokes `createRequestPlatformRuntime()`, maps the result to
`ApplicationPlatformBootstrap`, and mounts `ApplicationRuntimeGate`, which owns
client-realm runtime assembly per [ADR-0013](../../docs/adr/0013-web-client-runtime-ownership.md).

Provider order when runtime is ready:

```text
ApplicationRuntimeGate (ready)
  └── PlatformProvider
        └── AppProviders
              └── TimelineStoreProvider
                    └── routes
```

### Implemented (CR-03C)

- root layout server bootstrap invocation
- serializable `ApplicationPlatformBootstrap` boundary
- `ApplicationRuntimeGate` lifecycle (pending / unavailable / error / ready)
- client runtime assembly from `PresentationSnapshot` / client presentation bootstrap
- equivalence contract assertions
- lifecycle mount tests (`happy-dom`)
- application readiness marker (`data-platform-status="ready"`)
- E2E SPA navigation continuity tests
- integration tests

### Not implemented (I18N-02+)

- cookie scheme wiring and `PresentationPersistence` adapter
- Dashboard, Timeline, Quick Add hook migration
- locale switch UI

## Architecture references

- [Presentation Context Foundation](../../docs/architecture/presentation/presentation-context.md)
- [React Platform Provider Foundation](../../docs/architecture/presentation/react-platform-provider.md)
- [Application Platform Integration](../../docs/architecture/presentation/application-platform-integration.md)

- [ADR-0012 — User Time Zone Policy](../../docs/adr/0012-user-time-zone-policy.md)
- [ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate](../../docs/adr/0013-web-client-runtime-ownership.md)
- [Web Composition Root](../../docs/architecture/composition-root/web-composition-root.md)
- [@diabetes-universe/platform-web](../../packages/platform-web/README.md)
