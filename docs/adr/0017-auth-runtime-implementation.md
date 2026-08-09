# ADR-0017 — Authentication Runtime Implementation

## Status

Proposed

## Date

2026-08-09

## Context

P5 approved the separation of Product Account, Authentication Identity, Medical Subject, and Session. P6 approved a passwordless-first Web authentication architecture using email magic links, passkeys/WebAuthn, database-backed server sessions, secure cookies, and Better Auth behind a Diabetes Universe-owned adapter boundary.

This ADR converts that architecture into a concrete first implementation plan without introducing backend medical persistence, cloud sync, Timeline ownership migration, or multi-account local-data adoption.

## Decision Summary

The first production-capable Web authentication slice will use:

- `better-auth` **1.6.25**;
- `@better-auth/passkey` **1.6.25**;
- `@better-auth/drizzle-adapter` **1.6.25**;
- PostgreSQL-compatible relational persistence for authentication/account/session data;
- Drizzle ORM **0.45.2** and Drizzle Kit **0.31.10** for schema/migrations;
- Resend **6.18.1** behind a Diabetes Universe email-delivery adapter for magic-link email;
- Better Auth database-backed sessions;
- Better Auth magic-link plugin with hashed verification-token storage;
- Better Auth passkey plugin for WebAuthn;
- Next.js App Router route handlers/server-side session resolution;
- secure host-only HttpOnly session cookies;
- explicit environment-specific origin/RP configuration.

Exact package versions are pinned by the repository lockfile. Upgrades require normal dependency review and validation; production must not float on prerelease or `latest` tags.

## Persistence Boundary

Authentication persistence is relational and server-side.

PostgreSQL is selected as the persistence class because account/session/credential relationships require transactional constraints, unique identities, revocation, and later compatibility with server authorization/audit work.

This does **not** make the auth database the medical Timeline source of truth and does not approve the later medical backend schema.

Target boundary:

```text
Web/Auth application
      ↓
Diabetes Universe Identity & Session contracts
      ↓
Better Auth adapter
      ↓
Drizzle adapter
      ↓
PostgreSQL-compatible database
```

A managed PostgreSQL hosting vendor is deployment configuration rather than product identity architecture. Application code consumes `DATABASE_URL` and must not depend on provider-specific user/account abstractions.

## Database Schema Ownership

Better Auth core/plugin schema owns infrastructure records required for:

- authentication user mapping;
- sessions;
- authentication accounts/identities;
- verification records;
- passkeys.

Diabetes Universe must not expose Better Auth table IDs directly as medical ownership IDs merely because a one-to-one mapping exists in the first slice.

Before backend medical persistence is introduced, a follow-up backend architecture must define the canonical Product Account record and authoritative Account ↔ Medical Subject relationship.

## Schema Migration Policy

Auth schema changes are migration-controlled.

Rules:

1. schema generation is reviewed into version control;
2. production deployments do not run uncontrolled schema generation at request time;
3. destructive migrations require explicit review and rollback/restore planning;
4. migrations run before runtime code that requires the new schema;
5. application startup must fail clearly if required auth schema is unavailable rather than silently switching auth mode;
6. no automatic database reset or destructive recovery is allowed.

Drizzle migration files are the deployment source of truth for this slice.

## Better Auth Configuration

Better Auth remains an infrastructure library, not the product identity model.

Server configuration must include:

- explicit application name;
- explicit/dynamic allow-listed base URL configuration appropriate to local, Vercel Preview, and Production;
- trusted origins allow-list;
- database adapter;
- magic-link plugin;
- passkey plugin;
- session policy;
- secure cookie configuration;
- environment secret supplied only server-side.

No Better Auth `user` or `session` object may be imported into medical-domain packages.

## Magic Link Policy

Magic link is the bootstrap/fallback/recovery authentication method.

Required configuration:

- short lifetime: **10 minutes maximum** for the first implementation;
- single-use token semantics;
- verification tokens stored **hashed**, not plain text;
- generic UI response regardless of whether an email is already registered;
- callback destinations restricted to approved in-app paths/origins;
- no raw verification token in logs/telemetry;
- email message contains no medical data;
- rate limiting/abuse protection is mandatory before public production launch.

The application will use Better Auth's magic-link plugin but email delivery itself remains behind `AuthEmailDelivery` (or equivalent Diabetes Universe-owned interface).

## Email Delivery

Resend is selected as the first transactional email provider because it supports server-side Next.js delivery and verified-domain sending.

Boundary:

```text
Magic-link request
      ↓
AuthEmailDelivery
      ↓
Resend adapter
      ↓
Resend API
```

Required environment value:

```text
RESEND_API_KEY
AUTH_EMAIL_FROM
```

Production sending requires a verified domain. The sender should be a dedicated authentication address such as `auth@<approved-domain>`.

No provider delivery ID is a product account identifier.

## Session Policy

Sessions are database-backed and centrally revocable.

Initial configuration:

- maximum session lifetime: **7 days**;
- rolling/update age: **24 hours**;
- fresh-auth window: **10 minutes** for sensitive security operations;
- active sessions can be listed;
- one session can be revoked;
- all other sessions can be revoked;
- sign-out revokes the server session as well as clearing browser state.

These values are initial security policy, not immutable domain constants. Later security review may shorten them without changing Account identity semantics.

## Cookie Policy

Web session transport uses Better Auth cookies with Diabetes Universe prefix.

Required production properties:

- cookie prefix: `du-auth`;
- HttpOnly;
- Secure;
- SameSite=Lax unless an approved provider flow requires a documented change;
- host-only by default;
- Path intentionally scoped according to Better Auth requirements;
- no cross-subdomain cookie sharing in the first slice;
- no auth token copied into `localStorage`, `sessionStorage`, IndexedDB, URL query state, React persistence, or analytics.

Production and Preview must never disable Secure cookies.

## Base URL / Trusted Origin Policy

Authentication must not trust arbitrary Host/Origin values.

Environments:

### Local development

Approved local origin only, e.g. `http://localhost:3000`.

### Vercel Preview

Preview hosts must be validated through Better Auth's allow-listed dynamic base URL/host mechanism. Preview configuration may permit the repository's controlled `*.vercel.app` deployment pattern but must not accept arbitrary unrelated hosts.

### Production

A canonical production domain must be configured explicitly before real-user authentication/passkey enrollment.

Unknown origins/hosts fail closed.

## Passkey / WebAuthn Policy

Passkeys are the preferred repeat-authentication method.

Initial rules:

- multiple passkeys per account supported;
- enrollment requires an authenticated fresh session;
- credential registration/authentication is server-verified;
- passkey private keys never enter Diabetes Universe servers;
- passkey metadata is authentication infrastructure, not medical ownership;
- users can list and remove their passkeys;
- email magic-link remains fallback/recovery.

### RP ID

Real production passkey enrollment must not begin until the canonical production domain is known.

Configuration contract:

```text
AUTH_WEBAUTHN_RP_ID
AUTH_WEBAUTHN_RP_NAME=Diabetes Universe
AUTH_WEBAUTHN_ORIGIN
```

Local development may use localhost-compatible WebAuthn configuration. Vercel Preview passkey testing is allowed only with environment-specific RP/origin rules that do not create production credentials tied to preview hostnames.

## Application Adapter Boundary

Create a Diabetes Universe-owned package/boundary, conceptually `@diabetes-universe/identity`, containing application-facing contracts such as:

```text
AuthenticatedPrincipal
SessionSummary
PasskeySummary
AuthRequestResult
AuthSecurityActionResult
```

It exposes operations required by product UI, for example:

```text
requestMagicLink
getCurrentPrincipal
signOut
listSessions
revokeSession
revokeOtherSessions
listPasskeys
addPasskey
removePasskey
```

Exact API names may change during implementation, but these contracts must hide Better Auth-specific DTOs.

## Next.js Integration

Better Auth route handlers live under the approved auth API path (`/api/auth/*`).

Application protection follows two layers:

1. route/layout checks for navigation UX;
2. server-side validated session/principal checks at sensitive data/action boundaries.

A route redirect, hidden button, client hook, or middleware/proxy check is never sufficient authorization for sensitive data.

The current local Timeline remains accessible according to the approved product transition design, but authentication must not attach it to the signed-in account automatically.

## Local Medical Data Boundary

This implementation does **not** add `ownerId`, account ID, session ID, or provider ID to `SemanticTimelineEvent`.

After sign-in, current P4 data remains **unattached local medical data** until the explicit Local Data Adoption & Account Isolation wave is approved.

No code in the auth slice may:

- silently claim IndexedDB events;
- erase local Timeline on sign-out;
- expose one future account partition to another account;
- pretend current IndexedDB is already server-owned.

## Environment / Secrets Contract

Server-only secrets/config include at least:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL or approved dynamic-base-url config
RESEND_API_KEY
AUTH_EMAIL_FROM
AUTH_WEBAUTHN_RP_ID
AUTH_WEBAUTHN_RP_NAME
AUTH_WEBAUTHN_ORIGIN
```

Rules:

- secrets never use `NEXT_PUBLIC_`;
- secrets are configured separately for local/Preview/Production;
- secrets are never committed;
- missing required production secrets fail deployment/runtime initialization clearly;
- logs must never print database credentials, auth secret, session token, magic-link token, WebAuthn challenge, or provider credential.

## User-Facing Vertical Slice

The first implementation wave delivers:

1. `/auth` — Sign in / Create account entry;
2. request email link action;
3. `/auth/check-email` state;
4. magic-link callback/error handling;
5. authenticated application entry;
6. Passkey sign-in action where supported;
7. Account Security screen;
8. passkey list/add/remove;
9. active sessions list/revoke;
10. sign out.

UX must use existing design system, localization infrastructure, keyboard accessibility, responsive layout, loading/error states, and non-enumerating auth copy.

## Testing Gate

Required automated coverage before Feature Complete:

### Unit/integration

- identity adapter hides Better Auth DTOs;
- invalid/untrusted callback rejected;
- generic magic-link request response;
- session expiry/freshness policy;
- session revocation;
- passkey mapping/management boundaries;
- missing/invalid configuration fails safely;
- no Timeline ownership mutation on sign-in/sign-out.

### Browser E2E

At minimum:

```text
request magic link → confirmation state
verified auth fixture → authenticated application entry
sign out → protected account screen unavailable
active session → revoke other session
passkey capability state renders safely
existing local Timeline → sign in/out → local data remains unchanged/unattached
```

Real external email delivery and WebAuthn ceremonies require environment-specific integration tests in addition to deterministic CI fixtures.

## Deployment / Rollback

Rollout order:

```text
provision auth PostgreSQL
→ configure Preview secrets
→ apply reviewed auth migration
→ deploy auth runtime behind non-destructive route boundary
→ validate magic link
→ validate sessions
→ validate passkey in approved environment
→ enable visible auth entry
→ Production configuration
```

Rollback rules:

- application rollback must not require dropping auth tables;
- old runtime must remain compatible with applied additive migration where possible;
- failed auth deployment must not affect P4 Timeline IndexedDB data;
- no rollback path may silently create stateless/in-memory authentication.

## Explicit Non-Scope

This ADR does not implement or approve:

- backend medical Timeline persistence;
- cloud sync/outbox/conflict resolution;
- Timeline owner/account migration;
- local multi-account IndexedDB partitioning;
- Google/Apple account linking;
- caregiver/HCP authorization;
- Marketplace roles;
- production legal/consent workflow;
- final regulatory/security certification;
- final backend database architecture for all Diabetes Universe bounded contexts.

## Implementation Gate

Runtime implementation may begin only after this ADR is reviewed, CI/Vercel are green, and the PR is merged to `main`.

The runtime PR must remain a vertical auth slice and may not absorb medical backend/sync/account-adoption scope.

## Governing References

- P5 — Identity, Account & Data Ownership Architecture
- P6 — Authentication & Session Implementation Architecture
- ADR-0016 — Authentication & Session Implementation
- ADR-0014 — Local-First Medical Event Persistence Architecture
