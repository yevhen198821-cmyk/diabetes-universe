# P10 — Local Medical Data Adoption Architecture

## Status

**Architecture Design — Approved**

Date: 2026-08-19 (architecture/security audit closure: 2026-08-23)

Lifecycle authority: see [P10 approval closure](p10-approval-closure.md) for the audit
record and [P10 runtime implementation charter](p10-runtime-implementation-charter.md)
for the next implementation scope.

## Purpose

P10 defines how pre-existing durable local medical Timeline data is safely adopted into the authoritative cloud medical subject created by P9. It sits between the approved cloud persistence foundation and the later P11 offline-sync architecture.

P10 is intentionally a one-time or explicitly re-runnable **adoption/import workflow**, not continuous synchronization.

## Canonical dependencies

P10 inherits and must not weaken:

- `docs/adr/0014-local-first-medical-event-persistence-architecture.md`
- `docs/architecture/backend/p7-backend-medical-data-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`

P8 explicitly sequences:

```text
P9 Cloud Medical Persistence Implementation Design
→ P10 Local Data Adoption Architecture
→ P11 Offline Sync Architecture
→ P12 Conflict / Revision / Tombstone Architecture
```

P10 therefore must not silently implement P11/P12 semantics.

## Core problem

Existing or future clients may contain medically relevant Timeline records that were created locally before the account had authoritative cloud persistence. Those records cannot simply be copied into PostgreSQL because:

- the server owns authorization and canonical resource identity;
- local records may predate the cloud subject;
- local schemas may have evolved;
- retries must not create duplicates;
- partial imports must be resumable;
- malformed or unsupported records must not poison the whole adoption job;
- adoption must not overwrite newer authoritative cloud records;
- adoption must not be mistaken for multi-device sync.

## Decision summary

Adoption is an explicit, server-authorized, resumable batch workflow that converts eligible local semantic Timeline records into **new server-authoritative medical resources** under the authenticated account's canonical self subject.

The client may present a stable local event identity only as an **import source identity / deduplication key**. It does not become authoritative `resourceId` and does not grant ownership.

Adoption uses an import session and per-item mutation identity. The server generates canonical `resourceId`, revision, lifecycle timestamps, audit evidence, and outbox evidence through the P9 medical application-service boundary.

## 1. Explicit non-scope

P10 does not implement:

- continuous background sync;
- pull replication from cloud to local storage;
- bidirectional outbox draining;
- tombstone propagation;
- multi-device conflict resolution;
- last-write-wins;
- caregiver/HCP imports;
- CGM/device bulk ingestion;
- media/file import;
- arbitrary account-to-account migration;
- destructive deletion of local data after adoption;
- AI-based interpretation or correction of medical records.

These remain later architecture stages.

## 2. Adoption eligibility

A record is eligible for P10 adoption only if all of the following are true:

- it belongs to the currently authenticated client profile/account context;
- it is represented as an approved semantic Timeline event schema or can be deterministically migrated to one;
- it has a stable local source identity;
- it is not already acknowledged as adopted to a canonical server resource;
- it is not a local tombstone requiring P12 semantics;
- it does not require unsupported media/device/import semantics;
- it passes runtime validation before upload.

The client must never infer eligibility solely from display/UI fields.

## 3. Adoption initiation

Adoption must be initiated only after authenticated server identity exists and the canonical self subject has been resolved/provisioned.

Recommended flow:

```text
Authenticated account
→ resolve canonical self subject
→ inspect local adoption state
→ create/resume adoption session
→ validate and submit bounded batches
→ reconcile per-item outcomes
→ persist local adoption acknowledgements
→ final verification
→ mark session complete
```

The workflow is **system-guided but user-visible**. It must not silently migrate
medical history without the approved product/privacy contract in §44.

## 4. Import session

Each adoption run has a server-tracked import session concept.

Minimum session metadata:

- server-generated `adoptionSessionId`;
- authenticated actor/account binding;
- resolved subject binding;
- client-generated high-entropy `clientAdoptionRunId` for retry reconciliation;
- source platform/app version;
- source schema range summary;
- created/started/completed timestamps;
- lifecycle state: `open`, `completed`, `failed`, `cancelled`;
- bounded aggregate counters only;
- no duplicated medical payload blob.

### Session lifecycle semantics

| State       | Terminal? | Accepts new item batches? | Meaning                                                              |
| ----------- | --------- | ------------------------- | -------------------------------------------------------------------- |
| `open`      | No        | Yes                       | Active adoption; batches may be submitted                            |
| `failed`    | No        | Yes (after resume)        | Progress paused after recoverable error; same session may be resumed |
| `completed` | Yes       | No                        | Terminal success for the declared adoption set                       |
| `cancelled` | Yes       | No                        | Terminal stop; does not roll back committed resources                |

`failed` is **not** terminal. A client may resume the same `adoptionSessionId` with
the same `clientAdoptionRunId` after transient infrastructure, partial-batch, or
timeout failures. Per-item outcomes remain authoritative via adoption mappings;
resume never mints new `localEventId` values for already-submitted identities.

Only `completed` and `cancelled` close the session to future submissions.

Cancellation stops future submissions and does **not** roll back already committed
medical resources, audit rows, outbox rows, or adoption mappings.

The session is authorization-scoped server-side. Knowing `adoptionSessionId` never grants access.

## 5. Local source identity vs canonical resource identity

This is the central P10 identity rule.

A local record may contain a stable `localEventId` / client-generated identity from the local-first architecture. P9, however, makes cloud `resourceId` server-generated and canonical.

P10 resolves the apparent conflict as follows:

```text
localEventId
= source identity for import deduplication and local acknowledgement

resourceId
= new server-generated canonical medical resource identity
```

The server stores or otherwise durably records a subject-scoped adoption mapping:

```text
(subjectId, sourceNamespace, localEventId)
→ canonical resourceId
```

The client cannot choose canonical `resourceId`.

The same local source identity replayed in the same source namespace must reconcile to the same canonical resource and must never create a duplicate.

## 6. Source namespace

`localEventId` alone is insufficient because different client installations or historical local stores could generate overlapping identifiers.

Adoption uses a bounded `sourceNamespace`, derived from non-authoritative client installation/store identity plus server scope.

Properties:

- no PHI;
- opaque/random preferred;
- stable for the local durable store across retries;
- not used for authorization;
- server binds it to the authenticated account/subject;
- cannot be used to import into another subject.

If a local installation identity is unavailable, P10 implementation must define a safe migration-generated namespace before upload.

## 7. Adoption persistence

P10 requires durable session tracking and deduplication evidence. Recommended
implementation-level entities:

### `medical_adoption_sessions`

```text
medical_adoption_sessions
- adoption_session_id          (server-generated PK)
- account_id
- subject_id
- client_adoption_run_id       (client high-entropy retry key)
- source_platform              (web | ios | android)
- source_app_version
- source_schema_summary        (bounded summary, no PHI)
- lifecycle_state              (open | failed | completed | cancelled)
- eligible_count               (aggregate counter only)
- adopted_count                (aggregate counter only)
- already_adopted_count        (aggregate counter only)
- rejected_count               (aggregate counter only)
- quarantined_count            (aggregate counter only)
- created_at / started_at / completed_at / updated_at
```

Constraints:

- unique `(account_id, client_adoption_run_id)` for retry reconciliation;
- subject binding matches authenticated self-subject;
- no auth-table foreign key;
- no medical payload blob;
- session identifiers do not grant authorization.

### `medical_adoption_mappings`

- adoption_mapping_id
- subject_id
- source_namespace
- local_event_id
- canonical_resource_id
- canonical_revision
- source_schema_version
- payload_fingerprint
- adopted_at
- adoption_session_id

````

Constraints:

- unique `(subject_id, source_namespace, local_event_id)`;
- canonical resource reference belongs to the same subject;
- mapping is append/stable under normal adoption replay;
- no auth-table foreign key;
- no normal runtime physical delete;
- does not store full medical payload.

Exact table design belongs to P10 implementation design if the architecture is approved, but durable mapping is normative.

## 8. Per-item idempotency

Every imported item must have deterministic retry semantics independent of HTTP retry count.

Recommended item idempotency scope:

```text
accountId
+ subjectId
+ apiVersion/importVersion
+ sourceNamespace
+ localEventId
````

Server also stores/derives a canonical semantic payload fingerprint after validation and normalization.

Rules:

- same source identity + same semantic fingerprint -> return/reconcile original canonical result;
- same source identity + materially different semantic fingerprint -> `ADOPTION_SOURCE_CONFLICT` and no overwrite;
- another account/subject using same local identifiers cannot collide;
- retry after timeout must return the same canonical mapping when committed.

## 9. Batch contract

Adoption uses bounded batches, not an unbounded lifetime-history request.

Recommended first-slice properties:

- maximum item count per batch (implementation must choose a bounded value ≤ 100 before runtime enablement; default recommendation: 25);
- maximum encoded request size (must not exceed P8 transport ceiling; current P8 implementation uses 65 536 bytes per request);
- maximum per-event semantic payload size (must fit within batch and request ceilings after JSON encoding);
- deterministic client batch ordering (stable sort by `localEventId` or `(occurredAt, localEventId)`);
- per-item result array;
- batch-level correlation ID;
- no requirement that all items in a batch succeed together.

Exact numeric limits are implementation parameters, but bounded values must be
documented in the implementation charter and enforced before production adoption
enablement. Unbounded batch sizes are rejected.

A single malformed item should not automatically roll back unrelated valid items unless the implementation deliberately chooses smaller atomic groups. Per-item outcomes are preferable for resumability.

## 10. Atomicity model

Each successfully adopted item must atomically create all P9-required authoritative state:

```text
canonical medical resource
+ adoption mapping
+ audit evidence
+ outbox evidence
+ item idempotency outcome if separately represented
```

If any mandatory element fails, that item is not acknowledged as adopted.

The entire multi-item batch is **not** one database transaction. Large all-or-nothing batches would create lock duration, retry, and blast-radius problems.

## 11. Request shape

Conceptual item input:

```json
{
  "sourceNamespace": "opaque-local-store-id",
  "localEventId": "opaque-local-event-id",
  "sourceSchemaVersion": 3,
  "event": { "...": "SemanticTimelineEvent" }
}
```

Client must not send authoritative:

- accountId;
- subjectId as ownership proof;
- canonical resourceId;
- server revision;
- server createdAt/updatedAt/deletedAt;
- audit actor;
- server lifecycle state.

Historical local timestamps that are genuine semantic/source metadata may be submitted only through explicitly approved semantic fields and provenance fields.

## 12. Response shape

Conceptual per-item success:

```json
{
  "localEventId": "...",
  "status": "adopted",
  "resourceId": "server-generated",
  "revision": "opaque-revision",
  "createdAt": "server-lifecycle-time"
}
```

Conceptual replay:

```json
{
  "localEventId": "...",
  "status": "already_adopted",
  "resourceId": "same-server-resource",
  "revision": "current-or-adoption-contract-revision"
}
```

Failure results use stable safe codes and do not echo unnecessary PHI.

## 13. Schema migration of local records

Local records must be validated against their declared source schema version.

Adoption architecture allows deterministic client-side or server-side migration only when the transform is explicitly versioned and loss semantics are known.

Migration rules:

- never infer medical values from localized display strings when structured semantic data is unavailable;
- never silently change units/meaning;
- preserve original semantic occurrence time;
- preserve user-authored free text exactly except approved encoding normalization;
- record source schema version for auditability;
- unsupported/ambiguous legacy records are quarantined for user-safe remediation rather than guessed.

## 14. Legacy display-only data

ADR-0014 notes earlier demo/local shapes may contain presentation fields such as title/value/unit strings rather than canonical semantic data.

P10 must not manufacture authoritative medical semantics from ambiguous display strings.

Classification:

- deterministically convertible -> migrate using a tested converter;
- partially convertible but medically ambiguous -> do not auto-adopt;
- demo fixtures/non-user data -> exclude from adoption;
- user-authored notes with clear provenance -> may be imported through explicit note semantics if contract allows.

## 15. Provenance

Adopted resources should retain non-authoritative provenance sufficient to explain origin without exposing platform internals to public clients.

Conceptual provenance:

```text
source = local_adoption
sourcePlatform = web | ios | android
sourceSchemaVersion
sourceNamespace hash/reference
adoptionSessionId internal reference
```

Do not persist auth cookies, device secrets, raw browser identifiers, or unnecessary fingerprinting data.

## 16. Ordering

Adoption order does not define medical truth.

Semantic Timeline ordering remains based on event-observed time plus deterministic server tie-breaker. Server lifecycle `createdAt` reflects adoption time, not the original medical occurrence time.

A batch containing old and new events may therefore create resources whose lifecycle time is current while semantic occurrence time is historical. This distinction is required.

## 17. Duplicate detection boundary

P10 deduplicates by authoritative adoption source identity and fingerprint, not by heuristic medical similarity.

Rejected heuristic examples:

- same glucose value within five minutes;
- same insulin dose on same timestamp;
- same note text;
- same carbs value.

These can be legitimate distinct events. Heuristic clinical deduplication is unsafe without explicit domain-specific architecture.

## 18. Existing cloud data

P10 must never assume the cloud subject is empty.

If cloud resources already exist, adoption still creates/reconciles only by adoption mapping identity. It must not overwrite an existing cloud resource merely because event time/content looks similar.

Potential user-visible duplicates caused by independent historical entry are a later reconciliation/product concern, not an excuse for unsafe automatic merge.

## 19. Local acknowledgement state

After a server success is received, the local durable store records an adoption acknowledgement mapping:

```text
localEventId
→ canonicalResourceId
→ canonicalRevision/etag snapshot
→ adoptedAt
```

The local record is not physically deleted as part of P10.

The acknowledgement must be durable before the UI treats the item as fully reconciled. If the app crashes after server commit but before local acknowledgement, retrying the same source identity must safely return the original canonical mapping.

## 20. Resume semantics

Adoption must survive:

- process termination;
- browser/app restart;
- network loss;
- server timeout;
- partial batch success;
- duplicate batch submission.

Resume algorithm uses local durable acknowledgement state plus server session/mapping lookup. It never restarts blindly by minting new local identities.

## 21. Cancellation

Cancelling an adoption session stops future submission but does not roll back already committed medical resources.

Rollback-by-delete is rejected because:

- committed records may already be audited/backed up;
- some may have been edited after adoption in future stages;
- deleting all items can destroy legitimate medical history.

Any future "undo import" feature requires separate audited product architecture.

## 22. Final verification

A session may be marked complete only after the client/server agree on terminal status for every eligible local item in the declared adoption set.

Recommended completion evidence:

- total eligible count;
- adopted/already-adopted count;
- rejected/quarantined count;
- server session completion marker;
- no requirement to upload full payload manifest.

Counts are operational metadata and must not become PHI-rich analytics.

## 23. Failure taxonomy

P10 requires stable adoption-specific errors in addition to P8 errors.

Recommended codes:

- `ADOPTION_SESSION_NOT_FOUND`
- `ADOPTION_SESSION_CLOSED`
- `ADOPTION_SOURCE_CONFLICT`
- `ADOPTION_SCHEMA_UNSUPPORTED`
- `ADOPTION_ITEM_INVALID`
- `ADOPTION_BATCH_TOO_LARGE`
- `ADOPTION_NOT_ENABLED`

Standard auth/non-enumeration/service errors still follow P8.

## 24. Non-enumeration and authorization

Adoption session and mapping lookup must be subject-scoped and non-enumerating. Another account cannot learn whether a source namespace/local event ID exists for a different subject.

The server always derives actor and subject from authenticated context. Client-supplied source identity is deduplication metadata only.

## 25. Security and privacy

Local adoption transports PHI and therefore requires:

- TLS;
- authenticated server session/token;
- PHI-safe request logging;
- no event payloads in URLs;
- no payloads in metric labels;
- no raw request bodies in error telemetry;
- bounded batch size/depth;
- runtime validation;
- origin/CSRF protection for cookie-authenticated Web mutations;
- rate limiting;
- server-side authorization per session/batch;
- no medical DB credentials in clients.

## 26. Local data privacy

P10 does not solve encryption-at-rest for every local platform, but adoption implementation must not make local protection worse.

After successful cloud adoption, local retention/deletion policy remains a separate product/security decision. The client must not automatically erase the only local copy before durable server acknowledgement and verification.

## 27. Server privilege boundary

Adoption APIs call application services. They do not receive migrator, maintenance, or compliance credentials.

The runtime medical role must remain P9 least-privilege. If new adoption mapping tables are added, grants must be table-specific and reviewed; medical runtime still receives no blanket schema DELETE or DDL.

## 28. Repository/service ownership

Route/transport code never writes adoption session or mapping tables directly.

Recommended application boundary:

```text
MedicalAdoptionService
- startOrResumeSession(...)
- adoptBatch(...)
- getSessionStatus(...)
- completeSession(...)
- cancelSession(...)
```

Service orchestration owns transaction boundaries and uses repositories for:

- adoption sessions;
- adoption mappings;
- medical event creation;
- audit/outbox;
- idempotency/replay state.

### P8/P9 integration (post-implementation audit baseline)

P10 adoption must reuse existing P9 application boundaries rather than parallel
infrastructure:

- authenticated scope via `getAuthenticatedPrincipal()` and self-subject resolution (`findActiveSelfRelationship` / `provisionSelfSubject`);
- semantic validation and `toServerSemanticEvent` normalization (server strips client `id`, lifecycle timestamps);
- per-mutation transaction pattern in `medical-event-service` (resource + audit + outbox in one transaction);
- existing `medical_idempotency_records` with adoption-specific `operationScope` (e.g. `adoption.import`) and scoped key derived from `sourceNamespace` + `localEventId`;
- revision token generation and PHI-safe P8 error envelope concepts;
- `MedicalAdoptionService` added alongside `MedicalEventService` in the medical-service bundle, not a duplicate persistence stack.

Adoption HTTP transport inherits P8 production readiness gates:

- production requires distributed rate limiting with registered backend adapter (`resolveMedicalApiRuntimeCapability`);
- bounded request bodies and validation bounds;
- PHI-safe logging and non-enumeration;
- adoption remains behind `ADOPTION_NOT_ENABLED` / feature gate until explicit launch approval.

Adoption APIs are **separate** from ordinary P8 CRUD routes and from future P11 sync
and P12 conflict/tombstone APIs. Do not route adoption through `/me/medical-events` create.

## 29. Medical event create reuse

P10 should reuse the canonical medical event creation/domain validation path wherever possible, but adoption has distinct identity/idempotency semantics.

Do not fake adoption by calling the ordinary public create route repeatedly from the client because that would lose durable source mapping and resumable import-session semantics.

Internal application primitives may be shared beneath both workflows.

## 30. Audit

Every adopted resource must be auditable as originating from local adoption.

Audit metadata should capture:

- actor/account internal reference per approved audit rules;
- subject;
- operation category `local_adoption_create` or equivalent;
- canonical resource;
- adoption session internal reference;
- correlation ID;
- server time.

Do not duplicate full semantic payload into audit rows.

## 31. Outbox

If authoritative medical mutation requires P9 outbox evidence, adoption-created resources emit the same required outbox mutation evidence atomically.

P10 does not implement an outbox dispatcher or sync consumer.

## 32. Scale

Adoption must support large local histories without one giant request/transaction.

Design targets:

- thousands to tens of thousands of local records;
- bounded batches;
- resumable cursor/checkpoint on client;
- per-item transaction/short atomic group;
- indexed mapping lookup;
- no O(n²) duplicate scans;
- no full server-history comparison for each item.

100k-event histories should be possible through sustained batched adoption without changing the identity model.

## 33. Backpressure

Server may return rate-limit/backpressure guidance. Client pauses and retries with the same adoption/session/item identities.

Backpressure must not cause the client to generate new source IDs.

## 34. Adoption feature gate

Production adoption is behind a server-controlled feature/rollout gate until:

- P9 production medical schema/grants are validated;
- adoption migrations are applied;
- security review passes;
- end-to-end migration tests pass;
- local converters are verified against representative legacy datasets;
- operational monitoring and rollback/disable procedure exist.

Disablement stops new adoption mutations but does not delete already adopted resources.

## 35. Multiple local stores

A single account may legitimately have more than one historical local store/device.

Each store uses a distinct `sourceNamespace`. The server may host multiple adoption sessions for the same subject over time.

Cross-store content similarity does not automatically deduplicate. Only explicit adoption mapping identity is authoritative.

Continuous multi-device convergence belongs to P11/P12.

## 36. Re-running adoption

Re-running adoption for the same local store is safe because mappings are durable.

Expected outcomes:

- already mapped unchanged items -> replay/reconcile;
- new eligible local items -> create new canonical resources;
- same local identity with changed payload -> conflict, not overwrite;
- locally deleted previously adopted items -> do not propagate deletion in P10; defer to P12 sync/tombstone architecture.

## 37. Local edits after adoption

P10 does not authorize continuous post-adoption editing of cloud resources from an offline local copy.

If a locally acknowledged record changes after adoption, that is a sync mutation and belongs to P11/P12. The adoption workflow must classify it as outside P10 rather than re-importing it as a new resource.

## 38. Adoption vs import from external files

P10 is specifically for the application's own durable local Timeline store.

CSV, Apple Health, Google Health Connect, CGM vendor, pump, PDF, or other external-source import requires separate source/provenance and validation architecture. Do not route external data through `sourceNamespace/localEventId` merely to avoid designing those contracts.

## 39. Testing requirements

Architecture approval requires implementation tests to be planned for at least:

1. unauthenticated adoption rejected;
2. server resolves self subject;
3. client cannot choose another subject/account;
4. same local identity + same payload is idempotent;
5. same local identity + different payload conflicts;
6. same IDs under another account do not collide;
7. server generates canonical resourceId;
8. committed server result survives client acknowledgement crash/retry;
9. partial batch failures are resumable;
10. one malformed item does not duplicate successful items;
11. unsupported schema item quarantines safely;
12. legacy ambiguous display-only data is not guessed;
13. duplicate-looking but independently identified medical events are not heuristically collapsed;
14. cloud data existing before adoption is not overwritten;
15. adopted item emits audit/outbox atomically;
16. mapping transaction rollback leaves no false acknowledgement;
17. mapping lookup is subject-scoped/non-enumerating;
18. oversized batch rejected;
19. PHI absent from URL/log fixtures;
20. feature gate can disable new adoption without deleting data;
21. locally deleted previously adopted record is not tombstoned in P10;
22. post-adoption local edit is not silently re-imported.

## 40. Implementation sequence after approval

Recommended P10 implementation waves:

```text
P10-A adoption persistence schema + mappings/session repositories
P10-B adoption application service + item atomicity
P10-C server transport contract for session/batch/status
P10-D Web local-store adoption scanner/converters
P10-E resumable orchestration + UX states
P10-F security/load/recovery validation
P10-G controlled production enablement
```

Each wave receives its own merge gate.

## 41. Architecture decisions

### A. Reuse local event ID as cloud resourceId

**Rejected.**

Pros would include simple identity continuity. Cons are decisive: it violates P9 server-generated canonical identity, expands client authority, complicates collision/security policy, and couples server identity to historical client implementation.

**Selected:** source identity mapping to server-generated resourceId.

### B. One huge import transaction

**Rejected.** It creates large rollback scope, locks, timeout risk, and poor resumability.

**Selected:** per-item/short atomic transactions inside bounded batches.

### C. Heuristic medical deduplication

**Rejected.** Similar medical events can be legitimate independent records.

**Selected:** deterministic source-identity deduplication only.

### D. Adoption implemented as ordinary create retries

**Rejected.** Ordinary create lacks durable local source mapping/session semantics.

**Selected:** dedicated adoption application workflow that may reuse lower-level create primitives.

### E. Automatic deletion of local records after success

**Rejected.** Could create data loss and interferes with later offline architecture.

**Selected:** durable local acknowledgement; local retention is a later policy.

### F. Treat post-adoption edits/deletes as more adoption

**Rejected.** That would accidentally implement unsafe sync semantics.

**Selected:** adoption handles initial authoritative creation only; later mutation convergence belongs to P11/P12.

## 43. Adoption API transport surface (conceptual)

P10 requires a dedicated adoption API surface separate from ordinary P8 CRUD and
from future P11 sync and P12 conflict/tombstone APIs.

Normative conceptual operations (paths are illustrative; exact routing is implementation detail):

```text
POST /api/v1/medical/me/adoption-sessions
  → start or resume session (returns adoptionSessionId, lifecycle state)

GET  /api/v1/medical/me/adoption-sessions/:adoptionSessionId
  → session status, aggregate counters only

POST /api/v1/medical/me/adoption-sessions/:adoptionSessionId/items
  → submit bounded adoption batch; per-item outcomes

POST /api/v1/medical/me/adoption-sessions/:adoptionSessionId/complete
  → terminal completion after verification

POST /api/v1/medical/me/adoption-sessions/:adoptionSessionId/cancel
  → terminal cancellation without rollback
```

Properties:

- all routes require authenticated session; subject resolved server-side;
- `adoptionSessionId` in URL is lookup metadata only and does not grant access;
- mutations use PHI-safe P8 error envelope extensions (`ADOPTION_*` codes);
- transport inherits P8 bounded bodies, rate limiting, and production readiness gates;
- OpenAPI for adoption is a separate artifact from `medical-v1.yaml` until explicitly versioned.

## 44. Privacy and UX adoption contract

**Product/privacy decision (approved for architecture):**

Adoption is **not silent**. The client must:

1. Explain that eligible local Timeline history will be copied to the authenticated account cloud subject;
2. Show the count of eligible records (excluding `source: demo` and quarantined items);
3. Require an explicit user action to start adoption;
4. Show progress using aggregate counters only (no PHI-rich analytics);
5. Surface skipped/problem items with safe summaries (reason codes, not raw payloads);
6. Never automatically delete local history after success;
7. Never block account access solely because adoption was declined.

UI design is out of scope for this architecture PR. This section defines the
required privacy/UX contract implementation must satisfy.

## 45. Local storage implementation delta (Web baseline)

Current repository state (post-P8/P9, pre-P10 runtime):

| Capability               | Current (`packages/timeline-web`)                     | P10 runtime delta                                                                 |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Stable `localEventId`    | `SemanticTimelineEvent.id` / IndexedDB key            | Reuse; no rename required                                                         |
| `sourceNamespace`        | **Missing**                                           | Generate once; persist in `timeline_metadata`                                     |
| Adoption acknowledgement | **Missing**                                           | New store or metadata (`canonicalResourceId`, revision snapshot, `adoptedAt`)     |
| Session/run state        | Bootstrap metadata only                               | New local session mirror (`clientAdoptionRunId`, `adoptionSessionId`, checkpoint) |
| Retry/resume state       | **Missing**                                           | Per-item status + batch cursor in durable store                                   |
| Adoption quarantine      | Storage corruption quarantine only                    | Adoption-specific quarantine reasons for unsupported/ambiguous legacy             |
| IndexedDB version        | `TIMELINE_INDEXEDDB_VERSION = 1`                      | Requires v2+ migration for adoption stores                                        |
| Legacy lift to semantic  | `liftLegacyToSemantic` exists; sidecar in-memory only | P10-D must wire durable conversion or pre-scan                                    |
| `source: import`         | Type allows; IndexedDB validation currently rejects   | Implementation must allow `import` when semantically valid                        |

Demo seed events (`source: demo`) must be excluded from eligibility. User-authored
semantic events with `source: manual | device | import` are eligible when validated.

No localStorage for medical adoption state. Mobile native stores follow the same
contract with platform adapters in later implementation waves.

## 46. Approval checklist

P10 architecture/security audit (2026-08-23) confirmed:

- [x] P10 remains adoption/import, not continuous sync.
- [x] P9 canonical `resourceId` remains server-generated.
- [x] local event identity is only source/dedup identity.
- [x] durable subject-scoped adoption mapping prevents duplicate creates.
- [x] another account/subject cannot collide with or enumerate mappings.
- [x] per-item payload fingerprint mismatch produces conflict, not overwrite.
- [x] batch size and transaction duration are bounded.
- [x] partial failure is resumable.
- [x] server commit + client acknowledgement crash is retry-safe.
- [x] semantic occurrence time remains distinct from adoption lifecycle time.
- [x] ambiguous legacy presentation data is not guessed into medical semantics.
- [x] heuristic clinical deduplication is rejected.
- [x] existing cloud records are not overwritten by similarity.
- [x] local deletions/post-adoption edits are deferred to P11/P12.
- [x] audit and outbox evidence remain atomic with each adopted medical resource.
- [x] no full payload duplication in mapping/session tables.
- [x] adoption runtime remains behind medical-service/repository boundaries.
- [x] production DB privileges remain least-privilege and explicit for new tables.
- [x] PHI-safe logging/transport rules are explicit.
- [x] large histories are handled through bounded batches/indexed lookups.
- [x] production rollout is feature-gated and reversible without data deletion.
- [x] external device/file imports remain outside P10.
- [x] P11 Offline Sync Architecture remains a separate next stage.

## Current decision

**P10 architecture/security audit passed (2026-08-23). P10 Local Data Adoption
Architecture is approved as the baseline for implementation design.**

Adoption runtime is **not** implemented and is **not** approved for production
enablement until the [P10 runtime implementation charter](p10-runtime-implementation-charter.md)
waves complete their merge gates. P11 continuous sync remains the next architecture
stage after P10 runtime foundation; P10 must not implement P11/P12 semantics.
