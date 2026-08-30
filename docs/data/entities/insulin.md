# Insulin Entity

## Status

Approved as a Timeline semantic kind. Wave 4A defines the **target recording
contract**; production types are unchanged until later Wave 4 implementation
PRs.

Authoritative architecture:
[Wave 4A — Insulin Recording Architecture](../../architecture/insulin/wave-4a-insulin-recording-architecture.md).

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
- no shared insulin module in `@diabetes-universe/medical-domain`;
- no bolus calculator, insulin-on-board, recommendation, pump, or therapy plan.

## Target attributes (Wave 4, additive, not implemented here)

Wave 4 keeps the current required fields and adds optional identity/context
fields on the same `schemaVersion: 1`. No destructive startup migration.

| Attribute               | Required on new writes | Type         | Meaning                                              |
| ----------------------- | ---------------------- | ------------ | ---------------------------------------------------- |
| `preparation`           | yes                    | string       | Historical **display snapshot**                      |
| `doseUnits`             | yes                    | number       | Canonical IU; up to 2 decimal places                 |
| `preparationId`         | yes (new writes)       | catalogue ID | Stable product key; never a brand name               |
| `preparationCategory`   | no                     | enum         | `rapid` \| `basal` \| `unspecified` from catalogue   |
| `administrationContext` | no                     | enum         | Semantic context; labels live in locales             |
| `context`               | no                     | string       | Legacy only; new writes must not persist labels here |

Approved context IDs: `before_meal`, `after_meal`, `correction`, `basal`,
`other`, `unspecified`.

Approved catalogue IDs and safety rules live in the Wave 4A architecture
document. Category must not be inferred from a display name without a governed
mapping table.

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
- `doseUnits` must be a finite number greater than 0.
- Domain technical ceiling: `doseUnits <= 1000` (overflow/typo protection).
- Quick Add/edit may keep a tighter UI ceiling (current demo 100). Neither
  ceiling is a therapeutic limit.
- `preparation` must be a non-empty snapshot after trim.
- `occurredAt` must be valid ISO 8601; invalid Quick Add times fail create.
- `id`, `kind`, `source`, and `createdAt` are immutable after create.
- No default dose. No glucose-derived dose.
- The product records the entered dose; it does not calculate, recommend, or
  certify clinical safety.

## Notes

- Historical events shaped `{ kind, preparation, doseUnits, context? }` remain
  readable. Presentation maps legacy Russian context strings through a governed
  table or shows `unspecified` plus the original snapshot.
- Application startup must not rewrite insulin rows in IndexedDB.
- Explicit import/migration utilities may attach mapping evidence outside the
  event.
- Future cloud sync uses the existing Timeline/P10–P12 path; Wave 4 does not
  add an insulin-specific sync protocol.
- Implementation slices: 4B-I types/domain, 4B-II presentation, 4C Quick Add
  localization, 4D save integrity. None of those start in Wave 4A.
