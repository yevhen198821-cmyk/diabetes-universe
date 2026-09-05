# Wave 5A — Nutrition Semantic Architecture & Domain Contract

## Document status

| Field        | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Wave         | 5A — Semantic architecture and domain contract               |
| Status       | Implemented (domain only; UI/persistence/API unchanged)      |
| Date         | 2026-09-05                                                   |
| Scope        | Canonical Nutrition v2 contract + legacy v1 readability      |
| Out of scope | UI, persistence wiring, API/OpenAPI, writers, food catalogue |
| Base SHA     | `2762b1a1dc95844bc1be407a3da18a9a3291da44`                   |

Wave 5A defines the canonical Nutrition domain contract and implements it in
`@diabetes-universe/medical-domain`. It does **not** change Quick Add, Timeline
Detail, IndexedDB behavior, medical API, or OpenAPI. Existing Nutrition v1
records remain the production write/read path.

Implementation record:
[Wave 5A — Nutrition Domain Contract](../../implementation/wave-5a-nutrition-domain-contract.md).

## Table of contents

1. [Purpose](#1-purpose)
2. [Current-state inventory](#2-current-state-inventory)
3. [Problem statement](#3-problem-statement)
4. [Approved terminology](#4-approved-terminology)
5. [Canonical target contract](#5-canonical-target-contract)
6. [carbohydratesGrams](#6-carbohydratesgrams)
7. [mealType](#7-mealtype)
8. [Item snapshots](#8-item-snapshots)
9. [Authoritative total](#9-authoritative-total)
10. [Legacy v1 compatibility](#10-legacy-v1-compatibility)
11. [Ownership and dependency boundaries](#11-ownership-and-dependency-boundaries)
12. [Safety invariants](#12-safety-invariants)
13. [Phased implementation plan](#13-phased-implementation-plan)
14. [Explicit non-scope](#14-explicit-non-scope)
15. [Acceptance criteria](#15-acceptance-criteria)

## Dependencies

- [Nutrition Entity](../../data/entities/nutrition.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Wave 4A — Insulin Recording Architecture](../insulin/wave-4a-insulin-recording-architecture.md)
- [Wave 4B-I — Insulin Domain Foundation](../../implementation/wave-4b-i-insulin-domain-foundation.md)

---

## 1. Purpose

Diabetes Universe already records nutrition as a `SemanticTimelineEvent` of
`kind: 'nutrition'`. Wave 5A does not invent a new journal kind. It defines the
canonical Nutrition v2 semantic contract so later waves can adopt it without
breaking existing v1 records.

This wave:

- keeps `kind: 'nutrition'` as the only Nutrition/meal kind;
- introduces schemaVersion `2` as the **canonical domain generation**;
- keeps schemaVersion `1` readable as **legacy Nutrition**;
- owns locale-neutral validation in `medical-domain`;
- does **not** migrate, rewrite, or revalidate existing stored rows.

---

## 2. Current-state inventory

Audited against `origin/main` at
`2762b1a1dc95844bc1be407a3da18a9a3291da44`.

### 2.1 Production type contract

`NutritionTimelineEvent` (`packages/types/src/semantic-timeline.ts`):

```ts
interface NutritionTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'nutrition';
  readonly mode: NutritionEntryMode; // 'manual' | 'products'
  readonly mealType: NutritionMealType | string;
  readonly carbohydratesGrams: number;
  readonly products?: readonly NutritionProductSnapshot[];
  readonly note?: string;
}

type NutritionMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
```

Shared envelope `schemaVersion` is fixed to `1`. `NutritionMealType` in
`@diabetes-universe/types` does **not** include `unspecified`. The persisted
`mealType` field also allows free-form strings.

### 2.2 Production trajectory

```text
NutritionQuickAddForm
  → NutritionQuickAddEntry { mode, mealType: string, carbohydratesGrams, products? }
  → createSemanticNutritionTimelineEvent
       mealType ← mapQuickAddNutritionMealType(localized label)
       schemaVersion: 1
  → TimelineStore.addEvent
  → IndexedDB TimelineRepository
```

Quick Add meal options are hardcoded Russian labels (`Завтрак`, `Обед`, …).
`mapQuickAddNutritionMealType` infers canonical IDs from those labels. That
inference is a **legacy presentation/write adapter**, not the v2 domain
validator.

### 2.3 Existing bounds

| Boundary                          | Current rule                                                              |
| --------------------------------- | ------------------------------------------------------------------------- |
| Medical API `CARBS_GRAMS_MAX`     | `2000` (transport bound; unchanged in this wave)                          |
| Medical API `CARBS_GRAMS_MIN`     | `0` (transport bound; canonical v2 validity is `> 0`)                     |
| IndexedDB nutrition payload       | Requires `mode`, non-empty `mealType` string, finite `carbohydratesGrams` |
| API allow-list                    | `mode`, `mealType`, `carbohydratesGrams`, `products`, `note`              |
| API schemaVersion                 | Must be `1`                                                               |
| `@diabetes-universe/timeline-web` | Depends on `timeline` + `types` only — **not** `medical-domain`           |

### 2.4 Missing foundation (before this wave)

- `@diabetes-universe/medical-domain` had no Nutrition module.
- There was no closed canonical meal-type set that includes `unspecified`.
- There was no locale-neutral carbohydrates validator for Nutrition.
- Historical product lines used `productId` / `calculatedCarbsGrams`; there
  was no opaque `itemId` snapshot contract.
- There was no explicit legacy-versus-canonical classification.

---

## 3. Problem statement

The current Nutrition path is a usable local log, but it is not a safe
canonical recording contract.

**Kind pressure.** Future product language (food, meal, recipe, carb entry)
must not become parallel Timeline kinds. `nutrition` remains the only kind.

**Localized identity.** Meal labels are stored or inferred from Russian /
display strings. Canonical v2 must accept only closed identifiers.

**Authoritative total is implicit.** Itemized rows can imply that
`weight × carbsPer100` or a product catalogue is the source of truth. The
historical event total must remain the stored `carbohydratesGrams`.

**Legacy risk.** Applying a strict v2 validator to existing v1 rows would make
valid historical records unreadable (`mode`, free-form `mealType`,
`products`, `schemaVersion: 1`).

Wave 5A fixes the domain contract only. Later waves adopt it at the edges.

---

## 4. Approved terminology

| Term                                   | Meaning                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| **Nutrition event**                    | A `kind: 'nutrition'` Timeline record                                                 |
| **Legacy Nutrition event**             | Persisted schemaVersion `1` record; current production shape                          |
| **Canonical Nutrition v2 event**       | Domain payload with `schemaVersion: 2`, closed `mealType`, optional `items`           |
| **Canonical meal type**                | Closed identifier: `breakfast`, `lunch`, `dinner`, `snack`, `other`, `unspecified`    |
| **Authoritative total**                | Event-level `carbohydratesGrams`; immutable historical fact after save                |
| **Item snapshot**                      | Historical line inside one event (`itemId`, `name`, item carbs, optional mass fields) |
| **Technical maximum**                  | `NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS` (`1000`); not a therapeutic limit       |
| **Presentation policy**                | Future UI guards (500 g, comma/dot parser, localized labels). Not domain validity     |
| **Food database / catalogue identity** | Out of Wave 5A. Demo `productId` is not a catalogue key                               |

Do not use Wave 5A language that implies insulin dosing, carb ratio, bolus
calculation, or a recommended meal size.

---

## 5. Canonical target contract

### 5.1 Kind and schema generation

- Canonical kind remains `'nutrition'`.
- Forbidden parallel kinds: `food`, `meal`, `recipeMeal`, `carbEntry`.
- Canonical domain generation is `schemaVersion: 2`
  (`NUTRITION_SCHEMA_VERSION`).
- Persisted Timeline envelope `TimelineEventSchemaVersion` stays `1` in this
  wave. Shared type, IndexedDB, adoption, and API validators are not opened
  to `2` here.
- No mass migration of existing rows.

### 5.2 Canonical v2 payload (domain-owned)

The payload lives in `@diabetes-universe/medical-domain`, not as a replacement
of persisted `NutritionTimelineEvent`:

```ts
type NutritionMealType =
  'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other' | 'unspecified';

interface NutritionItemSnapshot {
  readonly itemId: string;
  readonly name: string;
  readonly carbohydratesGrams: number;
  readonly weightGrams?: number;
  readonly carbsPer100Grams?: number;
}

interface NutritionTimelineEventV2 {
  readonly kind: 'nutrition';
  readonly mealType: NutritionMealType;
  readonly carbohydratesGrams: number;
  readonly items?: readonly NutritionItemSnapshot[];
  readonly note?: string;
  readonly schemaVersion: 2;
}
```

This is the Insulin-style domain contract (`InsulinNewWritePayload` analogue):
presentation-neutral, envelope-free, ready for later writers. It is **not**
wired into Quick Add or persistence in Wave 5A.

`@diabetes-universe/types` `NutritionMealType` remains the persisted v1
identifier subset. Adding `unspecified` there would force Timeline
presentation `Record<NutritionMealType, string>` and new locale keys — that
is Wave 5B+ localization work.

### 5.3 Field decisions

| Field                  | Decision                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| `kind`                 | Always `'nutrition'`                                                          |
| `schemaVersion`        | `2` on canonical domain records; persisted production writes stay `1`         |
| `mealType`             | Closed canonical enum only; no free-form strings; no localized inference      |
| `carbohydratesGrams`   | Authoritative finite mass, `> 0`, `<= 1000`; no rounding                      |
| `items`                | Optional. Absent = total-carbs-only. Present = non-empty historical snapshots |
| `items: []`            | Invalid for new canonical v2                                                  |
| `note`                 | Optional string; blank/whitespace is omitted                                  |
| `mode`                 | Legacy v1 only; rejected on v2 validation                                     |
| `products`             | Legacy v1 only; rejected on v2 validation                                     |
| `calculatedCarbsGrams` | Legacy/derived field only; rejected on v2 validation                          |

---

## 6. carbohydratesGrams

Canonical validity (`validateNutritionCanonicalCarbohydratesGrams`):

- value is a `number`;
- `Number.isFinite(value)`;
- `value > 0`;
- `value <= NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS` (`1000`);
- the original number is returned; no rounding and no precision truncation.

`0`, negative, `NaN`, `Infinity`, and values above the technical maximum are
invalid. `0.1`, `12.125`, `500`, and `1000` are valid. `12.125` stays
`12.125`.

The constant must not be duplicated as a raw `1000` in domain code.

The future Quick Add / Edit **500 g** guard is presentation policy for
Wave 5B. Domain validation must keep accepting historical, API, and imported
values up to the technical maximum.

The existing medical API transport ceiling (`2000`) is **not** changed in
this wave.

---

## 7. mealType

Canonical identifiers (`NUTRITION_MEAL_TYPES`):

- `breakfast`
- `lunch`
- `dinner`
- `snack`
- `other`
- `unspecified`

`isNutritionMealType` is an exact membership check. These are invalid in the
canonical validator:

- `Breakfast`
- `Завтрак`
- `Frühstück`
- any other arbitrary string

Localization belongs to the presentation layer. Wave 5A does not add
Nutrition locale keys or a Nutrition-specific localization stack.

The existing Timeline lift-legacy map
(`mapLegacyNutritionMealType` in `@diabetes-universe/timeline`) remains a
**migration adapter for pre-semantic rows**. It is not imported into the
canonical v2 validator, and Wave 5A does not guess unknown legacy meal types.

---

## 8. Item snapshots

`items` is optional.

| Presence        | Meaning                           |
| --------------- | --------------------------------- |
| omitted         | Total-carbs-only Nutrition record |
| non-empty array | Itemized historical snapshot      |
| `[]`            | Invalid for canonical v2          |

Each item:

- `itemId` — non-empty opaque identity string inside this record;
- `name` — historical display snapshot, non-empty after trimming;
- `carbohydratesGrams` — same canonical mass contract as the event total;
- `weightGrams`, if present — finite and `> 0`;
- `carbsPer100Grams`, if present — finite and `> 0`.

Rules:

- Do not look up an item by `name`.
- Do not treat current demo `productId` as a catalogue identity.
- Do not add a food-database architecture.
- Extra unknown item fields (including `productId`) are ignored, not copied
  onto the validated snapshot.

---

## 9. Authoritative total

`event.carbohydratesGrams` is the authoritative historical total.

`items[].carbohydratesGrams` are historical item snapshots.

The validator must **not**:

- recompute the event total from items;
- round the total;
- repair a mismatch;
- recompute an old row as `weight × carbsPer100`;
- consult a product catalogue.

All values are immutable historical facts after save. A later edit/adoption
wave may ask a user to confirm a new total; Wave 5A does not rewrite history.

---

## 10. Legacy v1 compatibility

Existing Nutrition records must continue to be read by current Timeline,
Dashboard, IndexedDB, and API paths. Wave 5A does not change those readers.

Explicit concepts:

| Concept                    | Recognition                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| **Legacy Nutrition event** | `kind: 'nutrition'` and `schemaVersion: 1`                              |
| **Canonical Nutrition v2** | `kind: 'nutrition'` and `schemaVersion: 2` plus the strict v2 validator |

`classifyNutritionTimelineEvent`:

- classifies schemaVersion `1` as `legacy_v1` **without** applying the v2
  validator (free-form `mealType`, `mode`, `products`, and even values that
  v2 would reject stay readable as legacy);
- applies `validateNutritionTimelineEventV2` only to schemaVersion `2`;
- does not infer unknown legacy meal types;
- does not rewrite the record to v2.

Adoption of v1 → v2 is deferred to later Edit/API waves. There is no startup
migration and no silent backfill.

The shared persisted type `NutritionTimelineEvent` is unchanged. Opening
`TimelineEventSchemaVersion` to `1 \| 2` would allow schemaVersion `2` on
glucose/insulin as well and would require IndexedDB, adoption, and API
changes — that is later-wave work.

---

## 11. Ownership and dependency boundaries

```text
Canonical Nutrition v2 contract (@diabetes-universe/medical-domain)
        ↓
Future 5B presentation / Quick Add adapter (apps/web)
        ↓
Dashboard / Timeline / persistence / API   ← unchanged in Wave 5A
```

| Concern                               | Owner in Wave 5A                              | Not in Wave 5A         |
| ------------------------------------- | --------------------------------------------- | ---------------------- |
| Canonical v2 types and validators     | `medical-domain` nutrition module             | UI, locales            |
| Persisted v1 `NutritionTimelineEvent` | `@diabetes-universe/types` (unchanged)        | Rewrite to v2          |
| Localized meal labels                 | Existing presentation / Quick Add (unchanged) | Domain inference       |
| IndexedDB / API schemaVersion `1`     | Existing validators (unchanged)               | v2 wiring              |
| Insulin dose / glucose validation     | Existing modules (unchanged)                  | Any Nutrition coupling |

`@diabetes-universe/timeline-web` must **not** gain a `medical-domain`
dependency. That direction is unchanged.

Domain error codes are locale-neutral (`nutrition.carbohydrates.not_positive`,
…). User-facing copy stays out of `medical-domain`.

---

## 12. Safety invariants

1. Diabetes Universe **records carbohydrates entered or imported** as
   historical facts.
2. It does **not** calculate or recommend insulin from Nutrition in Wave 5A.
3. It does **not** implement carb ratio, correction factor, IOB, bolus math,
   or therapy recommendations.
4. The 1000 g ceiling is a **technical** domain bound, not a dietary
   recommendation.
5. The future 500 g UI guard is **not** a medical maximum.
6. No food database, barcode, photo recognition, recipe, shopping list, or
   calorie/macro model is defined here.
7. Closed verticals stay closed: Glucose, Insulin, Timeline generic
   architecture, and the localization platform are not modified.

---

## 13. Phased implementation plan

Planning labels only. **Only Wave 5A is implemented in this PR.**

| Wave   | Intent                                                                 | Must not include                           |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------ |
| **5A** | Domain contract, locale-neutral validators, architecture docs, tests   | UI, persistence, API, OpenAPI, writers     |
| **5B** | Canonical + localized Nutrition Quick Add; presentation policy (500 g) | Food DB, API, persistence semantic rewrite |
| Later  | Edit adoption v1→v2, save integrity, API/OpenAPI, Timeline Detail      | Insulin recommendations                    |

Do not claim that Quick Add, API, or persistence already write or validate
canonical v2. They still use Nutrition v1.

---

## 14. Explicit non-scope

Wave 5A does **not** include:

- Nutrition Quick Add redesign;
- manual 500 g UI limit;
- comma/dot parser;
- localized meal labels;
- product selector redesign;
- real food database;
- barcode scanning;
- photo recognition;
- recipes;
- shopping list;
- calorie / macros / protein / fat / fibre model;
- save-integrity changes;
- IndexedDB semantic validator wiring;
- Timeline Detail changes;
- Nutrition Edit;
- legacy adoption-on-edit;
- Medical API changes;
- OpenAPI changes;
- Dashboard changes;
- analytics;
- AI;
- insulin recommendations, bolus calculation, carb ratio, correction
  factor, IOB, or therapy recommendations.

If a later slice needs one of those layers to adopt v2, that is a new wave
with its own gate — not a silent expansion of 5A.

---

## 15. Acceptance criteria

Wave 5A is complete when all of the following are true:

1. `kind: 'nutrition'` remains the only Nutrition kind.
2. Canonical domain types and validators live in
   `@diabetes-universe/medical-domain` and are exported from the package root.
3. `NUTRITION_SCHEMA_VERSION` is `2`;
   `NUTRITION_LEGACY_SCHEMA_VERSION` is `1`.
4. Carbohydrates validity is finite, `> 0`, `<= 1000`, with no rounding.
5. Canonical meal types are the closed set including `unspecified`; localized
   labels are invalid in the v2 validator.
6. `items` is omitted or a non-empty snapshot array; `[]` is invalid.
7. The event total is not recomputed from items or catalogue data.
8. Valid v1 records classify as legacy and stay readable; the strict v2
   validator is not the v1 reader.
9. No UI, persistence behavior, API, or OpenAPI change.
10. No `timeline-web → medical-domain` dependency.
11. Insulin and glucose domain modules are unchanged.
12. Focused unit tests cover the numeric, meal-type, item, and legacy
    invariants.
13. Documentation does not claim that Quick Add/API/persistence already use
    v2.
