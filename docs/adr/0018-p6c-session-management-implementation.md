# ADR-0018 — P6c Session Management Implementation

## Status

Proposed

## Date

2026-08-11

## Context

P6c architecture is approved and merged on `main` at `77c4bea5b93292afbc311b2f78fe8916084e1d44` via [P6c — Account Security & Session Management](../architecture/identity/p6c-session-management.md).

P6a/P6b already provide:

- Better Auth `1.6.25` behind `@diabetes-universe/identity`;
- database-backed sessions in the existing auth schema (`0000_auth_foundation.sql`);
- current-session sign-out via `signOutCurrentSession` → `auth.api.signOut()`;
- passkey fresh-session enforcement via `AUTH_FRESH_AUTH_WINDOW_SECONDS` and `isSessionFreshForPasskeyMutation`;
- `/account/security` passkey management surface.

P6c adds active-session listing and remote revocation without Timeline/P4 ownership changes, without new auth DDL, and without turning the product into a broad Security Center.

Approved architecture policy (**Option B**):

- viewing `/account/security/sessions` requires a **normal authenticated session**;
- fresh authentication is required for **destructive** session operations only;
- current-session sign-out reuses existing P6b semantics without an additional fresh-auth requirement.

Implementation constraint discovered during architecture audit:

- Better Auth `auth.api.listSessions()` is bound to `freshSessionMiddleware` in `better-auth@1.6.25`;
- therefore P6c **must not** expose `auth.api.listSessions()` as the public identity primitive for UI listing;
- the identity boundary must still perform an **owned-session read** server-side, sanitize the result, and return `AccountSessionSummary[]`.

This ADR defines the concrete engineering design for that boundary. It does **not** authorize runtime code in this change set.

## Decision Summary

Implement P6c as three sequential slices (P6c-a, P6c-b, P6c-c) behind `@diabetes-universe/identity`:

1. **Session list read path:** identity-owned Drizzle repository read against the existing auth `session` table, scoped by authenticated Better Auth `userId`, filtered to non-expired rows, sanitized into `AccountSessionSummary[]`.
2. **Session mutations:** continue to use Better Auth server APIs for revocation (`revokeSession`, `revokeOtherSessions`, `revokeSessions`) and P6b `signOut` for current-session logout.
3. **Fresh auth:** reuse the existing P6b freshness helper and window; apply it only to destructive session-management operations.
4. **Web surface:** dedicated `/account/security/sessions` route with server-authoritative reads/actions and no optimistic security state.
5. **Database:** no migration for initial P6c.

## Better Auth Capability / Source Findings

Verified against installed `better-auth@1.6.25`:

| Better Auth operation | Endpoint / API                                                   | Middleware                   | P6c use                                           |
| --------------------- | ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------------- |
| List sessions         | `GET /list-sessions` / `auth.api.listSessions()`                 | `freshSessionMiddleware`     | **Not used** as public identity list primitive    |
| Revoke one            | `POST /revoke-session` / `auth.api.revokeSession({ token })`     | `sensitiveSessionMiddleware` | Used after ownership-constrained token resolution |
| Revoke others         | `POST /revoke-other-sessions` / `auth.api.revokeOtherSessions()` | `sensitiveSessionMiddleware` | Used for bulk other-device logout                 |
| Revoke all            | `POST /revoke-sessions` / `auth.api.revokeSessions()`            | `sensitiveSessionMiddleware` | Used for sign-out everywhere                      |
| Sign out current      | `POST /sign-out` / `auth.api.signOut()`                          | none                         | Reused P6b current-session path                   |

Additional source findings:

- `listSessions` returns parsed session records including **`token`**, `ipAddress`, and `userAgent`; identity sanitization is mandatory.
- `revokeSession({ token })` returns `{ status: true }` even when the token is absent or not owned by the caller.
- `revokeOtherSessions()` preserves the current session by excluding `ctx.context.session.session.token`.
- `revokeSessions()` deletes all sessions for the user, including the current one, but does **not** clear browser cookies by itself.
- `signOut()` deletes the cookie session token server-side when possible and always clears session cookies.
- `sensitiveSessionMiddleware` uses authoritative server-side session reads; it does **not** enforce fresh auth.
- `freshSessionMiddleware` checks `session.createdAt` against configured `freshAge`; P6 already sets `freshAge = AUTH_FRESH_AUTH_WINDOW_SECONDS`.

## Session Read Implementation

### Alternatives considered

#### A. Better Auth internal adapter / server primitive

Use Better Auth's internal `context.internalAdapter.listSessions(userId, { onlyActiveSessions: true })` from inside the identity service.

| Criterion            | Assessment                                                      |
| -------------------- | --------------------------------------------------------------- |
| Stability            | Poor — not a documented public contract on `auth.api`           |
| Coupling             | High — depends on Better Auth internal context wiring           |
| Authorization        | Good if caller `userId` is taken from validated session         |
| Testability          | Harder — requires Better Auth endpoint/context setup            |
| Upgrade risk         | High — internal adapter signatures/behavior can change silently |
| Transaction behavior | Inherited from Better Auth internals                            |
| Portability          | Unclear across PGlite/Postgres/runtime modes                    |

Rejected: too fragile for the canonical Option B list path.

#### B. Identity-owned Drizzle repository read (chosen)

Read active sessions from the existing auth `session` table through `@diabetes-universe/identity`'s existing `AuthDatabase` / `authSchema`, scoped by authenticated `userId`.

| Criterion            | Assessment                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| Stability            | Good — query lives in identity package with explicit DU contract          |
| Coupling             | Moderate — coupled to DU-owned auth schema that mirrors Better Auth       |
| Authorization        | Good — repository accepts authenticated `userId` only from `getSession()` |
| Testability          | Excellent — unit/integration tests against PGlite auth DB                 |
| Upgrade risk         | Manageable — localized mapper/repository + contract tests                 |
| Transaction behavior | Explicit Drizzle queries; no cross-package transaction needed for read    |
| Portability          | Matches existing PGlite/Postgres auth runtime modes                       |

Chosen as the **single canonical implementation path**.

#### C. Other Better Auth server-side list mechanism

No additional Better Auth public server API provides owned-session listing without `freshSessionMiddleware`. `auth.api.getSession()` returns only the current session.

Rejected: insufficient for Option B.

### Canonical read flow

```text
request headers/cookies
→ auth.api.getSession({ headers })                     // normal authenticated session required
→ if unauthenticated: AUTHENTICATION_REQUIRED
→ resolve authenticated Better Auth userId + current session.id
→ identity owned-session repository:
     SELECT active sessions WHERE userId = authenticatedUserId AND expiresAt > now()
→ map rows → sanitize → AccountSessionSummary[]
→ compare current.session.id to each sessionId → isCurrentSession
→ if current session id missing from owned active rows: fail closed (see below)
→ return sanitized read model to Web/server actions
```

Rules:

- Web/app packages must **not** import Drizzle auth schema or query auth tables directly.
- Only `@diabetes-universe/identity` may perform the owned-session repository read.
- Repository methods must never accept client-supplied `userId`, `accountId`, or ownership claims.
- Raw repository rows may contain `token`, `userAgent`, and `ipAddress` internally; they must not escape the identity mapper.

Proposed identity modules (implementation slice P6c-a):

```text
packages/identity/src/server/session-management/
  owned-sessions-repository.ts
  map-account-session-summary.ts
  session-management-freshness.ts
  session-management-errors.ts
  resolve-owned-session-token.ts
packages/identity/src/presentation/
  map-user-agent-label.ts
```

The user-agent label mapper lives in a presentation-oriented module within identity so auth persistence stays storage-focused while UI receives only controlled labels.

## Contracts

### `AccountSessionSummary`

Presentation-safe read model returned to Web/server actions:

```text
AccountSessionSummary
- sessionId: string                 // opaque management identifier (= Better Auth session.id)
- isCurrentSession: boolean         // determined server-side only
- createdAt: string                 // ISO-8601
- expiresAt: string                 // ISO-8601
- clientLabel: string               // controlled label, e.g. "Chrome · macOS"
- clientKind: "browser" | "mobile" | "desktop" | "unknown"
```

Explicit exclusions from browser/UI contracts:

- `token`
- Better Auth raw session object
- `userId`
- `accountId`
- `ipAddress`
- raw `userAgent`

`sessionId` is allowed only as an opaque target selector for revoke-one-other-session actions. It is **not** authorization proof.

### `updatedAt` / activity semantics

Better Auth may update `session.updatedAt` during session refresh/expiry extension (`updateAge`), not on every request.

Decision for initial P6c:

- **do not expose** an activity timestamp in `AccountSessionSummary` v1;
- do **not** label `updatedAt` as `lastActiveAt`, `lastSeenAt`, or similar;
- if a future slice adds a timestamp, it must use neutral record semantics and non-misleading UI copy approved separately.

### `SessionManagementResult`

```text
SessionManagementResult
- ok: boolean
- code: SessionManagementCode
- message: string                   // safe user-facing copy
- sessions?: AccountSessionSummary[] // refreshed sanitized list when applicable
```

### Identity service operations

Extend `IdentityService` with:

```text
listAccountSessions(headers) -> AccountSessionSummary[]
revokeAccountSession({ sessionId, headers }) -> SessionManagementResult
revokeOtherAccountSessions(headers) -> SessionManagementResult
revokeAllAccountSessions(headers) -> SessionManagementResult
signOutCurrentSession(headers) -> void               // existing P6b operation
```

## Authorization

Every operation follows:

```text
request
→ validate authenticated session from request headers/cookies
→ resolve authenticated Better Auth userId + current session.id
→ apply operation policy (fresh auth for destructive ops)
→ enforce ownership using authenticated userId only
→ perform repository read and/or Better Auth mutation
→ return sanitized contract result
```

Hard rules:

- never trust client-supplied `sessionId`, `accountId`, or `userId` for ownership;
- cross-account revoke attempts must not reveal foreign session existence;
- current-session termination must use `signOutCurrentSession`, not revoke-by-`sessionId`.

## Current Session Identification

Exact algorithm:

```text
current = auth.api.getSession({ headers })
ownedRows = ownedSessionsRepository.listActiveSessions(current.user.id)
summaries = mapAccountSessionSummaries(ownedRows, currentSessionId = current.session.id)

for each summary:
  summary.isCurrentSession = (summary.sessionId === current.session.id)
```

Forbidden:

- list order;
- newest `createdAt`;
- IP address;
- user-agent match;
- client-provided current flag.

### Current session missing from owned list

If `getSession()` returns a valid current session but `current.session.id` is absent from the owned active-session query result:

- **fail closed**;
- do not render a list with incorrect `isCurrentSession` values;
- return `AUTHENTICATION_REQUIRED` / safe recovery path;
- Web action/page redirects to `/auth` for reauthentication;
- log internal diagnostic metadata without token/cookie values.

This avoids presenting a false security state after concurrent revocation, expiry, or persistence inconsistency.

## Fresh Auth Implementation

Reuse existing P6b foundation without introducing a second freshness clock:

- window: `AUTH_FRESH_AUTH_WINDOW_SECONDS` (`10 * 60`);
- helper: `isSessionFreshForPasskeyMutation(session.createdAt)` or a thin alias in `session-management-freshness.ts` that delegates to the same function;
- source timestamp: validated current session's `createdAt` from `auth.api.getSession()`.

Required:

| Operation                    | Fresh auth |
| ---------------------------- | ---------- |
| `listAccountSessions`        | No         |
| `revokeAccountSession`       | Yes        |
| `revokeOtherAccountSessions` | Yes        |
| `revokeAllAccountSessions`   | Yes        |
| `signOutCurrentSession`      | No         |

Stale destructive request handling:

- identity returns `FRESH_AUTH_REQUIRED`;
- safe UI copy: «Подтвердите вход и повторите действие»;
- Web action does not call Better Auth revoke APIs;
- user reauthenticates via existing magic-link/passkey flows, then retries.

Implementation note:

- passkey destructive paths continue to use Better Auth hooks in `create-better-auth.ts`;
- session-management destructive paths use identity-boundary pre-checks before calling Better Auth revoke APIs;
- do not route session listing through `auth.api.listSessions()`.

## Revocation Flows

### Revoke one other session

```text
client submits sessionId only
→ auth.api.getSession({ headers })
→ require authenticated session
→ require fresh session (P6b freshness helper)
→ if sessionId === current.session.id:
     reject as wrong operation; current row must use signOutCurrentSession
→ ownedSessionsRepository.findActiveSessionToken({
     userId: current.user.id,
     sessionId: clientSessionId,
   })
→ if not found or expired:
     idempotent success + refreshed sanitized list
→ auth.api.revokeSession({ body: { token }, headers })
→ refreshed sanitized list
```

Ownership constraint:

```text
NOT: SELECT token WHERE id = clientSessionId
YES: SELECT token WHERE id = clientSessionId AND userId = authenticatedUserId AND expiresAt > now()
```

`sessionId` is a target selector, not proof of ownership.

Idempotency:

- already revoked, expired, or missing owned target → success/no-op with refreshed list;
- concurrent duplicate revoke → success;
- foreign or guessed `sessionId` → same safe completion class as missing owned target where enumeration must be avoided.

### Revoke other sessions

```text
authenticated + fresh session
→ user confirms bulk action
→ auth.api.revokeOtherSessions({ headers })
→ if zero other active sessions existed: successful idempotent no-op
→ refreshed sanitized list (current session only)
```

Better Auth preserves current session by excluding the current session token.

### Sign out everywhere

Exact sequence:

```text
authenticated + fresh session
→ user confirms destructive action
→ auth.api.revokeSessions({ headers })      // deletes all server sessions incl. current
→ if revokeSessions fails: return SESSION_REVOKE_FAILED; do not clear cookie
→ auth.api.signOut({ headers })             // supported cookie-clearing path
→ if signOut fails after successful revokeSessions:
     treat as partial failure; force unauthenticated recovery (redirect /auth)
→ redirect /auth
```

Failure semantics:

- never leave the browser in a state where UI still appears authenticated after successful global revocation;
- post-success UI must not offer destructive session actions without a new authenticated session;
- if server sessions are revoked but cookie clearing fails, the next protected request must still fail closed via authoritative session resolution.

Current-session row on the sessions page continues to use P6b `signOutCurrentSession`, not revoke-by-`sessionId`.

## User-Agent Presentation

Raw `userAgent` may be read server-side only inside the identity mapper input.

Presentation mapper location:

```text
packages/identity/src/presentation/map-user-agent-label.ts
```

Output examples:

- `Chrome · macOS`
- `Safari · iPhone`
- `Unknown browser`

Rules:

- best-effort parsing only;
- no fingerprinting enrichment;
- no third-party device intelligence;
- no stable cross-session device IDs;
- unknown/malformed input maps to `Unknown browser` and `clientKind = "unknown"`.

Raw user-agent strings must never reach Web components, server-action payloads, logs, or tests snapshots intended for UI review.

## Error Handling

Internal/application codes:

```text
AUTHENTICATION_REQUIRED
FRESH_AUTH_REQUIRED
SESSION_MANAGEMENT_UNAVAILABLE
SESSION_REVOKE_FAILED
```

Implementation-only codes (must not map 1:1 to distinct user-facing enumeration messages):

```text
SESSION_NOT_FOUND
SESSION_NOT_OWNED
SESSION_ALREADY_REVOKED
CURRENT_SESSION_REQUIRED
```

Safe UI mapping rules:

- unauthenticated → redirect `/auth`;
- stale destructive session → «Подтвердите вход и повторите действие»;
- revoke-one missing/expired/already-ended owned target → success/neutral completion;
- guessed foreign `sessionId` → same safe completion class as missing owned target;
- generic failure → «Не удалось выполнить действие. Попробуйте позже.»;
- never expose Better Auth/internal exception strings in UI;
- never log tokens, cookies, magic-link secrets, or raw user-agent in user-visible diagnostics.

## Race Conditions and Idempotency

| Scenario                                                | Expected behavior                                          |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Target already revoked                                  | Idempotent success; refresh list                           |
| Target expired between list and revoke                  | Idempotent success; omit from refreshed list               |
| Concurrent revoke of same other session                 | Idempotent success                                         |
| `revokeOtherAccountSessions` with zero other sessions   | Successful idempotent no-op                                |
| Current session disappears during work                  | Fail closed; redirect `/auth`                              |
| `revokeAllAccountSessions` success                      | All sessions invalidated; cookie cleared; redirect `/auth` |
| New session created on another device after bulk revoke | Refreshed list reflects current truth only                 |

No optimistic UI that marks a session revoked before server confirmation.

## Web Boundary (Future Implementation Only)

Route:

```text
/account/security/sessions
```

Proposed files (do not create in this ADR change set):

```text
apps/web/app/account/security/sessions/page.tsx
apps/web/components/auth/session-manager.tsx
apps/web/lib/auth/session-management-actions.ts
apps/web/lib/auth/session-management-state.ts
```

Cross-link update:

```text
apps/web/app/account/security/page.tsx
```

Web rules:

- initial page load uses server-side `listAccountSessions(await headers())`;
- mutations use server actions only;
- route/layout redirects remain UX-only, never authorization;
- after every successful mutation, revalidate/refresh from server result;
- no optimistic security state;
- destructive actions require confirmation dialogs with focus management;
- current row uses existing `signOutCurrentSessionAction`;
- other rows submit opaque `sessionId` only;
- stale destructive action surfaces fresh-auth prompt via safe message/redirect pattern already used in account security flows.

Loading/error states:

- initial read failure → neutral unavailable message, no partial secret leakage;
- destructive failure → inline safe error text, list refreshed from server when possible;
- sign-out everywhere success → redirect `/auth`, no authenticated shell rendered afterward.

Accessibility:

- explicit text buttons, not icon-only destructive controls;
- keyboard reachable actions before confirmation;
- non-color-only current-session indication;
- dialog focus trap and restore on close.

## Testing Architecture

### Unit tests

- sanitize mapper removes token/userId/ipAddress/raw UA from output;
- current-session detection by `session.id` equality only;
- user-agent label mapper fallback behavior;
- ownership-constrained token lookup rejects foreign `sessionId`;
- fresh-auth policy helper reuses P6b window/helper;
- error-code → safe message mapping;
- idempotent revoke-one behavior for missing/expired targets;
- fail-closed behavior when current session missing from owned list.

### Integration tests

- Account A lists only A sessions with normal authenticated session;
- Account B isolation: A cannot revoke B's session using B's `sessionId`;
- stale destructive operations return `FRESH_AUTH_REQUIRED`; list still works with normal session;
- `revokeOtherAccountSessions` preserves current session;
- zero-other-session bulk revoke is successful no-op;
- `revokeAllAccountSessions` removes all sessions and clears current auth state;
- no token/raw UA/IP in identity responses;
- Postgres runtime still does not auto-run DDL.

Required cross-account case:

```text
Account A authenticated
Account B authenticated
A obtains/guesses B.sessionId
A calls revokeAccountSession(B.sessionId)
→ must not revoke B
→ B remains authenticated
```

### E2E minimum

Deterministic multi-context Playwright flows without arbitrary sleeps:

1. A login → B login → A opens `/account/security/sessions` → current marked correctly → A revokes B → B loses access → A remains authenticated.
2. Sign out other sessions.
3. Sign out everywhere.
4. Stale-session destructive behavior: destructive action blocked until fresh reauthentication; list remains reachable under normal authenticated session.

Reuse existing P6b auth fixtures and capturing email delivery patterns.

## Better Auth Upgrade Boundary

Because Option B uses an identity-owned repository read rather than `auth.api.listSessions()`, Better Auth upgrades must be absorbed inside `@diabetes-universe/identity`:

- public DU contracts remain stable;
- Better Auth-specific behavior stays localized to identity server modules;
- auth schema drift is detected by identity integration/contract tests;
- if Better Auth changes session fields or revoke semantics, update repository/mappers and destructive-flow tests before merging dependency bumps.

Upgrade review checklist:

1. compare Better Auth session route/middleware changes;
2. run identity integration tests for list/revoke/fresh-auth flows;
3. verify sanitize mapper still excludes secrets;
4. verify sign-out-everywhere still clears cookies after `revokeSessions()`.

## Database

Initial P6c migration: **NONE**.

Do not modify Neon auth schema for P6c v1.

Do not add:

- `deviceId`
- fingerprint columns
- geolocation columns
- medical references

Existing `session` table remains sufficient.

## Implementation Slices

### P6c-a — Identity contracts and secure session read

- add contracts and `IdentityService` methods;
- implement owned-session repository read (canonical list path);
- implement sanitize mapper → `AccountSessionSummary`;
- implement ownership-constrained token resolution;
- wire Better Auth revoke/signOut mutations;
- add fresh-auth guards for destructive operations only;
- add user-agent presentation mapper;
- unit + integration tests;
- no Web UI.

Validation gate: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

### P6c-b — Web sessions surface

- add `/account/security/sessions`;
- add server actions and confirmation UX;
- cross-link `/account/security`;
- reuse current-session sign-out action for current row;
- no optimistic security state.

Validation gate: standard repo gate + targeted auth/session tests.

### P6c-c — Browser verification and closure

- multi-context Playwright flows for revoke-other, revoke-others, sign-out-everywhere, stale destructive behavior;
- regression for P6b passkey and magic-link flows;
- update lifecycle docs only after runtime green.

Validation gate: full CI + Vercel + E2E green.

## Rollback Considerations

- P6c-a can ship behind unused identity methods with no user-visible change; rollback = revert identity PR.
- P6c-b rollback = remove route/actions/components; existing P6b auth flows remain intact.
- No schema rollback required for initial slice because no migration is introduced.
- If sign-out-everywhere cookie clearing fails in production, hotfix must prioritize forced unauthenticated recovery over leaving stale authenticated UI.

## Definition of Done

P6c implementation is complete when:

1. `/account/security/sessions` exists as a dedicated screen with cross-link from passkeys security page.
2. Session list works on normal authenticated session without fresh-auth friction.
3. Destructive session operations enforce fresh auth and safe confirmations.
4. Current-session sign-out still uses P6b `signOutCurrentSession`.
5. Browser receives only sanitized `AccountSessionSummary` objects.
6. Cross-account revoke is impossible and covered by integration tests.
7. Sign-out-other-sessions no-op semantics are covered.
8. Sign-out-everywhere revokes all server sessions and clears current browser auth state.
9. No auth DDL migration was required for the initial slice.
10. Timeline/P4 contracts remain unchanged.
11. Full CI, link validation, and Vercel gates are green on the runtime merge commit.

## Consequences

Positive:

- Option B UX is achievable without bypassing Better Auth security informally from Web code;
- destructive operations remain on supported Better Auth revoke primitives;
- identity contracts stay stable even if Better Auth list middleware remains fresh-only;
- implementation can proceed in small sequential slices with independent validation gates.

Costs:

- identity package owns a repository read path that must stay aligned with Better Auth session persistence;
- sanitize/mapping code becomes a required maintenance surface on Better Auth upgrades;
- fail-closed current-session/list mismatch handling may force occasional reauthentication.

## Alternatives Considered

Rejected:

- using `auth.api.listSessions()` for UI listing — conflicts with approved Option B because of `freshSessionMiddleware`;
- direct Web-layer Drizzle reads — violates identity boundary and duplicates authorization policy;
- Better Auth internal adapter reads — unstable/non-public coupling;
- exposing `token` or raw Better Auth session objects to server actions/UI — forbidden by approved architecture;
- adding auth DDL for device/fingerprint/location presentation — unnecessary for initial P6c.

## References

- [P6c — Account Security & Session Management](../architecture/identity/p6c-session-management.md)
- [P6 — Authentication & Session Implementation Architecture](../architecture/identity/p6-authentication-session-implementation.md)
- [P6b — Passkey Enrollment & Sign-In](../architecture/identity/p6b-passkey-signin.md)
- [ADR-0016 — Authentication & Session Implementation](./0016-authentication-session-implementation.md)
- [ADR-0017 — Authentication Runtime Implementation](./0017-auth-runtime-implementation.md)
- Better Auth `1.6.25` session routes and middleware (`listSessions`, `revokeSession`, `revokeOtherSessions`, `revokeSessions`, `signOut`)

## Author

Diabetes Universe engineering / Cursor Cloud Agent
