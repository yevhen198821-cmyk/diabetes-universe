# P10 — Local Medical Data Adoption Architecture Approval Closure

## Status

**Architecture Design — Approved**

Date: 2026-08-23

## Purpose

This closure record completes the architecture/security audit for
`p10-local-data-adoption-architecture.md` after PR #95 merged the specification
while formal approval remained pending.

This document records audit outcomes and lifecycle correction. It does **not**
approve adoption runtime implementation or production enablement.

## Audit scope

Audit baseline: `main` at merge commit `0e4ce8ac08d75f98511d7d3fac5f488903d3fe21`
(P8 medical API transport merged; P9 persistence foundation and PostgreSQL
rehearsal closure on main).

Cross-checked against:

- `docs/architecture/sync/p10-local-data-adoption-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/implementation/p8-medical-api-transport.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`
- `docs/architecture/sync/p11-offline-sync-architecture.md`
- `docs/architecture/sync/p12-conflict-revision-tombstone-architecture.md`
- `docs/architecture/security/p13-security-privacy-hardening.md`
- `docs/adr/0014-local-first-medical-event-persistence-architecture.md`
- `packages/timeline`, `packages/timeline-web`, `packages/medical-domain`,
  `packages/medical-service`, `packages/medical-persistence`
- P8 HTTP implementation (`apps/web/lib/medical/server/*`)

## Inherited invariants confirmed

The audit confirmed P10 preserves post-P8/P9 invariants:

1. P10 is one-time/resumable adoption, not continuous sync.
2. P10 does not implement P11 sync semantics.
3. P10 does not implement P12 tombstone/conflict semantics.
4. Canonical `resourceId` remains server-generated (P9).
5. `localEventId` is source/dedup identity only.
6. `sourceNamespace` is non-authoritative and not used for authorization.
7. Authenticated account derives from server session (`resolve-medical-api-scope`).
8. Canonical subject is resolved/provisioned server-side.
9. Client-supplied `accountId`/`subjectId` do not grant authority.
10. Retry reconciles via mapping; no duplicate canonical resources.
11. Semantic payload fingerprint detects source identity reuse attacks.
12. Existing cloud data is not heuristically overwritten.
13. Local records are not physically deleted after adoption.
14. Server lifecycle time remains distinct from semantic occurrence time.
15. Audit/outbox/idempotency atomicity pattern matches P9 per-item transactions.
16. No auth-table FK/cascade on adoption tables.
17. No IndexedDB-to-Postgres bypass; adoption APIs call application services.
18. No medical DB access from browser code.

## Architecture findings

| Severity | Finding                                                      | Impact                                               | Remediation                                                                                 | Architecture text changed |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------- |
| HIGH     | Session `failed` lifecycle ambiguous (terminal vs resumable) | Crash/resume behavior unclear                        | Clarified `failed` is non-terminal and resumable; only `completed`/`cancelled` are terminal | Yes — §4 lifecycle table  |
| HIGH     | `medical_adoption_sessions` schema not normative             | Session persistence drift                            | Added recommended session table alongside mappings                                          | Yes — §7                  |
| HIGH     | P8 production readiness gates not explicit for adoption APIs | Adoption could bypass rate-limit gate                | Added §28 P8/P9 integration and production gate inheritance                                 | Yes — §28                 |
| HIGH     | IndexedDB validation rejects `source: import`                | Migrated import-source events cannot persist locally | Documented implementation prerequisite in §45                                               | Yes — §45                 |
| MEDIUM   | Conceptual adoption API surface not listed                   | Transport boundary ambiguity                         | Added §43 with normative conceptual operations                                              | Yes — §43                 |
| MEDIUM   | Privacy/UX contract implicit                                 | Risk of silent migration                             | Added explicit product/privacy contract §44                                                 | Yes — §44                 |
| MEDIUM   | Local adoption metadata stores missing in IndexedDB          | Cannot resume after browser restart                  | Documented Web delta table §45                                                              | Yes — §45                 |
| MEDIUM   | Batch numeric limits unspecified                             | Unsafe batch sizing possible                         | Required bounded values before enablement; aligned with P8 65 536-byte ceiling              | Yes — §9                  |
| LOW      | Migration sidecar in-memory only                             | Legacy lift not durable pre-adoption                 | Charter assigns P10-D scanner/converter work                                                | Charter only              |
| LOW      | `import` in semantic types but blocked at persistence        | Type/persistence inconsistency                       | §45 notes implementation fix                                                                | Yes — §45                 |
| INFO     | Demo seed uses `source: demo`                                | Eligibility filter path exists                       | Documented exclusion in §45                                                                 | Yes — §45                 |
| INFO     | No `medical_adoption_*` tables in repo yet                   | Expected pre-implementation                          | Charter defines schema wave                                                                 | Charter only              |

No unresolved **BLOCKER** or **HIGH** findings remain after architecture remediation.

## Session lifecycle decision

- `open` — accepts batches.
- `failed` — **non-terminal**; resume with same `adoptionSessionId` and `clientAdoptionRunId`.
- `completed` / `cancelled` — **terminal**; no further batches.
- Cancellation does not roll back committed resources.

## Source identity / mapping decision

- Mapping key: `(subjectId, sourceNamespace, localEventId)` unique.
- Mapping stores: canonical resource id, revision snapshot, schema version, payload fingerprint, session reference, adopted timestamp — **no full PHI payload**.
- Same identity + same fingerprint → replay/reconcile.
- Same identity + different fingerprint → `ADOPTION_SOURCE_CONFLICT`.
- Separate accounts/subjects cannot collide or enumerate mappings.
- Idempotency reuses P9 `medical_idempotency_records` with adoption `operationScope` plus durable mapping table.

## Batch / atomicity decision

- Bounded batches; recommended default ≤ 25 items; max ≤ 100.
- Request size ≤ P8 ceiling (65 536 bytes in current transport).
- Per-item atomic transaction: resource + mapping + audit + outbox + idempotency outcome.
- Batch is not one giant transaction.

## Resume / crash-safety decision

| Window                                           | Required behavior                                         |
| ------------------------------------------------ | --------------------------------------------------------- |
| Server commits → client crashes before local ack | Retry same source identity returns same canonical mapping |
| Client ack → crash before next batch             | Resume skips acknowledged items                           |
| Partial batch / timeout                          | Reconcile by stable source identity; no new identities    |
| Browser restart                                  | Durable local state + server session/mapping lookup       |

## Security conclusion

No architecture-level security blocker identified for the approved P10 scope.

Mandatory **implementation** gates (not architecture blockers):

1. adoption route auth/subject isolation tests;
2. mapping non-enumeration and cross-subject denial tests;
3. PHI-safe logging/telemetry regression tests;
4. bounded batch and request-size enforcement tests;
5. P8 production readiness gate on adoption routes;
6. feature gate / `ADOPTION_NOT_ENABLED` before production;
7. least-privilege grants for new adoption tables;
8. IndexedDB v2 migration and adoption metadata durability tests.

## Implementation prerequisites

See [P10 runtime implementation charter](p10-runtime-implementation-charter.md).

## Explicit non-scope

- P11 continuous sync runtime;
- P12 conflict/tombstone propagation;
- production adoption enablement;
- final UI redesign;
- external file/device import;
- production Neon deployment.

## P11 handoff

P10 ends when eligible pre-cloud local records have canonical cloud resources,
durable local acknowledgements, and a completed adoption session.

P11 begins with ongoing mutations after adoption. P10 must not introduce pull
cursors, sync outbox draining, tombstone propagation, or multi-device conflict resolution.

## Approval decision

**P10 architecture/security audit passed. P10 Local Data Adoption Architecture is
approved as the baseline for implementation design.**

Lifecycle correction: PR #95 merged the draft specification without closure record.
This document is the authoritative approval gate completion.

## Current decision

P10 architecture is approved for implementation charter execution. Adoption runtime
and production enablement require separate merge gates per the implementation charter.
