# P9 — Medical Persistence Foundation Implementation

## Status

**P9 IMPLEMENTATION CANDIDATE**

Date: 2026-08-14

## Scope delivered (this PR)

- `@diabetes-universe/medical-domain` — infrastructure-neutral domain types and semantic mappers
- `@diabetes-universe/medical-persistence` — PostgreSQL schema (`medical` namespace), migrations, repositories, revision tokens, idempotency fingerprinting, purge function
- `@diabetes-universe/medical-service` — subject provisioning and transactional medical event create with idempotency, audit, and outbox atomicity

## Explicit non-delivery

- No `/api/v1/medical/*` public production routes
- No outbox dispatcher/consumer
- No IndexedDB adoption, sync, tombstones, OAuth/MFA, Community, Recipes, Marketplace

## Local database bootstrap

- Test/local: `MEDICAL_DATABASE_MODE=pglite` or `NODE_ENV=test`
- Production: `MEDICAL_DATABASE_URL` + `MEDICAL_REVISION_TOKEN_SECRET` required (fail closed)

## Migrations

```bash
pnpm --filter @diabetes-universe/medical-persistence db:generate
```

Apply `packages/medical-persistence/drizzle/0000_medical_foundation.sql` with `medical_migrator` in deployment/CI.

Review `packages/medical-persistence/drizzle/grants.sql` for production role grants.

## Next step

Separate chartered PR for continued implementation within approved P9 scope. Public medical API routes remain blocked until explicitly approved.
