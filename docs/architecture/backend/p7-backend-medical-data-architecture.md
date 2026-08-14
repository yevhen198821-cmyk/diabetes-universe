# P7 — Backend Medical Data Architecture

## Status

**Architecture Design — Draft**

Date: 2026-08-14

## Purpose

Define the backend data architecture that follows the completed P5 identity/ownership model and P6 authentication/session foundation.

P7 answers how Diabetes Universe will persist and authorize medical data on the server without collapsing authentication identity, product account identity, medical subject identity, local persistence, and synchronization into one model.

This is an architecture wave only. It does **not** implement API routes, cloud synchronization, a production medical database schema, local-data adoption, mobile storage, OAuth, MFA, caregiver access, or clinician access.

## Baseline entering P7

The following foundations are already accepted:

- P3 Semantic Timeline Event Model — Feature Complete;
- P4 Durable Local Persistence — Feature Complete;
- P5 Identity, Account & Data Ownership Architecture — Approved;
- P6 authentication/session implementation — delivered;
- P6a magic-link authentication — Feature Complete;
- P6b passkey enrollment/sign-in/current-session sign-out — Feature Complete;
- P6c active-session management and remote revocation — Feature Complete.

The current Web Timeline remains local-first and durable in IndexedDB behind `TimelineRepository`.

Authentication proves the acting account. It does not by itself establish ownership of existing local medical history.

## Core architecture decision

Backend medical persistence must use a **resource-envelope model** rather than adding account, authentication, synchronization, or server-lifecycle fields directly to `SemanticTimelineEvent`.

Conceptually:

```text
MedicalEventResource
├─ resourceId
├─ subjectId
├─ semanticEvent
├─ lifecycle metadata
├─ revision metadata
└─ audit metadata
```

`SemanticTimelineEvent` remains the medical-domain payload.

Ownership, authorization, tenancy, revision state, deletion state, and synchronization metadata belong to infrastructure/resource envelopes around the semantic event.

## Identity and subject separation

P7 preserves the P5 separation:

```text
Authenticated Account
        ≠
Medical Subject
        ≠
Authentication Identity
        ≠
Session
```

The backend derives the acting `accountId` from the validated server session.

The medical resource is scoped to a `subjectId` resolved by server-side authorization policy.

A client-supplied `accountId`, `ownerId`, or `subjectId` is never authorization proof.

## Why subject-centric storage

### Option A — Account owns every medical record

Rejected.

Pros:

- simple consumer-only schema;
- fewer identifiers initially.

Cons:

- breaks caregiver and clinician access models;
- couples health data permanently to a login principal;
- makes account replacement/merging/delegation dangerous;
- confuses ownership with authorization.

### Option B — Authentication provider user owns every record

Rejected.

This would make Better Auth/provider identity part of the medical-domain ownership model and create vendor coupling.

### Option C — Medical subject owns resources; accounts receive authorized relationships

**Selected.**

This gives the platform a durable model for:

- self-management;
- future caregivers;
- future clinicians;
- account recovery or credential changes;
- delegated access without ownership transfer;
- explicit consent/policy expansion later.

## Initial consumer relationship

The first production consumer slice may use one authenticated account mapped to one medical subject through an explicit server-side relationship.

Conceptually:

```text
AccountSubjectRelationship
- relationshipId
- accountId
- subjectId
- relationshipType: self
- status: active | revoked
- createdAt
- updatedAt
```

Future relationship types such as caregiver or clinician require separate architecture approval and must not be enabled implicitly by this model.

## Canonical backend resource envelope

Conceptual minimum:

```text
MedicalEventResource
- resourceId: opaque stable server ID
- subjectId: canonical medical-subject ID
- semanticEvent: SemanticTimelineEvent
- lifecycleState: active | deleted
- revision: monotonic server revision or equivalent opaque version
- createdAt: server timestamp
- updatedAt: server timestamp
- deletedAt: timestamp | null
- createdByAccountId: audit actor reference
- updatedByAccountId: audit actor reference
```

Important boundaries:

- `resourceId` is not the same thing as local Timeline event identity unless a later sync ADR explicitly defines that mapping;
- `subjectId` is server-authoritative;
- actor account IDs are audit metadata, not medical ownership;
- semantic event data does not carry authentication/session/provider IDs;
- deletion is a lifecycle state; exact tombstone semantics belong to the later sync architecture.

## Database bounded contexts

P7 recommends **logical separation** between identity/auth persistence and medical persistence.

Initial physical deployment may use the same managed PostgreSQL platform if operationally justified, but medical tables must not be coupled to Better Auth tables through application-level shortcuts.

Target conceptual boundaries:

```text
Identity/Auth
- accounts
- authentication identities
- sessions
- passkeys / credentials

Medical Subject & Authorization
- medical_subjects
- account_subject_relationships

Medical Data
- medical_event_resources

Security/Audit
- security_audit_events
- medical_access_audit_events (when required)
```

Better Auth's `user` or `session` table must never become the parent table for medical records.

## PostgreSQL decision

### Option A — Separate database technology for medical data immediately

Not selected for the first backend slice.

It increases operational complexity before scale or workload evidence requires it.

### Option B — PostgreSQL behind a dedicated medical repository/service boundary

**Recommended for the first production backend.**

Reasons:

- transactional integrity;
- mature indexing and backup tooling;
- strong constraints;
- reliable migration tooling;
- straightforward managed scaling;
- consistent operations with current infrastructure experience;
- does not prevent later partitioning, replicas, archival, or service extraction.

The architecture must permit later database separation without changing product/domain contracts.

## Service boundary

Web, iOS, and Android clients must not connect directly to the medical database.

Target layering:

```text
Client / Web Server Actions
        ↓
Application/API boundary
        ↓
Medical Data Application Service
        ↓
Authorization / Subject Resolution
        ↓
Medical Repository
        ↓
PostgreSQL
```

No browser-side Neon/PostgreSQL access.

No medical repository credentials in client bundles.

## Authorization flow

Every medical read/write request follows this order:

```text
request
→ validate authenticated session
→ resolve canonical accountId
→ resolve authorized subject relationship
→ validate requested operation
→ load/mutate subject-scoped resource
→ write audit metadata where required
→ return sanitized application contract
```

Hard rules:

1. resource IDs identify resources; they do not authorize access;
2. `subjectId` supplied by a client is a selector only and must be re-authorized server-side;
3. repository operations must always be subject-scoped or receive an authorization-scoped context;
4. cross-subject reads fail closed;
5. server actions/routes cannot bypass the application authorization layer merely because they are server-side;
6. AI services receive no broader medical access than the calling authorized application context.

## Repository architecture

The existing local `TimelineRepository` is a client/local persistence boundary and must not silently become a remote network repository with different failure semantics.

P7 recommends a separate server-side contract, conceptually:

```text
MedicalEventRepository
- getById(subjectId, resourceId)
- list(subjectId, query)
- create(subjectId, mutation)
- update(subjectId, resourceId, expectedRevision, mutation)
- delete(subjectId, resourceId, expectedRevision)
```

The exact API is deferred to the API architecture wave.

Key property: every repository operation is subject-scoped.

## Concurrency and revisions

Cloud medical persistence requires explicit optimistic concurrency.

P7 requires every mutable server resource to have an authoritative revision/version.

A future mutation contract must support an expected revision or equivalent precondition so one client cannot silently overwrite a newer server version.

P7 does not yet define conflict-resolution UX or offline merge policy. Those belong to the sync/conflict architecture after API contracts exist.

## Idempotency

Create/import/adoption operations that may be retried must be idempotent.

A later API design must define an idempotency key or stable mutation identity independent of transport retries.

This is mandatory for:

- local-data adoption;
- offline replay;
- retry after timeout;
- mobile background synchronization.

Do not rely only on HTTP request uniqueness or generated timestamps.

## Local data adoption boundary

P5 established that existing IndexedDB data is **unattached local medical data**.

P7 preserves that state.

Sign-in still must not automatically upload or claim it.

A later Local Data Adoption architecture must define:

```text
unattached local partition
→ authenticated account
→ explicit user adoption decision
→ subject resolution
→ idempotent upload/import
→ verification
→ account/subject-associated local partition
```

P7 deliberately does not add `ownerId` to existing IndexedDB events.

## API boundary entering the next wave

P7 defines principles, not endpoints.

The subsequent API Contracts wave must define at minimum:

- authenticated actor derivation;
- subject selection and authorization;
- medical resource identifiers;
- pagination/cursors;
- create/update/delete mutation contracts;
- revision preconditions;
- idempotency;
- error taxonomy;
- rate limits;
- audit correlation;
- PHI-safe logging rules;
- versioning strategy.

## Data minimization

Server persistence must store only information needed for product, safety, legal, security, and operational purposes.

Do not persist:

- raw auth cookies or session tokens in medical tables;
- provider access tokens in medical resources;
- unnecessary IP/user-agent data with every medical event;
- AI prompts/responses as medical records by default;
- duplicated derived presentation strings that can be reconstructed from canonical data.

## Encryption

Minimum production requirement:

- TLS in transit;
- managed encryption at rest;
- secrets outside source control and client bundles;
- least-privilege service/database credentials;
- rotation capability;
- backup encryption.

Application-level field encryption should be introduced only where threat model, legal requirements, or key-separation needs justify it. It must not be added ad hoc in individual features.

## Audit model

Authentication/session audit and medical-data access audit are different concerns.

P7 requires an auditable boundary for medical mutations and later sensitive access, but does not require logging every routine read before the audit architecture is approved.

Medical audit records must not contain full medical payloads when identifiers and action metadata are sufficient.

Conceptually:

```text
MedicalAuditEvent
- auditId
- occurredAt
- actorAccountId
- subjectId
- action
- resourceType
- resourceId
- outcome
- correlationId
```

Retention and immutable-storage requirements require a separate compliance/security decision.

## Backup and recovery

Production medical persistence cannot depend on provider-default assumptions alone.

Implementation design must define:

- automated backups;
- point-in-time recovery where supported;
- tested restore procedure;
- recovery-point objective;
- recovery-time objective;
- migration rollback strategy;
- corruption/partial-migration handling;
- disaster-recovery ownership.

Backups are not a substitute for sync or local copies.

## Deletion and retention

P7 distinguishes:

- user-visible delete of a medical resource;
- synchronization tombstone lifecycle;
- account deletion;
- subject deletion;
- backup retention;
- security/audit retention;
- legally required retention.

One delete flag must not represent all of these concerns.

Exact retention periods are not set in P7 because jurisdiction/compliance policy is not yet approved.

## Internationalization and regional deployment

The data architecture must allow future regional storage and legal-residency requirements without changing semantic event contracts.

Do not embed country-specific assumptions in medical record primary keys or event schemas.

Regional routing/data residency is a later infrastructure architecture concern.

## Performance and scale

The architecture must support millions of users without changing core identity or resource semantics.

Initial implementation should use ordinary relational patterns with explicit indexes rather than premature sharding.

Required scale-ready properties:

- opaque non-sequential public IDs where appropriate;
- subject-scoped indexes;
- bounded queries and pagination;
- no full-history read requirement for routine screens;
- database connection pooling;
- server-side query limits;
- migration strategy for large tables;
- observability without PHI leakage.

Partitioning/sharding is deferred until measured scale requires it.

## Failure semantics

Medical writes must fail explicitly.

Forbidden behavior:

- silently falling back from cloud persistence to an unrelated local source of truth;
- returning success before authoritative persistence when the operation claims server durability;
- swallowing authorization failures;
- treating a timeout as confirmed failure or confirmed success without idempotent reconciliation.

Local-first UX may continue functioning according to the later sync architecture, but local and server durability states must remain distinguishable.

## Security invariants

P7 must preserve:

1. Better Auth/provider IDs never become medical ownership keys.
2. Medical resources are scoped to a medical subject.
3. Acting account comes from validated server authentication.
4. Ownership/access is resolved server-side.
5. No client-provided owner/subject field grants authorization.
6. No direct browser/mobile database access.
7. Medical event semantics remain independent of auth/session/sync infrastructure.
8. All routine queries are bounded.
9. Retryable mutations are idempotent.
10. Mutable resources have server-authoritative revision state.
11. Cross-account/cross-subject access fails closed.
12. Secrets and PHI are excluded from URLs and unsafe telemetry/logs.
13. Backup/restore is part of production readiness.
14. Local medical history is not silently adopted on sign-in.
15. AI operates under the same authorization boundary as deterministic application services.

## Explicit non-scope

P7 does not implement or approve:

- API endpoint shapes;
- cloud sync/outbox;
- conflict resolution;
- tombstone protocol;
- local-data adoption UI/runtime;
- mobile persistence adapters;
- OAuth;
- MFA/TOTP;
- caregiver/HCP delegation;
- organization tenancy;
- Marketplace permissions;
- AI diagnosis/treatment authority;
- production retention periods;
- regional hosting topology;
- database vendor migration.

## Recommended sequence after P7

If P7 is approved:

```text
P7 Backend Medical Data Architecture
→ API Contracts Architecture
→ Cloud Persistence Implementation Design
→ Local Data Adoption Architecture
→ Offline Outbox / Sync Architecture
→ Conflict / Revision / Tombstone Architecture
→ Security & Privacy Hardening
→ Mobile persistence/sync integration
```

Implementation must not begin until P7 passes architecture audit and an implementation ADR selects concrete schema, migration, repository, and deployment choices.

## Architecture approval gate

P7 may move from Draft to Approved only when review confirms:

- alignment with P5 identity/ownership invariants;
- no provider/account ID leakage into medical-domain ownership;
- subject-centric authorization model is unambiguous;
- `SemanticTimelineEvent` remains infrastructure-neutral;
- local P4 persistence is not silently redefined;
- adoption and sync remain explicitly deferred;
- revision/idempotency requirements are captured;
- backup/recovery and failure semantics are captured;
- Web/iOS/Android compatibility is preserved;
- no implementation/schema migration has been smuggled into the architecture wave.

## Current decision

**Recommended:** proceed with P7 architecture audit. Do not start backend implementation yet.
