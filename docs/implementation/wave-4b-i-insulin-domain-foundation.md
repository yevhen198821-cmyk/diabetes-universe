# Wave 4B-I — Shared Insulin Types and Medical-Domain Foundation

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4B-I                                                                         |
| Status       | Implemented                                                                  |
| Date         | 2026-08-30                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Base SHA     | `a3453018bbfb8f5eeb8d97c692ccd0dbafcc09b4`                                   |

This slice implements only the shared type contract and presentation-neutral
`@diabetes-universe/medical-domain` insulin foundation approved in Wave 4A.
It does not change UI, persistence, API, OpenAPI, or writer behavior.

## Package ownership

```text
Canonical insulin types (@diabetes-universe/types)
        ↓
@diabetes-universe/medical-domain insulin foundation
        ↓
Future 4B-II presentation adapter / 4C semantic Quick Add
```

| Package                             | Owns                                                                                                                            | Does not own                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `@diabetes-universe/types`          | `InsulinPreparationId`, `InsulinAdministrationContext`, additive optional fields on `InsulinTimelineEvent`                      | Display labels, grouping chrome, validation |
| `@diabetes-universe/medical-domain` | Catalogue identity, presentation grouping resolver, canonical dose validation, context guards, legacy mapping, new-write helper | Locales, UI, persistence, API allow-list    |
| `apps/web`                          | Unchanged writers, Dashboard, Timeline, medical API validators                                                                  | Not migrated in 4B-I                        |

Public consumers import from package roots. Deep imports are not required.

## Implemented type contract

`schemaVersion` remains `1`. Required fields stay `preparation` and
`doseUnits`. Legacy `context?: string` remains readable.

Additive optional fields:

- `preparationId?: InsulinPreparationId`
- `administrationContext?: InsulinAdministrationContext`

`InsulinPreparationId` is the closed catalogue:

- `insulin.prep.aspart_novorapid`
- `insulin.prep.aspart_fiasp`
- `insulin.prep.lispro_humalog`
- `insulin.prep.glulisine_apidra`
- `insulin.prep.glargine_lantus`
- `insulin.prep.degludec_tresiba`
- `insulin.prep.other`

`insulin.prep.unmapped` is not a type member. `preparationCategory` is not
on `InsulinTimelineEvent`. `InsulinQuickAddEntry` is unchanged (Wave 4C).

## Catalogue identity versus snapshot versus grouping

| Concern                       | Storage / API                                     | Owner                                |
| ----------------------------- | ------------------------------------------------- | ------------------------------------ |
| Catalogue entry ID            | Optional `preparationId` on later semantic writes | types + `insulin-catalogue`          |
| Display / Other-name snapshot | Required `preparation` string                     | Caller supplies; domain only trims   |
| Presentation grouping         | **Not persisted**                                 | `resolveInsulinPresentationGrouping` |

Grouping values: `rapid_acting`, `long_acting`, `unspecified`.

- NovoRapid / Fiasp / Humalog / Apidra IDs → `rapid_acting`
- Lantus / Tresiba IDs → `long_acting`
- `insulin.prep.other` or missing/unknown runtime ID → `unspecified`

Grouping is catalogue/presentation chrome. It is not a clinical
classification, therapy role, recommendation, or event field.

Identity is never inferred from display text. Medical-domain contains no
product display strings.

## Canonical dose versus future manual precision

`validateInsulinCanonicalDose`:

- value must be a `number`;
- `Number.isFinite(value)`;
- `value > 0`;
- `value <= 500` (`INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM`);
- returns the original number with no rounding.

This ceiling is the existing medical API technical transport bound
(`INSULIN_DOSE_MAX`). It is not a therapeutic or “safe” maximum.

Wave 4C may apply a two-decimal rule to **manual** parsers only. Device and
import values must not fail only because they have more fractional digits.

Domain APIs do not include `safeDose`, `recommendedDose`,
`maximumSafeDose`, `defaultDose`, `calculateDose`, or `glucoseToInsulin`.

## Administration context and legacy compatibility

New writes always produce `administrationContext`. Omitted / `null` / empty
string becomes `unspecified`. Invalid tokens fail.

`mapLegacyInsulinAdministrationContext` is an exact, read-only mapping:

| Stored `context` | Maps to       |
| ---------------- | ------------- |
| `Перед едой`     | `before_meal` |
| `После еды`      | `after_meal`  |
| `Коррекция`      | `correction`  |
| `Базальный`      | `basal`       |
| `Другое`         | `other`       |

Blank, partial, differently cased, and unknown strings return
`{ matched: false }`. The helper does not write `context`.

## New-write result contract

`prepareInsulinNewWrite(input)` returns:

- `{ ok: true, value }` with `preparationId`, `preparation` (trimmed),
  `doseUnits`, `administrationContext`;
- or `{ ok: false, error }` with a technical error code.

Successful output does not contain `context` or `preparationCategory`.

Error codes:

- `insulin.preparation_id.invalid`
- `insulin.preparation.snapshot_empty`
- `insulin.preparation.other_name_required`
- `insulin.dose.not_a_number`
- `insulin.dose.not_finite`
- `insulin.dose.not_positive`
- `insulin.dose.above_technical_maximum`
- `insulin.administration_context.invalid`

`insulin.prep.other` requires a non-empty user-entered name. The helper does
not manufacture a localized “Other” / “Другое” snapshot. Invalid input is
rejected, not repaired. There is no clock, event ID, persistence, locale, or
hidden global state.

## Wave 4E API incompatibility (tracked)

Current `validateSemanticEvent` in
`apps/web/lib/medical/server/medical-api-validation.ts` still allow-lists
insulin payload keys `preparation`, `doseUnits`, and `context` only.
`rejectUnknownTopLevelFields` therefore **rejects** `preparationId` and
`administrationContext` on create, update, and adoption.

4B-I does **not** change that allow-list, adoption validation, or OpenAPI.
Semantic insulin fields are **not** cloud-compatible until Wave **4E**.

No current UI writer emits the new fields. Quick Add still writes
`{ preparation, doseUnits, context? }` via
`createSemanticInsulinTimelineEvent`.

## Safety / non-recommendation boundary

The product records a user-entered dose. This foundation does not calculate,
recommend, default, or derive insulin from glucose. Technical bounds must not
be presented as clinical safety.

## Deferred work

| Wave      | Scope                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| **4B-II** | Presentation adapter and semantic-safe Timeline Edit (Option A preferred, or Option B lock) |
| **4C**    | Localized semantic Quick Add, including required Other name                                 |
| **4D**    | Awaited local IndexedDB save integrity                                                      |
| **4E**    | API allow-list, kind validation, adoption, OpenAPI, API/domain tests                        |

Wave 4B-II is not started here.
