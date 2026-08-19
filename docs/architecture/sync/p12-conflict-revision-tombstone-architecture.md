# P12 — Conflict, Revision, and Tombstone Architecture

## Status

**Architecture Design — Draft**

Date: 2026-08-19

## Purpose

P12 defines the authoritative conflict, revision, deletion, and tombstone semantics required to complete the safety model established by P7–P11.

P12 is architecture only. It does not implement runtime sync routes, database migrations, conflict-resolution UI, background workers, production delete propagation, caregiver/HCP delegation, CGM/device ingestion, Community, Recipes, Marketplace, or AI clinical logic.

## Canonical dependencies

P12 inherits and must not weaken:

- `docs/adr/0014-local-first-medical-event-persistence-architecture.md`
- `docs/architecture/backend/p7-backend-medical-data-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`
- `docs/architecture/sync/p10-local-data-adoption-architecture.md`
- `docs/architecture/sync/p11-offline-sync-architecture.md`

The sequence remains:

```text
P10 Local Data Adoption Architecture
→ P11 Offline Sync Architecture
→ P12 Conflict / Revision / Tombstone Architecture
→ P13 Security & Privacy Hardening
```

## Core invariants

P12 is governed by these non-negotiable rules:

- the server remains authoritative for actor, subject, authorization, canonical resource identity, revision, lifecycle, and delete state;
- revisions are opaque client tokens backed by authoritative compare-and-set semantics;
- no silent last-write-wins for conflicting medical records;
- conflict handling must preserve both server truth and unresolved local user intent;
- delete propagation uses explicit tombstones, never absence-as-delete;
- a tombstone is an authoritative lifecycle state, not permission to expose deleted PHI indefinitely;
- all sync-visible mutations atomically produce required audit, idempotency, and change-feed evidence;
- clients never receive direct database authority;
- conflict and tombstone behavior must remain subject-scoped and non-enumerating.

## Explicit non-scope

P12 does not approve:

- automatic semantic merging of medical conflicts;
- AI-selected conflict winners;
- arbitrary field-level CRDTs;
- silent last-write-wins;
- device-to-device peer conflict resolution;
- permanent backup erasure timing;
- legal-retention policy by jurisdiction;
- account deletion workflows;
- caregiver/HCP delegated conflict resolution;
- cross-account record movement;
- media/binary conflict handling;
- CGM/pump/vendor ingestion conflict rules;
- public production API route implementation;
- database schema or migration implementation.

## 1. Revision model

Every mutable authoritative medical resource has one current opaque revision token.

Client contract:

```text
resourceId
revision
```

Mutation contract:

```text
If-Match / baseRevision
→ atomic compare-and-set against current authoritative revision
```

Rules:

- clients never parse, increment, timestamp-compare, or derive revisions;
- a successful authoritative mutation advances revision exactly once for that resource mutation;
- a failed stale mutation does not advance revision;
- replay of the same committed mutation returns the already committed authoritative outcome;
- revision generation must not leak database sequence details or PHI.

## 2. Revision lineage

Revision lineage is logically ordered per resource.

Conceptual lineage:

```text
R1 → R2 → R3 → ...
```

P12 does not require clients to receive full historical revision chains. The server must, however, preserve sufficient durable evidence to determine whether a mutation was based on the current revision and to audit accepted/rejected lifecycle transitions.

A client-visible revision token represents the current authoritative version, not a portable snapshot of the record.

## 3. Conflict definition

A sync mutation is in conflict when the server cannot safely apply the user's intent without overwriting or contradicting a newer authoritative state.

Primary v1 conflict classes:

- `STALE_UPDATE` — local update is based on an older authoritative revision;
- `UPDATE_AFTER_DELETE` — local update targets a resource already tombstoned;
- `DELETE_AFTER_UPDATE` — local delete intent is based on an older revision after server modification;
- `DELETE_AFTER_DELETE` — repeated delete against an already tombstoned resource;
- `MUTATION_REPLAY_MISMATCH` — same mutation identity reused with materially different input;
- `RESOURCE_STATE_MISMATCH` — requested transition is invalid for current lifecycle state.

Authorization failure and resource absence are not conflict classes; public responses retain P8 non-enumeration semantics.

## 4. Conflict state machine

Client-side unresolved mutation state is conceptually:

```text
pending
→ in_flight
→ acknowledged
   or retryable
   or blocked
   or conflict
```

A `conflict` state is durable and survives restart.

A conflict must retain enough local information to present or execute a later approved resolution without reconstructing user intent from logs or telemetry.

## 5. Conflict evidence

For an authorized conflicted resource, the client may retain a bounded conflict record containing:

```text
conflictId
resourceId
clientMutationId
baseRevision
currentServerRevision
conflictKind
localIntentReference
serverRepresentationReference or bounded snapshot
createdAtLocal
lastObservedServerChangedAt?
```

Requirements:

- no cross-subject data;
- no full revision history by default;
- no auth credentials;
- PHI remains inside protected local persistence;
- telemetry receives only safe codes and bounded metadata, not medical payloads.

## 6. Conflict response minimization

A conflict response returns only data the authenticated self-subject is already authorized to read and only what is needed to resolve the conflict.

The server must not expose hidden historical versions merely because a conflict occurred.

If the current resource is tombstoned, the response may return lifecycle metadata required for safe resolution while withholding deleted semantic payload when policy requires it.

## 7. Resolution ownership

The server decides whether a proposed resolution transition is valid; the user or approved deterministic product policy supplies the resolution intent.

P12 allows future resolution actions such as:

- keep current server version and discard local intent;
- retry local intent against the newest revision after explicit user confirmation;
- create a new independent medical event instead of overwriting the existing resource;
- preserve unresolved conflict for later action.

P12 does not approve automatic field merging for medically meaningful records.

## 8. Rebase-style retry

A user-approved retry after reviewing a conflict is a **new mutation** with:

- a new `clientMutationId`;
- the current authoritative revision as `baseRevision`;
- an explicitly reconstructed semantic payload.

The original conflicted mutation remains immutable evidence of the failed intent and must not be silently rewritten into a new attempt.

## 9. Create-new resolution

When two edits are both medically meaningful and cannot safely replace one another, a future UI may allow the user to create a new distinct resource.

This path must generate a new canonical resource ID and new mutation identity. It is not a hidden conflict merge.

## 10. Tombstone definition

A tombstone is the authoritative server representation that a resource has entered deleted lifecycle state and that this deletion must converge across clients.

Conceptually:

```text
resourceId
revision
deletedAt
changeKind = deleted
```

The tombstone preserves identity and synchronization evidence while minimizing retained semantic payload according to retention policy.

## 11. Delete precondition

Delete requires the same optimistic concurrency discipline as update.

Conceptual contract:

```text
resourceId
baseRevision / If-Match
clientMutationId
```

Outcomes:

- current revision → tombstone accepted and revision advances;
- stale revision → `DELETE_AFTER_UPDATE` conflict;
- already tombstoned with same committed mutation → idempotent replay;
- already tombstoned with unrelated delete intent → deterministic already-deleted state, not recreation;
- out-of-scope resource → non-enumerating unavailable result.

## 12. Delete atomicity

An accepted delete must atomically commit:

```text
resource tombstone transition
+ new authoritative revision
+ audit evidence
+ sync change evidence
+ integration outbox evidence where required
+ mutation idempotency outcome
```

The server must not acknowledge deletion if another device could permanently miss the delete because sync evidence failed to commit.

## 13. Delete propagation

P11 delete intent becomes syncable only after P12 implementation approval.

Authoritative flow:

```text
Device A delete intent
→ server CAS delete
→ tombstone revision
→ subject syncSequence change
→ Device B pull
→ durable local tombstone application
```

A pulled tombstone must not generate a new outbound delete mutation.

## 14. Local tombstone application

When a client receives an authoritative tombstone:

- it records the authoritative deleted state and revision durably;
- it removes the resource from normal active Timeline projections;
- it does not immediately destroy local conflict evidence required for unresolved user intent;
- it does not enqueue a new outbound mutation merely because local storage changed;
- it advances the pull checkpoint only after durable tombstone application.

## 15. Update versus remote delete

If a device has a pending local update and pulls a newer tombstone for the same resource:

- the tombstone remains authoritative current server state;
- the pending local update becomes `UPDATE_AFTER_DELETE` conflict;
- local user intent is preserved;
- the client must not resurrect the resource automatically;
- any future restoration or create-new action requires explicit approved semantics.

## 16. Delete versus remote update

If a device has pending delete intent based on revision R and the server advances to R+1 because of another device's update:

- the delete must fail its CAS;
- the user intent remains locally preserved;
- the mutation becomes `DELETE_AFTER_UPDATE` conflict;
- the client must not delete the newer server version silently.

## 17. Concurrent deletes

Two devices may delete the same current revision concurrently.

Exactly one authoritative transition wins the CAS. The other device must converge safely:

- if the same logical mutation is replayed, return the committed delete outcome;
- if a distinct delete reaches an already tombstoned resource, return a deterministic already-deleted result and authoritative tombstone revision;
- no second tombstone resource is created.

## 18. Tombstone revision semantics

Deletion advances the same resource revision lineage.

A tombstone therefore has a current authoritative revision. Clients cannot update using the pre-delete revision.

This prevents delayed offline writes from silently reviving deleted medical records.

## 19. Restore policy

P12 does not define restore as undoing a delete in place.

Default v1 posture:

- no automatic tombstone reversal;
- no client can clear `deletedAt` by ordinary PATCH/update;
- if product later supports restore, it requires a dedicated audited transition with explicit authorization, retention constraints, and a new revision;
- if tombstone payload has been minimized/purged, in-place restore may be impossible and create-new is required.

## 20. Recreate after delete

Creating a medically similar event after deletion is a new resource unless a separately approved restore operation applies.

A client must never reuse a tombstoned `resourceId` for a new event.

## 21. Tombstone retention

Tombstones must remain available long enough for realistic offline clients and synchronization recovery.

Implementation must define:

- minimum online tombstone retention;
- relationship to sync-feed retention;
- backup/legal retention boundaries;
- what metadata survives semantic payload minimization;
- rehydration behavior after tombstone retention windows.

P12 does not choose jurisdiction-specific durations.

## 22. Payload minimization after delete

Deletion state does not justify indefinite duplication of sensitive medical payloads.

Recommended lifecycle:

```text
active resource
→ tombstone with required reconciliation metadata
→ policy-controlled semantic payload minimization/purge
→ minimal durable identity/audit/deletion evidence where legally and operationally required
```

Purge must not break the ability to prevent stale offline resurrection.

## 23. Anti-resurrection invariant

A resource deleted authoritatively must not reappear because an old device later reconnects with a stale update or create mapping.

The server enforces this with:

- canonical resource identity;
- current tombstone revision;
- CAS preconditions;
- durable mutation identity/idempotency;
- sync change evidence;
- retained anti-resurrection metadata for at least the supported offline/recovery horizon.

## 24. Rehydration and tombstones

A client that has lost its incremental cursor may perform P11 bounded rehydration.

Rehydration must not reconstruct deleted resources as active merely because tombstones are excluded from the ordinary active-resource list.

The bootstrap contract must include enough deletion knowledge to reconcile local copies. Acceptable designs include a bounded tombstone stream or a rehydration snapshot contract with a server high-watermark and deletion reconciliation phase.

A plain active-only list is insufficient when the client already has older local resources.

## 25. Rehydration with pending mutations

Before or during rehydration:

- local pending mutations and conflicts are preserved separately;
- authoritative resources/tombstones are rebuilt into a clean acknowledged view;
- pending mutations are re-evaluated against the reconstructed current revision/deleted state;
- stale pending updates become conflicts rather than disappearing;
- the new sync checkpoint is committed only after durable reconciliation.

## 26. Sync feed change kinds

P12 requires the subject-sequenced feed to distinguish lifecycle changes at least conceptually:

```text
created
updated
deleted
```

A delete entry references the canonical resource and tombstone revision.

The feed must not rely on a missing row to mean deletion.

## 27. Conflict identifiers

A conflict identifier is an opaque client-facing correlation handle for one detected conflict episode.

It must:

- contain no PHI;
- not grant authorization;
- not expose database primary keys where avoidable;
- be scoped to the authorized subject/resource conflict;
- remain stable enough for local resolution UX and support diagnostics.

## 28. Idempotency

Conflict and delete operations preserve P8/P11 idempotency rules.

Same scoped `clientMutationId` + same semantic request:

- reconciles to the original authoritative outcome.

Same scoped `clientMutationId` + materially different request:

- returns stable mutation replay conflict;
- never performs a second mutation.

A new user-approved conflict resolution uses a new mutation identity.

## 29. Audit

Audit must distinguish at least:

- successful update;
- stale update rejection/conflict;
- successful delete/tombstone;
- stale delete rejection/conflict;
- explicit future restore if ever approved;
- resolution action category when implemented.

Audit does not duplicate full PHI payloads by default.

## 30. Non-enumeration

For individual resources, P8 non-enumeration remains normative.

A caller outside the resolved subject scope must not learn whether a resource is active, tombstoned, conflicted, restored, or absent.

Internal audit may distinguish authorization-denied from missing resource; the public contract may not leak that difference.

## 31. Security and privacy

Conflict and tombstone transport requires:

- authenticated server context;
- server-resolved subject;
- TLS;
- origin/CSRF protection for cookie-authenticated Web mutations;
- PHI-safe logging and tracing;
- no medical payloads in URLs or metric labels;
- bounded request/response size;
- runtime validation;
- rate limiting and abuse controls;
- no database credentials in clients;
- no default raw request/response capture.

## 32. Account isolation

Local conflicts, pending deletes, tombstone checkpoints, and sync metadata must be partitioned by local account/profile context.

Signing into another account must never cause the new account to consume, resolve, or upload the previous account's conflict or delete intent.

## 33. Failure behavior

Retryable failures include network failure, timeout, transient 5xx/503, and explicit backpressure.

Conflicts, authorization rejection, semantic validation failure, invalid lifecycle transitions, and unsupported protocol are not blindly retried.

An ambiguous timeout after server commit is reconciled using the same mutation identity.

## 34. Error taxonomy

P12 introduces stable conceptual result codes such as:

- `REVISION_CONFLICT`
- `UPDATE_AFTER_DELETE`
- `DELETE_AFTER_UPDATE`
- `RESOURCE_ALREADY_DELETED`
- `CONFLICT_NOT_FOUND`
- `CONFLICT_STATE_CHANGED`
- `RESTORE_NOT_SUPPORTED`
- `TOMBSTONE_REHYDRATION_REQUIRED`

Exact public status mappings belong to implementation contracts and must remain compatible with P8 semantics.

## 35. Bounded resolution APIs

Future conflict APIs must be resource- or conflict-scoped and bounded.

Rejected designs:

- return every conflict ever created in one response;
- return full revision history by default;
- accept arbitrary server state replacement payloads;
- allow a conflict ID to bypass subject authorization.

## 36. Multi-device convergence

All devices converge through the authoritative server.

The system must correctly handle:

- update/update race;
- update/delete race;
- delete/update race;
- delete/delete race;
- long-offline stale update after delete;
- crash after accepted delete before local acknowledgement;
- rehydration after tombstone retention/feed cursor gap.

No device is allowed to become an independent convergence authority.

## 37. Testing requirements

Implementation planning must include at least:

1. current revision update succeeds and advances revision;
2. stale update returns conflict and does not overwrite;
3. current revision delete creates one tombstone and advances revision;
4. stale delete after newer update conflicts;
5. stale update after tombstone conflicts and cannot resurrect;
6. concurrent deletes create one authoritative tombstone;
7. delete replay with same mutation identity is idempotent;
8. mutation identity reuse with different payload is rejected;
9. pulled tombstone removes resource from active local projection;
10. pulled tombstone does not enqueue duplicate delete intent;
11. pending local update is preserved when remote tombstone arrives;
12. pending local delete is preserved when remote update wins;
13. conflict state survives restart;
14. conflict response exposes no cross-subject information;
15. conflict telemetry contains no PHI;
16. tombstone feed change is atomically committed with delete;
17. ambiguous timeout after delete reconciles to original tombstone;
18. active-only rehydration cannot resurrect previously deleted local records;
19. rehydration preserves unresolved pending mutations/conflicts;
20. account switch cannot consume another account's conflicts or deletes;
21. ordinary update cannot clear tombstone state;
22. recreate after delete receives a new canonical resource ID;
23. 100k-event histories do not require unbounded conflict/tombstone scans;
24. old supported clients fail safely when delete/conflict behavior is unsupported;
25. kill-switch or service outage never produces false delete acknowledgement.

## 38. Implementation sequence after approval

Recommended implementation waves:

```text
P12-A conflict/revision domain contracts
P12-B tombstone persistence and sync-feed contract
P12-C delete CAS service and idempotency
P12-D server conflict result contracts
P12-E Web local conflict/tombstone state
P12-F rehydration deletion reconciliation
P12-G update/delete multi-device integration tests
P12-H retention, purge, recovery, and security validation
P12-I controlled production enablement
```

Each wave receives its own implementation/security/merge gate.

## 39. Architecture decisions

### A. Silent last-write-wins

**Rejected.** It can silently rewrite medical history.

**Selected:** revision-aware CAS with explicit conflict preservation.

### B. Absence means deletion

**Rejected.** Offline clients cannot safely distinguish deletion from filtering, retention, or incomplete fetch.

**Selected:** explicit authoritative tombstone/change semantics.

### C. Reuse deleted resource ID for a new event

**Rejected.** It breaks lifecycle lineage and anti-resurrection guarantees.

**Selected:** new resource identity unless a separately approved restore transition exists.

### D. Full revision history to clients by default

**Rejected.** It increases PHI exposure and payload size.

**Selected:** current authoritative representation plus minimal conflict evidence.

### E. Automatic conflict merge

**Rejected.** Medical meaning can be altered by field-level merges.

**Selected:** preserve local intent and current server state; future user-approved resolution.

### F. Immediate hard delete

**Rejected.** It can make offline convergence and anti-resurrection impossible.

**Selected:** tombstone lifecycle followed by policy-controlled minimization/purge.

## 40. Approval checklist

P12 may move to Approved only when review confirms:

- [ ] server authority remains unchanged;
- [ ] one opaque revision/CAS model is normative;
- [ ] accepted mutation advances authoritative revision;
- [ ] stale update cannot silently overwrite;
- [ ] conflict taxonomy covers update/update and update/delete races;
- [ ] conflict evidence preserves user intent without exposing unrelated history;
- [ ] conflict resolution does not auto-merge medical payloads;
- [ ] delete requires current revision/CAS;
- [ ] accepted delete creates explicit tombstone state;
- [ ] tombstone advances the same resource revision lineage;
- [ ] sync feed carries explicit delete changes;
- [ ] pulled tombstones do not generate outbound loops;
- [ ] stale offline updates cannot resurrect deleted resources;
- [ ] repeated/concurrent deletes are deterministic and idempotent;
- [ ] restore/recreate boundaries are explicit;
- [ ] retention/minimization does not break anti-resurrection;
- [ ] rehydration reconciles deletions as well as active resources;
- [ ] pending local mutations survive rehydration;
- [ ] audit/idempotency/sync evidence shares atomic mutation boundaries;
- [ ] account/profile local conflict state is isolated;
- [ ] non-enumeration applies to active and deleted resources;
- [ ] PHI-safe logging/metrics rules are explicit;
- [ ] APIs and histories remain bounded;
- [ ] Web/iOS/Android compatibility assumptions remain explicit;
- [ ] runtime implementation remains outside this architecture PR;
- [ ] P13 Security & Privacy Hardening remains the next architecture gate.

## Current decision

P12 Conflict, Revision, and Tombstone Architecture is drafted and ready for architecture/security audit. Production conflict resolution and delete/tombstone propagation remain disabled until P12 passes the approval gate and separate implementation waves are approved.
