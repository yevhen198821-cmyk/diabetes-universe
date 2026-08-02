# Application Platform Integration

## Status

Approved — CR-03C Feature Complete per [ADR-0013](../../adr/0013-web-client-runtime-ownership.md)

## Purpose

Wire the approved platform foundation layers into the root Next.js application tree
without changing Dashboard, Timeline, or Quick Add product modules.

CR-03C closes the production integration chain:

```text
Request context
  ↓
createRequestPlatformRuntime()          (Server Component)
  ↓
RequestPlatformBootstrapResult
  ↓
createApplicationPlatformBootstrap()    (serializable DTO)
  ↓
ApplicationRuntimeGate                  (Client Component)
  ↓
createClientPlatformRuntimeFromBootstrap()
  ↓
PlatformProvider
  ↓
AppProviders → TimelineStoreProvider
  ↓
Application routes
```

## Responsibilities

- invoke server bootstrap from the root layout Server Component;
- map `RequestPlatformBootstrapResult` to `ApplicationPlatformBootstrap`;
- own client-realm runtime assembly in `ApplicationRuntimeGate`;
- mount `PlatformProvider` only when client runtime is ready;
- preserve existing `TimelineStoreProvider` ownership via `AppProviders`;
- handle `time-zone-required` through client browser IANA resolution;
- keep server/client import boundaries explicit.

## Non-responsibilities

- Dashboard, Timeline, or Quick Add string migration;
- `useTranslation()`, `useFormatter()`, or other product hook adoption;
- locale switch UI, Settings, or account profile;
- cookie name, TTL, SameSite, Secure, or consent policy;
- browser time-zone persistence;
- `localStorage` / `sessionStorage`;
- changes to `@diabetes-universe/platform` public contracts;
- changes to `@diabetes-universe/platform-web` public contracts.

## Application composition tree

### Ready branch

```text
RootLayout (Server Component)
  └── ApplicationRuntimeGate (Client, status: ready)
        └── PlatformProvider
              └── AppProviders
                    └── TimelineStoreProvider
                          └── route children
```

### Pending branch

```text
RootLayout (Server Component)
  └── ApplicationRuntimeGate (Client, status: pending)
        └── ApplicationBootstrapPendingScreen
```

Product routes, `AppProviders`, and `TimelineStoreProvider` are not mounted.

### Time-zone-unavailable branch

```text
RootLayout (Server Component)
  └── ApplicationRuntimeGate (Client, status: time-zone-unavailable)
        └── ApplicationBootstrapUnavailableScreen
```

No UTC, geographic, or locale-derived fallback is used.

### Infrastructure error branch

```text
RootLayout (Server Component)
  └── ApplicationRuntimeGate (Client, status: error)
        └── ApplicationBootstrapErrorScreen
```

No internal error text and no partial runtime are exposed.

## Server/client boundary

`PlatformRuntime` is **not** serializable and cannot cross the Next.js Server
Component → Client Component prop boundary.

Approved boundary transport:

| Branch               | Server payload           | Client action                                                        |
| -------------------- | ------------------------ | -------------------------------------------------------------------- |
| `ready`              | `PresentationSnapshot`   | `createClientPlatformRuntimeFromSnapshot()`                          |
| `time-zone-required` | `ServerPresentationSeed` | CR-03A client bootstrap → `createClientPlatformRuntimeFromContext()` |

The server realm may create `PlatformRuntime` for server-only snapshot mapping.
The React tree receives only serializable presentation data. The client realm
creates its own isolated runtime instance through approved client factories.

## Runtime ownership

| Realm  | Owner                                                       |
| ------ | ----------------------------------------------------------- |
| Server | `createRequestPlatformRuntime()` per request                |
| Client | `createClientPlatformRuntimeFromBootstrap()` per gate mount |

Rules:

- no module-level runtime singleton;
- no JSON serialization of runtime services;
- no `createRequestPlatformRuntime()` in client components;
- no runtime recreation inside product modules;
- `PlatformProvider` receives a ready runtime reference, not a DTO;
- runtime is not created inside `PlatformProvider`.

## Application Runtime Gate lifecycle

`ApplicationRuntimeGate` (`apps/web/lib/platform/integration/application-runtime-gate.ts`):

1. accepts `ApplicationPlatformBootstrap`;
2. starts in `pending` with neutral bootstrap screen;
3. runs `createClientPlatformRuntimeFromBootstrap()` in `useEffect`;
4. uses cancellation guard on unmount;
5. on `ready`, renders `PlatformProvider → AppProviders → children` once with
   `data-platform-status="ready"` on a non-visual wrapper (`display: contents`).

Effect policy:

- async `useEffect` permitted;
- no `useLayoutEffect`;
- no Suspense;
- no cookie persistence;
- no runtime logging;
- no medical data logging.

## Request lifecycle

```text
Request
  ↓
createRequestPlatformRuntime()
  ├── ready
  │     ↓
  │ createApplicationPlatformBootstrap()
  │     ↓
  │ ApplicationRuntimeGate (pending → ready)
  │     ↓
  │ createClientPlatformRuntimeFromSnapshot()
  │     ↓
  │ PlatformProvider → TimelineStoreProvider → Application
  │
  └── time-zone-required
        ↓
      createApplicationPlatformBootstrap()
        ↓
      ApplicationRuntimeGate (pending → ready | time-zone-unavailable)
        ↓
      createClientPresentationBootstrapResult() (client only)
```

## Ready branch

When explicit validated time zone is present in request context:

1. server bootstrap returns `{ status: 'ready', runtime }`;
2. server maps runtime locale context to `PresentationSnapshot`;
3. client gate assembles runtime from snapshot;
4. `PlatformProvider` receives the client-realm runtime instance;
5. `AppProviders` and route children mount once.

## Time-zone-required branch

When explicit time zone is absent:

1. server bootstrap returns `{ status: 'time-zone-required', seed }`;
2. server does **not** create `PlatformRuntime`;
3. client gate receives `ServerPresentationSeed` only;
4. after mount, client runs `createClientPresentationBootstrapResult()`;
5. browser IANA detection may resolve presentation context without cookie writes;
6. if browser time zone is unavailable, `ApplicationBootstrapUnavailableScreen` is shown;
7. no UTC, geographic, or locale-derived display fallback is used.

## Provider ordering

Approved order when product tree is mounted:

```text
PlatformProvider
  └── TimelineStoreProvider (via AppProviders)
        └── children
```

`TimelineStoreProvider` does not depend on `PlatformRuntime` in CR-03C.

While runtime assembly is pending or blocked, `AppProviders` and product routes
do not mount. Product modules do not consume platform hooks until the ready tree
is mounted.

## Equivalence contract

Pure assertion helpers verify that client runtime presentation values match
bootstrap presentation values:

- `language`;
- `locale`;
- `timeZone`;
- `hourCycle`;
- `numberingSystem`;
- `calendar`.

Server and client runtime object identity is not compared.

## Serialization constraints

Forbidden:

- `JSON.stringify(runtime)`;
- passing `PlatformRuntime` as a Server → Client prop;
- cookie/storage persistence of runtime services;
- module singleton user context;
- reconstructing runtime from incomplete data outside approved factories.

Allowed across the boundary:

- `PresentationSnapshot`;
- `ServerPresentationSeed`;
- discriminated `ApplicationPlatformBootstrap`.

## Failure handling

| Condition                         | Behaviour                                          |
| --------------------------------- | -------------------------------------------------- |
| missing explicit server time zone | `time-zone-required` (normal first visit)          |
| invalid snapshot on client        | runtime factory throws → safe infrastructure error |
| browser IANA unavailable          | `ApplicationBootstrapUnavailableScreen`            |
| infrastructure/config errors      | safe generic error screen (no internal text)       |

## HTML document language

`<html lang>` is resolved in the root layout Server Component from
`PresentationSnapshot.language` or `ServerPresentationSeed.language`. The client
gate does not re-resolve document language.

## Application readiness marker

Ready product tree exposes a non-visual readiness marker:

- attribute: `data-platform-status="ready"`;
- present only in the ready `ReadyApplicationTree` wrapper;
- absent in pending, time-zone-unavailable, and infrastructure-error states;
- carries no locale, time zone, runtime, or user data.

Playwright tests use `waitForApplicationReady()` before keyboard/focus flows.

## Root layout and client navigation lifecycle

Server bootstrap (`createRequestPlatformRuntime()` →
`createApplicationPlatformBootstrap()`) runs when the root layout Server
Component is created for a document navigation.

`ApplicationRuntimeGate` mounts with the root application tree. Client-side
navigation between Dashboard (`/`) and Timeline (`/timeline`) preserves the
mounted provider tree; bootstrap gate assembly does not repeat on each route
segment transition.

Full document reloads (for example `page.goto()` in tests) recreate the root
application tree and run bootstrap again.

## Testing strategy

Integration tests cover:

- serializable bootstrap mapping;
- client runtime factory from snapshot/seed;
- provider ordering source contract;
- import boundaries;
- request isolation;
- no runtime serialization;
- no module-level singleton;
- no UTC/geographic fallback in client integration modules;
- `PlatformProvider` exact runtime reference semantics;
- equivalence assertions for presentation values;
- lifecycle mount behaviour (`happy-dom` harness):
  - pending does not mount product or `AppProviders`;
  - ready mounts product once and exposes readiness marker;
  - infrastructure error and TZ-unavailable block product tree and readiness marker;
  - unmount cancellation guard;
- E2E readiness marker and SPA navigation continuity.

Regression policy:

- existing Dashboard, Timeline, and Quick Add modules remain unchanged;
- Playwright E2E suite remains the regression gate.

## Security / privacy

- do not log `PlatformRuntime` or medical data;
- do not serialize platform services;
- `ServerPresentationSeed` contains presentation preferences only;
- no cookie writes without an approved persistence policy;
- no user-specific module singletons.

## Deferred cookie / browser lifecycle

CR-03C does **not** implement:

- cookie name or attributes;
- persistence adapter for `PresentationPersistence`;
- account-profile time zone source;
- production locale cookie wiring in `readNextRequestPresentationContext()`.

## Future I18N-02 integration

I18N-02 will migrate Dashboard, Timeline, and Quick Add to platform hooks.
CR-03C keeps those modules on existing mock/local state while ensuring
`PlatformProvider` is mounted at the application root when the product tree
renders.

## Definition of Done

- [x] root layout invokes server bootstrap
- [x] serializable application boundary DTO
- [x] `ApplicationRuntimeGate` client lifecycle component
- [x] `PlatformProvider` mounted when client runtime is ready
- [x] `time-zone-required` explicit client boundary
- [x] provider ordering documented and implemented
- [x] equivalence contract tests
- [x] lifecycle mount tests
- [x] architecture documentation and ADR-0013
- [x] no Dashboard / Timeline / Quick Add product changes
- [x] no platform package public API changes
- [x] no cookie persistence policy introduced

## Architecture references

- [ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate](../../adr/0013-web-client-runtime-ownership.md)
- [Presentation Context Foundation](presentation-context.md)
- [React Platform Provider Foundation](react-platform-provider.md)
- [Web Composition Root](../composition-root/web-composition-root.md)
- [ADR-0012 — User Time Zone Policy](../../adr/0012-user-time-zone-policy.md)
