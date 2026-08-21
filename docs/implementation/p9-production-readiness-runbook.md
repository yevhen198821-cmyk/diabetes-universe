# P9 — Medical Persistence Readiness Runbook

## Status

| Gate                                | State                   |
| ----------------------------------- | ----------------------- |
| **A. Development / rehearsal gate** | **CLOSED** (2026-08-21) |
| **B. Production launch gate**       | **DEFERRED**            |

Date: 2026-08-21

## Purpose

This runbook records the P9 medical persistence readiness model across two
separate gates:

- **Gate A** — implementation validation, PostgreSQL migration rehearsal, and
  privilege smoke on an isolated target.
- **Gate B** — future production launch controls before real medical traffic and
  production medical data are enabled.

It does not approve public medical routes, P10 adoption runtime, P11 sync runtime,
P12 conflict/tombstone runtime, or P13 operational rollout by itself.

## Infrastructure decision

Neon currently serves as:

- development PostgreSQL;
- migration rehearsal environment;
- privilege and security validation environment.

Neon Free is **not** the permanent mandatory production platform for Diabetes
Universe. We are not upgrading to Neon Scale as part of this gate, and we are not
deploying medical persistence to the Neon primary branch now.

P9 must remain portable PostgreSQL. Application runtime depends on PostgreSQL
semantics — standard SQL, role-based privileges, and the `postgres` driver — not
Neon-specific application APIs, branching APIs, or HTTP database drivers.

Production PostgreSQL provider selection is deferred until launch planning.

The selected launch provider must support required capabilities including, at
minimum:

- supported PostgreSQL version compatible with reviewed migrations;
- encryption in transit;
- encryption at rest;
- automated backups;
- point-in-time recovery or equivalent;
- defined retention;
- tested restore procedure;
- monitoring;
- least-privilege database roles;
- secret rotation;
- regional/data residency requirements where applicable;
- required healthcare/privacy/compliance controls for launch markets.

Compliance requirements depend on launch jurisdiction and business/legal model. This
runbook does not prescribe a universal legal certification.

## RPO/RTO decision

RPO and RTO are launch-SLA decisions. They remain **unresolved** until production
infrastructure is selected and launch planning completes.

They become a blocking **production launch gate**. Development/rehearsal completion
does **not** require final production RPO/RTO values.

## Gate A — Development / rehearsal (CLOSED)

Gate A confirms that the P9 implementation foundation is complete and that the
portable PostgreSQL deployment path was validated on real PostgreSQL outside PGlite.

### Gate A closure criteria (met)

- repository CI green on the closure HEAD;
- P9 security/code audit with no unresolved blocking findings in scope;
- canonical migrations `0000` and corrected transactional `0001` reviewed;
- isolated PostgreSQL rehearsal performed on disposable branch
  `p9-prod-readiness-rehearsal`;
- primary Neon branch **not** modified during rehearsal;
- ownership-transfer issue discovered and corrected during rehearsal;
- live privilege smoke PASS on rehearsal target;
- no public medical API routes in scope;
- no P10/P11/P12 runtime in scope;
- no production medical data stored;
- no production medical traffic enabled.

### Gate A lifecycle wording

**P9 implementation foundation — COMPLETE**
**PostgreSQL deployment rehearsal — VALIDATED**
**Production deployment — DEFERRED to launch infrastructure gate**

### Rehearsal evidence

A disposable Neon branch `p9-prod-readiness-rehearsal` was created from the primary
branch on 2026-08-21 and used only for deployment rehearsal.

The rehearsal established:

- `0000` requires deploy-only database CREATE for `medical_migrator`;
- the original `0001` ordering could not transfer function ownership safely on real
  PostgreSQL because the new owner lacked schema CREATE and ownership-transfer role
  capability;
- granting permanent CREATE to `medical_maintenance_owner` would violate least
  privilege, so the migration was corrected to grant it only transactionally for the
  ownership transfer;
- temporary migrator membership in `medical_maintenance_owner` is required only for
  the transfer and must be revoked after deployment;
- after the corrected sequence, observed effective privileges matched the intended
  model for `medical_app`, idempotency maintenance, and maintenance-owner schema
  CREATE denial;
- final rehearsal verification confirmed:
  - purge function owner = `medical_maintenance_owner`;
  - `SECURITY DEFINER` enabled;
  - hardened `search_path=medical, pg_temp`;
  - PUBLIC EXECUTE denied;
  - maintenance owner schema CREATE removed;
  - temporary migrator SET-role capability removed.

No credentials or connection strings are recorded in repository documentation. No
changes were applied to the primary Neon branch during this rehearsal.

### Rehearsal deployment order

1. Create the required roles through the approved platform/admin path.
2. Grant deploy-only database CREATE to `medical_migrator`.
3. Apply `packages/medical-persistence/drizzle/0000_medical_foundation.sql` through the `medical_migrator` credential.
4. Temporarily grant `medical_migrator` SET-role capability for `medical_maintenance_owner`.
5. Apply `packages/medical-persistence/drizzle/0001_medical_privileges.sql` through the `medical_migrator` credential. The migration is transactional and fails closed if its role prerequisites are not met.
6. Immediately revoke the temporary `medical_maintenance_owner` membership from `medical_migrator`.
7. Run the live privilege smoke verifier against the exact rehearsal database.
8. Record rehearsal evidence: environment name, branch/target, migration revision, smoke result, operator/change reference, and confirmation that temporary membership was revoked.

### Ownership-transfer prerequisite

A real PostgreSQL rehearsal on 2026-08-21 confirmed two requirements that are not
modeled by PGlite:

1. `medical_migrator` needs database-level CREATE capability to create the `medical` schema during `0000`.
2. Transferring the purge function to `medical_maintenance_owner` requires the migrator to be able to SET ROLE to that owner, and the new owner must temporarily have CREATE on the `medical` schema.

The approved deployment pattern is therefore:

- platform/admin grants database CREATE to `medical_migrator` as a deploy-only capability;
- platform/admin temporarily grants `medical_maintenance_owner` membership/SET-role capability to `medical_migrator` immediately before `0001`;
- `0001` itself grants schema CREATE to `medical_maintenance_owner` only inside its transaction, transfers the function, and revokes schema CREATE before commit;
- platform/admin immediately revokes the temporary role membership after `0001` succeeds.

The temporary membership must not remain after deployment. `medical_maintenance_owner` remains a non-login, non-runtime owner role.

Production request runtime must never use an owner/migrator credential.

Required roles:

- `medical_migrator` — deploy/CI only;
- `medical_app` — request-runtime least privilege;
- `medical_outbox_worker` — narrow outbox publication access;
- `medical_idempotency_maintenance` — EXECUTE-only maintenance caller;
- `medical_maintenance_owner` — non-runtime SECURITY DEFINER owner.

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
- maintenance owner cannot read medical event resources;
- maintenance owner has no schema CREATE after the migration;
- temporary migrator → maintenance-owner membership has been revoked after deployment.

## Fail-closed rule

Any privilege-smoke failure blocks production medical enablement. Do not compensate by granting broader privileges. Fix the role/migration mismatch and rerun the full gate.

## Gate B — Future production launch (DEFERRED)

Gate B remains a future checklist. Completing Gate A does **not** authorize
production medical traffic, production medical data storage, or Neon primary-branch
deployment.

Before production medical runtime is enabled, all of the following must be satisfied
on the selected launch target:

1. select exact production PostgreSQL provider and environment;
2. define launch RPO/RTO targets;
3. establish backup/PITR or equivalent and record retention;
4. perform and record a restore drill or equivalent evidence;
5. complete security/compliance review for launch markets;
6. create required roles through approved administration;
7. grant deploy-only database CREATE to `medical_migrator`;
8. apply reviewed migrations `0000` and transactional `0001`;
9. immediately revoke temporary migrator → maintenance-owner membership;
10. run live privilege smoke PASS on the exact production target;
11. configure request runtime with dedicated `medical_app` credential only;
12. configure maintenance/outbox workers with dedicated credentials when implemented;
13. explicitly authorize production medical traffic through product/feature gates;
14. record deployment evidence and rollback/backup point.

P13 remains authoritative for the broader disaster-recovery and production-hardening model.

## Rollback posture

P9 rollback is configuration/traffic first, not destructive data rollback:

1. disable medical runtime feature gates;
2. stop new medical mutation traffic;
3. retain authoritative medical data and audit evidence;
4. roll application code back to the last approved build if needed;
5. repair privilege/configuration drift through a reviewed migration;
6. do not drop the `medical` schema or purge user data as an operational rollback mechanism.

## Current environment observation

During this closure wave, the existing Neon project `diabetes-universe-auth` was
inspected read-only. Its primary branch did not contain the `medical` schema or the
P9 medical roles at the time of inspection.

That is expected and intentional:

- P9 source is merged and rehearsal-validated;
- Neon Free remains development/rehearsal infrastructure only;
- production medical persistence is **not deployed**;
- production medical data is **not enabled**.

## Medical API baseline note

Gate A closure prepares the repository for a separate **Medical API implementation
wave (P8 transport)**. Public HTTP routes, controllers, error mapping, rate limits,
and contract tests are out of scope for this runbook gate and remain future work.
