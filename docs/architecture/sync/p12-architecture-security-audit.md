# P12 — Architecture and Security Audit Closure

## Status

**Architecture/Security Audit — Approved with normative clarifications**

Date: 2026-08-19

## Scope

This closure audits `p12-conflict-revision-tombstone-architecture.md` against the approved P7–P11 invariants. It adds no runtime sync code, API routes, database migrations, production delete propagation, or conflict-resolution UI.

## Audit result

P12 is architecturally sound after the clarifications below. Server authority, opaque revision/CAS semantics, durable client intent, subject-sequenced sync, explicit tombstones, non-enumeration, bounded transport, PHI-safe observability, and no-silent-last-write-wins remain mandatory.

## Normative clarifications

### 1. `DELETE_AFTER_DELETE` is not a conflict class

A distinct delete arriving after an authoritative tombstone does not represent two incompatible current medical truths. It is a terminal already-deleted lifecycle outcome.

Normative behavior:

- same `clientMutationId` replay reconciles to the original committed delete outcome;
- a different delete intent against an already tombstoned resource returns `RESOURCE_ALREADY_DELETED` plus the current authorized tombstone revision/lifecycle metadata required for convergence;
- no second tombstone transition is created;
- no conflict record is created solely because the resource is already deleted.

The conflict taxonomy therefore treats `STALE_UPDATE`, `UPDATE_AFTER_DELETE`, `DELETE_AFTER_UPDATE`, `MUTATION_REPLAY_MISMATCH`, and invalid current-state transitions as conflicts/errors requiring preserved intent or explicit resolution. `DELETE_AFTER_DELETE` is removed from the conflict class set and is handled as deterministic convergence.

### 2. Update/update conflict is explicitly covered

`STALE_UPDATE` is the normative update/update race result. Any update based on revision R that reaches a resource whose current authoritative revision is newer than R must fail CAS, preserve local intent, and never overwrite silently.

### 3. Revision lineage and replay

A successful new authoritative mutation advances the resource revision once. An idempotent replay of the same already committed mutation returns the existing committed revision and does not advance revision again.

### 4. Anti-resurrection after tombstone payload minimization

Semantic payload minimization or purge may remove deleted PHI but must not remove the minimum authoritative lifecycle evidence needed to reject stale mutation attempts during every supported offline/recovery window.

At minimum, retained anti-resurrection evidence must preserve enough subject-scoped state to establish that the canonical `resourceId` is deleted and that stale pre-delete revisions cannot become current again. If a later policy permits removing even that marker, all clients outside the retained horizon must be forced through authoritative rehydration/bootstrap before mutation acceptance; a stale update against an unknown/purged resource must never create or revive a resource.

### 5. Rehydration completeness

Rehydration cannot be active-resource-only. A client with pre-existing local history must reconcile both active authoritative resources and deletion knowledge under one bounded high-watermark protocol before receiving a new durable sync checkpoint.

Pending local mutations and conflicts remain isolated from the rebuilt acknowledged view and are re-evaluated after authoritative active/deleted state is reconstructed.

### 6. Tombstone response minimization

Already-deleted and delete-conflict responses expose only authorized lifecycle metadata required for convergence. Deleted semantic payload is not returned merely because a client presents an old revision or conflict handle.

### 7. Restore remains a separate transition

Ordinary update/PATCH cannot clear tombstone state. Any future restore must be a dedicated authorized and audited transition with its own precondition semantics and new authoritative revision. When deleted semantic payload no longer exists, create-new is the only safe recovery path unless a separately approved restoration source exists.

## Audit checklist

- [x] server authority remains unchanged;
- [x] one opaque revision/CAS model is normative;
- [x] new accepted mutations advance revision exactly once;
- [x] idempotent replay does not advance revision again;
- [x] stale update/update cannot silently overwrite;
- [x] update/delete and delete/update races preserve user intent;
- [x] already-deleted convergence is deterministic and not misclassified as a conflict;
- [x] accepted delete creates one explicit tombstone revision;
- [x] sync feed carries explicit deleted changes;
- [x] pulled tombstones cannot create outbound delete loops;
- [x] stale offline writes cannot resurrect deleted resources;
- [x] retention/minimization preserves anti-resurrection guarantees;
- [x] rehydration reconciles active and deleted authoritative state;
- [x] pending local mutations/conflicts survive rehydration;
- [x] audit/idempotency/sync evidence remains atomic with accepted mutations;
- [x] non-enumeration covers active, deleted, absent, and conflicted resource states;
- [x] conflict/tombstone transport and observability are PHI-safe;
- [x] APIs, conflict lists, revision exposure, and rehydration remain bounded;
- [x] runtime implementation remains outside this architecture PR;
- [x] P13 Security & Privacy Hardening remains the next architecture gate.

## Approval decision

**P12 architecture/security audit passes with the normative clarifications in this closure.** The original P12 architecture plus this closure form the approved P12 contract. Production implementation remains disabled until the separate P12 implementation waves pass their own design, security, test, and merge gates.
