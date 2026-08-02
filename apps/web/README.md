# @diabetes-universe/web

Next.js application for Diabetes Universe.

## Platform bootstrap (CR-02)

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
- `{ status: 'time-zone-required' }` on first visit or invalid cookie input;
- infrastructure/configuration errors still reject the returned promise.

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

Bootstrap is covered by integration tests in `lib/platform/tests/`. Production
routes do not invoke the bootstrap until CR-03 provides explicit time zone input.

### Implemented (CR-02)

- thin Next.js server bootstrap
- locale resolution
- required explicit time zone policy (ADR-0012)
- `RequestPlatformBootstrapResult` discriminated contract
- plain `WebPlatformConfig` assembly
- per-request runtime creation via `createWebPlatformRuntime()` when ready
- SSR isolation tests
- hydration boundary documentation

### Not implemented

- React Provider (CR-03)
- hooks (CR-03)
- client runtime / serializable context snapshot API (CR-03)
- cookie scheme wiring
- UI migration (Dashboard, Timeline, Quick Add)
- locale switcher
- full translations integration across UI

## Architecture references

- [ADR-0012 — User Time Zone Policy](../../docs/adr/0012-user-time-zone-policy.md)
- [Web Composition Root](../../docs/architecture/composition-root/web-composition-root.md)
- [@diabetes-universe/platform-web](../../packages/platform-web/README.md)
