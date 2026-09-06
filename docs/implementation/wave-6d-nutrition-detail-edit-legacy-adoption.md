# Wave 6D — Nutrition Timeline Detail + Edit + Legacy Adoption

## Status

| Field        | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Wave         | 6D                                                                              |
| Status       | Implemented                                                                     |
| Date         | 2026-09-06                                                                      |
| Architecture | [Wave 5A](../architecture/nutrition/wave-5a-nutrition-semantic-architecture.md) |
| Quick Add    | [Wave 6B](./wave-5b-canonical-localized-nutrition-quick-add.md)                 |
| Save         | [Wave 6C](./wave-6c-nutrition-save-integrity-indexeddb-validation.md)           |

Wave 6D makes Nutrition a complete editable Timeline vertical: dedicated
Detail, dedicated Edit, durable save, and **adoption-on-edit** for legacy v1.

| Wave   | Owns                                                     | Does not own          |
| ------ | -------------------------------------------------------- | --------------------- |
| **6B** | Canonical/localized Nutrition Quick Add writes (v2)      | Detail/Edit           |
| **6C** | Durable Quick Add save + semantic persistence validation | Detail/Edit, adoption |
| **6D** | Dedicated Detail/Edit + v1 adoption-on-edit              | API, catalog, recipes |

## Dedicated Nutrition Detail

Canonical v2 shows:

- carbohydrates total
- localized meal type (canonical enum keys only)
- date/time
- note when present
- itemized foods when `items` exist (snapshot name, item carbs, optional
  weight / carbs-per-100)

Legacy v1 remains readable without migration. Historical `mealType` strings
and `products[]` are shown as stored. Unknown meal labels are not inferred
on read.

Detail never displays UI mode, catalog IDs, `demoProductId`, `itemId`,
`schemaVersion`, or other technical persistence fields.

## Dedicated Nutrition Edit

Nutrition no longer uses the generic Timeline string editor.

```text
TimelineEventDetail
  → NutritionTimelineEventEditDraft
  → buildNutritionTimelineEventFromEditDraft
  → TimelineStore.updateEventAsync
  → IndexedDB (structural + injected semantic validator)
```

Supported fields: meal type, carbohydrates, note, time, itemized rows.

## Canonical numeric preservation

Canonical persisted Nutrition remains `> 0 && <= 1000` with arbitrary
precision and no rounding.

Manual edited input remains `> 0 && <= 500` with at most two typed fraction
digits (comma or dot). Unchanged stored values such as `12.125`, `750`, and
`1000` stay saveable exactly.

`event.carbohydratesGrams` remains authoritative. Opening Detail/Edit does
not recompute the total from `items`. Adding or removing items also does not
rewrite the event total unless the user edits the carbs field.

Unchanged historical item snapshots keep the same `itemId`, name, and
numbers. Newly added items receive a fresh opaque `itemId` and a
locale-neutral snapshot name. Catalog / demo IDs are never persisted.

## Legacy v1 adoption-on-edit

Viewing a v1 record does not migrate it.

Only a successful edit save writes canonical `schemaVersion: 2` on the
**same event ID**. `createdAt` is preserved; `updatedAt` is refreshed.

Known historical meal labels map through
`mapKnownLegacyNutritionMealType()` at the edit-save boundary only:

- Breakfast / Завтрак / Frühstück / Сніданок → `breakfast`
- Lunch / Обед / Mittagessen / Обід → `lunch`
- Dinner / Ужин / Abendessen / Вечеря → `dinner`
- Snack / Перекус → `snack`
- Other / Другое / Sonstiges / Інше → `other`

Unknown/free-form meal types are not guessed. The user must choose a
canonical meal type before save.

Legacy `products[]`:

- historical `productId` is never promoted
- a new opaque `itemId` is generated
- historical name and valid carbohydrates are snapshotted
- optional weight / per-100 are kept only when present and valid
- incomplete rows are omitted; the authoritative event total is preserved

React components do not contain meal-mapping inference. Mapping lives in
`apps/web/lib/medical/nutrition/nutrition-timeline-adoption.ts`.

## Durable edit save

Nutrition edit awaits `updateEventAsync`. Success means repository
`status === 'applied'`. Failure keeps the editor open, preserves entered
data, shows a localized persistence error, and retries the same event ID.

Insulin, Glucose, and other kinds keep the existing fire-and-forget
`updateEvent` path.

## Architecture

```text
medical-domain
     ↑
apps/web composition (presenter, adoption, edit model, validator)
     ↓ injected callback
timeline-web
```

`timeline-web` does not depend on `medical-domain`. No bulk IndexedDB
migration, no read-time v1→v2 conversion, no API / OpenAPI Nutrition
changes.

## Out of scope

Nutrition Medical API, OpenAPI Nutrition schema, backend sync, Food Catalog,
barcode, photo recognition, Recipes, macros, recommendations, bolus / IOB,
Family mode, Devices, schemaVersion 3, bulk migration.
