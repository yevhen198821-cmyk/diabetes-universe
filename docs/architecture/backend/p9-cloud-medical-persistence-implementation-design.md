# P9 — Cloud Medical Persistence Implementation Design

## Status

**Architecture Design — Draft**

Date: 2026-08-14

## Purpose

Define the concrete implementation architecture for server-side medical persistence on PostgreSQL/Neon, building strictly on approved **P7 — Backend Medical Data Architecture** and **P8 — Medical API Contracts Architecture**.

P9 answers how to implement tables, migrations, repository boundaries, transaction units, indexes, idempotency storage, revision semantics, audit/outbox coupling, credential isolation, and operational readiness **without** shipping production API routes, cloud sync, IndexedDB adoption, or client persistence changes.

## Baseline

P9 inherits approved invariants from P7 and P8:

- authenticated `accountId` is derived server-side from the validated session;
- medical resources are owned by a **Medical Subject**, not by Better Auth/provider identity;
- client-supplied `accountId`, `ownerId`, or `subjectId` never grants authorization;
- `SemanticTimelineEvent` remains infrastructure-neutral inside the resource envelope;
- persistence is behind an application service and private repository boundary;
- canonical `resourceId`, lifecycle timestamps, and revision state are server-authoritative;
- local IndexedDB history remains unattached until a separate adoption architecture is approved;
- no direct client/database access;
- v1 create idempotency, opaque keyset cursors, `If-Match` revision preconditions, and non-enumerating read/update/delete behavior are normative API contracts that persistence must support.

P9 is **implementation design only**. It does not implement Next.js route handlers, production medical API routes, sync protocols, tombstone semantics, or mobile/Web UI.

## Recommended package topology

Conceptual monorepo layout for the implementation wave that follows P9 approval:

```text
packages/medical-domain/          # pure domain types + validation mappers (no DB)
packages/medical-persistence/     # repository + SQL/Drizzle schema + migrations (server-only)
packages/medical-service/         # application services, authorization orchestration (server-only)
apps/web/                         # route handlers/server actions call medical-service only
```

Hard rule from P7/P8: route handlers and server actions **must not** import repository implementations or SQL drivers directly.

---

## 1. PostgreSQL/Neon bounded context

### Deployment model

**Recommendation:** start with one Neon PostgreSQL project that hosts **two logical bounded contexts** with **separate credentials, schemas or table ownership, and migration pipelines**.

| Context                   | Owner migrations                         | Runtime credential                      | Tables                                                              |
| ------------------------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Identity/Auth (existing)  | `@diabetes-universe/identity`            | `AUTH_DATABASE_URL` / existing app role | Better Auth `user`, `session`, `account`, `verification`, `passkey` |
| Medical persistence (new) | `@diabetes-universe/medical-persistence` | `MEDICAL_DATABASE_URL`                  | `medical_*` tables below                                            |

Physical co-location is permitted; **credential and migration sharing is forbidden**.

### Option A — Same database URL and role as Better Auth

**Rejected.**

Pros: one secret, one migration runner.

Cons: violates P7 least-privilege and independent rotation; auth lifecycle code could accidentally reach medical tables; future physical split becomes a breaking operational migration.

### Option B — Same Neon project, separate database role and migration ownership

**Selected for v1.**

Pros: operational simplicity; transactional local joins remain possible if ever needed for non-authorization diagnostics; clean split path to separate database later because contracts do not depend on shared credentials.

Cons: still shares failure blast radius at project level until physically split.

### Option C — Separate Neon project/database immediately

Deferred.

Pros: strongest isolation.

Cons: higher operational cost before workload evidence; cross-database workflows require explicit orchestration now.

### Credential and permission model

Create a dedicated PostgreSQL role, conceptually `medical_app`:

- `CONNECT` on medical database/schema only;
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` on medical tables only;
- **no** `CREATE`, `DROP`, `ALTER` in production runtime (migrations use a separate `medical_migrator` role);
- **no** read/write on Better Auth tables;
- **no** `SUPERUSER`, `BYPASSRLS`, or broad `ALL` grants.

Environment variables:

```text
MEDICAL_DATABASE_URL=postgres://medical_app@...   # runtime
MEDICAL_MIGRATOR_DATABASE_URL=postgres://medical_migrator@... # CI/deploy only
```

Auth runtime continues using existing `DATABASE_URL` (or `AUTH_DATABASE_URL` if split later). Medical runtime must fail closed if `MEDICAL_DATABASE_URL` is missing in production-capable modes.

### Schema placement

**Recommendation:** dedicated PostgreSQL schema `medical` within the co-located database.

Pros: namespace isolation without separate connection topology; clear ownership; simplifies permission grants.

Alternative `public` with `medical_` table prefixes is acceptable if tooling prefers flat namespaces; schema `medical` is preferred for grant boundaries.

### No auth→medical cascade invariant

Forbidden at persistence layer:

- foreign keys from medical tables to Better Auth `user` / `session` with `ON DELETE CASCADE`;
- triggers that delete medical rows when auth rows are deleted;
- application code that treats session revocation or passkey deletion as medical-data deletion.

`account_id` values stored in medical tables are **opaque product account identifiers** copied at write time for audit and idempotency scoping. They are not foreign keys to auth tables.

Account deletion, subject retirement, and medical retention are explicit orchestrated workflows deferred to compliance/product policy waves.

### Future physical split

Contracts exposed to application/API layers use domain IDs (`subjectId`, `resourceId`) and repository interfaces only. No API or repository contract may assume co-located SQL joins with auth tables. Physical split becomes an infrastructure migration without contract change.

---

## 2. Concrete medical persistence model

### Design principles

- normalize ownership and authorization relationships;
- keep `SemanticTimelineEvent` inside a resource envelope, not as flattened auth/sync columns;
- index for subject-scoped bounded reads and mutation lookups;
- enforce uniqueness and concurrency at the database layer where P7/P8 require it;
- avoid premature event-type explosion into dozens of tables before analytics requirements are concrete.

### Entity overview

```text
medical_subjects
account_subject_relationships
medical_event_resources
medical_idempotency_records
medical_audit_events
medical_outbox_events   # required when mutation contract mandates downstream integration
```

Internal surrogate keys (`BIGINT` or `UUID` primary keys) may exist for join efficiency. **Public contracts use opaque domain IDs** (`subjectId`, `resourceId`) generated by the server.

### `medical_subjects`

Represents a durable medical subject (person/context), not a login principal.

| Column         | Type               | Notes                                                     |
| -------------- | ------------------ | --------------------------------------------------------- |
| `subject_id`   | `UUID` PK (public) | server-generated opaque ID                                |
| `subject_kind` | `TEXT`             | v1: `person` only                                         |
| `status`       | `TEXT`             | `active` \| `retired` (retirement orchestration deferred) |
| `created_at`   | `TIMESTAMPTZ`      | server authoritative                                      |
| `updated_at`   | `TIMESTAMPTZ`      | server authoritative                                      |

Indexes/constraints:

- PK on `subject_id`;
- no `account_id` on subject row (ownership is via relationships).

### `account_subject_relationships`

Authorizes an account to act on a subject.

| Column              | Type                                    | Notes                                     |
| ------------------- | --------------------------------------- | ----------------------------------------- |
| `relationship_id`   | `UUID` PK                               | server-generated                          |
| `account_id`        | `TEXT` NOT NULL                         | product account ID from identity boundary |
| `subject_id`        | `UUID` NOT NULL FK → `medical_subjects` | **NO CASCADE** from auth                  |
| `relationship_type` | `TEXT`                                  | v1: `self` only                           |
| `status`            | `TEXT`                                  | `active` \| `revoked`                     |
| `created_at`        | `TIMESTAMPTZ`                           |                                           |
| `updated_at`        | `TIMESTAMPTZ`                           |                                           |

Constraints/indexes:

- unique partial index: one active self relationship per account

```sql
CREATE UNIQUE INDEX account_subject_one_active_self
  ON medical.account_subject_relationships (account_id)
  WHERE relationship_type = 'self' AND status = 'active';
```

- index `(subject_id, status)` for authorization lookups;
- **no FK** to auth `user` table.

### `medical_event_resources`

Authoritative server envelope around `SemanticTimelineEvent`.

| Column                  | Type                                    | Notes                                            |
| ----------------------- | --------------------------------------- | ------------------------------------------------ |
| `resource_id`           | `UUID` PK (public)                      | server-generated canonical ID                    |
| `subject_id`            | `UUID` NOT NULL FK → `medical_subjects` | subject-scoped ownership                         |
| `lifecycle_state`       | `TEXT`                                  | `active` \| `deleted`                            |
| `revision`              | `BIGINT` NOT NULL                       | monotonic per resource; exposed opaquely via API |
| `event_observed_at`     | `TIMESTAMPTZ` NOT NULL                  | projection of semantic `occurredAt`              |
| `event_kind`            | `TEXT` NOT NULL                         | projection of semantic `kind`                    |
| `schema_version`        | `SMALLINT` NOT NULL                     | semantic schema generation                       |
| `semantic_event`        | `JSONB` NOT NULL                        | canonical `SemanticTimelineEvent` payload        |
| `source_label`          | `TEXT` NULL                             | optional safe projection from provenance         |
| `created_at`            | `TIMESTAMPTZ` NOT NULL                  | server lifecycle                                 |
| `updated_at`            | `TIMESTAMPTZ` NOT NULL                  | server lifecycle                                 |
| `deleted_at`            | `TIMESTAMPTZ` NULL                      | set on delete lifecycle transition               |
| `created_by_account_id` | `TEXT` NOT NULL                         | audit actor                                      |
| `updated_by_account_id` | `TEXT` NOT NULL                         | audit actor                                      |

Constraints/indexes:

- PK `resource_id`;
- check `revision > 0`;
- check `lifecycle_state` enum values;
- check `deleted_at` IS NULL when `lifecycle_state = 'active'`;
- FK `subject_id` → `medical_subjects` **ON DELETE RESTRICT** (no cascade delete of subject from auth events);
- list pagination index (see §8):
  `(subject_id, lifecycle_state, event_observed_at DESC, resource_id DESC)`;
- optional filter index `(subject_id, event_kind, event_observed_at DESC, resource_id DESC)` once filters are allow-listed.

**Normalization note:** do not store duplicate authoritative lifecycle fields inside `semantic_event` on the server copy. Persistence mapper writes server envelope fields to columns; semantic JSON retains medical-domain payload. Client-local `id`, `createdAt`, `updatedAt` inside incoming semantic events are stripped or ignored on first persist and are not authoritative server fields.

### `medical_idempotency_records`

Supports P8 create idempotency contract.

| Column                  | Type                   | Notes                                    |
| ----------------------- | ---------------------- | ---------------------------------------- |
| `idempotency_record_id` | `UUID` PK              | internal                                 |
| `account_id`            | `TEXT` NOT NULL        | scope                                    |
| `subject_id`            | `UUID` NOT NULL        | scope                                    |
| `api_version`           | `TEXT` NOT NULL        | e.g. `v1`                                |
| `operation_scope`       | `TEXT` NOT NULL        | e.g. `medical_event.create`              |
| `idempotency_key`       | `TEXT` NOT NULL        | client opaque key, bounded length        |
| `request_fingerprint`   | `BYTEA` NOT NULL       | hash of normalized semantic input        |
| `status`                | `TEXT`                 | `in_progress` \| `completed` \| `failed` |
| `result_resource_id`    | `UUID` NULL            | populated on success                     |
| `result_revision`       | `BIGINT` NULL          |                                          |
| `stored_http_status`    | `SMALLINT` NULL        | for deterministic replay                 |
| `stored_response_body`  | `JSONB` NULL           | sanitized public response snapshot       |
| `created_at`            | `TIMESTAMPTZ`          |                                          |
| `updated_at`            | `TIMESTAMPTZ`          |                                          |
| `expires_at`            | `TIMESTAMPTZ` NOT NULL | retention window                         |

Unique scope:

```sql
CREATE UNIQUE INDEX medical_idempotency_scope_key
  ON medical.medical_idempotency_records (
    account_id, subject_id, api_version, operation_scope, idempotency_key
  );
```

Index `(expires_at)` for retention cleanup job.

### `medical_audit_events`

Append-oriented security/access audit. Not a substitute for full payload logging.

| Column             | Type          | Notes                            |
| ------------------ | ------------- | -------------------------------- |
| `audit_id`         | `UUID` PK     |                                  |
| `occurred_at`      | `TIMESTAMPTZ` |                                  |
| `actor_account_id` | `TEXT`        |                                  |
| `subject_id`       | `UUID` NULL   |                                  |
| `action`           | `TEXT`        | e.g. `medical_event.create`      |
| `resource_type`    | `TEXT`        | e.g. `medical_event`             |
| `resource_id`      | `UUID` NULL   |                                  |
| `outcome`          | `TEXT`        | `success` \| `denied` \| `error` |
| `correlation_id`   | `TEXT`        |                                  |
| `detail`           | `JSONB` NULL  | PHI-safe metadata only           |

Indexes: `(subject_id, occurred_at DESC)`, `(actor_account_id, occurred_at DESC)`, `(correlation_id)`.

No full `semantic_event` payload by default.

### `medical_outbox_events`

Required because P7/P8 mutation atomicity contract may mandate durable outbox rows in the same transaction as authoritative medical writes.

| Column         | Type               | Notes                                       |
| -------------- | ------------------ | ------------------------------------------- |
| `outbox_id`    | `UUID` PK          |                                             |
| `subject_id`   | `UUID` NOT NULL    |                                             |
| `resource_id`  | `UUID` NULL        |                                             |
| `event_type`   | `TEXT`             | e.g. `medical_event.created`                |
| `payload`      | `JSONB`            | integration-safe summary, not full PHI dump |
| `status`       | `TEXT`             | `pending` \| `published` \| `failed`        |
| `created_at`   | `TIMESTAMPTZ`      |                                             |
| `published_at` | `TIMESTAMPTZ` NULL |                                             |

Index `(status, created_at)` for dispatcher workers. Outbox consumer implementation is outside P9; table existence and transactional insert are in scope.

---

## 3. Self-subject provisioning

### Goal

Ensure every authenticated consumer account can resolve exactly one canonical active self subject and relationship, safely under concurrency and retries, without adopting local IndexedDB data.

### Transaction semantics

`provisionSelfSubject(accountId)` runs in **one database transaction**:

1. attempt `SELECT ... FOR UPDATE` or advisory lock keyed by `account_id` to serialize provisioning for that account;
2. if active self relationship exists → return existing `subjectId` (idempotent retry);
3. else insert `medical_subjects` row;
4. insert `account_subject_relationships` row (`relationship_type = self`, `status = active`);
5. insert audit row `subject.self_provisioned` with outcome `success`;
6. commit.

On unique-index violation from concurrent creators:

- roll back to a single reconciliation read of the winning row;
- return existing relationship without creating duplicate subject.

### Rules

- `accountId` input comes only from validated session mapping in application service layer;
- client cannot supply canonical `subjectId` for provisioning;
- provisioning does **not** read IndexedDB, enqueue adoption jobs, or create medical events;
- relationship revocation / subject retirement are separate explicit operations (non-scope for v1 consumer slice).

### Option comparison — concurrency control

| Option                    | Pros                   | Cons                                     | Decision                            |
| ------------------------- | ---------------------- | ---------------------------------------- | ----------------------------------- |
| App-level pre-check only  | simple                 | race under concurrent requests           | Rejected                            |
| Partial unique index only | DB-enforced uniqueness | requires reconciliation path on conflict | **Required**                        |
| Advisory lock per account | easy serialization     | must be used carefully with poolers      | **Recommended** in same transaction |

---

## 4. Medical event persistence — semantic payload storage

### Option A — Fully normalized event-specific tables

Example: `medical_glucose_events`, `medical_insulin_events`, ...

Pros:

- strong SQL type constraints per event;
- efficient typed analytics per column.

Cons:

- high migration churn as `SemanticTimelineEvent` evolves;
- polymorphic repository complexity;
- awkward fit for notes/activity variants and schemaVersion migrations;
- slower feature velocity for P3 categories already modeled in JSON.

**Not selected for v1.**

### Option B — JSONB semantic payload + indexed envelope projections

Store full `SemanticTimelineEvent` in `semantic_event JSONB` with envelope columns (`event_observed_at`, `event_kind`, `schema_version`) for indexing and filters.

Pros:

- aligns with infrastructure-neutral semantic model;
- supports schemaVersion migrators without wide DDL per category;
- bounded list queries use B-tree indexes on projections;
- validation occurs in application boundary before insert.

Cons:

- JSONB analytics require deliberate projection strategy later;
- requires disciplined validation to avoid schema drift in DB.

**Selected for v1.**

### Option C — Hybrid normalized facts + JSONB

Pros: optimized analytics for glucose/insulin aggregates.

Cons: dual write paths, consistency risk, premature optimization before query patterns are proven.

**Deferred** until analytics/BI requirements justify extract tables fed by outbox/ETL.

### Server mapping rules

On create/update:

1. validate transport DTO → domain `SemanticTimelineEvent`;
2. map `occurredAt` → `event_observed_at` (timestamptz UTC);
3. map `kind` → `event_kind`;
4. persist JSONB canonical semantic payload;
5. strip/ignore client authority over server envelope fields.

---

## 5. Resource identity

### ID format recommendation

| ID               | Format           | Authority                        |
| ---------------- | ---------------- | -------------------------------- |
| `subjectId`      | UUID v4 (opaque) | server-generated at provisioning |
| `resourceId`     | UUID v4 (opaque) | server-generated at create       |
| `relationshipId` | UUID v4          | server-generated                 |

**Recommendation:** UUID v4 for v1.

Pros: simple, well-supported, non-sequential enough for public exposure.

ULID is a viable alternative if sortable IDs are desired internally; public API still treats revision/IDs as opaque per P8. UUID v4 is sufficient because ordering uses `(event_observed_at, resource_id)` not ID order.

### Public vs internal IDs

**Recommendation:** use the same UUID as public `resourceId` PK without exposing separate internal bigint IDs in API contracts.

Optional internal `BIGINT` surrogate keys are permitted for join efficiency but must never appear in public responses.

### Client authority

Forbidden:

- accepting client-provided canonical `resourceId` on create;
- upsert by client semantic `id` as server PK;
- trusting local Timeline `id` as cloud resource identity without a future explicit sync mapping table (P11/P12).

Client idempotency keys and future import keys are separate scoped constructs stored in `medical_idempotency_records`, not resource primary keys.

---

## 6. Revision and concurrency

P8 v1 requires opaque `revision` with `If-Match` and HTTP `412 REVISION_CONFLICT` on stale writes.

### Database representation

- column `revision BIGINT NOT NULL` on `medical_event_resources`;
- starts at `1` on create;
- increments by `1` on each successful update or delete lifecycle transition;
- exposed to API layer as opaque string token (e.g. base64url encoding of `revision` + resource binding MAC) so clients cannot parse/increment it.

### Update pattern

```sql
UPDATE medical.medical_event_resources
SET
  semantic_event = $payload,
  event_observed_at = $observed_at,
  event_kind = $kind,
  revision = revision + 1,
  updated_at = $now,
  updated_by_account_id = $actor
WHERE subject_id = $subject_id
  AND resource_id = $resource_id
  AND revision = $expected_revision
  AND lifecycle_state = 'active';
```

- `0` rows updated → `REVISION_CONFLICT` (HTTP 412);
- missing `If-Match` at API layer → `428 PRECONDITION_REQUIRED` before SQL.

Delete uses the same expected-revision gate, then sets `lifecycle_state = deleted`, `deleted_at`, bumps `revision`.

### Option comparison — revision strategy

| Option                        | Pros                    | Cons                                 | Decision     |
| ----------------------------- | ----------------------- | ------------------------------------ | ------------ |
| Timestamp-only versioning     | simple                  | clock skew, opaque contract mismatch | Rejected     |
| Monotonic bigint per resource | matches P8 tests, cheap | requires opaque encoding at API      | **Selected** |
| Hash chain / vector clock     | strong audit story      | overkill for v1 self-only            | Deferred     |

---

## 7. Idempotency persistence

### Scope dimensions

Unique key scope (P8 normative):

```text
account_id + subject_id + api_version + operation_scope + idempotency_key
```

`operation_scope` for v1 create: `medical_event.create`.

### Request fingerprint

Compute stable hash (e.g. SHA-256) over normalized semantic payload after:

- field allow-listing;
- canonical JSON serialization;
- rejection of server-owned fields;
- normalization of timestamps and numeric formats.

Store as `request_fingerprint`.

### Stored result

On successful create transaction:

- `status = completed`;
- `result_resource_id`, `result_revision`;
- `stored_http_status` (201, including replay);
- `stored_response_body` — sanitized public resource representation for byte-stable replay if practical.

### Retention strategy

**Recommendation:** 72-hour minimum retention window for v1, configurable via environment with documented client contract.

- background job deletes or archives rows past `expires_at`;
- after expiry, reuse of same key may create a new resource — clients must use high-entropy keys;
- contract tests must exercise expiry behavior per P8.

### Replay and conflict

| Case                                           | Persistence behavior                               | API mapping                |
| ---------------------------------------------- | -------------------------------------------------- | -------------------------- |
| same scope + same fingerprint + completed      | return stored result                               | 201 replay                 |
| same scope + different fingerprint + completed | no mutation                                        | 409 `IDEMPOTENCY_CONFLICT` |
| same scope + in_progress (orphaned)            | reconcile or fail closed per implementation policy | documented                 |
| same key, different account/subject            | separate row due to scope                          | no collision               |

### Transaction relationship

Create mutation single transaction:

1. insert idempotency row `in_progress` OR lock existing scoped row;
2. on fingerprint mismatch with completed row → rollback → conflict;
3. on fingerprint match with completed row → return stored outcome;
4. insert `medical_event_resources`;
5. insert `medical_audit_events`;
6. insert `medical_outbox_events` if required;
7. update idempotency row to `completed` with stored response;
8. commit.

If step 4–7 fails, transaction rolls back; idempotency row should not remain falsely `completed`.

---

## 8. Pagination and index strategy

P8 requires stable keyset pagination, not OFFSET, for unbounded histories.

### Deterministic ordering tuple (v1 list contract)

**Selected tuple:** `(event_observed_at DESC, resource_id DESC)` scoped to `subject_id` and default `lifecycle_state = active`.

Rationale:

- aligns with clinical timeline mental model (most recent observations first);
- `resource_id` tie-breaker guarantees deterministic order when `occurredAt` duplicates;
- matches P8 allowed examples.

Alternative `(created_at, resource_id)` is acceptable for server-ingest views but **not** selected as the default user timeline ordering.

### Keyset query pattern

Given cursor decoding to `(cursor_observed_at, cursor_resource_id)`:

```sql
SELECT ...
FROM medical.medical_event_resources
WHERE subject_id = $subject_id
  AND lifecycle_state = 'active'
  AND (
    event_observed_at < $cursor_observed_at
    OR (event_observed_at = $cursor_observed_at AND resource_id < $cursor_resource_id)
  )
ORDER BY event_observed_at DESC, resource_id DESC
LIMIT $limit;
```

### Cursor encoding (implementation detail)

Opaque signed payload containing:

- `subjectId`, `apiVersion`, `filterHash`, `sortTuple`, `cursorObservedAt`, `cursorResourceId`, `exp`.

Invalid/tampered cursor → `400 INVALID_CURSOR` without leaking internals.

### Indexes

Primary list index:

```sql
CREATE INDEX medical_event_resources_subject_active_list
  ON medical.medical_event_resources (subject_id, event_observed_at DESC, resource_id DESC)
  WHERE lifecycle_state = 'active';
```

Lookup by resource:

```sql
CREATE UNIQUE INDEX medical_event_resources_subject_resource
  ON medical.medical_event_resources (subject_id, resource_id);
```

Avoid OFFSET-based list queries in production code paths.

---

## 9. Delete lifecycle

### Application-level delete (v1)

DELETE API transitions resource to:

- `lifecycle_state = deleted`;
- `deleted_at = now()`;
- `revision` incremented;
- row retained (no physical delete by default).

List endpoint omits deleted resources by default (P8).

### Explicit non-goals in P9

- tombstone sync protocol (P12);
- client-visible tombstone metadata;
- physical purge jobs except future compliance workflows;
- cascade delete from auth/session/account deletion.

### Option comparison — delete storage

| Option                         | Pros                       | Cons                    | Decision            |
| ------------------------------ | -------------------------- | ----------------------- | ------------------- |
| Physical DELETE                | simple queries             | breaks audit/sync later | Rejected as default |
| Soft delete column             | reversible, audit-friendly | table growth            | **Selected**        |
| Separate deleted archive table | clean active set           | move complexity         | Deferred            |

---

## 10. Transaction boundaries

### Subject provisioning

**Unit:** single transaction (see §3).

Failure: full rollback; no partial subject without relationship.

### Create medical event + idempotency + audit + outbox

**Unit:** single transaction.

Includes:

- idempotency claim/reconcile;
- `medical_event_resources` insert;
- `medical_audit_events` insert;
- optional `medical_outbox_events` insert.

Failure: rollback all; API returns error without durable resource. Idempotency row must not report success unless resource exists.

### Update + revision

**Unit:** single transaction.

- optimistic update with expected revision;
- audit row;
- optional outbox row.

Failure: no partial revision advance.

### Delete + revision

**Unit:** single transaction.

- preconditioned soft delete;
- audit row;
- optional outbox row.

### Read paths

Reads do not require audit rows by default. Authorization denial may emit audit telemetry asynchronously **only** if it does not weaken non-enumeration semantics.

### Failure semantics

- infrastructure errors → `503 SERVICE_UNAVAILABLE` / retry;
- do not cache transient failures as permanent idempotency success;
- timeouts leave outcome ambiguous → client reconciles via idempotency key per P8.

---

## 11. Repository and application-service boundary

### Layering

```text
Route Handler / Server Action
  → MedicalApiFacade (transport DTO validation, HTTP mapping)
    → MedicalAuthorizationService (resolve actor + subject relationship)
      → MedicalEventService (business rules, transaction orchestration)
        → MedicalEventRepository (SQL only)
        → MedicalIdempotencyRepository
        → MedicalAuditRepository
        → MedicalOutboxRepository
```

### Repository interface (conceptual)

```text
MedicalEventRepository
- getByResourceId(subjectId, resourceId)
- listKeyset(subjectId, query, cursor, limit)
- insert(resourceRow)
- updateWithRevision(subjectId, resourceId, expectedRevision, patch)
- markDeletedWithRevision(subjectId, resourceId, expectedRevision)

MedicalSubjectRepository
- findActiveSelfRelationship(accountId)
- provisionSelfSubject(accountId)  // transactional

MedicalIdempotencyRepository
- beginOrLoad(scope, key, fingerprint)
- complete(recordId, outcome)
```

Repositories accept **authorization-scoped context** (`subjectId`, `accountId`) on every call; they do not perform session validation.

### Forbidden imports

`apps/web/app/**` and route handlers must not import:

- Drizzle schema objects;
- SQL query builders;
- `MEDICAL_DATABASE_URL` readers.

Only `@diabetes-universe/medical-service` (or equivalent) is imported.

---

## 12. Migration strategy

### Ownership

- medical DDL owned by `packages/medical-persistence/migrations`;
- auth DDL remains in `packages/identity`;
- CI runs both pipelines independently;
- deploy job applies medical migrations before enabling medical routes.

### Forward-only production strategy

**Recommendation:** forward-only migrations in production.

- each migration is versioned SQL with explicit transaction boundaries where safe;
- destructive changes use expand/contract pattern across releases.

### Expand/contract pattern

Example future semantic field addition:

1. expand: add nullable column or JSON field tolerance;
2. deploy code that reads/writes new shape;
3. backfill if needed;
4. contract: add constraints after backfill complete.

### Rollback/recovery

- application rollback does not assume backward-compatible DDL;
- if deploy fails, forward fix preferred over automatic DDL rollback;
- `medical_migrator` keeps migration history table;
- document manual recovery for failed mid-migration state.

### Zero/low-downtime requirements

- additive migrations first;
- avoid long blocking `ACCESS EXCLUSIVE` locks on hot tables;
- create indexes `CONCURRENTLY` where supported;
- batch backfills with row limits.

### Large-table considerations

- plan retention jobs for idempotency and audit volumes;
- monitor table bloat;
- defer partitioning until single-table indexes exceed operational thresholds (see §15).

---

## 13. Backup and recovery

Implementation readiness requirements before production medical API cutover:

| Requirement         | v1 expectation                                      |
| ------------------- | --------------------------------------------------- |
| Automated backups   | Neon scheduled backups enabled                      |
| PITR                | enable Neon PITR where available                    |
| Backup verification | periodic restore to isolated environment            |
| Restore test        | documented runbook + annual test                    |
| RPO                 | placeholder: target ≤ 24h until product SLA defined |
| RTO                 | placeholder: target ≤ 4h until product SLA defined  |
| Local IndexedDB     | **not** a server backup strategy                    |

Restore procedures must include medical schema version verification and migration state reconciliation.

---

## 14. Security

| Area                 | Requirement                                                      |
| -------------------- | ---------------------------------------------------------------- |
| Credential isolation | separate `medical_app` role and URL                              |
| TLS                  | required for all production DB connections                       |
| Secrets              | `MEDICAL_DATABASE_URL` in managed secret store only              |
| PHI-safe logs        | no full `semantic_event` in app logs by default                  |
| SQL injection        | parameterized queries / typed query builder only                 |
| DB permissions       | least privilege; migrator separate from runtime                  |
| Audit scope          | actor, subject, resource IDs, action, outcome, correlation ID    |
| Network              | medical DB not publicly reachable; Neon IP allow/VPC as deployed |

Authorization non-enumeration is enforced in application/API layer; persistence returns `not found` for cross-subject resource lookups.

---

## 15. Scale

Design target: millions of accounts with long-running event histories.

| Mechanism          | Approach                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Connection pooling | Neon pooler / PgBouncer; bounded pool sizes per instance                                                                  |
| Bounded queries    | mandatory `LIMIT`; server max limit enforced                                                                              |
| Indexes            | subject-scoped composite indexes; no full table scans on list                                                             |
| Growth             | table growth expected; monitor autovacuum and index bloat                                                                 |
| Partitioning       | **not** in v1; revisit when single-table row count or index size exceeds agreed ops threshold (e.g. 100M+ rows per table) |

Read replicas may be introduced later for analytics; authoritative writes remain on primary.

---

## 16. Explicit non-scope

P9 does **not** implement or approve:

- production medical API route handlers;
- IndexedDB adoption/import;
- offline sync/outbox consumer workers;
- tombstone/conflict resolution (P12);
- CGM/device ingestion pipelines;
- OAuth / MFA;
- Community / Recipes / Marketplace;
- AI clinical decision-making or AI-authored medical persistence;
- caregiver/HCP relationship types beyond documenting future extension;
- physical account-deletion orchestration;
- field-level encryption (requires separate threat model).

---

## 17. Architecture decision records (summary)

| Topic                  | Recommendation                            | Rejected alternatives              |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| DB credential boundary | separate `medical_app` role + migrations  | shared auth credential             |
| Semantic storage       | JSONB + envelope projections              | per-event normalized tables (v1)   |
| Public resource ID     | UUID v4 server-generated                  | client semantic `id` as PK         |
| Revision               | monotonic bigint, opaque at API           | timestamp versioning               |
| Pagination             | keyset `(event_observed_at, resource_id)` | OFFSET                             |
| Delete                 | soft delete default                       | physical delete default            |
| Outbox table           | include in schema for atomic mutations    | best-effort post-commit audit only |
| Partitioning           | defer                                     | premature sharding                 |

---

## 18. Architecture approval gate

P9 may move from **Draft** to **Approved** only when review confirms:

1. P7/P8 invariants preserved without contract drift.
2. medical and auth credentials/migrations are isolated with least privilege.
3. no auth→medical cascade deletion path exists in schema or code design.
4. self-subject provisioning is transaction-safe, idempotent, and uniqueness-enforced.
5. `SemanticTimelineEvent` persistence strategy is explicit with validation before write.
6. server-generated `resourceId` / `subjectId` cannot be client-authored.
7. revision storage supports P8 `If-Match` / 412 / 428 semantics.
8. idempotency scope, fingerprint, replay, conflict, and retention are fully specified.
9. keyset pagination indexes match the declared ordering tuple.
10. delete lifecycle is soft-delete default without P12 tombstone leakage.
11. mutation transaction boundaries include audit/outbox when contract requires.
12. repository access is application-service-only.
13. migration ownership, expand/contract, and rollback posture are documented.
14. backup/PITR/restore test requirements are captured.
15. security, PHI-safe logging, and SQL injection controls are explicit.
16. scale approach avoids OFFSET and premature partitioning.
17. explicit non-scope prevents sync/adoption/API implementation smuggling.
18. no production routes, DB deployment, or runtime code shipped in this architecture PR.

## Current decision

**Draft implementation design. Architecture/security audit required before approval. Production medical API routes and cloud sync must not begin until P9 is approved and a subsequent implementation PR is explicitly chartered.**

## Recommended sequence after P9

```text
P9 Cloud Medical Persistence Implementation Design (this document)
→ P9 implementation PR (schema, repository, service — no public routes until separately approved)
→ P10 Local Data Adoption Architecture
→ P11 Offline Sync Architecture
→ P12 Conflict / Revision / Tombstone Architecture
→ P13 Security & Privacy Hardening
→ Medical API route implementation (post P8 + P9 implementation)
```
