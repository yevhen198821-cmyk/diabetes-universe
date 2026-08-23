# P10 — Local Data Adoption Foundation

## Status

**Implementation candidate**

Date: 2026-08-23

Architecture baseline: [P10 Local Data Adoption Architecture](../architecture/sync/p10-local-data-adoption-architecture.md)

Approval closure: [P10 approval closure](../architecture/sync/p10-approval-closure.md)

## Scope delivered

- `medical.medical_adoption_sessions` and `medical.medical_adoption_mappings` schema + PGlite bootstrap migration
- production privilege follow-on (`0002_medical_adoption_privileges.sql`)
- `MedicalAdoptionService` with per-item atomic adoption transactions
- adoption HTTP API under `/api/v1/medical/me/adoption-sessions`
- `MEDICAL_ADOPTION_ENABLED` feature gate
- IndexedDB v2 adoption metadata stores (`sourceNamespace`, acknowledgements, session checkpoints)
- local adoption scanner and resumable orchestrator (explicit invocation only)
- OpenAPI adoption surface in `docs/api/openapi/medical-v1.yaml`

## Session lifecycle

| State       | Terminal | Accepts batches  |
| ----------- | -------- | ---------------- |
| `open`      | No       | Yes              |
| `failed`    | No       | Yes after resume |
| `completed` | Yes      | No               |
| `cancelled` | Yes      | No               |

## Source identity and mapping

- Key: `(subjectId, sourceNamespace, localEventId)`
- Same identity + same semantic fingerprint → replay (`already_adopted`)
- Same identity + different fingerprint → `ADOPTION_SOURCE_CONFLICT` per item
- Canonical `resourceId` is always server-generated

## Batch limits

- Default recommended batch size: 25
- Hard maximum: 100 items per request
- Request body ceiling: 65 536 bytes (P8 transport limit)

## Feature gate

`MEDICAL_ADOPTION_ENABLED=1` (or `true`) enables adoption mutation endpoints.

Production still requires P8 distributed rate-limit readiness and registered adapter.

## IndexedDB v2

- `TIMELINE_INDEXEDDB_VERSION = 2`
- New stores: acknowledgements, adoption sessions, adoption quarantine
- `source: import` accepted when semantically valid
- Demo events excluded from adoption scanner

## Explicit non-scope

- P11 continuous sync / pull cursors / outbox drain
- P12 tombstone / conflict resolution
- final Timeline/Dashboard UX redesign
- production Neon deployment / adoption production enablement
- external CSV/device import

## Production blockers

- distributed rate-limit backend adapter implementation
- production medical DB deployment
- dedicated authenticated Playwright HTTP E2E for adoption routes
- architecture/security/code re-audit before lifecycle promotion

## Lifecycle

This foundation remains **implementation candidate** until independent audit passes.

## Remediation — durable resume and concurrency (2026-08-23)

### Durable resume strategy

- `TimelineAdoptionOrchestrator.run()` inspects IndexedDB via `getResumableSessionCheckpoint()` before minting a `clientAdoptionRunId`.
- Resumable local lifecycles: `open`, `failed` (most recent `updatedAt` wins).
- On resume: reuse checkpoint `clientAdoptionRunId`, reconcile server session via `createOrResumeSession`, preserve checkpoint `createdAt`.
- New run id only when: no resumable checkpoint, terminal checkpoint (`completed`/`cancelled`), or explicit `forceNewRun` / injected `clientAdoptionRunId`.
- Checkpoint fields: `clientAdoptionRunId`, `adoptionSessionId`, `lifecycle`, counts, optional `lastSubmittedLocalEventId`, `storageSchemaVersion`, stable `createdAt`, `updatedAt`.

### Completion rule

- Orchestrator calls `completeSession` only when every eligible item has a local acknowledgement and `failedCount === 0`.
- Unresolved failures → `status: 'incomplete'`, checkpoint `lifecycle: failed`, no server completion.
- Service `completeSession` rejects when `failedCount > 0` (`ADOPTION_SESSION_INCOMPLETE`, HTTP 409).
- `already_adopted` replays count as reconciled (local ack), not failure.

### Counter semantics

- Session counters describe unique adoption outcomes per item, not HTTP retry count.
- `adopted` first-time adoption increments `adoptedCount`.
- `already_adopted` replay does **not** increment `skippedCount` or any counter (mapping already durable).
- Failed items increment `failedCount` once per first durable failure outcome.
- Counters updated via atomic SQL: `count = count + delta` with subject-scoped `WHERE` (no read-modify-write in Node).
- `eligibleCount` is set at session creation only; not incremented on batch replay.

### Lifecycle CAS rules

- All lifecycle mutations use `transitionLifecycle(subjectId, adoptionSessionId, fromStates[], toState)` — conditional update on prior state.
- Complete: `open`/`failed` → `completed` (subject-scoped).
- Cancel: `open`/`failed` → `cancelled` (subject-scoped).
- Resume: `failed` → `open` via CAS on `createOrResumeSession`.
- Terminal `completed`/`cancelled` cannot complete/cancel/reopen through these methods.
- `incrementCounters` always includes `subjectId` in `WHERE`.

### Per-item batch admission

- Each item runs in its own transaction with `SELECT … FOR UPDATE` on the session row.
- Batch stops creating resources when session lifecycle is no longer `open`/`failed` (per-item `ADOPTION_SESSION_CLOSED`).
- No whole-batch giant transaction; per-item atomicity preserved.

### DB same-subject composite FK

- `UNIQUE (subject_id, resource_id)` on `medical_event_resources`.
- Composite FK on `medical_adoption_mappings (subject_id, canonical_resource_id)` → `medical_event_resources (subject_id, resource_id)`.
- Migration `0003_medical_adoption_subject_resource_fk.sql` (additive; drops single-column FK only).
- Cross-subject canonical resource mapping rejected at DB level.

### Concurrency model

- Concurrent counter increments: atomic `UPDATE` prevents lost updates.
- Concurrent complete/cancel: CAS transition; loser gets deterministic closed/conflict/not-found behavior.
- Batch vs terminal race: terminal transition wins; in-flight items see closed session per item.

### Replay counter behavior

- Replaying the same batch with `already_adopted` outcomes does not double-count session aggregates.
- Local orchestrator skipped count tracks client-side ack state; server counters stable on replay.

## Remediation — recoverable failure accounting (2026-08-23)

### Aggregate counter semantics (current logical state)

- `failedCount` = count of unique source identities with **current** unresolved item state (`state = failed`), not lifetime HTTP retry failures.
- `adoptedCount` = unique source identities that created a new canonical resource in this session.
- `skippedCount` = unique source identities reconciled via `already_adopted` in this session.
- `eligibleCount` = expected eligible items when known at session creation; may diverge if client rescan finds a different eligible set on resume.

### Durable per-item state source of truth

- Table: `medical.medical_adoption_item_states`
- Key: `(subject_id, adoption_session_id, source_namespace, local_event_id)`
- States: `failed` | `adopted` | `reconciled`
- Stores fingerprint + optional failure code and canonical resource id only — no semantic payload / PHI.
- `completeSession` checks unresolved item-state rows, not historical failure attempts.

### Failure resolution transitions

- First logical failure for a source identity: `failedCount +1`, item state `failed`.
- Repeat failure same identity: no counter delta.
- `failed → adopted`: `failedCount -1`, `adoptedCount +1`.
- `failed → reconciled` (`already_adopted`): `failedCount -1`, `skippedCount +1`.
- Terminal success states (`adopted`/`reconciled`) are not downgraded on conflict replays.

### Completion rule

- Session may complete only when zero unresolved item-state rows remain for the session.
- Historical resolved failures do not block completion.
- Orchestrator completion relies on local ack coverage; server independently validates unresolved item state.

### Transient vs logical failures

- Logical per-item failures (`ADOPTION_SOURCE_CONFLICT`, validation/quarantine outcomes) persist in item state.
- Lifecycle gate failures (`ADOPTION_SESSION_CLOSED`) and infrastructure errors propagate without durable unresolved item records.

### Item-state concurrency

- Item-state transitions are serialized per source identity via `pg_advisory_xact_lock` on `(subjectId, sourceNamespace, localEventId)` before read/compute/write.
- `recordOutcome()` always runs inside a transaction with the advisory lock, so callers do not need to pre-lock.
- First-write races are prevented by lock ordering; the unique `(subject_id, adoption_session_id, source_namespace, local_event_id)` constraint remains defense-in-depth.
- Aggregate session counters reflect serialized logical transitions returned as deltas from `recordOutcome()`.
- Lock order in `adoptSingleItem`: session lifecycle row lock → source advisory lock → mapping/item-state/idempotency/resource operations.
