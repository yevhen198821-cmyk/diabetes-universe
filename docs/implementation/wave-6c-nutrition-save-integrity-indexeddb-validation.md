# Wave 6C — Nutrition Save Integrity + IndexedDB Semantic Validation

## Status

| Field        | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Wave         | 6C                                                                              |
| Status       | Implemented                                                                     |
| Date         | 2026-09-06                                                                      |
| Architecture | [Wave 5A](../architecture/nutrition/wave-5a-nutrition-semantic-architecture.md) |
| Quick Add    | [Wave 6B](./wave-5b-canonical-localized-nutrition-quick-add.md)                 |
| Base SHA     | `510417e3c1b49d7a4802ff3921ca9658cee43d0f`                                      |

Wave 6C closes Nutrition Quick Add **save integrity** and **IndexedDB medical
semantic validation** for canonical Nutrition v2. It does not redesign Detail,
Edit, API, or legacy adoption.

| Wave   | Owns                                                     | Does not own                       |
| ------ | -------------------------------------------------------- | ---------------------------------- |
| **6B** | Canonical/localized Nutrition Quick Add writes (v2)      | Durable save, semantic quarantine  |
| **6C** | Durable save integrity + semantic persistence validation | Detail/Edit, API, adoption-on-edit |
| **6D** | Nutrition Detail/Edit adoption-on-edit (planned)         | Medical API, food database         |

## What changed

### Save integrity (mirrors Insulin Wave 4D)

Nutrition Quick Add now uses the shared async persistence contract:

```text
NutritionQuickAddForm
  → prepareNutritionQuickAddSubmitWithIdentity
  → NutritionQuickAddSubmitRequest { entry, eventId }
  → QuickAddHost finalizeQuickAddSubmit (await)
  → TimelineStore.addEventAsync
  → createSemanticNutritionTimelineEvent(entry, { id: eventId })
  → IndexedDB (structural + injected semantic validator)
```

Old path (pre-6C):

```text
onSubmit(entry) → addEvent(createSemanticNutritionTimelineEvent(entry))
  fire-and-forget, success haptic/close before durable completion
```

### Stable retry identity

`QuickAddSubmitEventKind` includes `'nutrition'`. Failed saves retain
`pendingEventId` until success or explicit reset/cancel.

| Scenario                           | Event ID                         |
| ---------------------------------- | -------------------------------- |
| Same persisted payload after fail  | Reused                           |
| Changed carbs/meal/note/time/items | New ID                           |
| Locale-only UI change              | Same ID and same canonical items |

Retry serialization includes only persisted semantic fields:
`carbohydratesGrams`, `mealType`, `items`, `note`, `time`. It excludes UI
locale labels, form `mode`, and validation chrome.

### Pending UX

While persistence is in flight:

- `aria-busy` and localized saving status
- dismiss/back/cancel blocked via QuickAddHost pending lock
- double-submit ignored
- all editable controls disabled

On persistence failure the form stays open with localized save error
(`role="alert"`), data preserved, retry identity retained. Success haptic and
panel close occur only after durable repository completion.

### App-level semantic validator

`validate-web-timeline-semantic-event.ts` composes Insulin and Nutrition rules
at the apps/web boundary:

```text
medical-domain
     ↑
apps/web validateWebTimelineSemanticEvent
     ↓ injected callback
timeline-web IndexedDB repository
```

Nutrition rules use `classifyNutritionTimelineEvent`:

- `canonical_v2` → accept
- `legacy_v1` → accept (readable history)
- `invalid` → reject writes; quarantine on read

Structural validation in `timeline-indexeddb-validation.ts` is unchanged.
`timeline-web` does not depend on `medical-domain`.

Invalid new v2 writes (localized mealType, zero/negative/>1000 carbs, NaN,
Infinity, legacy `mode`/`products`/`calculatedCarbsGrams`, empty `items[]`,
invalid item snapshots) are rejected before IndexedDB commit.

Structurally valid but semantically invalid seeded v2 rows are quarantined on
read using existing `invalid_event_schema` semantics.

### Localization

Added `quick-add.nutrition.saving`, `saveError.title`, and
`saveError.description` for `en-GB`, `de-DE`, `uk-UA`, `ru-RU`.

## Architecture invariants preserved

- Event total is not recomputed from items
- `canonicalSnapshotName` write behavior unchanged
- Manual UI policy (`>0`, `<=500`, 2 fraction digits) separate from domain
  persistence policy (`>0`, `<=1000`, arbitrary precision)
- Glucose and Insulin paths unchanged
- No Nutrition-specific repository APIs
- No migration of legacy v1 rows

## Known limitations

- Nutrition Detail/Edit unchanged
- No Medical API / OpenAPI Nutrition changes
- No cloud sync or adoption-on-edit (Wave 6D)
- Activity/Medication/Note save integrity not in this wave

## Test coverage

- Nutrition submit controller retry identity (including locale-only change)
- Form/host save-integrity integration (pending lock, save error chrome)
- Composed semantic validator (v1/v2 valid, invalid v2 matrix)
- IndexedDB write rejection + read quarantine with real web validator
- Existing Nutrition Quick Add E2E per locale + itemized flow
