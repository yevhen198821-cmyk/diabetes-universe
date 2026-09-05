# Wave 5B — Canonical + Localized Nutrition Quick Add

## Status

| Field        | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Wave         | 5B                                                                              |
| Status       | Implemented                                                                     |
| Date         | 2026-09-05                                                                      |
| Architecture | [Wave 5A](../architecture/nutrition/wave-5a-nutrition-semantic-architecture.md) |
| Domain       | [Wave 5A domain contract](./wave-5a-nutrition-domain-contract.md)               |
| Base SHA     | `8f98b507b0ab425699d07a23378378770ebecd51`                                      |

Wave 5B changes **new Nutrition Quick Add writes** and the **production
Nutrition Quick Add presentation**. It does **not** close the Nutrition
vertical.

| Wave   | Owns                                                               | Does not own                                    |
| ------ | ------------------------------------------------------------------ | ----------------------------------------------- |
| **5A** | Canonical Nutrition v2 domain contract in `medical-domain`         | UI, persistence integrity, API, writers         |
| **5B** | New Quick Add writes as v2 + localized presentation (four locales) | Save integrity, Edit/Detail, API, food database |
| **5C** | Persistence / save integrity (await, retry, quarantine)            | Nutrition Edit adoption, Medical API            |

## What changed

New manual Nutrition Quick Add submissions create a semantic event with:

- `kind: 'nutrition'`
- `schemaVersion: 2`
- canonical `mealType` (`breakfast`, `lunch`, `dinner`, `snack`, `other`)
- `carbohydratesGrams` as a number
- optional `items` snapshots
- optional `note`
- `source: 'manual'`

They do **not** persist:

- `mode`
- `products`
- `calculatedCarbsGrams`
- localized meal-type strings
- demo `productId`

`mode` remains React/form state only.

## Write path

```text
NutritionQuickAddForm (presentation state)
        ↓ parseNutritionManualCarbsInput / item snapshots
prepareNutritionQuickAddSubmit
        ↓ validateNutritionTimelineEventV2 (Wave 5A)
NutritionQuickAddEntry
        ↓ createSemanticNutritionTimelineEvent
NutritionTimelineEventV2
        ↓ existing Timeline addEvent (fire-and-forget)
IndexedDB structural accept of Nutrition v2
```

Old path (legacy history only):

```text
v1 NutritionQuickAddEntry { mode, products, localized mealType }
        ↓ createSemanticNutritionTimelineEvent (pre-5B)
NutritionTimelineEventV1 { schemaVersion: 1 }
```

Existing v1 rows are not migrated. Edit still uses
`mapQuickAddNutritionMealType` for generic title mapping and is unchanged.

## Localization

Production Nutrition Quick Add copy uses the existing
`packages/locales` / `PlatformProvider` / `useLocalization` platform.

Locales: `en-GB`, `de-DE`, `uk-UA`, `ru-RU`.

Meal labels reuse `timeline.mealType.*`. Form chrome uses
`quick-add.nutrition.*`. Form state stores canonical IDs. Changing locale
does not mutate stored medical data.

`unspecified` is a valid domain value for legacy/import/adoption. It is
not offered as a manual Quick Add choice.

## Manual carbohydrates presentation policy

Web-only input policy in `nutrition-manual-carbs-input.ts`:

- `> 0` and `<= 500`
- at most two user-entered fraction digits
- accepts `.` and `,`
- no rounding
- rejects malformed separators, `NaN` / `Infinity` strings, and `0`

Wave 5A domain validation remains `> 0 && <= 1000` with arbitrary
canonical precision. `500` is not a medical-domain rule.

## Itemized entry

The demo catalogue is presentation-only. Saved items contain:

- opaque `itemId` (form-row identity, not a name or catalogue key)
- `name` snapshot (localized display text at write time)
- `carbohydratesGrams` = `weightGrams * carbsPer100Grams / 100`
- optional `weightGrams` / `carbsPer100Grams` snapshots

The event total is the sum of item snapshot carbs. The Wave 5A validator
does not recompute or repair that total.

## Persistence boundary

IndexedDB structural validation now accepts Nutrition `schemaVersion: 2`
without importing `medical-domain`. Other kinds still require
`schemaVersion: 1`. Unknown versions remain rejected.

This is only enough for new v2 events to reload. It is **not** save
integrity:

- no durable `await` contract
- no pending-dismiss lock
- no retry identity
- no semantic write quarantine

Those belong to Wave 5C. Current Nutrition save remains fire-and-forget
`addEvent`.

## Architecture invariants

- `timeline-web` does not depend on `medical-domain`
- Glucose Quick Add / Insulin Quick Add are unchanged
- Insulin precision semantics are unchanged
- Medical API and OpenAPI are unchanged
- Timeline Detail / Nutrition Edit are unchanged
- localization architecture is unchanged

## Known limitations

- Nutrition Detail/Edit were not redesigned. Generic edit may still treat
  a localized meal title as editable text.
- Local v2 events are not cloud-adoption ready (`schemaVersion !== 1`
  stays unsupported in the adoption scanner).
- Demo product names are UI catalogue labels, not a food database.
