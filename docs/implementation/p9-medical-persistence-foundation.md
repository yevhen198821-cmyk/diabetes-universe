# P9 — Medical Persistence Foundation Implementation

## Status

| Gate                                | State                                      |
| ----------------------------------- | ------------------------------------------ |
| **P9 implementation foundation**    | **COMPLETE**                               |
| **PostgreSQL deployment rehearsal** | **VALIDATED**                              |
| **Production deployment**           | **DEFERRED to launch infrastructure gate** |
| **Production medical data**         | **NOT ENABLED**                            |

Date: 2026-08-14 (implementation merged via PR #93)

Closure record: 2026-08-21 (PR #101 — implementation/rehearsal gate)

This document does **not** describe a deployed production medical database. P9
implementation, security remediation, repository gates, and an isolated
PostgreSQL rehearsal on Neon Free validated the portable migration and privilege
model. Production provider selection, backup/PITR, RPO/RTO, compliance controls,
and live production deployment remain separate launch gates.

Runbook: [P9 Medical Persistence Production Readiness Runbook](p9-production-readiness-runbook.md).

## Scope delivered (this PR)

- `@diabetes-universe/medical-domain` — infrastructure-neutral domain types, semantic mappers, `MedicalRevision` bigint safety
- `@diabetes-universe/medical-persistence` — PostgreSQL schema (`medical` namespace), migrations, repositories, revision tokens, idempotency fingerprinting, purge function
- `@diabetes-universe/medical-service` — subject provisioning and transactional medical event create with idempotency, audit, and outbox atomicity

## Explicit non-delivery

- No `/api/v1/medical/*` public production routes
- No outbox dispatcher/consumer
- No IndexedDB adoption, sync, tombstones, OAuth/MFA, Community, Recipes, Marketplace
- No production medical database deployment
- No real production medical data storage

## Local database bootstrap

- Test/local: `MEDICAL_DATABASE_MODE=pglite` or `NODE_ENV=test` (applies `0000` only; **skips privilege migration**)
- PostgreSQL runtime (future launch): `MEDICAL_DATABASE_URL` + `MEDICAL_REVISION_TOKEN_SECRET` (≥32 chars, not a weak placeholder) required (fail closed)

## Infrastructure posture

Neon Free is the current **development/rehearsal** PostgreSQL environment only. It
is not mandatory production infrastructure and must not become an architectural
dependency.

P9 relies on portable PostgreSQL semantics — standard SQL migrations, role-based
privileges, and the `postgres` driver — not Neon-specific application APIs.
Final production PostgreSQL provider selection is deferred until launch planning.

## Migrations and privileges

Canonical migration source: `packages/medical-persistence/drizzle/0000_medical_foundation.sql`

PGlite/test bootstrap loads this file via `medical-foundation-migration.ts` (no duplicate SQL).

Privilege migration `0001_medical_privileges.sql` is mandatory for any real PostgreSQL
deployment that runs medical persistence with least-privilege roles. It is skipped
in PGlite/test bootstrap.

### PostgreSQL deployment rehearsal sequence

The sequence below was validated on an isolated Neon child branch. The same steps
apply to any approved PostgreSQL provider at launch; replace platform/admin steps
with the selected provider's administration path.

1. **Create roles** (platform admin — not applied by migrations):

   - `medical_app` — request-serving runtime
   - `medical_outbox_worker` — future outbox dispatcher
   - `medical_idempotency_maintenance` — scheduled purge caller
   - `medical_maintenance_owner` — SECURITY DEFINER function owner (not a caller credential)
   - `medical_migrator` — deploy/CI migration runner only

2. **Grant deploy capability to `medical_migrator`:** database CREATE is required so `0000` can create the `medical` schema. This is deploy-only and does not grant request-runtime access.

3. **Apply foundation migration** with `medical_migrator`:

   ```bash
   psql "$MEDICAL_MIGRATOR_DATABASE_URL" -f packages/medical-persistence/drizzle/0000_medical_foundation.sql
   ```

   `medical_migrator` owns created objects; it does **not** receive blanket `GRANT ALL ON SCHEMA medical` for runtime convenience.

4. **Prepare the function-ownership transfer:** platform/admin temporarily grants `medical_migrator` the ability to SET ROLE `medical_maintenance_owner`. This membership exists only for the deployment transaction.

5. **Apply privilege migration**:

   ```bash
   psql "$MEDICAL_MIGRATOR_DATABASE_URL" -f packages/medical-persistence/drizzle/0001_medical_privileges.sql
   ```

   This script is transactional and **fails clearly** if required roles, current deployment role, or ownership-transfer capability are missing. It grants schema CREATE to `medical_maintenance_owner` only inside the transaction for the PostgreSQL ownership transfer and revokes it before commit.

6. **Immediately revoke the temporary `medical_migrator` → `medical_maintenance_owner` membership.** It must not remain after deployment.

7. **Run the automated live privilege smoke check** against the deployed rehearsal or launch target:

   ```bash
   MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL="$MEDICAL_ADMIN_INSPECTION_DATABASE_URL" \
     pnpm --filter @diabetes-universe/medical-persistence db:smoke:privileges
   ```

   The smoke verifier inspects effective PostgreSQL ACLs and the hardened purge function. PGlite does not model the production role system sufficiently to replace this gate on real PostgreSQL.

### Privilege model summary

- `medical_app`: request-serving runtime; no `DELETE` or DDL; table-specific `SELECT`/`INSERT`/`UPDATE`; audit and outbox are `INSERT`-only
- `medical_outbox_worker`: worker-only; no `DELETE`; `SELECT` plus `UPDATE(status, published_at)` on outbox only
- `medical_idempotency_maintenance`: scheduled job role; no table privileges; schema `USAGE` plus `EXECUTE` only on `purge_expired_idempotency_records`
- `medical_maintenance_owner`: internal function owner; schema `USAGE` plus `SELECT` and `DELETE` only on idempotency records; no schema CREATE after migration; not granted to callers
- `medical_migrator`: deploy/CI only; executes reviewed migration DDL and migration-scoped DML; not request-serving

`REVOKE` from `PUBLIC`, hardened `SECURITY DEFINER` purge function owned by `medical_maintenance_owner`, and default privileges prevent future objects leaking to runtime roles.

## Relationship type extensibility

- PostgreSQL stores `relationship_type` as extensible TEXT
- Partial unique indexes scope only active `self` rows
- Domain v1 exposes `SupportedAccountSubjectRelationshipType = 'self'` for provisioning; persistence accepts future caregiver/clinician labels without schema redesign

## Revision representation

- Database: `BIGINT` with `CHECK (revision <= 9007199254740991)`
- Application/domain: `MedicalRevision` (`bigint`) through persistence and services
- Revision tokens encode bigint revisions; secrets require minimum strength in production-capable modes

## Rehearsal evidence (2026-08-21)

An isolated Neon child branch `p9-prod-readiness-rehearsal` was used for PostgreSQL
deployment rehearsal. The primary Neon branch was **not** modified.

The rehearsal validated:

- real PostgreSQL privilege and ownership-transfer behavior absent from PGlite;
- deploy database CREATE for `medical_migrator` and temporary SET-role capability for ownership transfer;
- corrected transactional `0001` migration design;
- live privilege smoke PASS on the rehearsal target, including:
  - purge function owned by `medical_maintenance_owner`;
  - `SECURITY DEFINER` enabled;
  - hardened `search_path=medical, pg_temp`;
  - PUBLIC EXECUTE denied;
  - maintenance owner schema CREATE removed after transfer;
  - temporary migrator SET-role capability removed after operator revocation.

No production medical data was stored. No production deployment occurred.

## Current environment observation

The existing Neon project `diabetes-universe-auth` primary branch was inspected
read-only on 2026-08-21. It contained auth/public database state but **did not**
contain the `medical` schema or P9 medical roles. That remains intentional: Neon
Free continues as development/rehearsal infrastructure only.

## Next step

1. **Medical API transport (P8)** — implement versioned HTTP routes against the
   existing domain/persistence/service foundation in a separate approved wave.
2. **Production launch infrastructure gate** — select production PostgreSQL provider,
   define RPO/RTO, establish backup/PITR and restore evidence, deploy reviewed
   migrations to the launch target, run live privilege smoke, configure
   `medical_app` runtime credentials, and complete security/compliance review before
   enabling production medical traffic.

Public medical API transport and production medical persistence deployment are
separate gates and must not be conflated.
