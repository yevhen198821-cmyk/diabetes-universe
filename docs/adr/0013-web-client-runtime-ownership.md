# ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate

## Status

Approved

## Context

CR-03C wires the approved platform foundation into the Next.js application tree.
An initial draft mounted `AppProviders` (and therefore `TimelineStoreProvider`)
before the client `PlatformRuntime` was ready, then upgraded the tree to include
`PlatformProvider`. That pattern violated single-mount expectations for product
routes and `TimelineStoreProvider`, and blurred server/client ownership of
`PlatformRuntime`.

`PlatformRuntime` is not serializable and cannot cross the Next.js Server
Component → Client Component boundary. ADR-0012 already requires that bootstrap
must not guess user time zone. Browser IANA detection is client-only.

CR-03B established `PlatformProvider` as a passive runtime distributor. Runtime
assembly belongs outside the provider and outside product modules.

## Decision

### Client realm owns UI-facing PlatformRuntime

The React product tree consumes a client-realm `PlatformRuntime` instance
created after hydration in the client realm. The server realm may create
`PlatformRuntime` for server-only work, but must not pass it to Client
Components.

### Serialization boundary

Server → Client transport is limited to:

| Type                           | Branch               |
| ------------------------------ | -------------------- |
| `PresentationSnapshot`         | `ready`              |
| `ServerPresentationSeed`       | `time-zone-required` |
| `ApplicationPlatformBootstrap` | discriminated union  |

Forbidden across the boundary:

- `PlatformRuntime`;
- runtime service serialization (`JSON.stringify(runtime)`);
- module-level runtime singleton;
- cookie or storage persistence of runtime state in CR-03C.

### Application Runtime Gate

`ApplicationRuntimeGate` is the sole client component responsible for runtime
lifecycle:

1. accept serializable `ApplicationPlatformBootstrap`;
2. start in `pending`;
3. create client `PlatformRuntime` through approved client factories;
4. on `ready`, render the product tree exactly once.

Runtime creation must not occur in `PlatformProvider`, `AppProviders`, or
product modules.

Approved async policy:

- `useEffect` in the gate is permitted for runtime assembly;
- `useLayoutEffect` is not used without proven necessity;
- Suspense is not introduced for bootstrap;
- cookie persistence is not implemented in CR-03C.

Cancellation/disposal guards prevent settled promises from updating state after
unmount.

### Provider tree

Ready composition:

```text
PlatformProvider
  └── AppProviders
        └── TimelineStoreProvider
              └── children
```

Rules:

- `PlatformProvider` always wraps the product tree when the tree is mounted;
- `TimelineStoreProvider` mounts only inside `PlatformProvider` and only once;
- pending, time-zone-unavailable, and infrastructure-error states do not render
  `AppProviders`, product routes, Dashboard, Timeline, or Quick Add.

Forbidden intermediate tree:

```text
AppProviders → children   (pending)
  ↓ upgrade
PlatformProvider → AppProviders → children
```

### Bootstrap states

| State                   | UI                       | Product tree |
| ----------------------- | ------------------------ | ------------ |
| `pending`               | neutral bootstrap screen | not mounted  |
| `time-zone-unavailable` | safe neutral screen      | not mounted  |
| `error`                 | safe generic screen      | not mounted  |
| `ready`                 | provider tree            | mounted once |

Constraints:

- no time-dependent values or Today/Yesterday labels in pending state;
- no UTC, geographic, or locale-derived time-zone fallback;
- infrastructure errors expose no internal error text and no partial runtime.

### Equivalence contract

Client runtime presentation values must match bootstrap presentation values for:

- `language`;
- `locale`;
- `timeZone`;
- `hourCycle`;
- `numberingSystem`;
- `calendar`.

Equivalence is asserted by pure comparison helpers in tests. Object identity
between server and client runtimes is not required or compared.

### HTML document language

`<html lang>` is resolved only on the server from `PresentationSnapshot` or
`ServerPresentationSeed`. The client does not re-resolve document language.

### Relationship to ADR-0012

ADR-0012 defines when server bootstrap may create `PlatformRuntime` and forbids
guessed time zones. ADR-0013 defines how approved serializable bootstrap data
crosses into the client realm and when the product tree may mount. Browser IANA
detection remains a client-only path for the `time-zone-required` branch.

## Consequences

### Positive

- Clear server/client ownership and transport boundary.
- Single-mount policy for product routes and `TimelineStoreProvider`.
- `PlatformProvider` stays a passive distributor (CR-03B contract preserved).
- Medical time-zone policy from ADR-0012 is enforced through client bootstrap
  states without partial product rendering.

### Negative

- Product routes are unavailable until client runtime assembly completes.
- A neutral bootstrap screen is visible on first paint for all visits.
- Lifecycle testing requires a DOM harness (`happy-dom`) for mount behaviour.

### Neutral

- Dashboard, Timeline, and Quick Add source remain unchanged until I18N-02.
- CR-02 server bootstrap is not modified in CR-03C.
- Cookie persistence and `PresentationPersistence` adapter remain deferred.

## Alternatives

### Render product tree before runtime readiness

Rejected. Mounting `AppProviders` before `PlatformProvider` causes provider-tree
replacement and risks `TimelineStoreProvider` remount.

### Serialize PlatformRuntime across the boundary

Rejected. Runtime services are not JSON-serializable and must not cross the RSC
boundary.

### Create runtime inside PlatformProvider

Rejected. Violates CR-03B separation between runtime assembly and distribution.

## Date

2026-08-02

## Author

Chief Architect

## References

- [ADR-0012 — User Time Zone Policy](./0012-user-time-zone-policy.md)
- [Application Platform Integration](../architecture/presentation/application-platform-integration.md)
- [React Platform Provider Foundation](../architecture/presentation/react-platform-provider.md)
- [Presentation Context Foundation](../architecture/presentation/presentation-context.md)
- [Web Composition Root](../architecture/composition-root/web-composition-root.md)
- CR-03C — Application Platform Integration Foundation
