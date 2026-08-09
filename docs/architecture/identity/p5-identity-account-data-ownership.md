# P5 — Identity, Account & Data Ownership Architecture

## Status

**Architecture Approved**

Date: 2026-08-09

## Purpose

Define the canonical identity, account, ownership, session, recovery, authorization, and local-data adoption model required before authentication implementation, backend persistence, API contracts, cloud sync, delegated access, and production security hardening.

P5 is an architecture wave. It does not implement an authentication vendor, login UI, backend database, cloud API, sync protocol, or Timeline schema mutation.

## Core Decision

Diabetes Universe separates four concepts:

```text
Medical Subject / Person
        ≠
Product Account
        ≠
Authentication Identity
        ≠
Session
```

No external authentication-provider identifier is a canonical Diabetes Universe product identity.

The platform uses stable internal opaque identifiers and maps external credentials/identities to those internal records through an adapter boundary.

## 1. Product Account

`Account` is the product security principal that can authenticate and act on resources according to authorization policy.

Conceptual minimum:

```text
Account
- accountId: opaque stable internal ID
- status: active | restricted | pendingDeletion | deleted
- createdAt
- updatedAt
```

Rules:

- `accountId` is controlled by Diabetes Universe infrastructure;
- email, phone, Apple/Google subject, passkey credential ID, or another provider key is not `accountId`;
- changing authentication method must not change product identity;
- one account may later have multiple authentication identities/credentials;
- credential lifecycle must not require rewriting medical ownership identifiers.

Exact persistence/API fields are deferred to later implementation/backend design.

## 2. Authentication Identity

An `AuthenticationIdentity` proves that a credential/provider identity is linked to an account.

```text
Account 1 ── N AuthenticationIdentity
```

Potential methods may later include passkeys, email-based flows, Apple, Google, or clinical/enterprise federation. P5 does not select the shipping provider or method.

Provider-specific subject IDs are credential mapping data, not domain ownership identifiers.

## 3. Medical Subject

The person whose health data is represented is conceptually distinct from the authenticated account.

The initial consumer product will normally have one account acting on its own medical subject, but future caregiver/HCP scenarios require the platform to distinguish:

```text
who authenticated
from
whose medical data is being accessed
```

A conceptual `subjectId` boundary is therefore reserved for backend/authorization architecture.

P5 does **not** add `subjectId` to current local `SemanticTimelineEvent` records.

## 4. Session

A session represents authenticated continuity on a browser/device context. Session identity is ephemeral security state and never medical-data ownership.

Later implementation must support expiry/rotation, revocation, current/all-session logout, device/session listing, suspicious-session response, and reauthentication for sensitive operations where appropriate.

Cookie/token/session technology belongs to the Authentication & Session Implementation Architecture.

## Data Ownership

Sensitive medical data must have explicit product-level subject/ownership association once server/cloud functionality exists.

Server-side authorization is authoritative. A client-provided owner/subject identifier is never authorization evidence.

### Current P4 Local Data

Current IndexedDB medical history has no authenticated server owner. Its state is:

**unattached local medical data**

It is not anonymous cloud data, not email-owned data, and not data owned by a browser-generated pseudo-user.

## Local Data Adoption

Existing local medical data must never be silently attached to whichever account signs in.

Required conceptual transition:

```text
Unattached local data
        ↓
explicit adoption decision + authenticated account
        ↓
validated idempotent attachment/import
        ↓
account-associated local/cloud data
```

Required invariants:

1. Sign-in alone never silently claims existing local medical history.
2. Existing local history requires an explicit ownership/adoption resolution.
3. Adoption must be idempotent and recoverable.
4. Retry must not duplicate Timeline records.
5. Account switching must never expose another account's medical data.
6. Sign-out must not silently destroy durable local data.
7. Account deletion and local-device cleanup are distinct operations.
8. The concrete adoption/sync mechanism waits for backend and sync ADRs.

## Authorization

P5 adopts **deny by default**, **least privilege**, and **server-authoritative authorization**.

Future authorization decisions must consider at least:

```text
authenticated account
requested subject/resource
relationship/role
requested action
resource state
policy/consent state
```

### Ownership ≠ Access

Caregivers and clinicians may later receive delegated access without becoming owners of the person's medical history.

### No Global Role Shortcut

Do not use one global enum such as `user | doctor | seller | admin` as the entire authorization model.

Medical access, caregiver delegation, clinical organization membership, Marketplace permissions, and internal operations are separate bounded contexts with different resource scopes.

## Authentication Provider Boundary

Target layering:

```text
Product / Application
        ↓
Identity & Session Application Boundary
        ↓
Authentication Provider Adapter
        ↓
Selected provider / credential technology
```

Product/domain code must not use a vendor SDK user object as the canonical account model.

This preserves provider replacement/linking and prevents vendor IDs from becoming medical ownership keys.

## Recovery

Account recovery is a first-class security concern. Later implementation must define verified recovery channels, credential replacement, compromised-account response, session invalidation, abuse/rate limiting, auditable security events, and the case where all authenticators are lost.

Recovery must never reconstruct ownership from possession of local IndexedDB data.

## Account Lifecycle

Conceptual lifecycle:

```text
created
→ active
→ restricted/suspended when required
→ pending deletion
→ deleted according to approved retention/legal policy
```

The product must keep these actions distinct:

- sign out;
- remove local data from this device;
- disconnect a credential/provider;
- delete account;
- delete medical records;
- export data.

One ambiguous destructive action must not represent multiple lifecycle operations.

## Authentication ≠ Consent

Authentication proves identity; it does not constitute consent.

Consent/privacy state is separate from session/authentication state. Future consent records must be purpose-specific and auditable where required.

## Security Invariants

Future implementation must preserve:

- stable opaque internal product IDs;
- provider IDs isolated from ownership/domain identity;
- server-authoritative authentication and authorization;
- deny-by-default and least privilege;
- session rotation/revocation;
- no PHI, credentials, or tokens in URLs/telemetry/logs;
- CSRF/XSS/session-fixation protections appropriate to the selected Web model;
- brute-force/rate-limit/abuse controls;
- secrets excluded from client bundles;
- audit events for security-sensitive account/session operations;
- no security claim based solely on possession of browser IndexedDB.

## Local Multi-Account Isolation

When multiple accounts become available on one browser/device, the current single Timeline namespace cannot be shared implicitly.

A later implementation ADR must define:

- unattached-local partition;
- per-account local namespace/partition;
- account switching;
- sign-out behavior;
- stale local data;
- cleanup policy;
- migration from current P4 storage;
- prevention of all cross-account reads.

P5 intentionally does not mutate the P4 IndexedDB schema before this design exists.

## Timeline Domain Boundary

P5 does not approve adding account/provider/session fields directly to `SemanticTimelineEvent`.

Medical-event semantics remain separate from ownership, tenancy, sync state, and server lifecycle. A later backend/sync design decides whether those concerns belong in resource envelopes, persistence records, or synchronization metadata.

Do not add `ownerId`, provider IDs, email addresses, session IDs, server revisions, or tombstones to current Timeline events merely to appear future-ready.

## Backend Implications

Backend architecture must preserve explicit separation among:

```text
accounts
authentication identities / credentials
sessions
medical subjects
resource subject/ownership association
authorization relationships
security/audit events
```

These concepts must not collapse into an authentication-provider user object.

## API Implications

Future APIs derive the acting account from validated server auth/session context.

A client cannot gain access by choosing an arbitrary `ownerId` or `subjectId` in a request. Resource IDs identify resources; they do not authorize access.

## Sync Implications

Sync is designed only after identity/backend foundations because it needs authenticated actor context, authoritative subject resolution, mutation identity, revisions, conflicts, tombstones, sync cursors, revoked-access behavior, and account/device isolation.

P5 adds no sync metadata.

## Marketplace and AI Boundaries

Marketplace may reuse the same account principal, but commerce permissions remain separate from medical-data permissions.

AI must operate under the same authenticated subject/authorization boundaries as deterministic product features and never receive broader medical-data access merely because it is an internal service.

## Rejected Alternatives

- **Email as canonical user ID** — mutable/recoverable contact identity is not stable product identity.
- **Auth-provider user ID as canonical Diabetes Universe ID** — creates vendor lock-in and dangerous medical ownership coupling.
- **Add `ownerId` to every local event now** — there is no approved account attachment/local partition/backend authority yet.
- **Sign-in silently claims existing IndexedDB data** — can attach one person's medical history to another account.
- **One global role enum** — insufficient for medical, caregiver, clinical, Marketplace, and internal authorization contexts.
- **Authentication implementation before ownership design** — lets provider/session choices become accidental domain architecture.

## Explicit Non-Scope

P5 does not implement:

- authentication SDK/provider;
- login/register UI;
- password/passkey/OAuth flows;
- backend service/database;
- session cookies/tokens;
- API endpoints;
- cloud persistence;
- outbox/sync/conflict resolution;
- Timeline ownership migration;
- local multi-account IndexedDB migration;
- caregiver/HCP UI;
- Marketplace authorization;
- production legal/consent copy;
- production encryption/key management;
- production audit service.

## Architecture Approval Gate

P5 is approved because:

- the Post-P4 audit and P5 design agree;
- no P3/P4 invariant is contradicted;
- account identity is provider-independent;
- local data cannot silently cross account boundaries;
- ownership and delegated access are distinct;
- authentication and consent are distinct;
- server authority is explicit;
- no premature Timeline/sync schema fields are introduced;
- Web/iOS/Android compatibility is preserved;
- repository CI and Vercel validation are green on the approval PR.

## Next Wave

The next wave is **Authentication & Session Implementation Architecture**.

It must select the concrete authentication/session approach while preserving this P5 model. Backend data architecture follows with approved account/subject/ownership semantics as inputs rather than inventing them independently.

Implementation of authentication must not begin before that next design/ADR is approved.

## Governing References

- ADR-0014 — Local-First Medical Event Persistence Architecture
- ADR-0015 — Web IndexedDB Timeline Persistence Implementation
- Post-P4 Platform State Audit
- P4 — Durable Local Persistence Feature Complete Record
