# Medical Neon installation and evidence: 2026-09-30

The medical schemas are installed on production Neon, and Vercel uses the restricted
application connection. A genuine email login and its authenticated medical database
access are confirmed. Full authenticated CRUD, account isolation and two-device
synchronization remain outstanding. This is not beta approval.

## Target and completed checks

- Project: `hidden-wave-09272295`; PostgreSQL 18.6; database `neondb`.
- Production branch: `br-soft-night-audxwvre`.
- Final installation rehearsal: `br-divine-night-au34dobf`.
- Production installation: all 13 SQL migrations, including `0009`/`0010` sync,
  applied atomically. Original migration hashes are recorded in
  `medical_ops.deployment_manifest`; this table has no application grant.
- The exact approved actor remains `medical_deployer`. Binding the fixed
  `neon-sql` role profile does not rewrite migration actor names or their guards.
- Production role/ACL smoke and all eight catalog preflight checks passed.
  The application connection created, updated and soft-deleted a synthetic event;
  sync emitted sequences 1, 2 and 3, including the deletion marker. The transaction
  deliberately rolled back, and its subject was confirmed absent afterwards.
- Direct application attempts at medical DDL, hard DELETE and reading audit rows
  were denied on rehearsal. Assuming `medical_deployer` was denied too.
- After production installation: one auth user, nine sessions, zero medical
  subjects/events/sync changes. Counts matched the before-installation auth counts.
  Personal records and credentials were not printed.

The rollback database checks alone do not establish production login, session
revocation, API audit coverage, adoption, two-device synchronization, or
cross-account API isolation. Separate live login evidence is recorded below.
Subject authorization is enforced by the API; these tables do not implement
per-account PostgreSQL RLS. A schema grant is not an account-isolation test.

## SQL-created roles

Neon Console/API-created legacy roles inherit provider administrative authority.
They remain present for inspection, but must not be selected as medical runtime
connections. Create the restricted roles using SQL, not the role-creation API.
See [Neon role documentation](https://neon.com/docs/manage/roles).

| Architectural role                | Installed role                       | Login | Purpose                                   |
| --------------------------------- | ------------------------------------ | ----- | ----------------------------------------- |
| `medical_app`                     | `du_medical_app`                     | Yes   | Table-specific request grants             |
| `medical_outbox_worker`           | `du_medical_outbox_worker`           | No    | Narrow outbox grants; worker not deployed |
| `medical_idempotency_maintenance` | `du_medical_idempotency_maintenance` | No    | Execute the approved purge function       |
| `medical_maintenance_owner`       | `du_medical_maintenance_owner`       | No    | Own the hardened purge function           |
| `medical_deployer`                | `medical_deployer`                   | Yes   | Deployment only                           |

All five lack SUPERUSER, CREATEDB, CREATEROLE and BYPASSRLS and cannot assume a
provider administrator role. No runtime role inherits a deployment/maintenance
role. Temporary maintenance-owner membership is removed from the deployer after
installation. Schema CREATE is removed from the maintenance owner too.

Neon grants the SQL role creator (`neondb_owner`) ADMIN OPTION from `cloud_admin`,
with INHERIT/SET false. Retain that operator authority for credential rotation and
future temporary migration grants. Remove the deployer's temporary self-granted
SET option without revoking the creator's ADMIN grant. Runtime never receives
this operator connection. The existing `medical_migrator` is a legacy prerequisite;
the `neon-sql` installer does not execute as it or use its credentials.

## Repeatable initial installation

Install the complete workspace using `pnpm install --frozen-lockfile`. These are
operator scripts, never application imports or request-time migrations.

Set `MEDICAL_BOOTSTRAP_DATABASE_URL` through an operator secret binding and
`MEDICAL_BOOTSTRAP_SECRET_FILE` to an absolute path outside the repository in a
protected location. Then run:

```sh
pnpm --filter @diabetes-universe/medical-persistence db:deploy:initial
```

For a Neon HTTP connection, set `MEDICAL_SQL_TRANSPORT=neon-http`. The workspace
rehearsal used Node 24.19 with `node --use-env-proxy` to honor its HTTP proxy;
there is no permitted direct PostgreSQL route in that workspace. The normal
operator path defaults to the PostgreSQL driver and uses one outer transaction.
Both transports execute the same SQL and original migrations. HTTP batches wrap
each multi-statement migration in an invoker DO block inside that transaction.

The installer refuses existing medical schemas or installation roles. It is an
**initial installer**, not a general migration runner. It never drops clinical
data or rotates credentials on rerun. The secret JSON file is created exclusively
with mode 0600 before sending the transaction. It is retained on failure because
a connection error can leave commit outcome uncertain. Inspect database state
before retrying. Move credentials into a durable encrypted operator secret store;
never put them in Git, shell history, a PR, chat, or logs.

Future migrations use `medical_deployer` directly. The operator can grant precisely
the temporary maintenance-owner authority needed for ownership changes, run the
reviewed migrations as the approved actor, remove that authority, and rerun the
smoke. Do not rerun foundation scripts indiscriminately over an existing schema.
Credential rotation uses the retained operator ADMIN authority.

## Post-installation verification

Set `MEDICAL_ROLE_PROFILE=neon-sql` for the operator checks only. The web runtime
does not need this variable. Use the deploy-only connection for the catalog/ACL
smoke, and the application connection for the rollback lifecycle smoke:

```sh
pnpm --filter @diabetes-universe/medical-persistence db:smoke:privileges
pnpm --filter @diabetes-universe/medical-persistence db:smoke:lifecycle
```

The respective secret inputs are `MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL` and
`MEDICAL_LIFECYCLE_SMOKE_DATABASE_URL`. The lifecycle check uses Neon HTTP and
deliberately fails the last statement to roll back all synthetic writes.

The read-only [catalog preflight](../../scripts/sql/medical-runtime-preflight.sql)
supports session settings `du.medical_role_profile=neon-sql` and
`du.medical_preflight_phase=runtime` (the default phase). All rows must pass.
The temporary `deployment` phase expects ownership-transfer authority; the final
`runtime` phase requires it to be removed. Do not leave the deployment phase set
when certifying post-installation access.

## Production application activation and email login

Vercel project `diabetes-universe-web`, Resulto team, now serves merged main commit
`916d0dc92ebbd154d32fab843d07ee8a1c95e3f8` on deployment
`dpl_8ezpKsfAV5cXEvug1pAT6NxGx8iT` (READY), with the canonical alias
[diabetes-universe-web.vercel.app](https://diabetes-universe-web.vercel.app).
The owner completed CLI device authentication. Production-only environment values
were installed; existing preview values and authentication secrets were preserved.

- `MEDICAL_DATABASE_URL` uses `du_medical_app`; authentication retains its separate
  `DATABASE_URL`. Neither owner nor deployment credentials were added to runtime.
- `MEDICAL_DATABASE_MODE=postgres`, `MEDICAL_RATE_LIMIT_MODE=distributed` and
  `MEDICAL_RATE_LIMIT_BACKEND=postgres` are configured.
- Independent strong revision-token and list-cursor secrets are stored as Sensitive
  Vercel values, rather than exposed Config values.
- `MEDICAL_ADOPTION_ENABLED=false` and `MEDICAL_SYNC_ENABLED=false` remain in place
  pending authenticated adoption/sync qualification and resolution of launch blockers.

Anonymous medical reads returned 401 `AUTH_REQUIRED` with private/no-store;
supplying a forged E2E account header did not authenticate them. Anonymous auth
session reads returned 200/null. These checks alone do not exercise the database.

A real magic-link login was requested only for owner-authorized addresses. The
support address was rejected by Resend with `validation_error`. The second request,
to the Resend owner's address, produced no delivery rejection. A read-only aggregate
check then confirmed that address was verified, a fresh real session existed, and
an active medical account/subject relationship had been provisioned by authenticated
application access. PostgreSQL rate-limit windows also appeared. No session token,
magic link, credential or clinical payload was read or printed. This verifies live
authentication and access to the configured medical backend, not a complete API
create/update/delete, revocation or cross-account isolation scenario.

The current sender is `onboarding@resend.dev`: Resend's test sender is restricted to
the Resend account owner. Public beta login requires a verified sending domain and
a valid `AUTH_EMAIL_FROM` address on that domain. The generic check-email screen
alone does not confirm delivery. Do not distribute the test-sender configuration
as a working public registration flow.

Perform authenticated CRUD/retry, cross-account denial, session revocation, adoption
and two-device sync checks before enabling the corresponding flags. Production
cannot use E2E authentication fixtures or a process-local rate limiter.

## Recovery evidence and limits

- Pre-installation production checkpoint: `br-patient-resonance-auzugey0`, named
  `before-medical-installation-20260930`, parent `br-soft-night-audxwvre`, LSN
  `0/22368B0`. It was copied before production medical installation.
- Earlier synthetic medical rehearsal `br-purple-night-aul8fdd3` was copied into
  `br-blue-sea-augckizu` (`medical-recovery-clone-20260930`). The copied event stayed
  deleted at revision 2; its sync head stayed at sequence 2 and the deletion marker
  was preserved. The copied branch passed role/ACL smoke. Use the final rehearsal
  branch for current installer/rotation tests; the earlier experiment revoked its
  creator ADMIN memberships and must not be used as the deployment template.
- With the owner's explicit authorization, the sole old auth-only snapshot
  `snap-hidden-smoke-auh90mbm` was replaced with the full production snapshot
  `snap-soft-band-auzhmnc1`, named `medical-production-20260930`, created
  `2026-09-30T23:41:13Z` from `br-soft-night-audxwvre`.
- That snapshot was restored into a **new** branch `br-frosty-queen-auyiv84q`, named
  `medical-snapshot-restore-20260930`, with finalization false. All 13 migration
  records, auth counts (one user/nine sessions), medical schemas and restricted
  role/ACL checks matched. The restricted application connection passed synthetic
  create/update/soft-delete/sync rollback smoke on the restored branch too.
- At snapshot capture, medical subjects/events/sync changes were empty. Populated
  deletion-marker preservation was demonstrated by the earlier branch-copy test;
  it must not be attributed to this empty medical snapshot. The earlier auth-only
  restore branch `br-plain-unit-au0rwpjq` remains available for inspection.

The production branch was not replaced or promoted. These checks verify an actual
medical schema snapshot restoration and restricted-role lifecycle behavior; they
exclude authenticated application reconnect and a measured end-to-end RTO. The
six-hour PITR window and one manual snapshot do not establish a monitored automatic
backup policy. Record business RPO/RTO, select supported retention and scheduling,
monitor backup failures, and rehearse authenticated application reconnect. Backups
must honor an erasure suppression ledger before reopening access.
Account-wide erasure and that ledger are still missing; event soft-delete retains
clinical payload. See the [beta blockers](beta-readiness-2026-09-30.md).

## Repository verification

[PR #171](https://github.com/yevhen198821-cmyk/diabetes-universe/pull/171) merged the
restricted-role installer and verification scripts. Both its CI run and the merged
main run passed: 2,145 unit/integration tests (including real PostgreSQL identity
coverage), 211 browser scenarios, build, typecheck, ESLint, formatting, Markdown
links and OpenAPI checks. Main CI run:
[36792049628](https://github.com/yevhen198821-cmyk/diabetes-universe/actions/runs/36792049628).
The new installation tests verify atomic schema/role rollback, runtime permission
denial, actor-guard preservation and rejection of administrative role attributes
and memberships. These automated scenarios are separate from live production
verification; they do not remove the remaining beta blockers.
