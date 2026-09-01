# Wave 4D — Insulin Quick Add Save Integrity

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4D                                                                           |
| Status       | **Implemented on branch / pending merge**                                    |
| Date         | 2026-08-31                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Depends on   | [Wave 4C](wave-4c-localized-semantic-insulin-quick-add.md) (merged)          |
| Base SHA     | `6e08a35fba6fbf0d42b171bfe1b39dffba1dff9a`                                   |

Insulin Quick Add now mirrors the Glucose Wave 3D save-integrity contract:
validate, allocate one stable event ID, enter pending state, await IndexedDB
persistence, then close only on confirmed success. Failed writes keep the form
open, preserve entered values, and retry with the same event ID only when the
semantic payload is unchanged.

## Scope

Implemented:

- shared Quick Add submit identity model (`quick-add-submit-identity-model.ts`)
  reused by glucose and insulin;
- `InsulinQuickAddSubmitRequest` carrying `{ entry, eventId }`;
- insulin submit controller with prepare/persist phases;
- async `onInsulinSubmit` on Dashboard and Timeline using `addEventAsync`;
- `createSemanticInsulinTimelineEvent(entry, { id: eventId })` for retry-safe
  writes;
- insulin form pending state, dismiss lock via shared host pending ref, and
  localized save-error chrome (`quick-add.insulin.saving`,
  `quick-add.insulin.saveError.*`) in EN/RU/UK/DE;
- regression tests at model, controller, integration, store, and E2E layers.

Not implemented (unchanged by this slice):

- medical API allow-list, kind validation, adoption, OpenAPI, cloud
  create/update, outbox/sync (Wave **4E**);
- other Quick Add categories (nutrition, medication, activity, note);
- calculator, dose recommendation, IOB, pump, therapy plan;
- Edit precision cleanup, global localization closure, unrelated IndexedDB
  validation.

## Trajectory

### Before (Wave 4C)

```text
InsulinQuickAddForm
  → prepareInsulinQuickAddSubmit
  → QuickAddHost.handleInsulinSubmit (sync)
       onInsulinSubmit(entry)
       haptics.success()
       closeQuickAdd('success')
  → Dashboard/Timeline addEvent(createSemanticInsulinTimelineEvent(entry))
```

### After (Wave 4D)

```text
InsulinQuickAddForm
  → prepareInsulinQuickAddSubmitWithIdentity
  → persistPreparedInsulinQuickAddSubmit
  → QuickAddHost.handleInsulinSubmit (async)
       finalizeQuickAddSubmit → onInsulinSubmit({ entry, eventId })
  → Dashboard/Timeline addEventAsync(
       createSemanticInsulinTimelineEvent(entry, { id: eventId }),
     )
  → [applied] → release pending → haptics.success() → closeQuickAdd('success')
```

## Stable identity lifecycle

1. Invalid submit never allocates `pendingEventId`.
2. First valid prepare calls `reconcileQuickAddSubmitEventId` with the serialized
   insulin semantic payload.
3. Persistence failure leaves the pending identity intact for an unchanged retry.
4. Same logical payload retry reuses the same full event ID.
5. Any edit to a persisted semantic field after failure (`preparationId`,
   `preparation` snapshot, `doseUnits`, `administrationContext`, `time`) clears
   the stale identity and allocates a fresh ID from the new payload/time.
6. Success clears identity inside `persistPreparedInsulinQuickAddSubmit`.
7. Explicit cancel resets identity when not pending.

## Persistence rejection audit

`TimelineStore.addEventAsync` awaits `timelineRepository.addEvent` and rejects
when the mutation throws or returns a non-`applied` status.

`IndexedDbTimelineRepository.addEvent` performs a single `readwrite`
transaction: `put(record)` then `await transaction.done`. It returns
`{ status: 'applied' }` only after `transaction.done` resolves. Any thrown
error or rejected `transaction.done` aborts the transaction before the method
returns success.

**Conclusion:** `addEventAsync` cannot reject after a durable IndexedDB commit.
A rejected persistence attempt means no timeline row was committed, so same-ID
retry remains idempotent and edited failed attempts safely receive a new
identity.

Verified by `addEvent rejects without durably committing when the database is
unavailable` in `timeline-indexeddb-repository.test.mjs`.

## Wave 4C semantic contract preserved

New writes still emit:

- `preparationId`
- `preparation` snapshot
- `doseUnits`
- `administrationContext`
- `schemaVersion: 1`
- `source: 'manual'`

Never emitted: legacy `context`, `preparationCategory`, translated “Other”.

## Validation

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm validate:openapi`
- `pnpm validate:openapi:breaking`
- `pnpm test:openapi-diff`
- `python3 scripts/validate-markdown-links.py`

Glucose save-integrity tests remain green.
