# P11 — Offline Sync Architecture

## Status

**Architecture Design — Approved**

Date: 2026-08-19

Lifecycle authority: see [P11 approval closure](p11-approval-closure.md) for the
merged approval record that corrected this document's prior Draft header after
PR #96.

## Purpose

P11 defines continuous offline synchronization for canonical medical Timeline events after P10 local-data adoption has established a safe path from historical local records into the authoritative cloud subject.

P11 defines the protocol, state machines, authority boundaries, retry semantics, push/pull convergence model, cursor requirements, and failure behavior required for Web, iOS, and Android clients to operate local-first while synchronizing with the authoritative server.

P11 is architecture only. It does not implement production sync routes, schema migrations, a dispatcher, conflict-resolution UX, tombstone policy, caregiver/HCP access, CGM/device ingestion, Community, Recipes, Marketplace, or AI clinical logic.

## Canonical dependencies

P11 inherits and must not weaken:

- `docs/adr/0014-local-first-medical-event-persistence-architecture.md`
- `docs/architecture/backend/p7-backend-medical-data-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`
- `docs/architecture/sync/p10-local-data-adoption-architecture.md`

The approved sequence remains:

```text
P10 Local Data Adoption Architecture
→ P11 Offline Sync Architecture
→ P12 Conflict / Revision / Tombstone Architecture
→ P13 Security & Privacy Hardening
```

P11 therefore establishes conflict detection and sync-safe transport states, but it must not silently decide the P12 conflict-resolution or tombstone semantics.

## Core goals

P11 must support:

- local-first durable writes while offline;
- restart-safe persistent client outbox;
- idempotent retry of client mutations;
- bounded push and pull;
- server-authoritative identity, ownership, revisions, lifecycle, and audit;
- deterministic multi-device convergence through the server;
- server-issued opaque sync cursors;
- crash-safe local acknowledgement;
- explicit stale-revision conflict detection without silent overwrite;
- recovery when a sync cursor can no longer be served;
- PHI-safe observability and transport;
- eventual compatibility across Web, iOS, and Android without changing domain ownership.

## Explicit non-scope

P11 does not approve:

- silent last-write-wins;
- automatic medical conflict merging;
- conflict-resolution UX;
- tombstone retention or delete convergence policy;
- permanent hard-delete semantics;
- caregiver/HCP delegated sync;
- cross-account data movement;
- device-to-device peer sync;
- external-file import;
- CGM, pump, wearable, Apple Health, Health Connect, or vendor ingestion;
- unbounded bulk synchronization;
- binary/media synchronization;
- public medical API implementation;
- AI interpretation of conflicts or medical records.

Those require separate approved stages.

## 1. Authority model

Offline-first operation does not transfer security authority to the client.

The server remains authoritative for:

- authenticated actor identity;
- canonical self-subject resolution;
- authorization;
- canonical `resourceId`;
- accepted revision;
- server lifecycle timestamps;
- audit evidence;
- durable authoritative change history;
- retention and deletion policy;
- conflict acceptance/rejection decisions defined by approved policy.

The client is authoritative only for durable local user intent that has not yet been acknowledged by the server.

Client-supplied account IDs, subject IDs, resource ownership fields, server revisions, or server lifecycle timestamps never grant authority.

## 2. Local-first write invariant

A local medical mutation is considered locally saved only after it is committed to durable local storage together with durable sync intent.

Target transaction:

```text
User action
→ validate semantic mutation locally
→ durable local resource mutation
+ durable local outbox entry
→ commit local transaction
→ render local pending state
→ later sync push
→ server authoritative decision
→ durable local acknowledgement/reconciliation
```

React state alone is never persistence.

If the durable local transaction fails, the UI must not report the mutation as saved.

## 3. Client sync identity

Every syncable local mutation has a high-entropy, durable client mutation identity generated before the local transaction commits.

Conceptual field:

```text
clientMutationId
```

Requirements:

- unique with negligible collision probability;
- stable across retries and process restarts;
- contains no PHI;
- never regenerated merely because a request timed out;
- bound server-side to authenticated actor + resolved subject + sync protocol version + operation scope;
- cannot authorize or select another subject.

For locally created records, the local event/source identity and `clientMutationId` are distinct concepts. The former identifies the local record; the latter identifies a specific mutation attempt semantically.

## 4. Canonical resource identity

P9/P10 server-generated canonical `resourceId` remains authoritative.

Offline create therefore follows:

```text
local stable event identity
+ clientMutationId
+ semantic event
→ push create
→ server generates canonical resourceId
→ server returns authoritative revision
→ client durably records local-to-canonical mapping
```

The client must not promote its local event ID into the canonical cloud resource ID.

## 5. Persistent client outbox

Every sync-capable client stores mutation intent in a persistent outbox in the same durable local transaction as the local mutation.

Conceptual outbox fields:

```text
clientMutationId
localEventId
canonicalResourceId?  // absent before first create acknowledgement
operation            // create | update | delete-intent placeholder
baseRevision?        // required for authoritative update/delete when applicable
semanticPayload or deterministic local reference
createdAtLocal
attemptCount
nextAttemptAt
state
lastSafeErrorCode?
```

The client outbox must survive restart and offline periods.

PHI duplication should be minimized. An implementation may reference the local canonical semantic record instead of duplicating full payloads when crash-safe semantics are preserved.

## 6. Client outbox state machine

Minimum conceptual states:

```text
pending
in_flight
retryable
acknowledged
conflict
blocked
```

Rules:

- `in_flight` is not durable success;
- network timeout returns the mutation to retryable reconciliation using the same identity;
- `acknowledged` is set only after the server result is durably applied to local storage;
- stale revision becomes `conflict`, not an automatic overwrite;
- permanent validation/policy rejection becomes `blocked` with a safe code;
- app restart may safely normalize stale `in_flight` entries back to retryable.

## 7. Push contract

Push is bounded and mutation-oriented.

Conceptual request:

```text
POST /sync/push
{
  "protocolVersion": 1,
  "mutations": [ ...bounded items... ]
}
```

Exact route naming is implementation detail and is not approved by P11.

Normative properties:

- authenticated actor and subject are resolved server-side;
- item count and encoded size are bounded;
- each item has stable `clientMutationId`;
- per-item results are returned;
- unrelated items need not share one database transaction;
- each accepted item uses the medical application-service boundary;
- retries with the same semantic mutation identity reconcile to the original authoritative result;
- one malformed item does not duplicate already accepted items.

## 8. Push create

Offline create has no authoritative base revision.

The server:

1. resolves actor and self subject;
2. validates the semantic event;
3. checks mutation identity/idempotency scope;
4. creates one canonical medical resource with server-generated `resourceId`;
5. commits mandatory audit/outbox/change-feed evidence atomically;
6. returns canonical identity and revision.

A replay of the same committed create must return/reconcile to the same canonical resource.

Reuse of the same mutation identity with materially different semantic input is a conflict/error and must never create another resource.

## 9. Push update

A sync update requires the last authoritative revision known when the local edit was based.

Conceptual input:

```text
canonicalResourceId
baseRevision
clientMutationId
updated semantic event
```

The server performs an atomic compare-and-set against the authoritative revision.

Outcomes:

- current base revision -> accepted update and new authoritative revision;
- stale base revision -> stable conflict result;
- unavailable/out-of-scope resource -> non-enumerating unavailable result;
- invalid semantic payload -> validation result;
- replay of already committed mutation -> original authoritative result.

A stale revision must never silently overwrite server state.

## 10. Delete boundary

P11 may carry a durable local `delete-intent` placeholder so clients do not lose user intent while offline, but P11 does not approve server tombstone propagation or delete conflict semantics.

Until P12 is approved:

- production sync delete propagation remains disabled;
- no local hard delete may destroy the only durable record required for reconciliation;
- delete intent is retained locally as blocked/pending-policy state;
- the server does not infer tombstone semantics from absence of a record.

## 11. Server sync change feed

Continuous pull requires an authoritative, subject-ordered server change feed.

P11 does **not** treat the existing P9 integration outbox `outbox_id` or `created_at` as a sufficient public sync cursor by assumption. UUID order and timestamps alone are not a robust subject-scoped continuation contract.

Selected architecture: introduce a dedicated logical sync-change sequence or equivalently upgrade an internal ledger with the following invariant:

```text
for each subject, every committed sync-visible authoritative mutation obtains
an immutable monotonically increasing syncSequence
```

Conceptual feed row:

```text
subjectId
syncSequence
resourceId
authoritativeRevision
changeKind
serverChangedAt
minimal sync payload/reference
```

The implementation may share transactional machinery with the P9 outbox, but sync cursor semantics are a separate contract.

## 12. Atomic feed publication

An authoritative mutation is sync-visible only when the resource mutation and required change-feed evidence commit atomically.

The system must not return durable success while failing to create the evidence required for later pull by another device.

Conceptually:

```text
resource mutation
+ audit evidence
+ integration outbox evidence where required
+ sync change evidence
+ mutation idempotency outcome
= one authoritative transaction boundary
```

## 13. Pull contract

Pull is bounded and cursor-based.

Conceptual request:

```text
GET /sync/pull?cursor=<opaque>&limit=<bounded>
```

No PHI is placed in the URL; the cursor is opaque metadata only.

Conceptual response:

```json
{
  "changes": [],
  "nextCursor": "opaque",
  "hasMore": false
}
```

Exact transport is implementation detail.

## 14. Sync cursor

The client-visible cursor is an opaque server-issued token that represents a subject-bound continuation position.

Normative requirements:

- integrity-protected/authenticated encoding;
- scoped to resolved subject;
- scoped to protocol/version and query semantics;
- contains no PHI, credentials, or medical free text;
- clients cannot construct or increment it;
- tampering returns a stable safe error;
- another subject cannot reuse it;
- cursor position maps to an authoritative sync sequence, not timestamp ordering;
- cursor lifetime and server feed retention are explicit.

Knowledge of a cursor never grants authorization.

## 15. Pull ordering and high-watermark semantics

Within one subject, changes are delivered in strictly increasing `syncSequence` order.

A pull page represents:

```text
(lastAcknowledgedSequence, pageHighSequence]
```

The client advances its durable checkpoint only after all returned changes in the page are durably applied locally.

If the app crashes after receiving a page but before checkpoint commit, it re-fetches the same range and reapplies idempotently.

## 16. Local pull application

Server changes are applied in a durable local transaction.

Rules:

- authoritative resource identity/revision replace local acknowledged metadata;
- applying a pulled authoritative change must not enqueue a new outbound mutation merely because local storage changed;
- local pending edits are not silently overwritten; they remain pending/conflicted according to base revision comparison;
- the pull checkpoint advances only in the same transaction or after durable application is proven;
- partial page application must not advance beyond uncommitted changes.

## 17. Push/pull loop

Recommended convergence loop:

```text
resolve authenticated sync context
→ pull authoritative changes from durable checkpoint
→ durably apply pull page
→ push bounded pending local mutations
→ durably reconcile per-item acknowledgements/conflicts
→ pull again to current server high-watermark
→ sleep/backoff until next trigger
```

Push-first may be supported later when formally proven equivalent for the client state machine, but the first implementation should use one documented ordering consistently.

Pull-before-push reduces the chance of submitting edits against revisions already known to be stale on the server.

## 18. Multi-device convergence

Devices never synchronize directly with each other.

Convergence path:

```text
Device A local mutation
→ authoritative server commit
→ subject sync change feed
→ Device B pull
```

The server is the only convergence authority.

A device being offline for a long time cannot block other devices from progressing.

## 19. Conflict detection boundary

P11 defines conflict detection but not conflict resolution.

A conflict exists when a local mutation based on authoritative revision R attempts to modify a resource whose server revision has advanced beyond R, or when another approved invariant detects incompatible concurrent intent.

On conflict:

- server state is not overwritten;
- local user intent is preserved;
- authoritative server representation/revision is retained for comparison;
- the outbox item becomes `conflict`;
- a stable conflict identifier/code is available to the client;
- no automatic semantic medical merge occurs.

P12 will define whether and how such conflicts are resolved.

## 20. Conflict payload minimization

Conflict responses return only the minimum authorized data needed for later resolution.

No cross-subject existence or history is exposed.

Conflict telemetry must not contain full PHI payloads.

## 21. Idempotency and replay

All push mutations are replay-safe.

Server mutation identity scope includes at least:

```text
authenticated account/actor
+ resolved subject
+ protocol version
+ operation domain
+ clientMutationId
```

The server stores or can deterministically recover the authoritative outcome long enough to cover realistic offline/background retries.

Same scoped identity + different semantic request returns a stable mutation conflict and never mutates a second resource.

## 22. Retry policy

Retryable examples:

- network interruption;
- client timeout with unknown outcome;
- transient 5xx/503;
- explicit backpressure/429;
- temporary dependency outage.

Clients use exponential backoff with jitter and honor server retry guidance when present.

Retries never generate a new mutation identity for the same logical mutation.

Authorization, validation, stale revision, unsupported protocol, and policy failures are not blindly retried.

## 23. Crash safety

P11 must be safe across crashes at all key boundaries:

- after local mutation but before first network attempt;
- after request send but before response;
- after server commit but before response;
- after response but before local acknowledgement;
- during pull page application;
- after pull page apply but before checkpoint update.

Persistent identities and transactional local checkpoints make every case recoverable without duplicate medical resources or lost user intent.

## 24. Feed retention and expired cursors

The server cannot promise infinite online change-feed retention merely because clients can remain offline indefinitely.

If a client's cursor references a sequence older than the supported feed retention boundary, the server returns a stable result such as:

```text
SYNC_REHYDRATION_REQUIRED
```

The server must not silently skip missing changes and advance the cursor.

## 25. Rehydration path

P11 requires a safe bounded authoritative rehydration path for clients whose change-feed cursor is no longer serviceable.

Rehydration properties:

- authenticated self-subject only;
- bounded pagination;
- deterministic ordering;
- server-authoritative canonical resources/revisions;
- no full-history single response;
- local pending mutation intent is preserved separately during rebuild;
- after rehydration, the client receives a new current sync checkpoint;
- rehydration cannot silently discard unresolved local conflicts or pending mutations.

Exact transport/API belongs to implementation design.

## 26. Initial sync after P10 adoption

A client that completed P10 adoption begins P11 with:

- durable local-to-canonical mappings for adopted records;
- authoritative revisions from adoption acknowledgements;
- a server-issued starting sync checkpoint established after adoption verification or through an initial P11 bootstrap.

P11 must not re-import adopted events as new creates.

## 27. Local record states

Client presentation may derive sync state without changing medical semantics.

Conceptual metadata states:

```text
local_only_pending
synced
pending_update
conflict
blocked
```

Sync state is infrastructure metadata, not part of the semantic medical event payload.

## 28. Schema/version compatibility

Sync protocol version and semantic event schema version are separate.

Rules:

- server supports an explicit set of sync protocol versions;
- released mobile clients may lag server releases;
- additive compatible fields do not require immediate client upgrade;
- unsupported semantic schema versions are rejected/quarantined safely;
- protocol downgrade must not weaken authorization/revision/conflict rules;
- breaking changes require a new protocol/version compatibility strategy.

## 29. Backpressure and scale

Sync is designed for journals from small histories through 100k+ events without scanning full history every cycle.

Requirements:

- bounded push batch size;
- bounded pull page size;
- indexed subject + sync sequence lookup;
- no offset pagination;
- no O(n²) duplicate scans;
- server backpressure support;
- client adaptive retry;
- maximum payload/depth limits;
- no unbounded mutation batches.

## 30. Background execution

Mobile/Web background execution is opportunistic.

Correctness must not depend on a client being continuously alive.

Sync is triggered by combinations of:

- app start/resume;
- connectivity restoration;
- user mutation;
- platform-approved background opportunity;
- explicit user refresh when appropriate.

A background execution deadline may stop the loop safely after any committed page/item boundary.

## 31. Authentication changes while offline

Local medical records may remain durably stored while a session expires, but server sync stops until authentication is re-established.

Rules:

- auth tokens are not embedded in outbox records;
- outbox entries survive session refresh/re-authentication;
- a different signed-in account must never consume the previous account's pending medical outbox;
- local data stores and sync metadata require explicit account/profile partitioning;
- account switch requires a safe store selection/isolation policy.

## 32. Authorization and non-enumeration

Every push/pull/bootstrap request derives actor and subject server-side.

For individual resources, cross-subject probing follows the existing non-enumeration contract.

A sync cursor, canonical resource ID, local event ID, or client mutation ID is never sufficient authorization.

## 33. Security and privacy

Sync transports sensitive health data and therefore requires:

- TLS;
- authenticated server requests;
- origin/CSRF defenses for cookie-authenticated Web mutations;
- PHI-safe logs and traces;
- no semantic event payloads in URLs;
- no payloads or identifiers with medical meaning in metric labels;
- bounded request size/depth;
- runtime validation at the server boundary;
- rate limiting and abuse protection;
- no database credentials in clients;
- no raw request/response body capture in default error telemetry.

## 34. Local security boundary

P11 does not redefine platform encryption-at-rest policy, but sync metadata must not weaken local medical-data protections.

Sensitive semantic records, pending outbox data, conflict snapshots, and local mappings remain inside the approved protected local persistence boundary for each platform.

## 35. Observability

Safe sync telemetry may include:

- correlation ID;
- protocol version;
- bounded counts;
- latency;
- retry category;
- safe error code;
- queue depth bucket;
- cursor age bucket;
- platform/app version.

It must not include:

- glucose values;
- insulin doses;
- nutrition details;
- medication names/doses;
- note text;
- full medical payloads;
- auth credentials;
- raw sync cursors when avoidable.

## 36. Integration outbox vs sync feed

P9 `medical_outbox_events` may serve integrations/event dispatch, but P11 distinguishes that operational concern from client synchronization.

The sync feed requires durable subject ordering and client retention/checkpoint semantics. An implementation may physically consolidate these systems only after proving that the resulting schema preserves both contracts without exposing internal dispatcher state to clients.

## 37. No client database access

Web/iOS/Android clients never connect directly to Neon/PostgreSQL or any server database.

All synchronization crosses authenticated application/service boundaries.

## 38. No sync bypass for AI or product modules

Analytics, Reports, Dashboard, AI, caregiver/HCP, Community, Recipes, and Marketplace do not get privileged raw sync access merely because they share an account.

Medical-data consumers use approved domain/application read models and authorization boundaries.

## 39. Operational kill switch

Production sync must be feature-gated.

The server can disable new sync mutation processing without deleting local or server medical records.

A kill switch must preserve deterministic safe failures such as `SYNC_TEMPORARILY_DISABLED` and must not trick clients into marking mutations acknowledged.

## 40. Failure taxonomy

P11 introduces stable sync-specific error/result families in addition to P8/P10 codes.

Recommended conceptual codes:

- `SYNC_PROTOCOL_UNSUPPORTED`
- `SYNC_CURSOR_INVALID`
- `SYNC_CURSOR_EXPIRED`
- `SYNC_REHYDRATION_REQUIRED`
- `SYNC_MUTATION_CONFLICT`
- `SYNC_MUTATION_INVALID`
- `SYNC_BATCH_TOO_LARGE`
- `SYNC_TEMPORARILY_DISABLED`
- `SYNC_RETRY_LATER`

Exact public mapping belongs to implementation contracts.

## 41. Testing requirements

Implementation planning must include at least:

1. unauthenticated push/pull rejected;
2. server resolves self subject and ignores ownership claims;
3. cross-subject resource probing remains non-enumerating;
4. local mutation and outbox commit atomically;
5. failed local persistence is not reported as saved;
6. offline create retry yields one canonical resource;
7. server generates canonical resource ID;
8. timeout after server commit reconciles with the same mutation ID;
9. same mutation ID with different payload conflicts;
10. update with current base revision succeeds and advances revision;
11. stale update becomes conflict without overwrite;
12. pulled changes are strictly subject-sequence ordered;
13. cursor tampering is rejected;
14. cursor cannot cross subjects;
15. pull crash before checkpoint safely replays;
16. applying pulled changes does not enqueue duplicate outbound mutations;
17. local pending edit is not silently overwritten by pull;
18. cursor retention gap requires explicit rehydration;
19. rehydration is bounded and preserves pending local intent;
20. P10-adopted events are not recreated by P11;
21. delete intent is not propagated before P12 approval;
22. process restart preserves pending/retryable/conflict state;
23. account switch cannot consume another account's outbox;
24. background deadline stops at a safe transaction boundary;
25. rate limiting/backpressure retains stable mutation identities;
26. 100k-event history does not require full scan per sync cycle;
27. PHI is absent from URL/log/metric fixtures;
28. sync kill switch never produces false acknowledgements;
29. integration outbox identifiers are not exposed as implicit public cursor semantics;
30. older supported client protocol remains safe under additive server changes.

## 42. Implementation sequence after approval

Recommended implementation waves:

```text
P11-A sync protocol/domain contracts
P11-B authoritative subject-sequenced change ledger
P11-C server push service and mutation idempotency
P11-D server pull/bootstrap services and signed cursors
P11-E Web persistent outbox/checkpoint adapter
P11-F Web sync orchestrator and state reconciliation
P11-G multi-device/conflict-detection integration tests
P11-H load/recovery/security validation
P11-I controlled production enablement
```

Each wave receives its own implementation/security/merge gate.

P12 conflict/revision/tombstone architecture must be approved before production delete propagation or conflict-resolution behavior is enabled.

## 43. Architecture decisions

### A. Timestamp as sync cursor

**Rejected.** Timestamps can collide, reorder, and do not provide an unambiguous subject-scoped continuation sequence.

**Selected:** server-controlled monotonic subject sync sequence behind an opaque signed cursor.

### B. Existing integration outbox ID as public cursor by default

**Rejected.** Current UUID/dispatcher semantics are not an approved client synchronization contract.

**Selected:** dedicated logical sync-change ordering, physically shareable only if all invariants are proven.

### C. Client-generated canonical cloud resource IDs

**Rejected.** Violates P9/P10 canonical server identity.

**Selected:** durable local-to-canonical mapping after server acknowledgement.

### D. Last-write-wins

**Rejected.** It can silently change medical history.

**Selected:** revision-aware conflict detection; P12 owns resolution.

### E. Full-history upload/download every cycle

**Rejected.** It is unbounded, wasteful, and unsuitable for large journals.

**Selected:** bounded mutation push plus subject-sequenced incremental pull.

### F. Device-to-device sync

**Rejected.** It fragments authorization and convergence authority.

**Selected:** all convergence passes through the authoritative server.

### G. Advance pull cursor before durable local apply

**Rejected.** A crash could permanently skip medical changes.

**Selected:** checkpoint advances only after durable application.

### H. Generate new mutation ID after timeout

**Rejected.** It can duplicate creates/mutations after ambiguous outcomes.

**Selected:** retry/reconcile with the same durable mutation identity.

## 44. Approval checklist

P11 may move to Approved only when review confirms:

- [ ] local save requires durable local mutation + durable outbox intent;
- [ ] server remains authoritative for actor, subject, resource ID, revision, and lifecycle;
- [ ] offline create preserves local identity but receives server canonical resource ID;
- [ ] client mutation IDs survive retries/restarts and are server-scoped;
- [ ] push batches and pull pages are bounded;
- [ ] accepted mutations atomically create sync-visible change evidence;
- [ ] pull uses monotonic subject sequence, not timestamps/UUID ordering;
- [ ] client cursor is opaque, integrity-protected, subject/version scoped, and PHI-free;
- [ ] checkpoint advances only after durable local application;
- [ ] applying pull does not generate duplicate push intent;
- [ ] stale updates are conflicts, never silent overwrites;
- [ ] conflict resolution is deferred to P12;
- [ ] production delete/tombstone propagation is deferred to P12;
- [ ] timeout/retry paths cannot duplicate accepted creates;
- [ ] cursor retention gaps produce explicit rehydration requirements;
- [ ] rehydration is bounded and preserves pending local intent;
- [ ] multi-device convergence goes through the authoritative server;
- [ ] account/profile local stores and outboxes are isolated;
- [ ] sync does not expose server DB credentials or direct DB access;
- [ ] PHI-safe transport/logging/metrics are explicit;
- [ ] integration outbox and client sync-feed contracts are not conflated;
- [ ] large histories do not require full scans per sync cycle;
- [ ] protocol/version compatibility supports lagging mobile clients;
- [ ] production enablement is feature-gated and fail-safe;
- [ ] public medical API implementation remains outside this architecture PR;
- [ ] P12 remains the next required architecture stage for conflict/tombstone policy.

## Current decision

P11 Offline Sync Architecture is drafted and ready for architecture/security audit. No production sync implementation is approved until this document passes the approval gate.
