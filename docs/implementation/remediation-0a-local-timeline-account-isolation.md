# Remediation 0A — Local Timeline Account Isolation

## Status

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| Remediation | 0A                                         |
| Status      | Implemented                                |
| Date        | 2026-09-06                                 |
| Priority    | P1 privacy / closed-beta blocker           |
| Base SHA    | `aa591f457296b68d1d7ce8f76f3f05849ccbdf89` |

This remediation isolates local Timeline medical data per ownership context
and stops automatic production demo seeding. It does not add cloud sync,
Family mode, bulk migration, or silent anonymous adoption.

## Previous vulnerability

One browser-origin IndexedDB (`diabetes-universe-timeline`) was shared by
every visitor on that origin.

- Logout cleared auth/session only. The Timeline repository stayed open on
  the same unscoped database.
- Account B could read medical events, quarantine rows, and adoption
  metadata previously written by Account A.
- `createWebTimelineRepository` always passed `seedEvents: demoTimelineEvents`,
  so a new production browser received durable fake glucose, insulin,
  nutrition, medication, activity, and notes in the same store as real
  records.

UI filtering over one shared store is not sufficient. Isolation has to exist
at the persistence ownership boundary.

## Local ownership model

Supported contexts:

1. Anonymous / pre-auth local user
2. Authenticated account A
3. Authenticated account B

Persistence identity is never an email address. Authenticated ownership is
derived from Better Auth `user.accountId`. Database names encode that token
as hex and never include email, access tokens, event IDs, or medical
payloads.

| Context         | Database name                                                          |
| --------------- | ---------------------------------------------------------------------- |
| Authenticated   | `du-timeline-acct-<hex(accountId)>`                                    |
| Anonymous       | `du-timeline-anon-<hex(ownerKey)>`                                     |
| Legacy unscoped | `diabetes-universe-timeline` (unowned, never opened as an owned store) |

Anonymous owner keys live in `localStorage` under
`du.timeline.anonymousOwnerKey`. The key is created once per browser profile
and reused after logout so the anonymous namespace is stable, not a new
universal medical database shared with signed-in users.

`createWebTimelineRepository` now requires an explicit owned `databaseName`
and rejects the legacy name.

## Anonymous semantics

- Anonymous records persist only in the anonymous namespace.
- Login does **not** silently attach anonymous records to the first account.
- Login does **not** delete the anonymous store.
- Login does **not** auto-adopt or upload local records.
- While authenticated, the anonymous store is closed and is not the active
  Timeline repository.
- After logout, the same anonymous namespace is reopened. Authenticated
  records stay in their account databases and are not readable from the
  anonymous context.

Future explicit adoption can open the anonymous (or legacy) store behind an
approved UX. This PR only leaves the stores intact.

## Authenticated semantics

- Each `accountId` has its own IndexedDB covering every Timeline store:
  `timeline_events`, `timeline_metadata`, `timeline_quarantine`,
  `timeline_adoption_acknowledgements`, `timeline_adoption_sessions`, and
  `timeline_adoption_quarantine`.
- Switching A → logout → B detaches A's repository before B's repository is
  created. B does not inherit A's events, quarantine, adoption metadata, or
  source namespace.
- Switching back to A reopens A's retained local store.

Logout does not wipe other accounts' device-local data.

## Repository transition

`TimelineStoreBoundary` resolves ownership through
`useTimelineLocalOwnership`:

1. First paint is `pending` and uses an empty in-memory repository. No
   IndexedDB is opened.
2. Session fetch then opens the owned database, or stays `blocked` (empty
   in-memory) if a session exists without a valid `accountId`.
3. The provider remounts on `key={ownershipKey}` when the authenticated
   account changes. Pending, blocked, and anonymous share one
   `unauthenticated` key so first session resolve does not remount the
   product tree. Authenticated A → B (or logout) still destroys the
   previous account repository.
4. The previous repository is closed on unmount.
5. Timeline chrome exposes `data-timeline-ownership` (`pending` /
   `blocked` / `anonymous` / `authenticated`) without account IDs.

Session resolution is fail-closed:

- successful `get-session` with `null` / no session → anonymous
- successful valid session with `accountId` → authenticated
- successful session present without `accountId` → blocked
- network exception, HTTP 5xx, HTTP 429, or any other non-success →
  indeterminate

Generic `!response.ok` is never treated as logout.

Indeterminate while an authenticated account is already known keeps that
account namespace. First-load indeterminate stays `pending` (empty
in-memory repository) and must not open anonymous IndexedDB until session
state is positively resolved. A first-load auth-service outage therefore
cannot expose browser-anonymous medical history to an actually
authenticated user.

A session user without `accountId` is blocked rather than falling back to
email.

## Account-switch behavior

Required sequence:

1. A's records leave the active Timeline before B can use it.
2. B uses B's own local store.
3. B does not see A's events or adoption/quarantine metadata.
4. Returning to A may reopen A's retained local store.

During the transition the UI is a loading/neutral empty in-memory
repository, not a previous account's durable store.

## Legacy global DB behavior

Existing browsers may already have `diabetes-universe-timeline`.

- That database is treated as legacy/unowned.
- It is never opened as the active owned store.
- It is never assigned to the current authenticated account.
- This PR does not bulk-migrate or delete it.
- Fresh installs never create that ambiguous global medical DB.

Future explicit adoption can present it as unowned local history.

## Demo seed policy

Normal production repository creation uses `seedEvents: []`.

Demo fixtures remain in `apps/web/lib/mocks/timeline.ts` for:

- explicit E2E helper `prepareCanonicalDemoTimelineFixture`
- unit tests
- Storybook/testing if a caller opts in

`NODE_ENV` alone does not seed medical history. Playwright `webServer` does
not restore the old global seed.

## Logout and auth-failure semantics

Logout:

- closes the authenticated Timeline repository
- remounts an anonymous or pending/neutral context
- must not keep authenticated records rendered
- must not expose them in the anonymous namespace

A stale-but-still-authenticated session (P6c fresh-auth gate) is still
account A, so A's store remains attached. That is not a cross-account leak.

Auth-service HTTP 5xx, 429, unexpected non-success, or a network exception
are indeterminate. They keep the last authenticated namespace and never
open anonymous medical data.

Only a successful `get-session` payload that is `null` / no session is a
proven signed-out transition. Then ownership leaves A and A's records are
not readable from the signed-out context.

## Multi-tab

There is no second auth bus and no BroadcastChannel ownership protocol.

Each tab independently:

- reads `/api/auth/get-session`
- refreshes ownership on `focus` and `visibilitychange`
- remounts the repository when `accountId` changes

If tab 1 logs out or logs in as B while tab 2 still has A's cookies, tab 2
keeps A's owned repository until its own session read says otherwise. A
repository never accepts a mismatched `accountId`; it only opens the
namespace derived from the session it actually observed.

## Future adoption interaction

Anonymous and legacy stores are left in place as unowned local history.
Approved adoption UX can later:

- list those namespaces
- ask the signed-in account to adopt or discard them
- write acknowledgements only into that account's owned database

No silent merge is performed here.

## Explicit non-scope

- F-02 / F-03 async save integrity
- F-04 test-auth security
- rate limiter / security headers
- export / account deletion
- cloud sync
- Nutrition Wave 6E
- Family
- device integrations
- UI redesign
- bulk migration or automatic deletion of old user data
- glucose / insulin / nutrition medical semantics
- Medical API / OpenAPI
