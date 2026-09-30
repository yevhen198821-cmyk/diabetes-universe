# Medical Neon installation and evidence: 2026-09-30

The medical schemas are installed on production Neon. The production application
has **not yet been verified against them**: Vercel environment access and a real
authenticated end-to-end check remain outstanding. This is not beta approval.

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

Database checks do not establish production login, session revocation, API audit
coverage, adoption, two-device synchronization, or cross-account API isolation.
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

## Application activation still required

Inspect the production Vercel project's actual connection targets first. Keep
`DATABASE_URL` for authentication separate from `MEDICAL_DATABASE_URL`. Set the
latter to the generated `du_medical_app` connection, never the owner/deployer URI.
Medical configuration requires:

- `MEDICAL_DATABASE_MODE=postgres`;
- independent strong `MEDICAL_REVISION_TOKEN_SECRET` and `MEDICAL_LIST_CURSOR_SECRET`;
- `MEDICAL_RATE_LIMIT_MODE=distributed`, `MEDICAL_RATE_LIMIT_BACKEND=postgres`;
- adoption/sync feature flags initially disabled pending authenticated qualification.

Never set `MEDICAL_DEPLOYER_DATABASE_URL` or the bootstrap URL on Vercel runtime.
Production cannot use E2E authentication fixtures or a process-local rate limiter.
Perform real login, CRUD/retry, cross-account denial, session revocation, adoption
and two-device sync checks before enabling the corresponding flags for a cohort.
The connected Vercel tool currently supplies no environment-management operation;
CLI device authentication by the owner is necessary to complete this part.

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
- The existing auth-only snapshot `snap-hidden-smoke-auh90mbm` and its earlier
  restore branch `br-plain-unit-au0rwpjq` are retained.
- Neon rejected a second root snapshot with `snapshots limit exceeded` and a
  rehearsal snapshot with `not allowed to snapshot non-root branch`.

Copying a branch proves state/role propagation, not restoration from an independent
medical snapshot, application reconnect, or a measured RTO. The production branch
was not replaced or promoted. Six-hour PITR and the existing single manual snapshot
do not establish a monitored automatic backup policy. Choose a supported retention
and backup plan, then rehearse medical snapshot/PITR recovery with authenticated
checks. Backups must honor an erasure suppression ledger before reopening access.
Account-wide erasure and that ledger are still missing; event soft-delete retains
clinical payload. See the [beta blockers](beta-readiness-2026-09-30.md).

## Repository verification

The updated full unit/integration suite passed 2,144 of 2,145 tests; one external
identity PostgreSQL test was skipped locally because `AUTH_TEST_POSTGRES_URL` was
not set. The new installation tests verify atomic schema/role rollback, runtime
permission denial, actor-guard preservation and rejection of administrative role
attributes/memberships. Typecheck, ESLint, formatting and Markdown links passed.
The CI workflow additionally supplies real PostgreSQL for the external auth test,
builds the application and runs the browser suite.
