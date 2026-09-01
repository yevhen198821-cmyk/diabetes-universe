# Insulin Entity

## Status

Approved as a Timeline semantic kind. Wave 4A is the approved recording
architecture. Wave 4B-I adds the shared TypeScript contract and
presentation-neutral medical-domain foundation. Wave 4B-II adds the shared
presentation adapter and the semantic-safe Timeline Edit path (**Option A**).
Wave 4C migrates Insulin Quick Add to the semantic contract, so both local
writers now emit `preparationId` and `administrationContext`. IndexedDB save
integrity and the medical API remain unchanged.

Authoritative architecture:
[Wave 4A — Insulin Recording Architecture](../../architecture/insulin/wave-4a-insulin-recording-architecture.md).
Implementation:
[Wave 4B-I — Shared Insulin Types and Medical-Domain Foundation](../../implementation/wave-4b-i-insulin-domain-foundation.md),
[Wave 4B-II — Insulin Presentation Adapter and Semantic-Safe Timeline Edit](../../implementation/wave-4b-ii-insulin-presentation-edit.md),
[Wave 4C — Localized Semantic Insulin Quick Add](../../implementation/wave-4c-localized-semantic-insulin-quick-add.md).

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

| Attribute               | Required    | Type         | Meaning                                                       |
| ----------------------- | ----------- | ------------ | ------------------------------------------------------------- |
| `id`                    | yes         | string       | Stable event identifier                                       |
| `kind`                  | yes         | `'insulin'`  | Discriminator                                                 |
| `occurredAt`            | yes         | ISO 8601     | Administration time entered by the user                       |
| `createdAt`             | yes         | ISO 8601     | Local first-seen timestamp                                    |
| `updatedAt`             | yes         | ISO 8601     | Local last-mutation timestamp                                 |
| `schemaVersion`         | yes         | `1`          | Semantic schema generation                                    |
| `source`                | yes         | source       | Origin (`manual` for Quick Add)                               |
| `provenance`            | no          | object       | Optional envelope provenance                                  |
| `preparation`           | yes         | string       | Display snapshot (catalogue label or user-entered Other name) |
| `doseUnits`             | yes         | number       | Canonical dose in international units                         |
| `preparationId`         | new writes  | catalogue ID | Catalogue identity; omitted on unmatched historical rows      |
| `administrationContext` | new writes  | context ID   | Semantic context; always set by new writes                    |
| `context`               | legacy only | string       | Free/localized administration label kept on historical rows   |

Conceptual unit: `CanonicalUnitId` `'insulin.international_unit'`. The unit is
not stored on the event.

### Current write path

Quick Add collects the semantic `InsulinQuickAddEntry` (`preparationId`,
`preparation` snapshot, `doseUnits`, `administrationContext`, `time`) and
validates it through `prepareInsulinNewWrite` before submit.
`createSemanticInsulinTimelineEvent` writes those semantic fields, sets
`source: 'manual'` and `schemaVersion: 1`, allocates a new event ID at create
time, and never emits the legacy `context` key.

Timeline Edit writes the same semantic fields through the Wave 4B-II edit
transition.

Dashboard and Timeline persist through awaited `TimelineStore.addEventAsync`
and IndexedDB. Glucose and insulin Quick Add share the Wave 3D / Wave 4D
save-integrity contract (stable event ID, pending state, dismiss lock, retry on
failure).

### Current limitations

- UI validation `0 < dose <= 100` is a technical typo guard, not a safe dose;
  Quick Add additionally accepts at most two fractional digits as a manual
  input policy, while canonical domain validity stays `> 0`, `<= 500` with no
  precision limit;
- semantic fields are local-only until Wave 4E; `validateSemanticEvent` still
  rejects them at the API boundary;
- failed local writes surface a localized save error and retry with the same
  event ID once Wave 4D is merged; until then see branch implementation status;
- the shared Quick Add action menu and shared UI picker chrome remain
  unlocalized for every category;
- no bolus calculator, insulin-on-board, recommendation, pump, or therapy plan.

## Target attributes (Wave 4, additive)

Wave 4B-I implemented the optional identity/context fields on
`InsulinTimelineEvent`. Wave 4B-II and Wave 4C now write them on new local
Quick Add and Edit paths. The medical API validator is unchanged — Wave 4E
remains required before those fields may cross the cloud boundary.

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
- Timeline Edit is semantic-aware as of Wave 4B-II (Option A). Preparation
  identity and its display snapshot are resolved together in one save, an
  explicit context choice writes `administrationContext` and removes the
  legacy `context`, and a legacy row never gains a fabricated identity. The
  Wave 4A §11.4 edit gate is therefore satisfied.
- Cloud sync of the new fields is **blocked** until Wave 4E updates the
  medical API allow-list, kind validation, adoption, OpenAPI, and tests.
  Wave 4 does not add an insulin-specific sync protocol.
- Implementation slices: 4B-I types/domain, 4B-II presentation plus
  semantic-safe edit (merged), 4C localized Quick Add including the required
  Other name (merged), 4D local save integrity (implemented on branch / pending
  merge), 4E API/adoption/OpenAPI (not started).
