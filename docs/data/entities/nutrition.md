# Nutrition Entity

## Status

Approved as a Timeline semantic kind. Wave 5A owns the canonical Nutrition
v2 domain contract in `@diabetes-universe/medical-domain`. Wave 5B writes
**new Nutrition Quick Add events** as v2 and localizes the production Quick
Add. Existing v1 history stays readable. Persistence save-integrity is
Wave 5C. Medical API / OpenAPI / Detail / Edit remain on their current
contracts.

Authoritative architecture:
[Wave 5A — Nutrition Semantic Architecture](../../architecture/nutrition/wave-5a-nutrition-semantic-architecture.md).
Implementation:
[Wave 5A — Nutrition Domain Contract](../../implementation/wave-5a-nutrition-domain-contract.md),
[Wave 5B — Canonical + Localized Nutrition Quick Add](../../implementation/wave-5b-canonical-localized-nutrition-quick-add.md).

## Purpose

Represent one **user-recorded nutrition / carbohydrate event** in the shared
Timeline journal.

A nutrition event stores an authoritative carbohydrate total, a meal-type
identifier or legacy label, optional historical item or product snapshots,
and lifecycle metadata. It is a journal record, not a food database, recipe
book, shopping list, calorie tracker, or insulin recommendation.

## Current production attributes (schemaVersion 1)

These fields are what Dashboard, Timeline, Quick Add, and IndexedDB persist
today.

| Attribute            | Required | Type                      | Meaning                                     |
| -------------------- | -------- | ------------------------- | ------------------------------------------- |
| `id`                 | yes      | string                    | Stable event identifier                     |
| `kind`               | yes      | `'nutrition'`             | Discriminator. The only Nutrition/meal kind |
| `occurredAt`         | yes      | ISO 8601                  | Meal / entry time                           |
| `createdAt`          | yes      | ISO 8601                  | Local first-seen timestamp                  |
| `updatedAt`          | yes      | ISO 8601                  | Local last-mutation timestamp               |
| `schemaVersion`      | yes      | `1`                       | Persisted semantic generation               |
| `source`             | yes      | source                    | Origin (`manual` for Quick Add)             |
| `mode`               | yes      | `'manual' \| 'products'`  | Legacy entry mode                           |
| `mealType`           | yes      | v1 ID or free-form string | May be a localized label on older rows      |
| `carbohydratesGrams` | yes      | number                    | Stored carbohydrate mass                    |
| `products`           | no       | product snapshots         | Legacy itemized lines with `productId`      |
| `note`               | no       | string                    | Optional note                               |

Conceptual unit: `CanonicalUnitId` `'mass.g'`. The unit is not stored on the
event.

`meal` is not a canonical kind. Historical demo mappings must use
`nutrition` only.

### Current write path

New Nutrition Quick Add submissions collect a canonical
`NutritionQuickAddEntry` (`mealType` ID, `carbohydratesGrams`, optional
`items` / `note`) and `createSemanticNutritionTimelineEvent` writes
`schemaVersion: 2`. Wave 5A `validateNutritionTimelineEventV2` runs before
the payload is produced. Form `mode` is presentation state and is not
persisted.

Legacy v1 rows (`mode`, `products`, free-form `mealType`) remain readable
and are not rewritten.

### Current limitations

- Nutrition Detail / Edit are unchanged and are not a v2 adoption path;
- demo catalogue IDs stay presentation-only and are not food-database keys;
- medical API transport carbs bounds remain `0…2000` and `schemaVersion: 1`;
- Quick Add / Timeline still use fire-and-forget save for nutrition
  (Wave 5C);
- no food database, barcode, photo recognition, recipes, or macros;
- no insulin-from-carbs recommendation.

## Target attributes (Wave 5A domain contract, schemaVersion 2)

Canonical v2 is the **new Quick Add write** shape
(`NutritionTimelineEventV2` in `@diabetes-universe/types`). Existing v1
history stays on `NutritionTimelineEventV1`. The medical API is still v1.

| Attribute            | Required on new canonical writes | Type            | Meaning                                                               |
| -------------------- | -------------------------------- | --------------- | --------------------------------------------------------------------- |
| `kind`               | yes                              | `'nutrition'`   | Unchanged discriminator                                               |
| `schemaVersion`      | yes                              | `2`             | Canonical domain generation                                           |
| `mealType`           | yes                              | closed enum     | `breakfast`, `lunch`, `dinner`, `snack`, `other`, `unspecified`       |
| `carbohydratesGrams` | yes                              | number          | Authoritative historical total; finite, `> 0`, `<= 1000`; no rounding |
| `items`              | no                               | non-empty array | Historical item snapshots; omit for total-carbs-only                  |
| `note`               | no                               | string          | Optional note                                                         |

Legacy-only fields (`mode`, `products`, `calculatedCarbsGrams`, free-form
`mealType`) are not part of canonical v2. Wave 5A does not rewrite them.

Each `NutritionItemSnapshot` has an opaque in-record `itemId`, a display
`name`, item-level `carbohydratesGrams`, and optional `weightGrams` /
`carbsPer100Grams`. Items are not looked up by name. Demo `productId` is
not promoted to catalogue identity.

## Relationships

- A nutrition event is one variant of `SemanticTimelineEvent`.
- Dashboard Day Summary nutrition totals sum stored `carbohydratesGrams`.
- Timeline card, detail, search, and filter consume the same semantic event.
- Insulin events are independent records. Nutrition does not generate insulin
  doses, carb-ratio suggestions, or IOB.

## Constraints

- `kind` must be `'nutrition'`. Parallel kinds (`food`, `meal`,
  `recipeMeal`, `carbEntry`) are forbidden.
- Canonical v2 `carbohydratesGrams`: finite number, greater than 0, and
  `<= NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS` (`1000`). This is a
  technical domain ceiling, not a dietary recommendation.
- The Quick Add 500 g guard is presentation policy (Wave 5B), not domain
  validity.
- Canonical v2 `mealType` accepts only the closed identifier set. Localized
  labels are invalid in the domain validator.
- `items`, when present, must be a non-empty array. `items: []` is invalid
  for new canonical v2.
- The event total is not recomputed from items or `weight × carbsPer100`.
- Existing v1 records remain readable. There is no automatic migration in
  Wave 5A.

## Notes

- Wave 5B writes new Quick Add events as canonical v2. It does not migrate
  v1 history or close save integrity.
- `classifyNutritionTimelineEvent` distinguishes `legacy_v1` from
  `canonical_v2` without applying the strict v2 validator to v1 rows.
- Application startup must not rewrite nutrition rows in IndexedDB.
- Meal labels for new Quick Add / Timeline cards come from the localization
  platform. Stored `mealType` stays a canonical ID.
