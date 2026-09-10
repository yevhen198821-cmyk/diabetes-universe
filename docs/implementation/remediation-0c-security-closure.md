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
| `process-local` on Vercel production  | **Rejected** (adapter not registered) |
| `process-local` on Vercel preview     | Allowed for preview diagnostics only  |
| unknown identifier                    | Adapter not registered                |

`postgres` / `neon` is the production backend. It reuses
`MEDICAL_DATABASE_URL`. `@diabetes-universe/web` now depends on `postgres`
directly so the production adapter can resolve the driver already used by
`@diabetes-universe/medical-persistence`. No Redis/Upstash dependency was
added.

In-memory counters are not claimed as a distributed serverless limiter.
Vercel production must set `MEDICAL_RATE_LIMIT_BACKEND=postgres` (or
`neon`) and apply `0007_medical_ops_rate_limit.sql` plus
`0008_medical_ops_rate_limit_privileges.sql` as an approved medical
migration actor (`medical_deployer` on current Neon production, or
`medical_migrator` where that login path still exists).

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
script-src 'self' 'nonce-<per-request>' 'sha256-<theme-init-script>';
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

| Item        | Development                          | Production HTTPS              |
| ----------- | ------------------------------------ | ----------------------------- |
| HSTS        | omitted                              | `max-age=15552000`            |
| script-src  | adds `'unsafe-inline' 'unsafe-eval'` | nonce + theme hash + `'self'` |
| connect-src | adds `ws:` / `wss:` for Next.js HMR  | `'self'`                      |
| Vercel live | added only when `VERCEL_ENV=preview` | not added                     |

HSTS does not set `includeSubDomains` or `preload` because domain/subdomain
ownership is not asserted here.

WebAuthn/passkeys and magic links stay same-origin (`connect-src 'self'`,
`form-action 'self'`). Public-key credential APIs are not disabled.

### Known CSP limitations

- `'strict-dynamic'` is omitted. Next.js 16 does not nonce every runtime
  script consistently, and a strict-dynamic policy can leave duplicate
  hydrated UI. `'self'` plus per-request nonce remains.
- `style-src 'unsafe-inline'` remains because a nonce/hash style policy
  would break Next.js/Tailwind inline styles.
- `img-src https:` is broader than `'self'` so remote avatars work.
- Vercel preview adds `https://vercel.live` to script/connect sources.
- A report-only / hash-only style policy is out of scope.

## Production Neon migration authority

Current Neon production (`diabetes-universe-auth` / `main` / `neondb`)
cannot execute the previous documented procedure.

`medical_migrator` and the maintenance roles were created as **NOLOGIN**.
Privilege migrations previously required:

```
current_user = 'medical_migrator'
```

and `0001` additionally required:

```
pg_has_role(current_user, 'medical_maintenance_owner', 'SET') = true
```

Neon blocks `GRANT` membership for these platform-managed roles even after
`SET ROLE neon_superuser`. Observed production error:

```
permission denied to grant role "medical_migrator"
SQLSTATE 42501
```

`neondb_owner` also cannot `SET ROLE medical_migrator`. The previous
operator step that temporarily granted `medical_migrator` the ability to
`SET ROLE medical_maintenance_owner` is therefore impossible on this Neon
configuration and is **removed**.

Runtime privileges are not weakened to work around that platform limit.

### Approved migration actors

Privilege migrations now use `isApprovedMedicalMigrationActor(current_user)`
instead of hardcoding `current_user = 'medical_migrator'`.

Exact allowlist only:

- `medical_migrator`
- `medical_deployer`

Rejected by the guard:

- `neondb_owner`
- `medical_app`
- `PUBLIC`
- arbitrary environment-selected roles
- any role that merely matches a `medical_` prefix

No other role is accepted.

### Role separation

| Role                        | Purpose                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `medical_app`               | Runtime only. Approved `SELECT`/`INSERT`/`UPDATE`. No DDL. No role administration. Never a migration actor.                                                                             |
| `medical_deployer`          | LOGIN deploy-only operator role. Runs approved migration DDL. Never used by application runtime, `apps/web`, Medical API, or Vercel runtime env.                                        |
| `medical_migrator`          | Architectural migration-owner role. Remains accepted by the actor guard. Not converted into a runtime role. On current Neon production it is NOLOGIN and cannot be the connecting user. |
| `medical_maintenance_owner` | Owns the approved `SECURITY DEFINER` purge function. Remains **NOLOGIN**. No persistent role membership is granted to deploy actors.                                                    |

`medical_deployer` may own schemas/tables it creates. That is acceptable on
Neon: the role is deploy-only, `medical_app` is not the owner and cannot
`ALTER`/`DROP`, and `PUBLIC` remains revoked. The purge function is
transferred with `ALTER FUNCTION ... OWNER TO medical_maintenance_owner`
after a transactional `GRANT CREATE` / `REVOKE CREATE` on schema `medical`.
`0001` no longer requires `SET ROLE` or persistent membership.

### Operator bootstrap

Create `medical_deployer` out of band. Do not create it from an app request
path. See `packages/medical-persistence/scripts/bootstrap-medical-deployer.sql`.

Requirements:

- `LOGIN`
- deploy-only
- strong generated password (`openssl rand -base64 32` or equivalent)
- grant deploy-only `CREATE` on database `neondb`
- credentials stored only in the operator/CI secret store if later automated
- **not** committed
- **not** present in Vercel runtime env
- **not** referenced by Medical API runtime or `apps/web`

Do not make `medical_maintenance_owner` `LOGIN`. Do not leave schema
`CREATE` on that role after deployment. Do not grant persistent
memberships.

### Production deployment sequence

Connect as `medical_deployer`, then apply the exact repo order:

1. `0000_medical_foundation.sql`
2. `0001_medical_privileges.sql`
3. `0002_medical_adoption.sql`
4. `0002_medical_adoption_privileges.sql`
5. `0003_medical_adoption_subject_resource_fk.sql`
6. `0004_medical_adoption_item_states.sql`
7. `0004_medical_adoption_item_states_privileges.sql`
8. `0005_medical_diabetes_settings.sql`
9. `0006_medical_diabetes_settings_privileges.sql`
10. `0007_medical_ops_rate_limit.sql`
11. `0008_medical_ops_rate_limit_privileges.sql`
12. live privilege smoke

```bash
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0000_medical_foundation.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0001_medical_privileges.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0002_medical_adoption.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0002_medical_adoption_privileges.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0003_medical_adoption_subject_resource_fk.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0004_medical_adoption_item_states.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0004_medical_adoption_item_states_privileges.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0005_medical_diabetes_settings.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0006_medical_diabetes_settings_privileges.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0007_medical_ops_rate_limit.sql
psql "$MEDICAL_DEPLOYER_DATABASE_URL" -f packages/medical-persistence/drizzle/0008_medical_ops_rate_limit_privileges.sql

MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL="$MEDICAL_ADMIN_INSPECTION_DATABASE_URL" \
  pnpm --filter @diabetes-universe/medical-persistence db:smoke:privileges
```

No role memberships are required before or after this sequence.

### Post-migration privilege smoke

After deployment:

- `medical_app`: `USAGE` on `medical` and `medical_ops`; table-specific runtime grants only; `SELECT`/`INSERT`/`UPDATE` on `medical_ops.rate_limit_windows`; no `CREATE`, no `ALTER`, no `DROP`, no role administration, no `DELETE` except where already approved
- `medical_deployer`: unused at runtime
- `PUBLIC`: no access to medical schemas, tables, or functions
- `medical_maintenance_owner`: owns the purge function, remains `NOLOGIN`, has only approved function-support privileges, no leftover schema `CREATE`

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
