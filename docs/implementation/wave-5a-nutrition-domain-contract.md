# Wave 5A — Nutrition Domain Contract

## Status

| Field        | Value                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Wave         | 5A                                                                              |
| Status       | Implemented                                                                     |
| Date         | 2026-09-05                                                                      |
| Architecture | [Wave 5A](../architecture/nutrition/wave-5a-nutrition-semantic-architecture.md) |
| Base SHA     | `2762b1a1dc95844bc1be407a3da18a9a3291da44`                                      |

This slice implements only the presentation-neutral
`@diabetes-universe/medical-domain` Nutrition contract approved in Wave 5A.
It does not change UI, persistence behavior, API, OpenAPI, or writer
behavior. Quick Add, Timeline, IndexedDB, and the medical API still operate
on Nutrition v1 (`schemaVersion: 1`).

## Package ownership

```text
Persisted Nutrition v1 (@diabetes-universe/types NutritionTimelineEvent)
        ↑ unchanged readers

Canonical Nutrition v2 (@diabetes-universe/medical-domain)
        ↓
Wave 5B presentation / Quick Add adapter (new writes)
```

| Package                             | Owns                                                                                         | Does not own                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `@diabetes-universe/types`          | Unchanged persisted v1 `NutritionTimelineEvent` / v1 `NutritionMealType`                     | Canonical v2 validators                  |
| `@diabetes-universe/medical-domain` | Canonical meal types, carbs validator, item snapshots, v2 event validator, legacy classifier | Locales, UI, persistence, API allow-list |
| `apps/web`                          | Unchanged writers, Dashboard, Timeline, medical API validators                               | Not migrated in 5A                       |
| `@diabetes-universe/timeline-web`   | Unchanged IndexedDB validation (`schemaVersion === 1`)                                       | No `medical-domain` dependency           |

Public consumers import from the `medical-domain` package root.

## Implemented domain contract

`NUTRITION_KIND` is `'nutrition'`. Parallel kinds are not introduced.

| Export                                         | Role                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `NUTRITION_SCHEMA_VERSION`                     | Canonical generation (`2`)                                       |
| `NUTRITION_LEGACY_SCHEMA_VERSION`              | Persisted generation (`1`)                                       |
| `NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS`  | Technical maximum (`1000`); not a therapeutic limit              |
| `NUTRITION_MEAL_TYPES` / `NutritionMealType`   | Closed canonical identifiers, including `unspecified`            |
| `isNutritionMealType`                          | Exact membership; no localized inference                         |
| `NutritionItemSnapshot`                        | Historical item snapshot                                         |
| `NutritionTimelineEventV2`                     | Canonical payload (`kind`, `mealType`, total, optional `items`)  |
| `NutritionTimelineEventLegacy`                 | Alias of persisted `NutritionTimelineEvent`                      |
| `validateNutritionCanonicalCarbohydratesGrams` | Finite, `> 0`, `<= 1000`, no rounding                            |
| `validateNutritionItemSnapshot`                | Opaque `itemId`, trimmed name, canonical item carbs              |
| `validateNutritionTimelineEventV2`             | Strict v2 validator; rejects `mode` / `products` / empty `items` |
| `classifyNutritionTimelineEvent`               | `legacy_v1` vs `canonical_v2` without applying v2 rules to v1    |

Error codes are locale-neutral (`nutrition.carbohydrates.not_positive`,
`nutrition.meal_type.invalid`, …). Medical-domain does not store user-facing
copy.

## Canonical versus presentation policy

Domain validity accepts `500` and `1000`. A future Quick Add 500 g ceiling
is **not** encoded in these validators.

`12.125` is stored and returned as `12.125`. There is no decimal-place
policy in Wave 5A.

## Legacy compatibility

`classifyNutritionTimelineEvent` treats `kind: 'nutrition'` +
`schemaVersion: 1` as `legacy_v1` and does not run the v2 validator. Free-form
or localized `mealType` values such as `Завтрак` remain readable as legacy.
They are not inferred to `breakfast`.

`validateNutritionTimelineEventV2` rejects schemaVersion `1`. That rejection
is not a read path for existing records.

There is no automatic v1 → v2 migration in this wave.

## Safety / non-recommendation boundary

This foundation records historical carbohydrate facts. It does not calculate,
recommend, or derive insulin. It does not add a food catalogue, barcode
scanner, or macro model.

## Deferred work

| Wave   | Scope                                                                | Status      |
| ------ | -------------------------------------------------------------------- | ----------- |
| **5B** | Canonical + localized Nutrition Quick Add; 500 g presentation policy | Implemented |
| **5C** | Persistence / save integrity                                         | Not started |
| Later  | Edit adoption, API/OpenAPI, Timeline Detail                          | Not started |
