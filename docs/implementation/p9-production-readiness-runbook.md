# P9 — Medical Persistence Production Readiness Runbook

## Status

**Implementation / security closure candidate**

Date: 2026-08-21

## Purpose

This runbook defines the final production-readiness gate for the P9 medical persistence foundation before public medical API transport or later adoption/sync runtime may be enabled.

It does not approve public medical routes, P10 adoption runtime, P11 sync runtime, P12 conflict/tombstone runtime, or P13 operational rollout by itself.

## Preconditions

The target Neon/PostgreSQL environment must provide a dedicated medical deployment path and the following roles:

- `medical_migrator` — deploy/CI only;
- `medical_app` — request-runtime least privilege;
- `medical_outbox_worker` — narrow outbox publication access;
- `medical_idempotency_maintenance` — EXECUTE-only maintenance caller;
- `medical_maintenance_owner` — non-runtime SECURITY DEFINER owner.

Production request runtime must never use an owner/migrator credential.

## Required deployment order

1. Create the required roles through the approved platform/admin path.
2. Apply `packages/medical-persistence/drizzle/0000_medical_foundation.sql` through the deploy/migrator credential.
3. Apply `packages/medical-persistence/drizzle/0001_medical_privileges.sql` through the deploy/migrator credential.
4. Configure the request runtime with the dedicated `medical_app` credential only.
5. Configure maintenance/outbox workers with their own dedicated credentials only when those workers are implemented and approved.
6. Run the live privilege smoke verifier against the exact target database.
7. Record the environment, migration revision, smoke result, operator/change reference, and rollback point in the deployment evidence.

## Live privilege smoke

Use an administrative/read-only inspection credential that can inspect PostgreSQL role and ACL metadata. Do not use or print application secrets.

```bash
MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL='<redacted-admin-inspection-url>' \
  pnpm --filter @diabetes-universe/medical-persistence db:smoke:privileges
```

The verifier fails closed if required roles/schema are absent or if effective privileges differ from the approved P9 model.

It validates at least:

- `medical_app` has schema USAGE but no schema CREATE;
- `medical_app` has approved SELECT/INSERT/UPDATE grants and no runtime DELETE;
- audit/outbox access remains append-only for request runtime;
- outbox worker can update publication fields but not payload;
- idempotency maintenance caller has no direct table access;
- maintenance caller can execute only the hardened purge function;
- purge function remains SECURITY DEFINER, owned by `medical_maintenance_owner`, with hardened `search_path`;
- PUBLIC cannot execute the purge function;
- maintenance owner cannot read medical event resources.

## Fail-closed rule

Any privilege-smoke failure blocks production medical enablement. Do not compensate by granting broader privileges. Fix the role/migration mismatch and rerun the full gate.

## Rollback posture

P9 rollback is configuration/traffic first, not destructive data rollback:

1. disable medical runtime feature gates;
2. stop new medical mutation traffic;
3. retain authoritative medical data and audit evidence;
4. roll application code back to the last approved build if needed;
5. repair privilege/configuration drift through a reviewed migration;
6. do not drop the `medical` schema or purge user data as an operational rollback mechanism.

## Backup / recovery gate

Before production medical runtime is enabled, the owning environment must document and verify:

- backup/PITR availability for the target Neon project;
- named RPO and RTO targets;
- a restore drill or equivalent evidence that the medical schema can be recovered;
- separation of backup/recovery administration from request-runtime credentials.

P13 remains authoritative for the broader disaster-recovery and production-hardening model.

## Current environment observation

During this closure wave, the existing Neon project `diabetes-universe-auth` was inspected read-only. Its current primary branch did not contain the `medical` schema or the P9 medical roles at the time of inspection.

Therefore P9 code is merged, but live production medical persistence is **not deployed** to that current Neon primary branch. This is a deliberate blocker, not a reason to weaken the gate.

## Closure criteria

P9 production-readiness closure requires all of the following:

- repository CI green on the exact closure HEAD;
- P9 security/code re-audit with no unresolved blocking findings;
- real target environment identified;
- required roles created through approved administration;
- migrations `0000` and `0001` applied successfully;
- live privilege smoke PASS on the exact deployed target;
- runtime credential confirmed as `medical_app`-scoped rather than owner/migrator;
- backup/PITR and recovery evidence recorded;
- no public medical API route enabled as part of this closure PR;
- no P10/P11/P12 runtime scope mixed into this gate.

Until every criterion is satisfied, lifecycle status remains **foundation delivered — production readiness pending**.
