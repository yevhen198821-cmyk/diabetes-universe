# P7 — Backend Medical Data Architecture

## Status

**Architecture Design — Approved**

Date: 2026-08-14 (merged; canonical baseline for P8/P9)

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

This gives the platform a durable model for self-management, future delegation, account recovery, and explicit consent/policy expansion without ownership transfer.

## Initial consumer relationship and provisioning

The first production consumer slice uses one authenticated account mapped to one medical subject through an explicit server-side relationship.

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

### Self-subject provisioning invariant

Creation of the initial `MedicalSubject` plus its `self` relationship must be **server-authoritative, idempotent and concurrency-safe**.

Required properties:

- the authenticated `accountId` comes only from the validated session;
- the client cannot choose the canonical `subjectId` for provisioning;
- at most one active canonical `self` relationship may exist for the initial consumer account model;
- uniqueness must be enforced at the persistence layer, not only by an application pre-check;
- provisioning must execute in a transaction or equivalent atomic unit so concurrent/retried requests cannot create duplicate subjects/relationships;
- retries return/reconcile to the already-created canonical relationship instead of creating another subject;
- provisioning a subject does **not** adopt, upload, claim, or mutate existing IndexedDB history.

The concrete constraint/index and provisioning API belong to the implementation ADR/API-contract wave.

Future relationship types such as caregiver or clinician require separate architecture approval and must not be enabled implicitly by this model.

## Canonical backend resource envelope

Conceptual minimum:

```text
MedicalEventResource
- resourceId: opaque stable server-generated ID
- subjectId: canonical medical-subject ID
- semanticEvent: SemanticTimelineEvent
- lifecycleState: active | deleted
- revision: monotonic server revision or equivalent opaque version
- createdAt: server-generated timestamp
- updatedAt: server-generated timestamp
- deletedAt: server-generated timestamp | null
- createdByAccountId: audit actor reference
- updatedByAccountId: audit actor reference
```

Important boundaries:

- canonical `resourceId` values are generated/assigned by the trusted server persistence boundary; a client-supplied identifier may be an idempotency/import key but cannot become a canonical resource ID merely by assertion;
- authoritative lifecycle timestamps are server-generated; client/device timestamps may exist only as explicitly modeled medical/source data;
- `resourceId` is not the same thing as local Timeline event identity unless a later sync ADR explicitly defines that mapping;
- `subjectId` is server-authoritative;
- actor account IDs are audit metadata, not medical ownership;
- semantic event data does not carry authentication/session/provider IDs;
- deletion is a lifecycle state; exact tombstone semantics belong to the later sync architecture.

## Database bounded contexts and credential isolation

P7 requires **logical and security separation** between identity/auth persistence and medical persistence.

Initial physical deployment may use the same managed PostgreSQL/Neon platform or project if operationally justified, but that does not permit shared application credentials or shared migration ownership.

Mandatory boundaries:

- medical runtime uses a dedicated database credential/role with least privileges for medical persistence;
- Better Auth/identity runtime credentials are not reused as the medical repository credential;
- medical migrations have independent ownership/tooling and must not be executed implicitly by Better Auth lifecycle code;
- auth runtime must not gain broad read/write privileges over medical tables merely because both contexts share a PostgreSQL deployment;
- medical runtime must not gain write access to Better Auth credential/session tables;
- secret rotation for one bounded context must be possible without rotating the other context's application credential;
- a future physical database split must not change domain/application contracts.

Conceptual boundaries:

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

Better Auth's `user` or `session` table must never become the ownership parent for medical records.

### No auth-to-medical cascade invariant

Authentication/account lifecycle and medical-data lifecycle are separate.

Forbidden:

- database `ON DELETE CASCADE` or equivalent application cascade from Better Auth user/session/credential deletion into `medical_subjects` or medical resources;
- treating logout/session revocation as medical-data deletion;
- deleting medical history automatically because an authentication identity/credential is removed.

Account deletion must be an explicit orchestrated product/compliance workflow that resolves subject ownership, retention, audit and deletion policy independently. Exact policy is deferred; accidental cascade is prohibited now.

## PostgreSQL decision

### Option A — Separate database technology for medical data immediately

Not selected for the first backend slice because it increases operational complexity before scale/workload evidence requires it.

### Option B — PostgreSQL behind a dedicated medical repository/service boundary

**Recommended for the first production backend.**

Reasons include transactional integrity, mature indexing/backup tooling, constraints, migrations and managed scaling while retaining the option for later physical separation.

## Service boundary

Web, iOS, and Android clients must not connect directly to the medical database.

Target layering:

```text
Client / Web Server Action / Route Handler
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

Hard module-boundary rule: UI code, route handlers and server actions must not import or instantiate the medical repository directly. They call the application/API boundary; only the medical application/service layer may reach the repository after authenticated actor and subject authorization have been established.

No browser-side Neon/PostgreSQL access. No medical repository credentials in client bundles.

## Authorization flow

Every medical read/write request follows this order:

```text
request
→ validate authenticated session
→ resolve canonical accountId
→ resolve authorized subject relationship
→ validate requested operation
→ load/mutate subject-scoped resource
→ write required audit/outbox state atomically with the mutation where the contract requires it
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

The exact API is deferred. Every repository operation remains subject-scoped.

## Transaction boundary

A medical mutation must have an explicit atomicity contract.

When a mutation contract requires medical audit state, idempotency state, or an outbox record for reliable downstream processing, those writes must commit atomically with the authoritative medical mutation in the same database transaction or through an architecture with equivalent atomic guarantees.

Forbidden: commit the medical mutation, then perform a best-effort audit/outbox write whose failure can leave the system claiming a fully successful operation while required security/integration evidence is missing.

Not every read requires an audit row, and the exact outbox schema is deferred to later architecture.

## Concurrency and revisions

Every mutable server resource has authoritative revision/version state. Future mutation contracts must support an expected revision or equivalent precondition so one client cannot silently overwrite a newer server version. Conflict-resolution UX/offline merge policy remains deferred.

## Idempotency

Create/import/adoption operations that may be retried must be idempotent. A later API design must define an idempotency key or stable mutation identity independent of transport retries.

This is mandatory for local-data adoption, offline replay, retry after timeout and mobile background synchronization. Do not rely only on HTTP request uniqueness or generated timestamps.

## Local data adoption boundary

P5 established that existing IndexedDB data is **unattached local medical data**. P7 preserves that state. Sign-in or self-subject provisioning must not automatically upload or claim it.

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

The subsequent API Contracts wave must define at minimum authenticated actor derivation, subject authorization, resource IDs, pagination, mutation contracts, revision preconditions, idempotency, errors, rate limits, audit correlation, PHI-safe logging and versioning.

## Data minimization

Do not persist raw auth cookies/session tokens in medical tables, provider access tokens in medical resources, unnecessary network/device metadata with every event, AI prompts/responses as medical records by default, or reconstructable presentation strings.

## Encryption

Minimum production requirement: TLS in transit, managed encryption at rest, secrets outside source/client bundles, least-privilege context-specific database credentials, independent rotation capability and backup encryption.

Application-level field encryption requires an approved threat/key-management model; it must not be added ad hoc.

## Audit model

Authentication/session audit and medical-data access audit are separate concerns. Medical audit records should contain identifiers/action metadata rather than full medical payloads when sufficient.

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

Retention/immutable-storage requirements require a separate compliance/security decision.

## Backup and recovery

Implementation design must define automated backups, point-in-time recovery where supported, tested restore, RPO, RTO, migration rollback, corruption/partial-migration handling and disaster-recovery ownership. Backups are not a substitute for sync/local copies.

## Deletion and retention

P7 distinguishes user-visible resource delete, sync tombstones, account deletion, subject deletion, backup retention, security/audit retention and legally required retention. One delete flag must not represent all concerns. Exact retention periods are deferred pending jurisdiction/compliance policy.

## Internationalization and regional deployment

Architecture must allow future regional storage/residency requirements without changing semantic event contracts. Country-specific assumptions must not be embedded in medical record primary keys/event schemas.

## Performance and scale

The architecture must support millions of users without changing core identity/resource semantics. Start with relational patterns/indexes rather than premature sharding.

Required properties include opaque non-sequential public IDs where appropriate, subject-scoped indexes, bounded pagination, no routine full-history reads, connection pooling, server-side query limits, large-table migration strategy and observability without PHI leakage.

## Failure semantics

Medical writes fail explicitly. The system must not silently fall back to an unrelated local source of truth, return authoritative success before durability, swallow authorization failures, or treat a timeout as confirmed success/failure without idempotent reconciliation.

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
14. Local medical history is not silently adopted on sign-in/provisioning.
15. AI operates under the same authorization boundary as deterministic application services.
16. Identity/auth and medical persistence use separate least-privilege runtime credentials even when physically co-located.
17. Auth/session/credential deletion cannot cascade-delete medical subjects/resources.
18. Initial self-subject provisioning is server-authoritative, idempotent, unique and concurrency-safe.
19. Route handlers/server actions cannot bypass the medical application service to access repositories directly.
20. Canonical resource IDs and lifecycle timestamps are server-authoritative.
21. Medical migrations are independently owned from Better Auth migrations.
22. Required mutation + audit/idempotency/outbox state has an explicit atomic transaction boundary.

## Explicit non-scope

P7 does not implement or approve API endpoint shapes, cloud sync/outbox protocol, conflict resolution, tombstone protocol, local-data adoption UI/runtime, mobile persistence adapters, OAuth, MFA/TOTP, caregiver/HCP delegation, organization tenancy, Marketplace permissions, AI diagnosis/treatment authority, production retention periods, regional hosting topology or database vendor migration.

## Recommended sequence after P7

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

Implementation must not begin until P7 passes architecture audit and an implementation ADR selects concrete schema, migration, repository, credential, transaction and deployment choices.

## Architecture approval gate

P7 may move to Approved only when review confirms:

- alignment with P5 identity/ownership invariants;
- subject-centric authorization and infrastructure-neutral `SemanticTimelineEvent`;
- local P4 persistence/adoption boundaries preserved;
- revision/idempotency/backup/failure requirements captured;
- dedicated medical credential/migration boundary captured;
- no auth-to-medical cascade path;
- self-subject provisioning uniqueness/concurrency semantics captured;
- application-service-only repository access captured;
- server-authoritative IDs/timestamps and mutation atomicity captured;
- Web/iOS/Android compatibility preserved;
- no production schema/API implementation smuggled into this architecture wave.

## Current decision

**P7 architecture/security audit passed. P7 is approved as the canonical backend medical data baseline for P8/P9. Cloud persistence implementation must follow the separate P9 implementation design and must not begin production API routes before that design is approved.**
