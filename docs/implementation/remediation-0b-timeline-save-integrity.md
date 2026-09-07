# Remediation 0B — Timeline Save Integrity

## Status

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| Remediation | 0B                                         |
| Status      | Implemented                                |
| Date        | 2026-09-07                                 |
| Priority    | P1 data integrity / closed-beta blocker    |
| Base SHA    | `e60033fd795f87274a6175a1c03f0829f001ed33` |

This remediation closes F-02 and F-03. The UI must not report a successful
medical-record mutation until the Timeline repository confirms durable
persistence, including IndexedDB transaction completion.

It does not change medical validation, OpenAPI, cloud sync, Family, devices,
Nutrition 6E, or Remediation 0A ownership isolation.

## F-02 root cause

Medication, Activity, and Note Quick Add called the host submit callback,
played a success haptic, and closed the panel before the repository mutation
finished.

The previous sequence was:

1. Validate
2. `onSubmit?.(...)` without awaiting durable persistence
3. `haptics.success()`
4. `closeQuickAdd('success')`

A rejected IndexedDB write could still look like a saved medical event.

Glucose, Insulin, and Nutrition Quick Add already used
`finalizeQuickAddSubmit` / `addEventAsync` and were left unchanged.

## F-03 root cause

Timeline edit saved Nutrition through `updateEventAsync`, but every other
editable kind used fire-and-forget `updateEvent(...)`.

The editor then returned to view mode and played a success haptic before the
update transaction completed. A rejected write could still show the edited
values as saved.

## Affected kinds

Quick Add (F-02):

- medication
- activity
- note

Timeline edit (F-03):

- glucose
- insulin
- nutrition (already durable; behavior unchanged)
- medication
- activity
- note
- any other non-Nutrition editable kind routed through the shared editor

## Durable-save invariant

Required sequence for every medical mutation that reports success:

1. Validate
2. Prepare a stable semantic payload
3. Enter pending
4. Await repository persistence
5. Confirmed durable success
6. Update UI / haptic
7. Close or return to view mode

On persistence failure:

- the form or editor stays open
- user-entered values stay intact
- a localized save error is shown
- no success haptic
- no success close / no return to view
- retry actually retries persistence

Durability comes from repository completion. This remediation does not use
`setTimeout`, `Promise.resolve` delays, or React state as a persistence
signal.

## Retry identity policy

Quick Add Medication / Activity / Note now use the same identity controller
as Insulin and Nutrition.

- An unchanged semantic payload after a failed persist retries with the same
  logical event ID.
- Editing a persisted semantic field after failure allocates a new logical
  event ID.
- Localized presentation labels are not part of retry identity.

Medication identity fields: medication id/name, dose, doseUnit, context,
note, occurredAt.

Activity identity fields: activityType, duration, note, occurredAt.

Note identity fields: title, body, occurredAt.

Timeline edit always preserves `event.id`, `createdAt`, `kind`, and the
kind's existing historical identity fields. Edit retry never creates a
second event.

## Failure behavior

Quick Add pending:

- Save is disabled
- duplicate submit is ignored
- Escape / backdrop / cancel cannot discard an in-flight submit
- `role=status` and `aria-busy` expose the pending state

Quick Add failure:

- pending clears
- the form remains
- inputs are preserved
- `role=alert` shows the localized save error
- retry is possible

Edit failure:

- stay in edit mode
- edited fields remain
- localized save error
- no success haptic
- displayed canonical event is not treated as saved
- successful retry updates `updatedAt` using existing event semantics

## Interaction with Remediation 0A

0A remains the ownership boundary:

- account-specific IndexedDB
- anonymous separation
- legacy unscoped database is never opened as an owned store
- no production demo seed
- fail-closed session resolution

`TimelineStoreProvider` remounts on ownership change
(`key={ownershipKey}`). An in-flight mutation keeps the repository it
started with. After remount, `isMountedRef` prevents applying that result
into the next account's UI.

A pending save started in Account A cannot appear in Account B.

## Delete / replace audit

`handleDelete` still calls sync `deleteEvent`, closes the detail, and plays
a success haptic before durable delete completes. That is a user-visible
false-success path.

It is documented here and left out of this PR. `replaceEvents` is unused by
these fixes and remains out of scope.

## Explicit non-scope

- F-04 test-auth
- F-10 rate limiter
- security headers
- Glucose validator F-14
- numeric-bound alignment F-08
- localization-wide cleanup F-07
- export / delete F-05
- Medical API nutrition v2 F-09
- cloud sync
- Family
- devices
- Nutrition 6E
- broad UI redesign
- medical validation / therapy advice / bolus / IOB / carb ratio
- OpenAPI semantics
