# P6c — Account Security & Session Management

## Status

**Architecture Design — Approved**

Date: 2026-08-11

Architecture approval records the final session-list fresh-auth policy (Option B) and identity-boundary listing approach required for P6c implementation.

## Context

P6b closed passkey enrollment, passkey sign-in, passkey management, and current-session sign-out on top of P6a email magic-link authentication, database-backed sessions, and the Diabetes Universe identity boundary.

The next approved authentication slice is **P6c — Account Security & Session Management**.

The primary user question is:

> «Где сейчас выполнен вход в мой аккаунт и как я могу прекратить доступ ненужной сессии?»

P6c designs safe management of authenticated **server sessions**. It does not expand into a general security center, OAuth, MFA, sync, or Timeline ownership changes.

## Goals

P6c must provide architecture for:

1. viewing active authenticated sessions for the signed-in account;
2. identifying the current session server-side;
3. revoking one specific other session;
4. signing out on all other devices while preserving the current session;
5. optionally signing out everywhere, including the current session;
6. clear, accessible security UX with one primary task per screen;
7. a server-authoritative authorization boundary that never trusts client-supplied ownership.

P6c must reuse Better Auth session primitives where they are correct, rather than inventing a parallel session protocol.

## Non-goals

P6c explicitly excludes:

- OAuth Google/Apple;
- MFA/TOTP;
- account recovery redesign;
- trusted devices;
- device fingerprinting;
- security event history / audit UI;
- suspicious-login detection;
- email alerts;
- Timeline ownership or adoption changes;
- cloud sync / backend medical API;
- organization / doctor sessions;
- a broad Security Center beyond passkeys + sessions;
- database migrations in the architecture wave itself;
- runtime implementation in this wave.

## Existing Foundation

Confirmed baseline on `main` at merge commit `0b12a4a1c81c717bce97c6de799d45fe36b16ce3`:

- magic-link authentication;
- passkey enrollment and sign-in;
- passkey list/add/remove with fresh-session protection;
- current-session sign-out via server revocation + cookie clear;
- canonical Diabetes Universe `accountId` separate from Better Auth user IDs and passkey credential IDs;
- Neon auth schema with `user`, `session`, `account`, `verification`, `passkey`;
- `@diabetes-universe/identity` as the application boundary over Better Auth `1.6.25`.

Current contracts already include:

```text
AuthenticatedPrincipal
SessionSummary
PasskeySummary
```

Current runtime operations already include:

```text
getCurrentPrincipal
requestMagicLink
listPasskeys
deletePasskey
signOutCurrentSession
```

P6b deliberately left active-session listing and remote revocation to P6c.

## Better Auth Capability Audit

Audit target: **Better Auth `1.6.25`** on the same release line already pinned by P6b.

### Built-in session management endpoints

Better Auth provides standard session-management endpoints without a separate plugin:

| Operation                | Better Auth endpoint                                               | Middleware                   | Notes                                            |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------ |
| List active sessions     | `GET /list-sessions` via `auth.api.listSessions()`                 | `freshSessionMiddleware`     | Returns active sessions for authenticated user   |
| Revoke one session       | `POST /revoke-session` via `auth.api.revokeSession()`              | `sensitiveSessionMiddleware` | Request body expects **`token`**, not `id`       |
| Revoke other sessions    | `POST /revoke-other-sessions` via `auth.api.revokeOtherSessions()` | `sensitiveSessionMiddleware` | Preserves current session token                  |
| Revoke all sessions      | `POST /revoke-sessions` via `auth.api.revokeSessions()`            | `sensitiveSessionMiddleware` | Deletes all sessions for user, including current |
| Sign out current session | `POST /sign-out` via `auth.api.signOut()`                          | existing P6b path            | Already implemented as `signOutCurrentSession`   |

Better Auth does **not** require the Multi Session plugin for this use case. The Multi Session plugin is for multi-account cookie switching, not for account security session management.

### Existing session schema

The current auth persistence schema already stores everything P6c needs for a first slice:

```text
session
- id            opaque session identifier
- token         session cookie token (secret credential)
- expiresAt
- createdAt
- updatedAt
- ipAddress     optional request metadata
- userAgent     optional request metadata
- userId        auth identity linkage
```

This matches Better Auth's documented core session model and the project's existing `0000_auth_foundation.sql`.

**Conclusion:** P6c does **not** require a database migration for the initial implementation slice, unless a later approved need emerges for custom presentation fields. Do not add Timeline, device, sync, or medical references to auth persistence.

### Capability gaps to handle in the identity boundary

Better Auth primitives are sufficient, but Diabetes Universe must add policy and mapping on top:

1. **Client-facing identifier must be `session.id`, never `session.token`.**
   Better Auth revoke APIs accept the session token internally. The identity boundary resolves `sessionId → token` server-side and never exposes the token to UI, logs, or client payloads.

2. **Current session must be determined server-side.**
   Compare the validated current session's `id` from `getSession()` with each listed session. Do not infer current session from list order, IP, or user-agent.

3. **Fresh-auth policy is not uniform across Better Auth endpoints, and DU session-list policy differs from Better Auth defaults.**
   Better Auth `auth.api.listSessions()` uses `freshSessionMiddleware`. P6c adopts **Option B**: viewing `/account/security/sessions` requires only a normal authenticated session; fresh authentication is required for destructive operations only. Therefore `listAccountSessions` must **not** use `auth.api.listSessions()` as its public identity primitive. The identity boundary loads caller-owned active sessions server-side from auth persistence (or an equivalent server-only path), maps them into `AccountSessionSummary`, and never forwards Better Auth raw list output to UI.
   Revoke endpoints use `sensitiveSessionMiddleware` only. Diabetes Universe must enforce additional fresh-auth policy for destructive session operations at the identity/application boundary, using the same `AUTH_FRESH_AUTH_WINDOW_SECONDS` concept already used for passkey mutations.

4. **`revokeSession` is idempotent and may return success without deleting a foreign session.**
   Better Auth returns `{ status: true }` even when the target token is absent or not owned by the caller after lookup. The identity boundary must translate this into safe, non-enumerating user messaging while preserving idempotent server semantics.

5. **Session list output may include secret fields unless stripped.**
   The identity boundary must map Better Auth session records into Diabetes Universe `AccountSessionSummary` contracts and omit token and any other secret transport material.

6. **`updatedAt` is not a guaranteed precise "last activity" signal.**
   Better Auth rolling session refresh updates expiration and may update session metadata according to `updateAge`. P6c may expose approximate activity only with explicit wording; it must not imply per-request tracking that does not exist.

## UX / IA Decision

### Options considered

**Option A — single page `/account/security` with Passkeys + Sessions sections**

Pros:

- fewer routes;
- one "security" destination from `/account`.

Cons:

- two distinct primary tasks on one screen;
- longer mobile scroll;
- harder to extend later with OAuth/MFA/recovery without turning the page into a Security Center;
- sessions task competes visually with passkey management.

**Option B — dedicated route `/account/security/sessions`**

Pros:

- one primary task per screen;
- better mobile focus;
- aligns with P6b's already-shipped passkey page at `/account/security`;
- leaves room for future security slices without redesigning a hub;
- clearer E2E and accessibility boundaries.

Cons:

- requires lightweight cross-navigation between passkey and session pages.

### Decision

Adopt **Option B**.

Information architecture:

```text
/account
  → Безопасность входа (/account/security)
      → Passkeys (existing P6b surface)
      → Active sessions (/account/security/sessions)
```

Rules:

- `/account/security` remains the passkey management page delivered in P6b;
- `/account/security/sessions` is the dedicated active-session management page;
- each page includes a single primary task and a simple cross-link to the sibling security page;
- do not introduce a multi-module Security Center dashboard in P6c;
- do not show OAuth providers, MFA, audit history, or recovery redesign on these pages.

### Sessions page UX

Primary task: **review active sign-ins and revoke unwanted access**.

Recommended layout:

1. page title and short explanation;
2. current-session summary at top when present;
3. list of other active sessions;
4. secondary bulk actions:
   - `Выйти на других устройствах`
   - `Выйти везде` (destructive, confirmation required);
5. link back to passkeys page.

Each session row shows:

- controlled browser/device presentation label;
- `Текущая сессия` badge for current session only;
- `Создана` (`createdAt`);
- `Истекает` (`expiresAt`);
- optional `Примерная активность` (`updatedAt`) only if mapped with non-misleading copy;
- one primary action:
  - current row → `Выйти` using existing current-session sign-out semantics;
  - other row → `Завершить сессию`.

Do not show:

- session token;
- raw session/database IDs;
- raw user-agent strings;
- IP addresses in P6c UI;
- approximate geolocation;
- medical-data references.

Accessibility:

- keyboard-reachable actions before destructive confirmation;
- explicit button labels, not icon-only revoke controls;
- confirmation dialog focus management;
- non-color-only current-session indication;
- destructive actions expose clear status/error text.

## Session Contract

Extend the identity package with Diabetes Universe-owned contracts. Final names may adjust during implementation, but the semantics are fixed.

### `AccountSessionSummary`

Conceptual read model for UI:

```text
AccountSessionSummary
- sessionId: opaque public management identifier (= Better Auth session.id)
- accountId: canonical Diabetes Universe account ID
- isCurrentSession: boolean determined server-side
- createdAt: ISO-8601 timestamp
- expiresAt: ISO-8601 timestamp
- lastSeenAt: ISO-8601 timestamp | null   // mapped from updatedAt when available
- clientLabel: human-readable browser/device summary
- clientKind: "browser" | "mobile" | "desktop" | "unknown"
```

Rules:

- `sessionId` is the only client-facing target identifier for revoke-one-other-session actions;
- session token never appears in this contract;
- `accountId` comes from mapped authenticated principal, never from client input;
- list responses contain only non-expired active sessions;
- current session is explicitly flagged; list order is not authoritative.

### `SessionManagementResult`

Conceptual result for destructive operations:

```text
SessionManagementResult
- ok: boolean
- code: internal machine-readable code
- message: safe user-facing message
- refreshedSessions?: AccountSessionSummary[]
```

### Identity service operations

Extend `@diabetes-universe/identity` conceptually with:

```text
listAccountSessions(headers) -> AccountSessionSummary[]
revokeAccountSession({ sessionId, headers }) -> SessionManagementResult
revokeOtherAccountSessions(headers) -> SessionManagementResult
revokeAllAccountSessions(headers) -> SessionManagementResult
signOutCurrentSession(headers) -> void   // existing P6b operation, reused
```

Implementation must keep Better Auth behind this boundary:

```text
listAccountSessions        -> server-side owned-session read + sanitize -> AccountSessionSummary[]
                             (NOT auth.api.listSessions() as the public identity primitive)
revokeAccountSession       -> resolve sessionId to owned token -> auth.api.revokeSession()
revokeOtherAccountSessions -> auth.api.revokeOtherSessions()
revokeAllAccountSessions   -> auth.api.revokeSessions()
signOutCurrentSession      -> auth.api.signOut()
```

`listAccountSessions` may reuse the same auth persistence records Better Auth stores, but the public identity operation must authenticate with a normal validated session and return only sanitized DU read models. Do not expose `auth.api.listSessions()` response shape, middleware behavior, or secret fields to UI/server-action consumers.

UI and server actions depend only on Diabetes Universe contracts.

## Identity Boundary

Target layering remains unchanged:

```text
Web UI / Server Actions
        ↓
@diabetes-universe/identity
        ↓
Better Auth server API
        ↓
Auth persistence (Neon / PGlite)
```

Rules:

- product/domain packages must not import Better Auth client/server types;
- session list and revoke flows must not bypass `IdentityService`;
- Better Auth session token remains a transport secret, not a UI identifier;
- canonical `accountId` mapping continues through `mapAuthenticatedPrincipal`;
- no second auth source of truth;
- Timeline/P4 packages remain unaware of session-management UI.

## Authorization Model

Every session-management operation follows the same server-authoritative pattern:

```text
request
→ validate authenticated session from request headers/cookies
→ resolve canonical account/principal
→ verify operation policy (fresh-auth where required)
→ validate target session ownership within authenticated user
→ perform Better Auth mutation
→ return mapped contract result
```

Hard rules:

- never trust `accountId`, `userId`, or `sessionId` ownership from unauthenticated or client-only state;
- a revoke target must belong to the authenticated Better Auth user resolved from the current session;
- cross-account revoke attempts must fail safely without revealing whether another account's session exists;
- current-session termination must reuse `signOutCurrentSession`, not a parallel revoke mechanism;
- destructive mutations must go through server actions/route handlers with CSRF-safe cookie-authenticated POST semantics already used by Better Auth;
- route/layout redirects remain UX-only and never substitute for server authorization.

### Current session identification

Server algorithm:

```text
current = auth.api.getSession({ headers })
listed = listAccountSessions server-side owned-session read for authenticated user
for each session in listed:
  isCurrentSession = session.id === current.session.id
```

Forbidden heuristics:

- first row in list;
- newest `createdAt`;
- matching IP address;
- matching user-agent string;
- client-provided "current" flag.

### Revoke current session

When the user ends the current session from the sessions page:

```text
signOutCurrentSession
→ Better Auth signOut
→ invalidate current server session
→ clear session cookie
→ redirect to safe public route (/auth)
```

Do not expose a separate "revoke by sessionId" action for the current row.

## Fresh-Auth Policy

Reuse the existing fresh-session window configured for P6:

```text
AUTH_FRESH_AUTH_WINDOW_SECONDS = 10 minutes
```

### Session list fresh-auth decision — Option B (approved)

Final architecture decision:

- viewing `/account/security/sessions` requires a **normal authenticated session** only;
- fresh authentication is **not** required to view the session list;
- fresh authentication **is** required for destructive operations;
- current-session sign-out continues to use existing P6b `signOutCurrentSession` semantics without an additional fresh-auth requirement.

Better Auth note: `auth.api.listSessions()` is protected by `freshSessionMiddleware`. P6c therefore does **not** use `auth.api.listSessions()` as the public identity primitive for UI listing. The identity boundary loads sessions server-side, sanitizes them, and returns `AccountSessionSummary[]`.

Policy by operation:

| Operation                                    | Fresh auth required | Additional UX                                                                 |
| -------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| View active sessions (`listAccountSessions`) | **No**              | Normal authenticated session; no reauthentication prompt for read-only access |
| Revoke one other session                     | **Yes**             | Reauthenticate if stale before destructive action                             |
| Sign out other sessions                      | **Yes**             | Confirmation dialog + fresh auth                                              |
| Sign out everywhere                          | **Yes**             | Strong confirmation + fresh auth                                              |
| Sign out current session                     | **No**              | Reuse existing P6b sign-out semantics                                         |

Rationale:

- read-only session listing follows the same authenticated-session pattern already used for passkey listing in P6b;
- remote revocation is destructive and must not run from a stale borrowed session;
- current-session sign-out is an ordinary logout and should remain low friction;
- Better Auth's fresh requirement on `listSessions` is an implementation constraint handled inside the identity boundary, not a product UX requirement for `/account/security/sessions`.

Implementation note:

- passkey fresh-session enforcement already uses Better Auth hooks in `create-better-auth.ts`;
- P6c must add a parallel identity-boundary fresh-session guard for destructive session-management mutations, or an equivalent server-side pre-check before calling Better Auth revoke APIs;
- `listAccountSessions` must authenticate with a normal validated session and must not depend on `freshSessionMiddleware` behavior reaching the UI path.

## Revocation Semantics

### Revoke one other session

```text
Authenticated fresh session
→ user selects other session row
→ server receives sessionId only
→ identity service resolves sessionId among caller-owned active sessions
→ map to Better Auth token internally
→ auth.api.revokeSession({ token })
→ return refreshed session list
```

Semantics:

- caller can revoke only sessions owned by the authenticated user;
- if target is current session, route to `signOutCurrentSession` instead;
- if target already revoked or expired, treat as success (idempotent);
- safe user message: generic success or "session already ended" without exposing other accounts.

### Sign out other sessions

Use Better Auth `revokeOtherSessions`.

```text
Authenticated fresh session
→ user confirms bulk action
→ auth.api.revokeOtherSessions()
→ current session remains valid
→ return refreshed list containing only current session
```

Semantics:

- when no other active sessions exist, treat as **successful idempotent no-op**;
- safe user message may confirm completion without implying another device was removed.

Partial failure:

- Better Auth performs internal deletes in parallel;
- if implementation observes partial failure, identity boundary returns a generic retry message and refreshed list from a follow-up list call;
- do not expose which device failed unless safe and useful; prefer generic copy.

### Sign out everywhere

**Included in P6c.**

Use Better Auth `revokeSessions`.

```text
Authenticated fresh session
→ user confirms destructive action
→ auth.api.revokeSessions()
→ all sessions invalidated, including current
→ clear browser cookie/session state
→ redirect to /auth
```

UX requirements:

- separate from "sign out other sessions";
- explicit warning that the current device will also be signed out;
- confirmation dialog with irreversible language;
- post-success redirect to `/auth`.

This satisfies compromised-account recovery at the session layer without introducing a separate security-center workflow.

## Privacy Model

P6c session management must minimize collected and displayed metadata.

### IP address

Better Auth may store `ipAddress` on session creation/update as request metadata.

P6c decision:

- **do not display IP address in user-facing UI;**
- do not derive geolocation from IP in P6c;
- do not add IP-based heuristics for "current session";
- retention follows normal session row lifetime and deletion on revoke/expiry;
- future security alerting may reconsider IP use in a separate approved wave.

### User-Agent

Better Auth stores raw `userAgent`.

P6c decision:

- raw user-agent strings must not be shown to users;
- identity boundary maps raw UA to a controlled presentation label such as `Chrome on macOS`, `Safari on iPhone`, or `Unknown browser`;
- mapping is best-effort and purely presentational;
- unknown or malformed UA maps to `Unknown browser`; no fingerprinting enrichment.

### Device fingerprinting

Forbidden in P6c:

- custom device IDs;
- canvas/hardware fingerprinting;
- cross-session stable client identifiers beyond existing Better Auth session records;
- third-party device intelligence services.

### Data minimization

Use only metadata required for the security function:

- session identity (`id`);
- created/expiry timestamps;
- optional approximate last seen from `updatedAt`;
- coarse browser/device label from user-agent mapping.

Do not store or display medical data, Timeline ownership, sync state, or provider secrets in session metadata.

## Error Model

### Internal machine-readable codes

Suggested identity-boundary codes:

```text
AUTHENTICATION_REQUIRED
FRESH_AUTH_REQUIRED
SESSION_MANAGEMENT_UNAVAILABLE
SESSION_NOT_FOUND
SESSION_NOT_OWNED
SESSION_ALREADY_REVOKED
SESSION_REVOKE_FAILED
CURRENT_SESSION_REQUIRED
```

These codes are for server/logs/tests. They must not all map 1:1 to distinct user-facing messages when doing so aids enumeration.

### Safe user-facing messages

Use short, actionable Russian copy similar to existing auth messages:

- unauthenticated → redirect to `/auth`;
- stale session on destructive action → "Подтвердите вход и повторите действие";
- revoke success → "Сессия завершена";
- bulk revoke success → "Выход на других устройствах выполнен";
- sign-out everywhere success → redirect to `/auth` with neutral confirmation;
- generic failure → "Не удалось выполнить действие. Попробуйте позже.";

Rules:

- do not reveal whether a guessed `sessionId` belongs to another account;
- do not expose Better Auth/internal error strings in UI;
- do not log session tokens, magic-link tokens, or raw cookies;
- map idempotent "already revoked/expired" cases to safe success or neutral completion copy.

## Race Conditions and Idempotency

Design for concurrent and delayed client actions:

| Scenario                                               | Expected behavior                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Target session already revoked                         | Treat as success; refresh list                                                            |
| Target session expired between list and revoke         | Treat as success; omit from refreshed list                                                |
| Two devices revoke same other session concurrently     | Idempotent success                                                                        |
| Current session disappears during bulk revoke          | Return unauthenticated result and redirect to `/auth`                                     |
| `revokeOtherSessions` while another device signs in    | New device may create a new session afterward; refreshed list reflects current truth only |
| `revokeOtherAccountSessions` with no other sessions    | Treat as successful idempotent no-op; refreshed list shows current session only           |
| `revokeSessions` while current request still finishing | Current session must end; client redirects to `/auth`                                     |

Implementation should prefer:

- server-side list refresh after every mutation;
- idempotent revoke semantics;
- no optimistic UI that assumes success before server confirmation.

## Test Strategy

Architecture-only in this wave; implementation must add the following coverage.

### Unit tests

- map Better Auth session record → `AccountSessionSummary`;
- strip token/secret fields from mapped output;
- user-agent → controlled `clientLabel` mapping with unknown fallback;
- current-session detection by `session.id` equality;
- fresh-auth policy helper for session-management mutations;
- ownership validation and foreign `sessionId` rejection;
- error-code → safe message mapping;
- idempotent revoke behavior for missing/expired targets.

### Integration tests

- authenticated user lists only own active sessions with a normal authenticated session;
- unauthenticated list/revoke rejected;
- stale session on destructive actions rejected with fresh-auth result; list remains available on normal authenticated session;
- revoke other session removes authentication for that session token;
- current session remains after `revokeOtherAccountSessions`;
- `revokeAllAccountSessions` removes current and other sessions;
- current-session sign-out still uses existing P6b path;
- no token appears in identity contract responses;
- Postgres runtime still does not auto-run DDL.

### E2E tests

Deterministic multi-context browser flows without arbitrary sleeps:

**Flow 1 — revoke other session**

```text
Context A login
→ Context B login
→ Context A opens /account/security/sessions
→ A sees current + other session rows
→ A revokes B
→ B loses authenticated access on protected route
→ A remains authenticated
```

**Flow 2 — sign out other sessions**

```text
Context A login
→ Context B login
→ A executes "sign out other sessions"
→ B unauthenticated
→ A still authenticated
```

**Flow 3 — sign out everywhere**

```text
Context A login
→ Context B login
→ A executes "sign out everywhere" with confirmation
→ A redirected to /auth
→ B unauthenticated
```

E2E should reuse existing auth fixtures patterns from P6b without exposing production-only secrets.

## Security Invariants

P6c must preserve at minimum:

1. Session token never becomes a UI management identifier.
2. Client never determines account ownership.
3. Session management is server-authoritative.
4. Users can manage only their own sessions.
5. Current session is determined only by validated server session identity.
6. Revocation takes effect server-side, not by cookie deletion alone.
7. No device fingerprinting.
8. No medical data in auth/session metadata.
9. No secrets/tokens in logs or UI.
10. Identity boundary remains `@diabetes-universe/identity`.
11. Timeline/P4 remain independent from auth session metadata.
12. P6c does not become sync architecture.

### Browser / UI delivery invariants

The browser and UI receive only sanitized `AccountSessionSummary` read models from server-side identity operations.

Never deliver to the browser:

- `session.token`;
- raw Better Auth session objects or other internal auth transport objects;
- raw `userId` / `accountId` values for authorization decisions;
- raw IP address;
- raw User-Agent strings.

Allowed:

- `sessionId` (= Better Auth `session.id`) as an opaque target identifier for revoke-one-other-session actions.

Forbidden interpretation:

- `sessionId` is not authorization proof;
- ownership is determined only from the server-side authenticated principal and server-side owned-session lookup.

## Future Boundaries

The following remain explicitly out of scope for P6c and require separate architecture approval:

- OAuth providers;
- MFA/TOTP;
- trusted devices;
- login anomaly detection;
- email/push security alerts;
- security activity timeline;
- account recovery redesign;
- delegated medical access;
- Timeline adoption / `ownerId`;
- cloud sync;
- backend medical APIs.

## Implementation Slices

Recommended implementation order after architecture approval:

### P6c-a — Identity contracts and mapping

- add `AccountSessionSummary` and session-management service methods;
- implement server-side owned-session read + sanitize for `listAccountSessions` (not `auth.api.listSessions()` as the public primitive);
- map Better Auth revoke APIs for destructive operations;
- strip secrets and add current-session detection;
- add user-agent presentation mapper;
- add fresh-auth guards for destructive session operations only;
- unit + integration tests without UI.

### P6c-b — Web sessions surface

- add `/account/security/sessions`;
- cross-link with existing `/account/security` passkey page;
- server actions for list/revoke bulk operations;
- confirmation UX for destructive actions;
- reuse current-session sign-out for current row.

### P6c-c — Browser verification

- multi-context Playwright coverage for revoke-other, revoke-others, sign-out-everywhere;
- regression for P6b passkey and magic-link flows;
- documentation closure only after runtime green.

No slice may introduce OAuth, Timeline changes, sync, or auth DDL auto-migration.

## Definition of Done

P6c architecture is approved with the following conditions satisfied:

1. P6b invariants remain intact.
2. Better Auth capability reuse is explicit and sufficient without a custom session protocol.
3. Session UI identifier, current-session detection, and revoke semantics are unambiguous.
4. Privacy rules forbid fingerprinting and raw IP/UA display.
5. Fresh-auth policy distinguishes view/revoke/current sign-out behavior, including approved Option B for session-list viewing.
6. Sign-out-everywhere scope is explicitly decided and safe.
7. Identity-boundary contracts and error model are defined.
8. Test strategy covers unit, integration, and multi-context E2E.
9. No Timeline/P4 ownership changes are introduced.
10. Documentation gate is green.

P6c implementation is complete only after a separate runtime PR passes the standard validation gate and post-merge verification. That runtime work is **not** part of this architecture wave.

## Open Questions

No blocking open questions remain.

Resolved for implementation:

- Session-list fresh-auth policy is **Option B**: normal authenticated session for viewing; fresh auth for destructive operations only; do not expose `auth.api.listSessions()` as the public identity primitive.

Non-blocking notes for implementation review:

- Final Russian UX copy for bulk destructive confirmations may be refined during implementation without changing authorization semantics.
- If Better Auth session list output changes between patch releases, the identity mapper must remain the only adaptation point.
- If product later requires IP visibility, that must be a separate privacy-reviewed decision; P6c UI omits IP by design.

## Governing References

- P5 — Identity, Account & Data Ownership Architecture
- P6 — Authentication & Session Implementation Architecture
- P6b — Passkey Enrollment & Sign-In (Feature Complete)
- ADR-0016 — Authentication Session Implementation
- ADR-0017 — Auth Runtime Implementation
- Better Auth 1.6 Session Management documentation

## Next Slice

P6c implementation closure:

- **P6c-a** — Accepted & Merged (PR #85)
- **P6c-b** — Accepted & Merged (PR #86)
- **P6c-c** — E2E / closure candidate (multi-context browser verification, stale-session fixture, regression gates)

After P6c feature-complete closure: evaluate the next approved identity wave separately. Do not begin OAuth, MFA, or sync merely because session management exists.
