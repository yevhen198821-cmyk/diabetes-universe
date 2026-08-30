# Insulin Entity

## Status

Approved as a Timeline semantic kind. Wave 4A is the approved recording
architecture. Wave 4B-I adds the shared TypeScript contract and
presentation-neutral medical-domain foundation. Application writers, UI,
IndexedDB, and the medical API remain on the current payload.

Authoritative architecture:
[Wave 4A — Insulin Recording Architecture](../../architecture/insulin/wave-4a-insulin-recording-architecture.md).
Implementation:
[Wave 4B-I — Shared Insulin Types and Medical-Domain Foundation](../../implementation/wave-4b-i-insulin-domain-foundation.md).

## Purpose

Represent one **user-recorded insulin administration** in the shared Timeline
journal.

An insulin event stores the dose the user entered, a preparation display
snapshot, optional administration context, and lifecycle metadata. It is a
journal record, not a prescription, recommendation, pump command, or therapy
plan.

## Current production attributes (schemaVersion 1)

These fields are what Dashboard, Timeline, Quick Add, and IndexedDB persist
today.

| Attribute       | Required | Type        | Meaning                                   |
| --------------- | -------- | ----------- | ----------------------------------------- |
| `id`            | yes      | string      | Stable event identifier                   |
| `kind`          | yes      | `'insulin'` | Discriminator                             |
| `occurredAt`    | yes      | ISO 8601    | Administration time entered by the user   |
| `createdAt`     | yes      | ISO 8601    | Local first-seen timestamp                |
| `updatedAt`     | yes      | ISO 8601    | Local last-mutation timestamp             |
| `schemaVersion` | yes      | `1`         | Semantic schema generation                |
| `source`        | yes      | source      | Origin (`manual` for Quick Add)           |
| `provenance`    | no       | object      | Optional envelope provenance              |
| `preparation`   | yes      | string      | Free display string (often a brand label) |
| `doseUnits`     | yes      | number      | Canonical dose in international units     |
| `context`       | no       | string      | Free/localized administration label       |

Conceptual unit: `CanonicalUnitId` `'insulin.international_unit'`. The unit is
not stored on the event.

### Current write path

Quick Add collects `InsulinQuickAddEntry` (`preparation`, `doseUnits`, `time`,
optional `context` string). `createSemanticInsulinTimelineEvent` copies
trimmed strings and the numeric dose, sets `source: 'manual'`, and allocates a
new event ID at create time.

Dashboard and Timeline persist through fire-and-forget `TimelineStore.addEvent`
and IndexedDB. Glucose Wave 3D save integrity does **not** apply.

### Current limitations

- preparation and context are not semantic identifiers;
- brand labels act as identifiers;
- Quick Add options and form chrome are hardcoded in Russian;
- UI validation `0 < dose <= 100` is a demo technical bound, not a safe dose;
- shared insulin types and medical-domain helpers exist (Wave 4B-I); no UI
  writer emits `preparationId` or `administrationContext` yet;
- no bolus calculator, insulin-on-board, recommendation, pump, or therapy plan.

## Target attributes (Wave 4, additive)

Wave 4B-I implements the optional identity/context fields on
`InsulinTimelineEvent`. Writers and the medical API are unchanged.

Wave 4 keeps the current required fields and adds optional identity/context
fields. `schemaVersion` stays `1` **only if** every fail-closed reader that
will see the new writer contract — including the medical API allow-list and
adoption validator — is updated **before** those writes reach that boundary.
No destructive startup migration.

| Attribute               | Required on new writes | Type         | Meaning                                                                                                                                                                 |
| ----------------------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preparation`           | yes                    | string       | Historical **display snapshot** — never compared as identity                                                                                                            |
| `doseUnits`             | yes                    | number       | Canonical IU; finite, `> 0`, `<= 500` (server bound). Manual parsers may cap fractional digits; storage does not.                                                       |
| `preparationId`         | when catalogue-known   | catalogue ID | Stable internal catalogue-entry key (includes `insulin.prep.other`). **Omitted** on unmatched historical strings. Never a display label. Never `insulin.prep.unmapped`. |
| `administrationContext` | yes (new writes)       | enum         | Semantic context. Optional in TypeScript **only** so legacy rows remain readable. New writes always set it (`unspecified` if none chosen).                              |
| `context`               | no                     | string       | Legacy only; new writers must not write this field                                                                                                                      |

`preparationCategory` is **not** a persisted event field. Rapid / long-acting
grouping is catalogue/presentation chrome derived from `preparationId` when
the entry is known.

Approved context IDs: `before_meal`, `after_meal`, `correction`, `basal`,
`other`, `unspecified`.

Approved catalogue IDs and safety rules live in the Wave 4A architecture
document. Do not infer a catalogue ID from a display name without a governed
mapping table.

### Cloud / API compatibility (current)

The current medical API validator (`validateSemanticEvent`) **rejects unknown
fields**. `preparationId` and `administrationContext` therefore **cannot**
pass create, update, or adoption today. Semantic insulin writes are
**local-only** until the named **Wave 4E** API/adoption/OpenAPI slice. This
entity page does not claim the existing cloud path already accepts the new
fields.

## Relationships

- An insulin event is one variant of `SemanticTimelineEvent`.
- Dashboard Day Summary insulin total is the sum of `doseUnits` for local-today
  insulin events — an arithmetic total, not a prescribed daily dose.
- Timeline card, detail, search, and filter consume the same semantic event.
- Quick Add and (later) edit create or update the same entity.
- Diabetes Settings and a future Therapy Profile are **not** parents of this
  event. Wave 2A deferred therapy/regimen.
- Glucose events never generate insulin events.

## Constraints

- `kind` must be `'insulin'`.
- Canonical `doseUnits` validity: finite number, greater than 0, and
  `<= 500` (existing server technical bound
  `INSULIN_DOSE_MAX`). This is **not** a therapeutic or “safe” ceiling.
- Current Quick Add/Edit UI ceiling remains `<= 100` as a narrower **typo
  guard**. Also not therapeutic.
- Manual input (Wave 4C) may accept at most two fractional digits. Device
  and import values must not be rejected solely for extra decimals. Do not
  silently round persisted values.
- `preparation` must be a non-empty snapshot after trim. For
  `insulin.prep.other`, the snapshot is the **user-entered name**, never a
  localized “Other/Другое” label. If that name is not collected, Other must
  not ship as a semantic writer.
- `occurredAt` must be valid ISO 8601; invalid Quick Add times fail create.
- `id`, `kind`, `source`, and `createdAt` are immutable after create.
- No default dose. No glucose-derived dose.
- The product records the entered dose; it does not calculate, recommend, or
  certify clinical safety.

## Notes

- Historical events shaped `{ kind, preparation, doseUnits, context? }` remain
  readable. Unmatched strings keep the original `preparation` snapshot and
  **omit** `preparationId`. Presentation maps legacy Russian context strings
  through a governed table or shows `unspecified` plus the original snapshot.
- Readers prefer `administrationContext`, then the governed legacy `context`
  mapping, then presentation fallback. When both old and new context fields
  exist, `administrationContext` wins.
- Application startup must not rewrite insulin rows in IndexedDB.
- Explicit import/migration utilities may attach mapping evidence outside the
  event.
- Timeline Edit today spreads the existing event and overwrites only
  `preparation` / `context`. Wave 4C semantic writes **must not ship** until
  Edit is semantic-aware for those fields **or** temporarily prevents editing
  them on semantic insulin events.
- Cloud sync of the new fields is **blocked** until Wave 4E updates the
  medical API allow-list, kind validation, adoption, OpenAPI, and tests.
  Wave 4 does not add an insulin-specific sync protocol.
- Implementation slices: 4B-I types/domain (this wave), 4B-II presentation
  plus semantic-safe edit, 4C localized Quick Add (including required Other
  name), 4D local save integrity, 4E API/adoption/OpenAPI. 4B-II is not
  started.
