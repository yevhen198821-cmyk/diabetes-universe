# P9 — Medical Persistence Foundation Implementation

## Status

**P9 IMPLEMENTATION CANDIDATE**

Date: 2026-08-14

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

4. **Run a live Neon privilege smoke check before enabling medical persistence runtime.** Verify from PostgreSQL system catalogs or an equivalent deployment smoke script that the effective state is:

   - `medical_app`: no `DELETE`, no DDL; table-specific privileges only;
   - `medical_idempotency_maintenance`: schema `USAGE` + `EXECUTE` only on `medical.purge_expired_idempotency_records(integer)`, with no direct table privileges;
   - `medical_maintenance_owner`: schema `USAGE` + `SELECT, DELETE` only on `medical.medical_idempotency_records`; no privileges on unrelated medical tables;
   - `PUBLIC`: no unintended access to medical schema/tables/functions;
   - the purge function owner is `medical_maintenance_owner` and PUBLIC EXECUTE remains revoked.

   PGlite does not model the production role system sufficiently to replace this deployment gate. Do not enable production medical persistence until the live privilege check passes.

### Privilege model summary

| Role                              | Runtime   | DELETE on medical tables            | Notes                                                                 |
| --------------------------------- | --------- | ----------------------------------- | --------------------------------------------------------------------- |
| `medical_app`                     | yes       | **none**                            | SELECT/INSERT/UPDATE per table; audit INSERT-only; outbox INSERT-only |
| `medical_outbox_worker`           | worker    | **none**                            | SELECT + UPDATE(status, published_at) on outbox only                  |
| `medical_idempotency_maintenance` | job       | **none**                            | schema USAGE + EXECUTE on `purge_expired_idempotency_records` only   |
| `medical_maintenance_owner`       | internal  | idempotency only (function owner)   | SELECT + DELETE on idempotency only; not granted to callers           |
| `medical_migrator`                | deploy/CI | via reviewed migration scripts only | not request-serving                                                   |

`REVOKE` from `PUBLIC`, hardened `SECURITY DEFINER` purge function owned by `medical_maintenance_owner`, and default privileges prevent future objects leaking to runtime roles.

## Relationship type extensibility

- PostgreSQL stores `relationship_type` as extensible TEXT
- Partial unique indexes scope only active `self` rows
- Domain v1 exposes `SupportedAccountSubjectRelationshipType = 'self'` for provisioning; persistence accepts future caregiver/clinician labels without schema redesign

## Revision representation

- Database: `BIGINT` with `CHECK (revision <= 9007199254740991)`
- Application/domain: `MedicalRevision` (`bigint`) through persistence and services
- Revision tokens encode bigint revisions; secrets require minimum strength in production

## Next step

Separate chartered PR for continued implementation within approved P9 scope. Public medical API routes remain blocked until explicitly approved.
