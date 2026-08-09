# P5 — Identity, Account & Data Ownership Architecture

## Status

**Architecture Design — Proposed**

Date: 2026-08-09

## Purpose

Define the canonical identity, account, ownership, session, recovery, authorization, and local-data adoption model required before authentication implementation, backend persistence, API contracts, cloud sync, delegated access, and production security hardening.

P5 is a design wave. It does not implement an authentication vendor, login UI, backend database, cloud API, sync protocol, or Timeline schema mutation.

## Problem

P4 made Timeline data durable on a single Web browser profile, but durable local data is not yet attached to an authenticated product account.

The platform must eventually support:

- Web, iOS, and Android;
- account creation and sign-in;
- multiple authentication methods;
- secure sessions and recovery;
- explicit ownership of sensitive medical data;
- local-first creation before network availability;
- adoption of existing local data into an account;
- backend authorization and cloud sync;
- account deletion/export/retention;
- future caregiver and healthcare-professional access without confusing access with ownership.

If authentication implementation begins before these semantics are fixed, provider IDs, email addresses, tenant boundaries, or sync assumptions can leak into domain models and persistence contracts.

## Core Decision

Diabetes Universe separates four concepts:

```text
Product Person / Subject
        ≠
Product Account
        ≠
Authentication Identity
        ≠
Session
```

No external authentication provider identifier is a canonical Diabetes Universe product identity.

The platform uses stable internal opaque identifiers and maps external credentials/identities to those internal records through an adapter boundary.

## Identity Model

### 1. Account

`Account` is the security principal that can authenticate and own/access resources according to authorization policy.

Conceptual minimum:

```text
Account
- accountId: opaque stable internal ID
- status: active | restricted | pendingDeletion | deleted
- createdAt
- updatedAt
```

Exact API/database fields are deferred to the implementation/backend design.

Rules:

- `accountId` is generated and controlled by Diabetes Universe infrastructure;
- email, phone number, Apple subject, Google subject, passkey credential ID, or another provider key is not `accountId`;
- changing an email/provider must not change product identity;
- one account may later have multiple authentication identities/credentials;
- authentication identity lifecycle must not force medical-record identity changes.

### 2. Authentication Identity

An `AuthenticationIdentity` proves that an external or internal credential belongs to an account.

Conceptual relationship:

```text
Account 1 ── N AuthenticationIdentity
```

Examples may later include:

- passkey;
- email-based credential/recovery flow;
- Apple;
- Google;
- enterprise/clinical federation in future scopes.

P5 does not select which methods ship first.

Provider-specific subject IDs are credential mapping data, not domain ownership identifiers.

### 3. Person / Medical Subject

The person whose health data is represented must not be permanently conflated with the authentication account.

For the initial single-user product, one account will normally act on its own medical subject. However, future caregiver/HCP scenarios require the architecture to distinguish:

```text
who authenticated
from
whose medical data is being accessed
```

P5 therefore reserves a separate conceptual `subjectId`/medical-subject boundary for backend authorization design.

This does **not** require adding `subjectId` to current local Timeline events in P5.

### 4. Session

A `Session` represents authenticated continuity on a device/browser context.

Session identity is ephemeral security state and must never become medical-data ownership.

Sessions must support later:

- expiry/rotation;
- revocation;
- device/session listing;
- logout current session;
- logout other/all sessions;
- suspicious-session response;
- secure reauthentication for sensitive operations.

Exact token/cookie technology belongs to the Authentication/Session Implementation Design.

## Data Ownership Model

### Ownership Principle

Sensitive user medical data has explicit product-level ownership/subject association on the server once cloud/account functionality exists.

Server-side authorization is authoritative. A client-provided owner/subject value is never trusted merely because it is present in a payload.

### Local P4 Data Before Account Attachment

Current P4 IndexedDB data is local-profile data with no authenticated server owner.

It must be treated as:

**unattached local medical data**

not as:

- anonymous cloud account data;
- data owned by an email address;
- data owned by a browser-generated pseudo-user that silently becomes server identity.

This distinction prevents accidental account crossover.

## Local Data Adoption / Claim Model

When account functionality is later introduced, existing local medical data must not be silently attached to whichever account happens to sign in.

Required state transition:

```text
Unattached local data
        ↓
explicit adoption decision + authenticated account
        ↓
validated ownership attachment/import process
        ↓
account-associated local/cloud data
```

### Required Rules

1. Sign-in alone does not silently claim pre-existing local medical history.
2. If local history exists, the application must explicitly resolve whether it belongs to the authenticated account.
3. Adoption must be idempotent and recoverable.
4. Adoption must never duplicate Timeline records on retry.
5. Switching accounts must not expose another account's medical data.
6. Sign-out must not accidentally destroy durable local data unless an approved privacy policy explicitly requires removal and the user understands the effect.
7. Account deletion and local-device cleanup are separate operations with explicit policy.
8. Adoption/sync implementation waits for backend and sync ADRs.

The exact UX for adoption belongs to a later product/UX design, but silent attachment is architecturally forbidden.

## Authorization Model

P5 adopts **deny by default** and server-authoritative authorization.

Authorization decisions will later be expressed against at least:

```text
authenticated account
requested medical subject/resource
relationship/role
requested action
resource state
policy/consent state
```

### Initial Self-Service Principle

For the initial consumer experience, an authenticated account may access its own approved resources.

Future access by caregivers, clinicians, sellers, support staff, or administrators must be modeled as explicit delegated/role-based authorization, not by changing ownership.

### Ownership ≠ Access

A caregiver or clinician may receive access to a person's medical information without becoming the owner of that medical history.

This invariant is required before future HCP/caregiver work.

## Roles and Bounded Contexts

Do not create one global `role` field such as:

```text
user | doctor | seller | admin
```

and use it as the entire authorization model.

Different bounded contexts require different relationships and scopes:

- medical subject access;
- caregiver delegation;
- clinical organization membership;
- Marketplace seller permissions;
- internal operations/support permissions.

Authorization must remain resource- and context-aware.

## Authentication Architecture Boundary

P5 requires provider independence.

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

Product/domain code must not depend directly on a specific vendor SDK's user object as the canonical account model.

A provider can be replaced or supplemented without migrating medical ownership identifiers.

## Recovery Model

Account recovery is a first-class security architecture concern, not an afterthought to login.

Later implementation must define:

- recovery eligibility;
- verified recovery channels;
- credential reset/replacement;
- compromised-account response;
- session invalidation after sensitive recovery;
- rate limiting/abuse protection;
- auditable security events;
- safe handling when a user loses all authenticators.

Recovery must not depend on reconstructing ownership from local IndexedDB data.

## Account Lifecycle

Required conceptual lifecycle:

```text
created
→ active
→ restricted/suspended when required
→ pending deletion
→ deleted according to approved retention/legal policy
```

Deletion is not equivalent to immediate physical destruction of every record in every subsystem. Production implementation requires explicit retention, legal, backup, audit, and recovery policies.

The product must clearly distinguish:

- sign out;
- remove local data from this device;
- disconnect a credential/provider;
- delete account;
- delete specific medical records;
- export data.

These actions must not share one ambiguous control.

## Privacy / Consent Boundary

Authentication proves identity; it does not equal consent.

P5 establishes that consent/privacy state is separate from authentication/session state.

Future consent records must be purpose-specific and auditable where required. Revoking a consent must not be implemented as merely logging out.

## Security Invariants

Future implementation must preserve:

- server-authoritative authentication/authorization;
- stable internal opaque IDs;
- external provider IDs isolated from product/domain ownership;
- deny-by-default authorization;
- least privilege;
- secure session rotation/revocation;
- no PHI in URLs;
- no credential/token/PHI logging;
- CSRF/XSS/session fixation protections appropriate to the selected Web auth model;
- brute-force/rate-limit/abuse controls;
- reauthentication for high-risk operations where appropriate;
- secrets isolated from client bundles;
- audit events for security-sensitive account/session actions;
- no security claim based solely on possession of a browser's IndexedDB database.

## Local Storage and Account Isolation

Once multiple accounts are supported on one browser/device, the current single local Timeline namespace cannot simply be reused across accounts without an explicit partition/adoption design.

A later implementation ADR must define local account isolation, including:

- per-account local namespaces/partitions;
- unattached-local partition;
- account switching;
- sign-out behavior;
- stale local data;
- cleanup policy;
- migration from current P4 storage;
- no cross-account reads.

P5 intentionally does not mutate the P4 IndexedDB schema before that ADR exists.

## Timeline Domain Boundary

P5 does not approve adding authentication/account fields directly to `SemanticTimelineEvent`.

The medical event represents medical semantics. Ownership, tenancy, sync state, and server lifecycle may belong to resource envelopes/storage/sync records rather than the clinical payload itself.

A later backend/sync design must decide the exact envelope.

This keeps medical-domain semantics from becoming coupled to one account provider or one synchronization protocol.

## IDs

All canonical product/security identifiers must be:

- opaque;
- stable for their intended lifecycle;
- non-semantic;
- not derived from email/phone/name;
- safe for distributed creation only when the owning architecture requires it;
- treated independently from database internal row IDs where useful.

Exact UUID/ULID/other algorithms are deferred to implementation ADRs unless a cross-system requirement makes the choice architectural.

## Backend Implications

P5 requires later backend architecture to support explicit separation among:

```text
accounts
authentication identities / credentials
sessions
medical subjects
resource ownership/subject association
authorization relationships
security/audit events
```

These may map to different physical tables/services depending on the selected backend, but must not collapse into a provider user object.

## API Implications

Future APIs must derive the acting account from validated server session/auth context.

Clients must not be allowed to gain access by choosing an arbitrary `ownerId`/`subjectId` in request data.

Resource-scoped IDs in APIs are identifiers, not authorization evidence.

## Sync Implications

Sync architecture must be designed after identity/backend foundations because it needs:

- authenticated actor/session;
- authoritative subject/ownership resolution;
- idempotent mutation identity;
- revisions/conflict policy;
- deletion/tombstone policy;
- per-account/per-subject sync cursor semantics;
- revoked-access behavior;
- account switching/device isolation.

No sync metadata is added by P5.

## Marketplace Boundary

Marketplace identity may reuse the same account principal but commerce permissions/data remain a separate bounded context.

Seller status must not grant medical-data permissions. Medical-data ownership/access must not grant seller/admin permissions.

## AI Boundary

AI access to user data must later operate under the same authenticated subject/authorization boundaries as deterministic product features.

AI must not receive broader medical-data access merely because it is an internal service.

## Rejected Alternatives

### Email address as canonical user ID

Rejected. Email can change, be recycled, have verification/recovery complexity, and belongs to authentication/contact semantics rather than stable product identity.

### Authentication-provider user ID as canonical Diabetes Universe ID

Rejected. It creates vendor lock-in and makes provider linking/migration dangerous to medical ownership.

### Add `ownerId` to every current local event immediately

Rejected. There is no approved account attachment, local partition, backend authority, or migration model yet. A guessed field would create false semantics.

### Sign-in silently claims all existing IndexedDB data

Rejected. It can attach one person's medical history to another account on a shared or reused browser.

### One global role enum for all authorization

Rejected. Medical access, caregiver relationships, clinicians, Marketplace, and internal operations have different resource boundaries.

### Authentication first, ownership later

Rejected. This allows provider/session implementation choices to become accidental domain architecture.

## P5 Deliverables

P5 architecture is complete when the project has approved:

1. canonical account identity model;
2. authentication-identity separation;
3. medical subject/ownership boundary;
4. unattached local-data semantics;
5. local-data adoption guardrails;
6. session lifecycle requirements;
7. recovery requirements;
8. authorization principles;
9. account lifecycle/deletion/export boundaries;
10. local multi-account isolation requirements;
11. caregiver/HCP delegation invariant;
12. security/privacy invariants;
13. implementation ordering for Auth, Backend, API, and Sync.

## Explicit Non-Scope

P5 does not implement:

- authentication SDK/provider;
- login/register UI;
- passwords/passkeys/OAuth flows;
- backend service/database;
- session cookies/tokens;
- API endpoints;
- cloud persistence;
- outbox/sync/conflict resolution;
- Timeline `ownerId` migration;
- local multi-account IndexedDB migration;
- caregiver/HCP UI;
- Marketplace permissions;
- production consent/legal text;
- production encryption/key-management;
- production audit service.

## Recommended Next Design After P5 Approval

The next design wave should be **Authentication & Session Implementation Architecture**, selecting the concrete authentication approach only after P5 is approved.

Backend data architecture follows with the approved account/subject/ownership semantics as inputs rather than inventing them independently.

## Completion Gate

P5 may be marked Architecture Approved only when:

- the Post-P4 audit and this design agree;
- no P4/P3 invariant is contradicted;
- account identity is provider-independent;
- local data cannot silently cross account boundaries;
- ownership and delegated access are distinct;
- authentication and consent are distinct;
- server authority is explicit;
- no premature Timeline/sync schema fields are introduced;
- future Web/iOS/Android compatibility is preserved;
- documentation/CI checks are green.

Implementation must not begin before this gate is approved.

## Governing References

- ADR-0014 — Local-First Medical Event Persistence Architecture
- ADR-0015 — Web IndexedDB Timeline Persistence Implementation
- Post-P4 Platform State Audit
- P4 — Durable Local Persistence Feature Complete Record
