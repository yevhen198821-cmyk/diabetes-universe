# P10 — Local Data Adoption Runtime Implementation Charter

## Status

**Implementation charter — not yet implemented**

Date: 2026-08-23

Architecture baseline: [P10 Local Data Adoption Architecture](p10-local-data-adoption-architecture.md) (Approved)

Approval closure: [P10 approval closure](p10-approval-closure.md)

## Purpose

Define the **next implementation PR scope** after P10 architecture approval.
This charter does not implement runtime behavior.

## Next PR title (recommended)

**P10 Local Data Adoption Foundation**

## In scope (foundation PR and follow-on waves)

### Wave P10-A — persistence schema

- `medical_adoption_sessions` table + indexes (see architecture §7)
- `medical_adoption_mappings` table + unique `(subject_id, source_namespace, local_event_id)`
- Drizzle definitions + SQL migration + `medical_app` privilege grants
- No auth-table FK

### Wave P10-B — application service

- `MedicalAdoptionService` with per-item atomic transactions
- Reuse `medical-event-service` create primitives, audit/outbox repositories, idempotency repository
- Adoption-specific errors (`ADOPTION_SOURCE_CONFLICT`, etc.)
- Subject-scoped session/mapping repositories

### Wave P10-C — bounded adoption API

- Conceptual routes from architecture §43
- P8 error envelope, bounded bodies, rate limiting, production readiness gate
- `ADOPTION_NOT_ENABLED` feature gate
- Separate from `/me/medical-events` CRUD

### Wave P10-D — Web local adoption metadata

- IndexedDB v2 migration:
  - `sourceNamespace` in `timeline_metadata`
  - adoption acknowledgement store
  - local session/run checkpoint state
- Allow `source: import` in IndexedDB validation when semantically valid
- Scanner: iterate `timeline_events`; `localEventId` = event `id`; exclude `source: demo`
- Wire `liftLegacyToSemantic` for any legacy shapes encountered

### Wave P10-E — resumable orchestration

- Client batch loop with stable identities
- Local ack after server success
- Resume after crash/restart without minting new identities

### Wave P10-F — security/load validation

- Tests from architecture §39
- PHI-safe logging fixtures
- Large-history batched adoption load tests

### Wave P10-G — controlled enablement

- Production feature gate validation
- Documented numeric batch limits
- Operational disable without data deletion

## Explicitly out of scope

- P11 offline sync runtime (outbox drain, pull cursors, continuous replication)
- P12 conflict/tombstone propagation
- Final product UI redesign (privacy contract only; see architecture §44)
- Production Neon deployment / launch gate
- External CSV/Health Connect/CGM import
- OpenAPI publication for adoption routes (optional follow-on)

## Bounded values (must be set before production enablement)

| Parameter                      | Requirement                                       |
| ------------------------------ | ------------------------------------------------- |
| Max items per batch            | ≤ 100; recommended default 25                     |
| Max request bytes              | ≤ 65 536 (P8 transport ceiling)                   |
| Max per-event semantic payload | Must fit within batch/request after JSON encoding |

## P8/P9 reuse map

| Capability               | Reuse                                                      |
| ------------------------ | ---------------------------------------------------------- |
| Auth + self-subject      | `resolve-medical-api-scope` pattern                        |
| Semantic validation      | `medical-api-validation` / domain mappers                  |
| Per-mutation transaction | `medical-event-service` pattern                            |
| Idempotency              | `medical_idempotency_records` with `adoption.import` scope |
| Audit / outbox           | existing repositories                                      |
| Revision tokens          | `createRevisionTokenService`                               |
| Production gate          | `resolveMedicalApiRuntimeCapability`                       |

## Success criteria for foundation merge gate

1. Schema migrated in test/CI PostgreSQL service container.
2. Per-item atomicity proven by rollback tests.
3. Idempotent replay and fingerprint conflict proven.
4. Adoption routes reject unauthenticated and cross-subject access.
5. IndexedDB adoption metadata durable across restart (Web).
6. No PHI in URL/log test fixtures.
7. Feature gate blocks mutations when disabled.
8. Full repository CI gates pass.

## Current decision

This charter authorizes **implementation design and foundation PRs** only. Production
medical adoption enablement remains a separate launch gate after P10-F/P10-G and
operational readiness review.
