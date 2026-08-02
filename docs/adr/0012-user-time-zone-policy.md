# ADR-0012 — User Time Zone Policy

## Status

Approved

## Context

Thin Next.js Platform Bootstrap (CR-02) must assemble a valid `WebPlatformConfig`
before calling `createWebPlatformRuntime()`. `LocaleContext.timeZone` and
`FormattingContext.timeZone` are required fields.

During CR-02 implementation a provisional server default (`Europe/London`) was
introduced without architectural approval. That violated the principle
_Implementation Must Not Redesign Architecture_.

Diabetes Universe is a medical product. Time zone affects calendar-day boundaries
for glucose, insulin, nutrition, medication summaries, Timeline grouping, and
relative time display. Guessing a user time zone on SSR creates medical
interpretation risk.

Independent dimensions are already fixed by ADR-0009:

- language, locale, and time zone are separate;
- time zone must not be derived from locale or `Accept-Language`;
- UTC is appropriate for canonical storage and technical systems, not as a
  substitute user display time zone on SSR.

Browser IANA time zone is available only on the client. The server cannot reliably
infer user time zone from HTTP headers, host system zone, or deployment region.

## Decision

### Option C — Required User Time Zone

`PlatformRuntime` for user presentation context is created **only** when a valid
explicit IANA time zone is available.

Bootstrap must **not**:

- use a platform default time zone;
- use UTC as a user display time zone fallback;
- derive time zone from locale, `Accept-Language`, server host, or deployment
  region;
- call `Intl.DateTimeFormat().resolvedOptions().timeZone` as a hidden server
  default.

When no valid explicit time zone is available, bootstrap returns
`{ status: 'time-zone-required', seed }` and must not create `PlatformRuntime` with a
guessed value.

### Approved time zone sources

| Source                 | Role                                                                          |
| ---------------------- | ----------------------------------------------------------------------------- |
| Account profile        | Future primary source of user time zone preference                            |
| Validated cookie       | Current approved server source once a cookie scheme is wired                  |
| Browser IANA detection | First-client-visit source (Presentation Integration / CR-03)                  |
| UTC                    | Canonical storage and technical systems only — **not** user display time zone |

CR-02 bootstrap reads only validated explicit server input (`cookieTimeZone` in
`RequestPresentationContext` once cookie wiring exists). CR-02 does not design
the CR-03 cookie or client snapshot API.

### Time-dependent SSR restrictions

Until a valid explicit user time zone is available, the following SSR
calculations are forbidden:

- today / yesterday boundaries;
- Dashboard Day Summary;
- Timeline day grouping;
- relative time;
- local event time display;
- calendar filters.

Application code must defer time-dependent presentation to CR-03 client alignment
or non-runtime placeholders.

### Bootstrap result contract

Absence of a valid explicit user time zone is a **normal first-visit state**, not
an exceptional error. `createRequestPlatformRuntime()` returns a discriminated
`RequestPlatformBootstrapResult`:

- `{ status: 'ready', runtime }` when `PlatformRuntime` is created;
- `{ status: 'time-zone-required', seed }` when no valid explicit IANA time zone is
  available.

`ServerPresentationSeed` carries immutable server-resolved locale preferences
(language, locale, hour cycle, optional numbering system and calendar) from the
same canonical locale resolution used by the ready flow. It must not contain
time zone, `PlatformRuntime`, localization/formatting services, translation
bundles, medical data, or browser objects.

Infrastructure and configuration errors from `createWebPlatformRuntime()`
continue to reject the returned promise. Bootstrap does not create partial
`PlatformRuntime` instances and does not throw for missing user time zone.

## Consequences

### Positive

- No unapproved time zone guess in production bootstrap.
- Medical day-boundary risk from SSR defaulting is removed.
- Clear boundary between CR-02 bootstrap and CR-03 client snapshot work.
- Aligns with ADR-0009 independent-dimension model.

### Negative

- `createRequestPlatformRuntime()` cannot succeed on SSR until explicit time zone
  input exists.
- Production bootstrap invocation remains deferred until cookie wiring or CR-03
  snapshot exists.
- Time-dependent UI continues to use current demo behavior outside Platform
  Runtime until migration.

### Neutral

- Locale resolution and `WebPlatformConfig` assembly remain implemented in CR-02.
- Tests may pass explicit time zone values as fixtures.

## Alternatives

### Option A — Platform default time zone

Rejected. Any single default is a product policy decision with international and
medical UX consequences and was not approved.

### Option B — UTC bootstrap default

Rejected. UTC is deterministic but harms user-facing day-boundary presentation and
is not a substitute for user local time in a medical journal product.

## Date

2026-08-02

## Author

Chief Architect

## References

- [ADR-0009 — Localization Platform](./0009-localization-platform.md)
- [Web Composition Root](../architecture/composition-root/web-composition-root.md)
- CR-02 — Thin Next.js Platform Bootstrap
