# P6b — Passkey Enrollment & Sign-In

## Status

**Feature Complete**

Date: 2026-08-11

This lifecycle record closes P6b for the approved Web scope. The architecture sections below remain the governing design baseline.

## Completion Baseline

Implementation and closure were delivered through:

- PR #80 — `docs(p6b): define passkey enrollment and sign-in architecture`
  - merge commit: `107a651378ce8465696249a8bb7a9a34575c83b6`
- PR #81 — `feat(p6b): passkey enrollment, sign-in, and current-session sign-out`
  - branch: `feature/p6b-passkey-runtime`
  - closure HEAD: `5c66c3ab4becc1c38473c2f7d7f62e3d2c9da13f`

## Delivered Runtime

P6b implementation is complete:

- Passkey enrollment complete — authenticated account can register a passkey after fresh-session verification;
- Passkey sign-in complete — `/auth` supports WebAuthn authentication with email magic-link fallback;
- current-session sign-out complete — server session is revoked and the session cookie is cleared;
- `@better-auth/passkey` remains isolated behind `@diabetes-universe/identity`;
- explicit WebAuthn relying-party configuration (`AUTH_WEBAUTHN_RP_ID`, `AUTH_WEBAUTHN_RP_NAME`, `AUTH_WEBAUTHN_ORIGIN`) fails closed when invalid;
- minimal `/account/security` surface lists account-scoped passkeys and supports add/remove with server-side authorization;
- Better Auth user IDs and passkey credential IDs remain separate from canonical Diabetes Universe `accountId`;
- Timeline/P4 ownership, adoption, and local IndexedDB contracts are unchanged;
- OAuth, cloud sync, backend medical persistence, and delegated medical access are not implemented;
- active-session/device listing and remote session revocation remain future P6c scope.

## Neon Auth Database

Neon schema migration was applied and verified externally outside this agent runtime:

- P6a foundation migration `0000_auth_foundation.sql` applied;
- P6b passkey migration `0001_passkey_foundation.sql` applied;
- auth tables present: `user`, `session`, `account`, `verification`, `passkey`;
- passkey indexes and constraints verified;
- temporary Neon migration branch deleted;
- PostgreSQL/Neon runtime startup does not auto-run DDL.

Neon schema migration verified externally; Cursor runtime smoke unavailable because runtime secrets are not exposed to agent.

## Validation Baseline

The implementation completion gate was validated on PR #81 closure HEAD `5c66c3ab4becc1c38473c2f7d7f62e3d2c9da13f` with:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Playwright auth baseline **38/38 E2E**
- Markdown link validation
- GitHub CI green
- Vercel Preview green

This lifecycle closure must also pass the current standard CI/Vercel gate before merge.

## P6b Completion Gate

All approved P6b completion conditions are satisfied for the current Web scope:

1. Dependency and lockfile are pinned — complete.
2. Auth migration is explicit and reviewed — complete.
3. Authenticated passkey registration works — complete.
4. Passkey sign-in creates the normal server session — complete.
5. Email magic-link fallback still works — complete.
6. Current-session sign-out revokes the session — complete.
7. Passkey management is account-scoped server-side — complete.
8. Security/configuration diagnostics do not leak to UI — complete.
9. Full implementation validation and Vercel validation are green — complete.
10. Canonical architecture documentation matches runtime reality — complete with this closure change.

## Explicit Non-Scope Remains Unchanged

P6b does not implement:

- active-session/device listing;
- remote session revocation beyond the current session;
- Google/Apple OAuth;
- passwords;
- Timeline ownership/adoption changes;
- medical backend/sync/outbox/conflicts;
- delegated medical access;
- Marketplace permissions.

These remain P6c and later platform waves and must not be retrofitted into P6b.

## Next Slice

After P6b: **P6c — Active Sessions & Account Security Management**.

P6 as a whole is not Feature Complete; only P6b is closed by this record.

## Purpose

Define the next vertical authentication slice after P6a established email magic-link authentication, database-backed sessions, the Diabetes Universe identity boundary, and Web auth routes.

P6b adds passkeys without changing medical-data ownership, Timeline contracts, cloud sync, or account/data adoption semantics.

## Scope

P6b includes:

- install and isolate `@better-auth/passkey` behind `@diabetes-universe/identity`;
- WebAuthn relying-party configuration;
- authenticated passkey enrollment;
- passkey sign-in from `/auth`;
- list the current account's passkeys in a minimal account security surface;
- remove a passkey only after server-side authenticated authorization;
- sign out the current server session;
- deterministic unit/integration tests and browser tests where WebAuthn can be virtualized safely.

P6b explicitly excludes active-session/device listing, remote session revocation, Google/Apple OAuth, passwords, Timeline ownership/adoption, medical backend/sync, and delegated medical access. Session/device management remains P6c.

## Governing Invariants

P6b preserves:

- Product Account ≠ Authentication Identity ≠ Medical Subject ≠ Session;
- Better Auth user IDs and passkey credential IDs are never medical-owner identifiers;
- current local IndexedDB Timeline data remains unattached;
- passkey enrollment does not claim local medical data;
- server-side authorization is authoritative;
- WebAuthn credentials are authentication material, not domain data;
- authentication remains separate from consent.

## Dependency Decision

Use `@better-auth/passkey` on the same pinned release line as Better Auth. P6b targets `better-auth@1.6.25` and `@better-auth/passkey@1.6.25` unless an implementation compatibility check proves a required coordinated patch upgrade. The plugin remains an implementation detail behind Diabetes Universe-owned identity contracts.

## Relying Party Configuration

P6b requires explicit configuration:

- `AUTH_WEBAUTHN_RP_ID` — trusted relying-party identifier, never inferred from an untrusted request Host header;
- `AUTH_WEBAUTHN_RP_NAME` — human-readable `Diabetes Universe`;
- `AUTH_WEBAUTHN_ORIGIN` — exact trusted origin for the environment.

Production must fail closed when Passkey functionality is enabled but RP configuration is invalid or incomplete. Preview deployments must never silently reuse an incompatible Production RP/origin configuration. Passkeys on Preview are either explicitly configured for the preview origin or intentionally disabled.

## Enrollment Journey

```text
Authenticated account
→ Account / Security
→ Add passkey
→ verify authenticated and fresh session
→ begin WebAuthn registration
→ authenticator performs user verification
→ server verifies challenge/origin/RP ID
→ credential stored in auth persistence
→ security UI refreshes
```

Requirements:

- account authority comes from the validated server session, never a browser-supplied account ID;
- enrollment requires fresh authentication;
- challenge/origin/RP validation uses the auth implementation, not custom cryptography;
- user verification is required for production unless a documented compatibility decision proves otherwise;
- no passkey action changes Timeline ownership.

## Sign-In Journey

```text
/auth
→ Use passkey
→ WebAuthn authentication ceremony
→ server validates credential/challenge/origin/RP ID
→ auth identity resolved
→ canonical Diabetes Universe account resolved
→ database-backed session created
→ allow-listed callback
→ application entry
```

Email magic-link remains the recovery/fallback channel. User-facing Passkey failures are generic and actionable; provider, authenticator, database, and configuration diagnostics remain server-side.

## Passkey Management

The minimal `/account/security` surface shows only the authenticated account's passkeys. It may show a friendly name and creation date, but never raw public-key material, challenges, internal auth-library IDs, or unnecessary authenticator metadata.

Removing a passkey requires:

- authenticated principal resolved server-side;
- account ownership validation through the identity boundary;
- fresh authentication;
- protection against cross-account deletion.

Email magic-link recovery remains available, so P6b does not need a full last-authentication-method lockout policy, but destructive UI should warn clearly.

## Current Session Sign-Out

P6b completes the basic account journey with current-session sign-out:

```text
Sign out
→ revoke/invalidate current server session
→ clear session cookie
→ redirect to a safe public route
```

Clearing only the browser cookie is insufficient when the provider supports server-session invalidation.

## UX

### `/auth`

One primary task: authenticate.

Recommended hierarchy:

1. `Войти с Passkey` when Passkey support is enabled for the environment;
2. fallback divider;
3. email magic-link form.

### `/account/security`

One primary task: manage sign-in security.

P6b includes Passkey list, Add passkey, Remove passkey, and appropriate success/error states. Active-device/session management is not shown until P6c.

The browser/OS owns biometric or PIN interaction. Diabetes Universe must not imitate Face ID, Touch ID, Windows Hello, fingerprint, or security-key system dialogs.

## Accessibility

Passkey controls must support keyboard navigation before native WebAuthn UI opens, have explicit accessible names/status messages, use non-color-only states, and restore meaningful focus after cancellation or completion.

## Security Requirements

- no custom WebAuthn cryptography;
- no raw credential or challenge logging;
- no arbitrary callbacks;
- fresh-auth enforcement for add/remove Passkey;
- server-side account resolution for management mutations;
- credential data exists only in auth persistence;
- test-only WebAuthn controls fail closed outside explicit E2E runtime;
- RP ID and origin are deployment configuration, not request-derived authority.

## Testing Strategy

Required tests include:

- RP/origin configuration validation;
- identity-boundary tests preventing plugin-specific credential types leaking into product/domain code;
- authenticated enrollment authorization;
- cross-account removal rejection;
- current-session sign-out invalidation;
- email fallback regression;
- Chromium virtual WebAuthn authenticator E2E where deterministic;
- regression proving WebAuthn test controls are inaccessible outside explicit E2E runtime.

CI must not require physical biometric hardware.

## Migration / Database

The Passkey plugin requires additional auth persistence schema.

Rules:

- migration is explicit and reviewed;
- PostgreSQL/Neon runtime startup never auto-runs DDL;
- PGlite E2E/test bootstrap may create the test schema;
- auth-persistence migration versioning remains separate from Timeline event schema and P4 local-storage schema;
- Neon migration is applied only after the implementation schema has passed review and before enabling Passkeys in an environment.

## Definition of Done

P6b is complete only when:

- dependency and lockfile are pinned;
- auth migration is explicit;
- authenticated Passkey registration works;
- Passkey sign-in creates the normal server session;
- magic-link fallback still works;
- current-session sign-out revokes the session;
- management is account-scoped server-side;
- security/configuration diagnostics do not leak to UI;
- format, lint, typecheck, tests, build, E2E, links, CI and Vercel are green;
- architecture/security audit passes;
- implementation is merged and post-merge validation is green.

## Architecture Next Slice

After P6b: **P6c — Active Sessions & Account Security Management**.
