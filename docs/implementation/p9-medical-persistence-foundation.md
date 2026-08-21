# P9 — Medical Persistence Foundation Implementation

## Status

**Implementation foundation delivered — formal production readiness pending**

Date: 2026-08-14 (implementation merged via PR #93)

Lifecycle note: security/code remediation was merged after the initial foundation
PR. This document does **not** declare production medical runtime readiness. A
formal implementation/security re-audit closure record is still required before
production enablement.

Production gate: [P9 Medical Persistence Production Readiness Runbook](p9-production-readiness-runbook.md).

## Scope delivered (this PR)

- `@diabetes-universe/medical-domain` — infrastructure-neutral domain types, semantic mappers, `MedicalRevision` bigint safety
- `@diabetes-universe/medical-persistence` — PostgreSQL schema (`medical` namespace), migrations, repositories, revision tokens, idempotency fingerprinting, purge function
- `@diabetes-universe/medical-service` — subject provisioning and transactional medical event create with idempotency, audit, and outbox atomicity

## Explicit non-delivery

- No `/api/v1/medical/*` public production routes
- No outbox dispatcher/consumer
- No IndexedDB adoption, sync, tombstones, OAuth/MFA, Community, Recipes, Marketplace

## Local database bootstrap

- Test/local: `MEDICAL_DATABASE_MODE=pglite` or `NODE_ENV=test` (applies `0000` only; **skips privilege migration**)
- Production: `MEDICAL_DATABASE_URL` + `MEDICAL_REVISION_TOKEN_SECRET` (≥32 chars, not a weak placeholder) required (fail closed)

## Migrations and privileges (production mandatory)

Canonical migration source: `packages/medical-persistence/drizzle/0000_medical_foundation.sql`

PGlite/test bootstrap loads this file via `medical-foundation-migration.ts` (no duplicate SQL).

### Deploy sequence (Neon)

1. **Create roles** (platform admin / Neon console — not applied by migrations):

   - `medical_app` — request-serving runtime
   - `medical_outbox_worker` — future outbox dispatcher
   - `medical_idempotency_maintenance` — scheduled purge caller
   - `medical_maintenance_owner` — SECURITY DEFINER function owner (not a caller credential)
   - `medical_migrator` — deploy/CI migration runner only

2. **Apply foundation migration** with `medical_migrator` via `MEDICAL_MIGRATOR_DATABASE_URL`:

   ```bash
   psql "$MEDICAL_MIGRATOR_DATABASE_URL" -f packages/medical-persistence/drizzle/0000_medical_foundation.sql
   ```

   `medical_migrator` owns created objects; it does **not** receive blanket `GRANT ALL ON SCHEMA medical` for runtime convenience.

3. **Apply privilege migration** (mandatory for production isolation):

   ```bash
   psql "$MEDICAL_MIGRATOR_DATABASE_URL" -f packages/medical-persistence/drizzle/0001_medical_privileges.sql
   ```

   This script **fails clearly** if required Neon roles are missing. Do not skip in production.

4. **Run the automated live privilege smoke check before enabling medical persistence runtime:**

   ```bash
   MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL="$MEDICAL_ADMIN_INSPECTION_DATABASE_URL" \
     pnpm --filter @diabetes-universe/medical-persistence db:smoke:privileges
   ```

   The smoke verifier inspects effective PostgreSQL ACLs and the hardened purge function. PGlite does not model the production role system sufficiently to replace this deployment gate.

### Privilege model summary

- `medical_app`: request-serving runtime; no `DELETE` or DDL; table-specific `SELECT`/`INSERT`/`UPDATE`; audit and outbox are `INSERT`-only
- `medical_outbox_worker`: worker-only; no `DELETE`; `SELECT` plus `UPDATE(status, published_at)` on outbox only
- `medical_idempotency_maintenance`: scheduled job role; no table privileges; schema `USAGE` plus `EXECUTE` only on `purge_expired_idempotency_records`
- `medical_maintenance_owner`: internal function owner; schema `USAGE` plus `SELECT` and `DELETE` only on idempotency records; not granted to callers
- `medical_migrator`: deploy/CI only; executes reviewed migration DDL and migration-scoped DML; not request-serving

`REVOKE` from `PUBLIC`, hardened `SECURITY DEFINER` purge function owned by `medical_maintenance_owner`, and default privileges prevent future objects leaking to runtime roles.

## Relationship type extensibility

- PostgreSQL stores `relationship_type` as extensible TEXT
- Partial unique indexes scope only active `self` rows
- Domain v1 exposes `SupportedAccountSubjectRelationshipType = 'self'` for provisioning; persistence accepts future caregiver/clinician labels without schema redesign

## Revision representation

- Database: `BIGINT` with `CHECK (revision <= 9007199254740991)`
- Application/domain: `MedicalRevision` (`bigint`) through persistence and services
- Revision tokens encode bigint revisions; secrets require minimum strength in production

## Verified environment state for this closure wave

The existing Neon project `diabetes-universe-auth` primary branch was inspected read-only on 2026-08-21. At inspection time it contained the existing auth/public database state but **did not contain the `medical` schema or the required P9 medical roles**.

That observation confirms the intended lifecycle boundary: the P9 implementation foundation is in source control, but production medical persistence has not yet been deployed to that Neon primary branch. No public medical runtime may be enabled until the runbook closure criteria pass on the selected target environment.

## Next step

Complete the production-readiness runbook: approved role provisioning, migrations `0000` + `0001`, live privilege smoke, runtime-credential verification, backup/PITR evidence, and formal implementation/security closure. Public medical API transport (P8) remains a separate later gate and must not be enabled as part of P9 closure.
