# Beta readiness: 2026-09-30

## Current decision

Medical production beta remains blocked. This change supplies reviewable runtime
code and recovery evidence. Medical schemas are installed on Neon, the restricted
Vercel connection is active, and a genuine email login reached the medical backend.
Full authenticated lifecycle qualification and beta certification remain outstanding. See the
[production installation evidence](medical-neon-production-runbook.md).
Operator supplied by the owner: Resulto, Poland. Support:
[resulto.universe@gmail.com](mailto:resulto.universe@gmail.com).
A company registration/address, approved privacy notice and terms remain necessary.

## Live observations

- Vercel production deployment `dpl_8ezpKsfAV5cXEvug1pAT6NxGx8iT` was READY,
  serving main commit `916d0dc92ebbd154d32fab843d07ee8a1c95e3f8`.
- `https://diabetes-universe-web.vercel.app/api/auth/get-session` returned 200/null
  without a session. Anonymous medical reads returned 401 `AUTH_REQUIRED` with
  private/no-store. A forged E2E account header did not bypass production auth.
  A genuine owner-authorized email login established a verified user and a fresh
  session; authenticated access provisioned a medical subject relationship and
  PostgreSQL rate-limit windows. Full authenticated CRUD, cross-account isolation
  and session revocation remain unverified.
- Owner-selected Neon project `hidden-wave-09272295`, main
  `br-soft-night-audxwvre`, now has `medical` and `medical_ops`: all 13 migrations
  were applied atomically as the exact approved actor `medical_deployer`.
  New SQL-created `du_medical_*` roles avoid the provider authority inherited by
  the existing API-created roles. Production role/ACL checks, eight catalog checks,
  and synthetic create/update/soft-delete/sync with complete rollback passed.
  Installation preserved the then-existing one auth user/nine sessions and empty
  medical tables. The later real login created a session and medical relationship.
- The original managed `medical_app`/`medical_migrator` roles remain unsafe choices
  for application runtime. The new `du_medical_app` has no administrative attributes
  or role memberships. Deploy-only temporary maintenance authority was removed;
  the role creator retains non-inheritable/non-SET operator ADMIN authority for
  rotation. No actor guards were bypassed or broadened.
- Production Vercel now uses the restricted app role, independent Sensitive HMAC
  secrets and PostgreSQL distributed limiting. Preview values were preserved.
  Adoption and sync flags remain disabled pending qualification.
- Resend rejected the support-address login request, while login to the Resend
  owner succeeded. The current test sender `onboarding@resend.dev` requires a
  verified sending domain and a valid sender before public beta registration.
- Point-in-time retention was 21,600 seconds (six hours); no automatic snapshot
  schedule was configured on the selected main branch.

## Recovery rehearsal

With the owner's explicit approval, the auth-only snapshot
`snap-hidden-smoke-auh90mbm` was replaced by full production snapshot
`snap-soft-band-auzhmnc1` (`medical-production-20260930`, 23:41:13 UTC).
It was restored into a **new** branch `br-frosty-queen-auyiv84q`
(`medical-snapshot-restore-20260930`), with finalization false. Production was not
switched. The restore preserved all 13 medical migration records and one auth
user/nine sessions. Role/ACL checks and restricted-runtime synthetic lifecycle
smoke passed. Medical tables were empty at snapshot capture, so this does not prove
recovery of populated clinical history, authenticated reconnect or end-to-end RTO.

An earlier isolated synthetic branch copy preserved a deleted event at revision 2,
its sync sequence 2 and deletion marker. This is separate branch-copy evidence.
Pre-installation, rehearsal and restored branches are retained for inspection.
Exact branch IDs and verification limits are in the
[production runbook](medical-neon-production-runbook.md).

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
with `du.medical_role_profile=neon-sql` and the default `runtime` phase. All eight
catalog checks now pass on the production medical schema. The phase matters:
post-installation must reject retained temporary ownership-transfer access. Run the
profile-aware role/ACL smoke too. These checks do not prove authenticated API isolation.

## Safe rollout sequence

1. Confirm the exact production auth and medical connection targets without copying
   credentials into logs, PRs or chat. Use the installed SQL-created runtime role
   and the operator-only deployment path in the new installation runbook.
2. Apply the ordered foundation/adoption/settings/rate-limit migrations and their
   privilege scripts on the isolated rehearsal branch, then `0009_medical_sync.sql`
   and `0010_medical_sync_privileges.sql`. A final deployment grants the runtime role
   only the table-specific privileges. Runtime must not use deploy/owner roles.
3. Verify as `du_medical_app`: DDL, direct audit modification and unauthorized
   hard DELETE are denied. Check cross-account authorization through the API.
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

- Full authenticated production CRUD/retry, session revocation, account isolation,
  adoption and two-device sync qualification. Schema installation, restricted-role
  activation and real owner login are completed.
- A verified email sending domain and production sender for public registration.
- Complete read/denial audit coverage, restricted audit review/retention and alerting.
- Verified account-wide erasure, downstream/backup suppression and tracked requests.
- Approved privacy/terms and operator legal identity/address.
- Automatic backup monitoring and medical restore/reconnect rehearsal against RPO/RTO.
- Conflict resolution workflow; queue/ledger/tombstone retention and compaction with
  stale-device rebootstrap/cursor expiration. Current ledger/outcomes do not expire.
- Cross-tab/browser lifecycle qualification and bounded long-history adoption/export
  memory behavior. No service-worker/background guarantee is made.

## Verification evidence for this change

PR #171 and its merged main CI passed all 2,145 unit/integration tests, including
real PostgreSQL identity coverage, and 211 browser scenarios. Typecheck, ESLint,
Prettier, build, Markdown links and OpenAPI checks also passed. Main CI evidence:
[run 36792049628](https://github.com/yevhen198821-cmyk/diabetes-universe/actions/runs/36792049628).
Production database checks, real login and restore evidence are documented in the
[installation runbook](medical-neon-production-runbook.md); they have a narrower
scope than complete beta certification.
