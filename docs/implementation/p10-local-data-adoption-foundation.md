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
