# Remediation 0C — Security Closure

## Status

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| Remediation | 0C                                         |
| Status      | Implemented                                |
| Date        | 2026-09-07                                 |
| Priority    | P1 security / closed-beta blocker          |
| Base SHA    | `42a374d2ce6bbd0c5e61fc49e702b3ad088705a8` |

This remediation closes F-04, F-10, and application-level security headers.
It does not change medical validation, Nutrition 6E, Family, devices, or
Remediation 0A/0B ownership and save-integrity behavior.

## F-04 — Test auth production impersonation

### Previous vulnerability

Medical API scope resolution enabled `x-test-account-id` impersonation when:

```
NODE_ENV === 'test'
OR MEDICAL_API_ENABLE_TEST_AUTH === '1'
```

An accidentally configured production environment could therefore expose a
direct account impersonation path.

### New production invariant

`isMedicalApiTestAuthAllowed(...)` returns **false** when any of these is
true, regardless of `MEDICAL_API_ENABLE_TEST_AUTH`:

- `NODE_ENV === 'production'`
- `VERCEL_ENV === 'production'`
- `AUTH_RUNTIME_ENV === 'production'`

No environment variable can reactivate test auth in a production runtime.
The enable flag is ignored after the production check.

`resolvePrincipalForRequest()` is the only reader of `x-test-account-id`.
`peekMedicalApiPrincipal()` and `resolveMedicalApiScope()` both go through
that function, so the production lockout also covers the PR #153
unauthenticated classification path.

There are no dedicated E2E helper HTTP routes in the production Next.js
tree. Playwright uses `AUTH_RUNTIME_ENV=e2e` fixtures, not a test-auth
route.

### Test-auth matrix

| Runtime                 | Flag  | Result               |
| ----------------------- | ----- | -------------------- |
| `NODE_ENV=production`   | `1`   | disabled             |
| `NODE_ENV=production`   | `0`   | disabled             |
| `NODE_ENV=production`   | unset | disabled             |
| `VERCEL_ENV=production` | `1`   | disabled             |
| `NODE_ENV=test`         | unset | enabled (unit tests) |
| `NODE_ENV=development`  | `1`   | enabled              |
| `NODE_ENV=development`  | unset | disabled             |

`MEDICAL_API_PRODUCTION_GATE=1` is a rate-limit readiness simulation only. It
does not disable or enable test auth.

Malformed or blank `x-test-account-id` values remain unauthenticated. Real
session authentication is unchanged: when test auth is disabled, a real
session principal is used and a test header cannot replace it.

## F-10 — Production rate limiting

### Previous anti-pattern

`createProcessLocalMedicalApiRateLimitAdapter()` always returned
`{ outcome: 'allowed' }`. The production gate could be “ready” while no quota
was enforced.

### New architecture

The existing `MedicalApiRateLimiter` contract is reused. No second subsystem.

| Backend                               | Adapter                               |
| ------------------------------------- | ------------------------------------- |
| `postgres` / `neon`                   | Shared Postgres fixed-window counters |
| `process-local` / `memory`            | Enforcing in-process counters         |
| `e2e-memory` + `AUTH_RUNTIME_ENV=e2e` | Enforcing in-process (Playwright)     |
| `process-local` on Vercel prod        | **Rejected** (adapter not registered) |
| unknown identifier                    | Adapter not registered                |

`postgres` / `neon` is the production backend. It reuses
`MEDICAL_DATABASE_URL` and the existing `postgres` driver already depended
on by `@diabetes-universe/medical-persistence`. No Redis/Upstash dependency
was added.

In-memory counters are not claimed as a distributed serverless limiter.
Vercel production must set `MEDICAL_RATE_LIMIT_BACKEND=postgres` (or
`neon`) and apply `0007_medical_ops_rate_limit.sql` plus
`0008_medical_ops_rate_limit_privileges.sql` as `medical_migrator`.

The request path never runs `CREATE TABLE`. `medical_app` has
`SELECT, INSERT, UPDATE` only. A missing table fails closed (`503`).

Playwright (`AUTH_RUNTIME_ENV=e2e`) still registers a passthrough adapter
first so browser suites do not consume human-use quotas. That adapter is
not a production limiter.

### Why Postgres, and operational requirements

| Topic                | Decision                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Why Postgres         | Already required for medical persistence; no new vendor; atomic `INSERT ... ON CONFLICT`                   |
| Required env         | `MEDICAL_RATE_LIMIT_MODE=distributed`, `MEDICAL_RATE_LIMIT_BACKEND=postgres\|neon`, `MEDICAL_DATABASE_URL` |
| Schema               | `medical_ops.rate_limit_windows` — isolated from medical event/settings tables                             |
| Privileges           | `medical_app`: SELECT/INSERT/UPDATE. No DELETE. No CREATE.                                                 |
| Latency / contention | One upsert per authenticated request; primary key is hashed bucket + window                                |
| Failure              | Store/connect errors → `backend_unavailable` → authenticated `503 SERVICE_UNAVAILABLE`                     |

### Limits (per account, 60-second window)

| Class          | Read | Mutation |
| -------------- | ---- | -------- |
| Settings       | 120  | 30       |
| Medical events | 180  | 60       |
| Adoption       | 60   | 20       |
| Other          | 90   | 30       |

These are generous closed-beta abuse limits, not treatment semantics.

### Key strategy

Bucket key = SHA-256(`accountId` + rate class + operation).

Keys and logs never include email, glucose, insulin, nutrition, notes, or
event payloads. Path query strings are not part of the key.

### Trusted proxy assumptions

Rate limiting runs after authentication. Unauthenticated callers receive
`401 AUTH_REQUIRED` and never reach medical data. The limiter does not trust
client-supplied `X-Forwarded-For` as identity.

Vercel remains the trusted TLS/proxy boundary for auth (`trustedProxyHeaders`
in Better Auth). Medical API quotas are account-scoped after a real principal
is resolved.

### Backend failure policy

Store errors return `backend_unavailable` → HTTP `503 SERVICE_UNAVAILABLE`
for authenticated traffic. The limiter does not fail open to unlimited
traffic.

Rationale: a medical API that becomes unlimited when the counter store is
down is an abuse path. Closed beta can tolerate a temporary `503` for
authenticated callers.

Unauthenticated production-gate failures remain `401 AUTH_REQUIRED` (PR #153
regression). Auth classification happens before the limiter.

### 429 contract

Unchanged OpenAPI envelope:

- HTTP 429
- `error.code = RATE_LIMITED`
- `Retry-After` seconds
- no PHI

## Security headers

Static headers are applied globally via `apps/web/next.config.ts`
`headers()` for `/:path*`. `poweredByHeader` is disabled.

CSP is **not** set in `next.config.ts`. A second static CSP would AND with
the per-request nonce policy and break Next.js hydration. CSP is attached
in `apps/web/proxy.ts` for every non-static route, including `/`,
`/timeline`, `/auth`, Medical API routes, and error responses.

| Header                    | Production value                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Content-Security-Policy   | per-request nonce policy; see below                                                         |
| Strict-Transport-Security | `max-age=15552000` when `NODE_ENV=production`                                               |
| X-Content-Type-Options    | `nosniff`                                                                                   |
| Referrer-Policy           | `strict-origin-when-cross-origin`                                                           |
| Permissions-Policy        | camera, microphone, geolocation, payment, usb, bluetooth, accelerometer, gyroscope disabled |
| X-Frame-Options           | `DENY`                                                                                      |

### CSP directives (production)

```
default-src 'self';
script-src 'self' 'nonce-<per-request>' 'sha256-<theme-init-script>' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self';
connect-src 'self';
form-action 'self';
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
worker-src 'self' blob:;
```

`proxy.ts` generates a nonce, forwards it as `x-nonce` for Next.js scripts,
and sets the response CSP. The theme bootstrap script in `app/layout.tsx`
uses the same nonce. The SHA-256 hash is a fallback for that exact script.

`style-src 'unsafe-inline'` is required because Next.js/Tailwind emit inline
styles. `unsafe-eval` is not used in production.

`img-src` includes `https:` so Better Auth avatar URLs can load. No
analytics scripts are present.

Clickjacking protection is `frame-ancestors 'none'` plus `X-Frame-Options: DENY`.

### Dev vs production

| Item        | Development                                             | Production HTTPS                        |
| ----------- | ------------------------------------------------------- | --------------------------------------- |
| HSTS        | omitted                                                 | `max-age=15552000`                      |
| script-src  | adds `'unsafe-inline' 'unsafe-eval'`; no strict-dynamic | nonce + theme hash + `'strict-dynamic'` |
| connect-src | adds `ws:` / `wss:` for Next.js HMR                     | `'self'`                                |
| Vercel live | added only when `VERCEL_ENV=preview`                    | not added                               |

HSTS does not set `includeSubDomains` or `preload` because domain/subdomain
ownership is not asserted here.

WebAuthn/passkeys and magic links stay same-origin (`connect-src 'self'`,
`form-action 'self'`). Public-key credential APIs are not disabled.

### Known CSP limitations

- `style-src 'unsafe-inline'` remains because a nonce/hash style policy
  would break Next.js/Tailwind inline styles.
- `img-src https:` is broader than `'self'` so remote avatars work.
- Vercel preview adds `https://vercel.live` to script/connect sources.
- A report-only / hash-only style policy is out of scope.

## Explicit non-scope

- F-14 glucose supplemental validator
- F-08 numeric bound alignment
- F-09 Nutrition API v2 / Wave 6E
- F-05 export/account deletion
- F-07 localization cleanup
- CodeQL/SBOM/action pinning
- account lifecycle, backup/PITR, cloud medical sync
- Family, Devices
- broad observability platform
- UI redesign
