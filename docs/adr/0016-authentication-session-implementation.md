# ADR-0016 — Authentication & Session Implementation

## Status

Proposed

## Context

P5 established that Product Account, Authentication Identity, Medical Subject, and Session are separate concepts. P4 durable local Timeline data is not yet attached to an authenticated server owner.

The project now needs a concrete Web authentication/session direction before account-facing UI and production-capable auth runtime are implemented.

## Decision

Diabetes Universe will use a passwordless-first authentication approach for the initial Web implementation:

- email magic link for bootstrap/fallback/recovery;
- passkeys/WebAuthn as the preferred repeat sign-in method;
- database-backed server sessions;
- secure HttpOnly Web session cookies;
- Better Auth as the initial authentication library behind a Diabetes Universe-owned adapter boundary.

Google and Apple authentication remain compatible future authentication identities but are not required in the first implementation slice.

Traditional passwords are not part of the first slice.

## Session Decision

Sessions are server-revocable records rather than permanently stateless long-lived client claims.

This enables:

- active session/device listing;
- individual and global revocation;
- compromised-account response;
- fresh-auth checks for sensitive account/security actions;
- future security audit correlation.

The Web cookie must not contain PHI, medical-subject data, email, or authorization role sets and must not be copied to localStorage/sessionStorage.

## Identity Boundary

Better Auth records and provider identifiers are infrastructure concerns.

Product/domain code consumes internal Diabetes Universe identity/session contracts. Authentication-provider identifiers never become canonical medical ownership identifiers.

## Local Data Boundary

Authentication does not claim existing P4 IndexedDB Timeline data.

Existing local data remains unattached until a later explicit adoption/account-isolation architecture is approved and implemented.

## Security Boundary

Route/proxy checks are optimistic UX controls only. Secure authorization occurs server-side near data/application actions after validating the server session and canonical principal.

Magic-link tokens must be short-lived and single-use, redirect targets must be allow-listed, authentication responses must avoid account enumeration, and tokens/secrets/PHI must not be logged.

Passkey enrollment requires a sufficiently fresh authenticated session. Production WebAuthn RP ID/origins must be deliberately fixed before real-user passkey enrollment.

## Consequences

Positive:

- no password storage/reset/credential-stuffing surface in the first slice;
- passkey support provides a phishing-resistant preferred path;
- database sessions satisfy P5 device/session management requirements;
- Better Auth reduces custom security-sensitive code;
- adapter boundary preserves vendor/library independence;
- architecture remains compatible with Web, iOS, Android, Google, and Apple.

Costs:

- real auth implementation now requires minimal server-side auth persistence/database infrastructure;
- email delivery infrastructure is required for magic-link bootstrap/recovery;
- passkey production configuration requires stable RP ID/origin decisions;
- account linking and recovery require explicit testing and policy.

## Rejected Alternatives

- custom authentication/session implementation;
- auth-provider user ID as canonical Diabetes Universe account/medical owner ID;
- password-first authentication;
- stateless-only long-lived Web sessions;
- silently attaching existing local Timeline data on sign-in;
- implementing Google/Apple before the core account/session/recovery flow is stable.

## Implementation Gate

Implementation requires a follow-up implementation ADR covering at least:

- auth persistence/database adapter;
- exact Better Auth package/version and configuration;
- email delivery provider and token-storage policy;
- session lifetime/freshness configuration;
- production cookie names/domains/options;
- WebAuthn RP ID/origins;
- environment/secrets handling;
- route layout/protection integration;
- application adapter contracts;
- migration/deployment/rollback strategy;
- E2E/security regression plan.

## Date

2026-08-09
