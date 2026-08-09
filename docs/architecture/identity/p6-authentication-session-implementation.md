# P6 — Authentication & Session Implementation Architecture

## Status

**Architecture Design — Proposed**

Date: 2026-08-09

## Purpose

Define the concrete authentication and session architecture for Diabetes Universe after P5 approved the separation of Product Account, Authentication Identity, Medical Subject, and Session.

P6 chooses the first implementation direction for Web while preserving future iOS/Android support and avoiding coupling medical-domain ownership to an authentication vendor.

P6 is still a design wave. It does not add login pages, install an auth SDK, create a production database, send email, or attach current P4 Timeline data to an account.

## Governing P5 Invariants

P6 must preserve:

- Product Account ≠ Authentication Identity ≠ Medical Subject ≠ Session;
- provider user IDs are not canonical Diabetes Universe account IDs;
- current IndexedDB Timeline data remains unattached local medical data until an explicit adoption flow exists;
- sign-in alone never silently claims local medical data;
- server-side authorization is authoritative;
- authentication is not consent;
- SemanticTimelineEvent does not gain auth/session/provider fields in P6;
- ownership and delegated access remain distinct.

## Decision Summary

The first authentication implementation will be **passwordless-first**.

Initial methods:

1. **Email magic link** — bootstrap/fallback authentication and recovery channel.
2. **Passkey (WebAuthn)** — preferred repeat sign-in method after enrollment.

Deferred but compatible methods:

- Sign in with Apple;
- Sign in with Google;
- additional enterprise/clinical federation in future scopes.

Traditional password authentication is **not part of the first implementation slice**.

The authentication library selected for the initial implementation is **Better Auth**, isolated behind a Diabetes Universe identity/session adapter boundary.

Sessions are **database-backed server sessions**. The browser receives only a secure session cookie; client-side JavaScript must not own long-lived bearer credentials for normal Web application access.

## Why Passwordless-First

The first release does not need to create password storage, password-strength UX, password reset, credential-stuffing exposure, or password-specific recovery policy merely to establish secure account access.

Email magic link gives a broadly available bootstrap/recovery path. Passkeys provide a stronger repeat-authentication path based on WebAuthn public-key credentials.

This design intentionally does not make email the canonical account identity. Email is an AuthenticationIdentity/contact/recovery attribute mapped to the internal account.

## Authentication Library Boundary

Target layering:

```text
Web UI / Server Actions / Route Handlers
            ↓
Diabetes Universe Identity & Session Application Boundary
            ↓
Auth Provider Adapter
            ↓
Better Auth
            ↓
Auth persistence + email/passkey integrations
```

Product code must consume Diabetes Universe-owned contracts such as conceptual:

```text
AuthenticatedPrincipal
SessionSummary
AuthenticationMethod
ReauthenticationRequirement
```

It must not spread Better Auth `user`, `session`, provider account, or plugin-specific structures through product/domain packages.

A later replacement or augmentation of Better Auth must not require migration of canonical medical ownership identifiers.

## Account Identity Mapping

P5 remains authoritative:

```text
Diabetes Universe accountId
        1
        ↓
        N
AuthenticationIdentity
```

Better Auth's internal user identifier may be used as an implementation mapping key only if an implementation ADR explicitly maps it to the canonical Diabetes Universe account record. Product code must not assume that a vendor/library-generated identifier is the medical owner identifier merely because both currently have a one-to-one relationship.

## Initial Authentication Journeys

### Journey A — First account access with email

```text
Enter email
→ request magic link
→ generic confirmation response
→ user opens one-time link
→ server verifies token
→ canonical account resolved/created
→ server session created
→ local-data adoption gate evaluated separately
→ application entry
```

Security rules:

- response must not reveal whether an email already has an account;
- verification token is single-use and short-lived;
- token storage must not use plaintext when a hashed storage mode is available;
- callback/redirect targets must be allow-listed and never accept arbitrary external URLs;
- successful verification establishes authentication only, not ownership of existing local medical data.

### Journey B — Enroll passkey

After a sufficiently fresh authenticated session:

```text
Account security
→ Add passkey
→ WebAuthn registration ceremony
→ server verifies challenge/credential
→ credential mapped to current account
→ user sees passkey in security settings
```

Passkey enrollment requires recent/fresh authentication.

### Journey C — Sign in with passkey

```text
Sign in
→ Use passkey
→ WebAuthn authentication ceremony
→ server verifies credential
→ canonical account resolved
→ new server session created
→ application entry
```

### Journey D — Fallback/recovery

If passkey is unavailable:

```text
Use email instead
→ magic link authentication
→ fresh session
→ user can inspect/revoke old passkeys and enroll a replacement
```

Recovery must never reconstruct account ownership from browser IndexedDB data.

## Session Architecture

### Database-backed sessions

P6 chooses database-backed sessions rather than a permanently stateless self-contained session as the default Web architecture.

Reasons:

- active-device/session listing is a P5 requirement;
- individual session revocation is required;
- logout-all is required;
- compromised-session response is required;
- sensitive operations need session freshness/reauthentication;
- future audit/security controls need stable session identity.

Conceptual session record:

```text
Session
- sessionId
- accountId
- createdAt
- expiresAt
- lastSeenAt (implementation policy)
- revokedAt? / status
- authentication assurance/freshness metadata
- device display metadata (privacy-minimized)
```

Exact schema belongs to the implementation/database ADR.

## Web Session Cookie

The normal Web browser session is represented by an opaque/random session credential in a cookie controlled by the server/auth library.

Required cookie properties in production:

- HttpOnly;
- Secure;
- SameSite policy appropriate to the selected OAuth/magic-link flows;
- Path scoped intentionally;
- production domain scoped intentionally;
- no PHI, email, role list, or medical subject data encoded in the cookie;
- no localStorage/sessionStorage copy of the auth credential.

Client UI may cache non-sensitive presentation state, but authorization never trusts client state.

## Session Lifetime Policy

Exact durations are implementation configuration, not permanent product constants, but P6 requires two concepts:

1. **session lifetime** — bounded authenticated continuity;
2. **fresh-auth window** — shorter period used for sensitive account/security actions.

Sensitive operations requiring fresh authentication should include at least:

- add/remove passkey;
- change primary/recovery email;
- revoke other sessions;
- begin account deletion;
- future export of sensitive medical data;
- future changes to delegated medical access.

A stale but otherwise valid session should trigger reauthentication rather than silently perform these operations.

## Logout / Revocation

Required operations:

- sign out current session;
- list active sessions;
- revoke one other session;
- revoke all other sessions;
- revoke all sessions during compromised-account recovery when policy requires it.

Removing a cookie without revoking its server session is not sufficient for security-sensitive revocation flows.

## Route and Data Protection

Next.js route redirection/proxy checks may provide optimistic UX routing only.

They are not the authorization boundary.

Secure access must be verified server-side close to the data/application action through a centralized Identity/Authorization Data Access Layer.

Conceptual flow:

```text
request/action
→ resolve validated session
→ resolve canonical account/principal
→ authorization check
→ data operation
```

A hidden button or protected layout is never authorization evidence.

## CSRF / XSS / Redirect Safety

Implementation must preserve:

- HttpOnly server cookie sessions;
- CSRF protection appropriate to cookie-authenticated state-changing requests;
- strict callback/redirect allow-listing;
- no arbitrary `returnTo` external redirect;
- no auth tokens in application logs;
- no PHI in URLs;
- no provider secrets in browser bundles;
- security headers/CSP work remains part of production hardening but auth implementation must not obstruct it.

## Email Delivery Boundary

Better Auth is not the email delivery provider.

Email delivery remains behind a separate application/infrastructure boundary so transactional email vendors can be changed without changing account identity.

Magic-link email requirements:

- generic request response to reduce account enumeration;
- rate limiting by relevant signals;
- short expiry;
- single-use verification;
- hashed verification token storage where supported;
- localized templates later through approved localization infrastructure;
- no medical information in authentication emails.

The concrete email delivery vendor is deferred to implementation ADR/configuration.

## Passkey / WebAuthn Boundary

Passkeys are scoped to the production WebAuthn relying-party identity and allowed origins.

The production RP ID must be chosen deliberately before real user enrollment because changing it can invalidate existing passkey usability.

Initial architecture must support:

- platform and cross-platform authenticators;
- discoverable/passkey sign-in where supported;
- multiple passkeys per account;
- list/rename/remove UX;
- recovery path when all passkeys are lost;
- user-verification policy appropriate to production security review.

Passkeys are an AuthenticationIdentity/credential, never the Product Account itself.

## Apple / Google

Apple and Google remain approved future authentication identities behind the same adapter boundary.

They are not required for the first slice because adding multiple providers before the canonical account-linking, recovery, and duplicate-identity rules are implemented increases account-merge risk.

When introduced, provider linking must require authenticated/fresh context or another explicitly approved safe account-linking ceremony. Matching accounts solely by an unverified client-provided email is forbidden.

## Local P4 Data After Sign-In

P6 does not implement data adoption.

The required UI/runtime state after authentication is conceptually:

```text
Authenticated account
+
unattached local Timeline exists?
        ↓
YES → adoption decision required before cloud ownership/sync
NO  → normal account application state
```

Until the adoption architecture is implemented, auth work must not mutate current IndexedDB Timeline ownership semantics.

## Multi-Account Browser Safety

P6 authentication implementation must not expose one signed-in account's future account-bound local data to another account.

However, the physical IndexedDB partition migration is deferred to its dedicated adoption/local-account-isolation implementation ADR.

Therefore the first auth slice must not pretend that current P4 storage is already account-scoped.

## Mobile Compatibility

The identity architecture must remain usable by iOS/Android.

Shared concepts:

- canonical account;
- authentication identities;
- server session/device session;
- passkeys;
- provider linking;
- recovery;
- authorization.

Platform-specific session transport may differ. The Web HttpOnly cookie choice is a Web adapter concern and must not become the cross-platform domain contract.

## Observability / Audit Requirements

No PHI or authentication secrets may be emitted to logs.

Security events to become auditable in later implementation include:

- authentication success/failure category;
- passkey added/removed;
- authentication identity linked/unlinked;
- session created/revoked;
- recovery/security-sensitive account action;
- account deletion initiation/cancellation/completion.

Logs must avoid raw magic-link tokens, session tokens, WebAuthn challenges, provider tokens, and medical payloads.

## Selected Initial Technology Direction

### Better Auth

Approved as the first implementation library, subject to the adapter boundary and implementation ADR.

Required capabilities for our chosen use:

- database-backed user/account/session persistence;
- session list/revoke operations;
- magic-link authentication plugin;
- passkey/WebAuthn plugin;
- social-provider extensibility for later Apple/Google;
- server-side Next.js integration.

### Rejected for first implementation: custom auth stack

Writing credential verification, token issuance, WebAuthn ceremonies, session rotation/revocation, and provider linking directly in application code creates unnecessary security risk and maintenance burden.

### Rejected for first implementation: stateless-only long-lived Web sessions

Stateless-only sessions make central revocation/device-session management and compromised-account response weaker or more complicated than the P5 product requires.

### Rejected for first implementation: password-first

Passwords add password storage, reset, strength, breach/credential-stuffing, and recovery complexity without providing a necessary capability for the first product slice.

### Rejected: auth-provider identity as medical owner identity

This violates P5 and creates vendor lock-in plus account-linking risk.

## Implementation Ordering

After P6 approval, implementation should proceed as one vertical slice:

```text
P6 Architecture Approved
→ P6 Implementation ADR
→ minimal auth persistence/database foundation
→ Better Auth adapter boundary
→ email magic-link flow
→ database-backed session flow
→ Sign in / Check email / Auth error UI
→ Passkey enrollment/sign-in
→ Security / Sessions screen
→ protected application entry
→ browser E2E
→ architecture/security audit
→ merge
```

Google/Apple are a later small wave after the core account-linking and recovery behavior is proven.

Local Timeline adoption/account isolation remains a subsequent dedicated wave and must not be smuggled into this implementation.

## First Visible UI Deliverables

This is the wave after which the product gains real account-facing pages users can try in Vercel:

- Sign in / Create account entry;
- Check your email state;
- Authentication error/retry state;
- Passkey sign-in action where supported;
- Account Security screen;
- Passkeys list/add/remove;
- Active Sessions list/revoke;
- Sign out;
- protected transition into the existing Dashboard/Timeline application.

These screens use the existing design system, localization foundation, accessibility standards, and responsive Web architecture.

## Explicit Non-Scope

P6 does not yet implement:

- production auth runtime;
- auth database migration;
- email vendor;
- Google/Apple setup;
- local Timeline adoption;
- multi-account IndexedDB partition migration;
- backend medical-data persistence;
- cloud sync/outbox/conflicts;
- caregiver/HCP authorization;
- Marketplace permissions;
- production consent/legal copy;
- full security/compliance certification.

## Completion Gate

P6 Architecture may be approved only when:

1. P5 invariants remain intact.
2. Initial auth methods are explicit.
3. Session model supports listing/revocation/fresh authentication.
4. provider/library objects do not become domain identity.
5. Web cookie/session security boundary is explicit.
6. route protection is not confused with server authorization.
7. local P4 data is not silently attached during sign-in.
8. mobile compatibility is preserved.
9. implementation ordering is explicit.
10. CI/Vercel documentation gate is green.

Implementation begins only after this architecture and a concrete implementation ADR are approved.

## Governing References

- P5 — Identity, Account & Data Ownership Architecture
- ADR-0014 — Local-First Medical Event Persistence Architecture
- P4 — Durable Local Persistence Feature Complete
