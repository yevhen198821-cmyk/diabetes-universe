# Beta readiness: 2026-09-30

## Current decision

Medical production beta remains blocked. This change supplies reviewable runtime
code and recovery evidence; it does not certify or deploy the medical backend.
Operator supplied by the owner: Resulto, Poland. Support:
[resulto.universe@gmail.com](mailto:resulto.universe@gmail.com).
A company registration/address, approved privacy notice and terms remain necessary.

## Live observations

- Vercel production deployment `dpl_756NjYF1C5B3F9hppBuPATvSMVCN` was READY,
  serving main commit `e1dc374559ff528953254bac3d706409e7338d68`.
- `https://diabetes-universe-web.vercel.app/api/auth/get-session` returned 200/null
  without a session. Anonymous medical reads returned 401 `AUTH_REQUIRED` with
  private/no-store. Successful production login, authenticated CRUD and session
  revocation were **not** verified. A working anonymous gate does not prove them.
- Owner-selected Neon project `hidden-wave-09272295`, main
  `br-soft-night-audxwvre`, contained public authentication tables but no `medical`
  schema. The owner confirmed there is no separate medical project. The medical backend
  has not been deployed in the supplied Neon project.
- `medical_deployer` was absent. `neondb_owner` was not superuser and had no
  membership/SET authority for the medical roles. Existing privilege migration
  explicitly requires an approved migration actor and temporary SET authority for
  `medical_maintenance_owner`. Do not widen `medical_app` or skip privilege SQL.
- Rehearsal-branch privilege preflight also showed `medical_migrator` cannot SET
  `medical_maintenance_owner`. `medical_app` has CREATEROLE/CREATEDB and inherited
  membership/SET in `neon_superuser`; this is not a least-privilege runtime role.
  All inspected login roles inherit that provider role without ADMIN OPTION.
  A table grant script alone does not remove this authority. Platform administration
  must provision a restricted runtime role and supported ownership-transfer path.
- Point-in-time retention was 21,600 seconds (six hours); no automatic snapshot
  schedule was configured on the selected main branch.

## Recovery rehearsal

A manual main-branch snapshot `snap-hidden-smoke-auh90mbm`
(`beta-readiness-2026-09-30`, 19:21:39 UTC) was restored into the **new** branch
`br-plain-unit-au0rwpjq` (`beta-restore-rehearsal-2026-09-30`), with finalization
false. Production compute/name/default branch were not switched.
Both main and restored branch had one auth user, nine session rows, and no medical
schema. Schema inspection and aggregate counts matched; no personal records were
printed. This confirms snapshot restoration of the existing authentication database.
It does not validate medical recovery, application reconnect, full integrity,
security after restore, or an end-to-end RTO.
An additional isolated migration rehearsal branch is `br-purple-night-aul8fdd3`.
Rehearsal branches are retained for inspection, not deleted automatically.

Before beta, select and record a business RPO/RTO, configure a supported automatic
backup schedule and retention, monitor failures, and rehearse the medical database
on a separate restore branch. Verify schema/version, constraints, aggregate counts,
authenticated API reads/writes and isolation using synthetic accounts. Replay an
erasure suppression ledger before reopening access; old snapshots must not revive
erased subjects. Record measured times, operator and recovery evidence. Never
finalize a restore over production during a rehearsal.

## Runtime behavior supplied

- A repeated create returns the original payload/revision even after update or
  soft deletion. It does not resurrect the deleted row. Payload is reconstructed
  only after its complete semantic fingerprint matches the original request.
- Fingerprints now recursively include nested clinical values. Version `v2:` fails
  closed against historical hashes that omitted nested values. Such retries receive
  `IDEMPOTENCY_CONFLICT`; do not replace keys blindly (that can duplicate records).
  Existing adoption mappings require deliberate reconciliation before rollout.
- `/data` explains browser/profile-local storage and exports every store in one
  consistent readonly transaction, including quarantine, acknowledgements, queued
  edits and conflict evidence. The JSON is a local diagnostic archive; it is neither
  a cloud/account export nor a supported restore/import format.
- Explicit local deletion removes only the selected IndexedDB database. Other open
  connections receive versionchange; blocked deletion waits for them to close.
  Download an archive first if wanted. It does not erase account, cloud or backups.
- Authenticated profiles can explicitly adopt local data using resumable sessions.
  Nutrition schema v2 is eligible. Demo records are excluded; quarantine is retained.
  Adoption is a one-time copy, not a live sync promise. Anonymous history is not
  silently moved into an account. Account switching aborts stale network authority.
- Sync is explicit opt-in and requires `MEDICAL_SYNC_ENABLED=true` server side.
  Local writes and queue intent commit together. Mutation requests persist before
  sending; acknowledgements and server idempotency outcomes survive ambiguous
  responses. Pull applies projection and cursor atomically and never emits new
  outgoing edits. Web Locks serialize same-profile adoption/sync across tabs.
- Enabling sync queues reconciliation of adopted records, including local edits and
  deletions since adoption. CAS conflicts retain local edits and server evidence;
  tombstones remove projections without losing pending payloads. The status banner
  exposes pending writes, conflicts and failures. Sync runs while the app is open.
- Event detail/list/sync pull record successful disclosure before returning data.
  Audit details contain counts/identifiers, not clinical payloads. A failed audit
  insert fails the read. This does not yet cover every denial/auth/settings read.

## Repeatable role preflight

Run the read-only [preflight SQL](../../scripts/sql/medical-runtime-preflight.sql)
against the target with an approved connection. On the isolated Neon rehearsal
branch all five checks failed: schema, required roles, restricted runtime attributes,
restricted role membership and migration ownership-transfer authority. The script
queries only platform catalogs. Passing it is a prerequisite, not a substitute for
the table-grant/DDL denial matrix or authenticated API checks.

## Safe rollout sequence

1. Confirm the exact production auth and medical connection targets without copying
   credentials into logs, PRs or chat. Obtain the existing approved migration actor
   and ownership-transfer authority from the database/platform administrator.
2. Apply the ordered foundation/adoption/settings/rate-limit migrations and their
   privilege scripts on the isolated rehearsal branch, then `0009_medical_sync.sql`
   and `0010_medical_sync_privileges.sql`. A final deployment grants the runtime role
   only the table-specific privileges. Runtime must not use deploy/owner roles.
3. Verify as `medical_app`: normal API works; DDL, direct audit modification,
   unauthorized DELETE, cross-subject reads and privileged maintenance are denied.
   Verify the trigger and outcome writes under this role, not PGlite owner alone.
4. Deploy with sync disabled, confirm auth, real distributed rate limiting,
   synthetic account isolation and API no-store. Rehearse adoption with interruption,
   nested payload retries, two devices, offline edits, conflicts and deletion.
5. Before enabling sync, resolve the launch blockers below. Enable only for an
   isolated synthetic beta cohort and observe acknowledgements/errors. Disable the
   server flag to pause network sync; preserve local queues and exports for recovery.

## Account erasure and support procedure

The support page supplies a contact and directs users to request account/cloud
access or erasure. It does not claim automatic or completed erasure. Email must not
contain glucose history, exported archives, credentials or session tokens.

The responsible operator must authenticate a request through the signed-in account
or another verified channel; an email address alone is insufficient authority.
Inventory account/subject relationships and legal retention before approving any
purge. Revoke sessions and disable access, pause writers/adoption/workers, preserve
only a minimal non-clinical erasure receipt and suppression marker, then use a
separate approved maintenance procedure for canonical events (including tombstones),
settings/targets, adoption items/mappings, idempotency, sync changes/outcomes,
outbox, auth credentials/avatars and downstream consumers. Shared subject access
must be reconciled before erasure. Verify denial and absent clinical content after
completion. Manage backups by expiry and suppression on restore, not a false claim
of immediate backup erasure. Send the requester a receipt and actual scope/timing.

A validated account-wide erasure executor, suppression ledger and request tracking
are **not implemented**. The current delete-event API is a soft delete and retains
clinical payload. The runtime role intentionally lacks hard DELETE. Do not beta
launch with a support email alone as the erasure mechanism.

## Remaining launch blockers

- Approved production migration actor, exact target configuration and live runtime
  privilege tests; authenticated production end-to-end verification.
- Complete read/denial audit coverage, restricted audit review/retention and alerting.
- Verified account-wide erasure, downstream/backup suppression and tracked requests.
- Approved privacy/terms and operator legal identity/address.
- Automatic backup monitoring and medical restore/reconnect rehearsal against RPO/RTO.
- Conflict resolution workflow; queue/ledger/tombstone retention and compaction with
  stale-device rebootstrap/cursor expiration. Current ledger/outcomes do not expire.
- Cross-tab/browser lifecycle qualification and bounded long-history adoption/export
  memory behavior. No service-worker/background guarantee is made.

## Verification evidence for this change

The unit/integration suite contained 2,141 tests: 2,140 passed and one external
identity PostgreSQL test was skipped because AUTH_TEST_POSTGRES_URL was not set.
The affected locale suites were rerun after the support namespace correction.
Typecheck, ESLint, Prettier, production build, Markdown links, OpenAPI schema,
OpenAPI compatibility against origin/main and 21 OpenAPI contract tests passed.
Browser inspection covered local data, support and the home page.
The full browser suite initially passed 201 scenarios; three tests exposed a
single-store-only delay hook that no longer intercepted atomic event/queue writes,
and six dependent serial scenarios were not run. The hook now delays the complete
atomic write. All 16 scenarios in the affected files and local-data/profile checks
passed on rerun, including the three failures and six skipped dependents. Across
the full run and this rerun, all 210 distinct browser scenarios have a passing result.
