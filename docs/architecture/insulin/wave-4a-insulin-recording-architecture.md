# Wave 4A — Insulin Recording Architecture

## Document status

| Field        | Value                                                     |
| ------------ | --------------------------------------------------------- |
| Wave         | 4A — Architecture only                                    |
| Status       | **Approved** (merged)                                     |
| Date         | 2026-08-30 (remediated)                                   |
| Scope        | Canonical insulin administration recording                |
| Out of scope | Runtime, UI, migrations, production TypeScript in this PR |
| Base SHA     | `1067b9f9221ba2406c97078846dd7343533524e9`                |

Wave 4A is the approved architecture. Decisions in this document are
unchanged.

**Implementation progress** (annotation only):

| Slice     | Status                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 4A        | Approved and merged                                                                                                                     |
| **4B-I**  | Implemented — [shared types and medical-domain foundation](../../implementation/wave-4b-i-insulin-domain-foundation.md)                 |
| **4B-II** | Implemented — [presentation adapter and semantic-safe edit](../../implementation/wave-4b-ii-insulin-presentation-edit.md), **Option A** |
| **4C**    | Implemented — [localized semantic insulin Quick Add](../../implementation/wave-4c-localized-semantic-insulin-quick-add.md)              |
| **4D**    | Implemented — [insulin Quick Add save integrity](../../implementation/wave-4d-insulin-quick-add-save-integrity.md)                      |
| **4E**    | Implemented on branch / pending merge — [API / adoption / OpenAPI](../../implementation/wave-4e-insulin-api-adoption-openapi.md)        |

The §11.4 Timeline Edit hard gate is satisfied by **Option A**. Wave 4D local
save integrity is merged. Wave 4E (this branch / pending merge) updates the
runtime allow-list, kind-specific validation, adoption validation, OpenAPI
contract, and API/domain tests so semantic insulin fields are v1-transport
compatible. The continuous cloud sync engine remains out of scope.

## Table of contents

1. [Purpose](#1-purpose)
2. [Current-state inventory](#2-current-state-inventory)
3. [Problem statement](#3-problem-statement)
4. [Approved terminology](#4-approved-terminology)
5. [Canonical target contract](#5-canonical-target-contract)
6. [Preparation model](#6-preparation-model)
7. [Administration context taxonomy](#7-administration-context-taxonomy)
8. [Safety invariants](#8-safety-invariants)
9. [Ownership and dependency boundaries](#9-ownership-and-dependency-boundaries)
10. [Persistence and save integrity](#10-persistence-and-save-integrity)
11. [Compatibility and migration](#11-compatibility-and-migration)
12. [Localization contract](#12-localization-contract)
13. [Product presentation](#13-product-presentation)
14. [Phased implementation plan](#14-phased-implementation-plan)
15. [Risks](#15-risks)
16. [Explicit non-scope](#16-explicit-non-scope)
17. [Acceptance criteria for Wave 4B-I](#17-acceptance-criteria-for-wave-4b-i)

## Dependencies

- [Insulin Entity](../../data/entities/insulin.md)
- [Timeline Entity](../../data/entities/timeline.md)
- [Timeline Quick Add Integration](../timeline/quick-add-integration.md)
- [Dashboard Quick Add Integration](../dashboard/quick-add-integration.md)
- [Timeline Shared State](../timeline/shared-state.md)
- [Wave 2A — Diabetes Settings Architecture](../profile/wave-2a-diabetes-settings-architecture.md)
- [Wave 3A-I — Shared Glucose Domain Foundation](../../implementation/wave-3a-i-shared-glucose-foundation.md)
- [UI Bible: Quick Add](../../ui-bible/003-quick-add.md)
- [P8 — Medical API Contracts](../api/p8-medical-api-contracts.md)
- [OpenAPI medical-v1](../../api/openapi/medical-v1.yaml)

---

## 1. Purpose

Define the safe canonical architecture for recording insulin **administration**
before any Wave 4 runtime or UI work begins.

Diabetes Universe already records insulin as a `SemanticTimelineEvent` of
`kind: 'insulin'`. Wave 4A does not invent a new journal. It replaces free
display strings, brand-as-identifier coupling, and fire-and-forget save
semantics with a governed recording contract that:

- stores a dose the user entered;
- preserves historical display when catalogues change;
- localizes labels without persisting them as medical identity;
- keeps Dashboard and Timeline on one semantic contract;
- forbids dosing calculation, recommendation, or pump control;
- does not treat local IndexedDB acceptance as cloud/API compatibility.

This document is the approval gate for later Wave 4 implementation slices.

---

## 2. Current-state inventory

### Historical baseline (pre–Wave 4B)

Audited against `origin/main` at
`1067b9f9221ba2406c97078846dd7343533524e9` (2026-08-30). Subsections §2.1–§2.9
record the **pre–Wave 4B** production inventory that informed Wave 4A
architecture decisions. They are retained unchanged; they do not describe the
repository after Waves 4B-I, 4B-II, or 4C merged. For the live inventory, see
§2.10.

### 2.1 Production type contracts (historical baseline)

`InsulinQuickAddEntry` (`packages/types/src/quick-add.ts`):

```ts
interface InsulinQuickAddEntry {
  readonly preparation: string;
  readonly doseUnits: number;
  readonly time: string;
  readonly context?: string;
}
```

`InsulinTimelineEvent` (`packages/types/src/semantic-timeline.ts`):

```ts
interface InsulinTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'insulin';
  readonly preparation: string;
  readonly doseUnits: number;
  readonly context?: string;
}
```

Shared envelope already provides `id`, `occurredAt`, `createdAt`, `updatedAt`,
`schemaVersion: 1`, `source`, and optional `provenance`.

`CanonicalUnitId` already includes `'insulin.international_unit'`. The insulin
event does **not** persist a unit field; `doseUnits` is treated as IU.

Glucose already uses a semantic context union
(`GlucoseMeasurementContext`). Insulin `context` remains an untyped `string`.

### 2.2 Production trajectory

```text
InsulinQuickAddForm
  → InsulinQuickAddEntry { preparation, doseUnits, time, context? }
  → QuickAddHost.handleInsulinSubmit
       onInsulinSubmit(entry)
       haptics.success()
       closeQuickAdd('success')          // immediate close
  → DashboardRoot / TimelineShell
       createSemanticInsulinTimelineEvent(entry)
       TimelineStore.addEvent(event)     // fire-and-forget
  → IndexedDB TimelineRepository
  → store projection upsert after applied
```

Dashboard and Timeline share the same creator and store API. They do **not**
share the Wave 3D glucose save-integrity contract.

### 2.3 Quick Add input

| Concern            | Current implementation                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Form               | `apps/web/components/quick-add/insulin-quick-add-form.tsx`                                                  |
| Preparation list   | `insulin-preparation-options.ts` — `NovoRapid`, `Fiasp`, `Humalog`, `Apidra`, `Lantus`, `Tresiba`, `Другое` |
| Preparation groups | Hardcoded RU: «Быстрый инсулин», «Базальный инсулин»                                                        |
| Context list       | `insulin-context-options.ts` — `Перед едой`, `После еды`, `Коррекция`, `Базальный`, `Другое`                |
| Dose parse         | `parseInsulinDoseInput()` — finite, `> 0`, `<= 100`; pattern allows one fractional group                    |
| Labels             | Hardcoded Russian in the form and action metadata                                                           |
| Locale keys        | No `quick-add.insulin.*` resources                                                                          |

The selected preparation **label is stored as `preparation`**. Rapid/basal
group headings are UI-only and are not persisted.

«Другое» is stored as the literal string `Другое`. There is no free-text
preparation name field.

### 2.4 Semantic write

`createSemanticInsulinTimelineEvent`:

- `preparation` ← trimmed entry string;
- `doseUnits` ← parsed number;
- `context` ← trimmed optional string or omitted;
- `occurredAt` ← ISO 8601 from selected local time;
- `id` ← `insulin-${HHmm}-${uuid}` generated at create time (not retained across retry);
- `source: 'manual'`;
- `schemaVersion: 1`.

### 2.5 Timeline Edit (current)

`updateSemanticTimelineEventFromDraft` in
`apps/web/components/timeline/timeline-event-detail-model.ts`:

- spreads the existing event (`...event`);
- overwrites `preparation` from the generic `title` field;
- overwrites `context` from the generic free-text context field;
- validates dose with the same **100 IU** UI ceiling as Quick Add;
- does not read or write any preparation identity other than the display
  string.

After optional semantic fields exist, this spread-then-overwrite pattern can
leave `preparationId` pointing at the previous catalogue entry while
`preparation` holds a new title, and can leave `administrationContext` stale
while `context` holds a new string. That conflict is a **hard rollout gate**
(see §11.4), not a later polish item.

### 2.6 Consumers

| Surface                  | Behavior                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Dashboard Day Summary    | `getTodayInsulinTotal()` sums today's `doseUnits`                                            |
| Dashboard Recent Events  | Insulin cards: title = `preparation`, value = formatted dose, context = stored string        |
| Dashboard Quick Actions  | Opens insulin Quick Add                                                                      |
| Next Action              | Can open insulin form via `openCategory: 'insulin'`; copy does not recommend a dose          |
| Timeline card / detail   | `mapInsulinPresentation()` — title = `preparation`; search includes preparation/dose/context |
| Timeline edit            | Generic draft as in §2.5                                                                     |
| Timeline search / filter | Kind filter `insulin`; haystack uses stored strings                                          |
| IndexedDB validation     | Requires `preparation` + `doseUnits`; does not validate context taxonomy                     |
| Localization             | Kind/unit/Day Summary labels exist; Quick Add insulin copy is not localized                  |

### 2.7 Server / API / adoption (current)

These paths **do not** automatically accept new semantic insulin fields.

| Boundary                        | Current behavior                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime create/update           | `validateSemanticEvent` in `apps/web/lib/medical/server/medical-api-validation.ts` calls `rejectUnknownTopLevelFields` with a shared allow-list. Allowed insulin-relevant keys: `preparation`, `doseUnits`, `context`, plus envelope keys. **`preparationId` and `administrationContext` are unknown and are rejected.** |
| Kind-specific insulin rules     | Requires `preparation` string and `doseUnits` in `INSULIN_DOSE_MIN` (0) … `INSULIN_DOSE_MAX` (**500**). Optional `context` is a bounded string, not a semantic enum.                                                                                                                                                     |
| Adoption                        | `medical-adoption-validation.ts` reuses `validateSemanticEvent`. The same allow-list applies.                                                                                                                                                                                                                            |
| Domain mapper                   | `packages/medical-domain/src/mappers/semantic-event-mapper.ts` strips server-owned lifecycle fields and projects `kind` / `occurredAt` / `schemaVersion`. It does not define insulin-specific optional fields.                                                                                                           |
| OpenAPI `SemanticTimelineEvent` | `docs/api/openapi/medical-v1.yaml` declares `occurredAt`, `schemaVersion`, `source`, `kind` only. It does **not** document insulin payload fields. Runtime validation, not the YAML property list, is the fail-closed gate.                                                                                              |

`MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MAX` is **500**. That is the approved
current transport/domain technical ceiling. There is no approved 1000 IU
decision in the repository.

Local IndexedDB and TypeScript structural typing may accept extra fields.
**That is not cloud compatibility.** Semantic insulin writes must not be
considered cloud-compatible until Wave **4E** completes.

### 2.8 Missing foundation

- `@diabetes-universe/medical-domain` has no insulin module.
- `apps/web/lib/medical/` has no insulin adapter.
- There is no bolus calculator, insulin-on-board model, stacking warning,
  correction factor, carbohydrate ratio, pump command, or therapy plan.
- Wave 2A §14 explicitly deferred therapy/regimen. Wave 4A does not reopen that
  decision.

### 2.9 Confirmed limitations

1. Preparation is a free display string.
2. Context is a localized/free string.
3. Preparation and context options are hardcoded in Russian.
4. Display/trade names act as identifiers (stored, searched, and compared as titles).
5. The 100 IU Quick Add/Edit bound is a UI typo guard, not a medical recommendation.
6. The 500 IU server bound is a technical transport/domain ceiling, not a safe dose.
7. Insulin uses fire-and-forget `addEvent` and immediate close.
8. There is no shared insulin medical-domain/presentation foundation.
9. Strict API/adoption validators reject unknown semantic fields.
10. Generic Timeline Edit would desynchronize new semantic fields if they shipped first.
11. There is no dosing calculator, active-insulin model, recommendation, pump
    integration, or therapy plan.

### 2.10 Current repository state (post–Wave 4C)

Audited against `main` at `8c776882c7d7af51655fd0e80b81d513fb148730` (Wave 4D
merged). Wave 4E is implemented on branch / pending merge.

| Slice  | Status                                                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 4A     | Approved and merged (this document)                                                                                              |
| 4B-I   | Merged — [shared types and medical-domain foundation](../../implementation/wave-4b-i-insulin-domain-foundation.md)               |
| 4B-II  | Merged — [presentation adapter and semantic-safe edit](../../implementation/wave-4b-ii-insulin-presentation-edit.md), Option A   |
| 4C     | Merged — [localized semantic Insulin Quick Add](../../implementation/wave-4c-localized-semantic-insulin-quick-add.md)            |
| **4D** | Merged — [insulin Quick Add save integrity](../../implementation/wave-4d-insulin-quick-add-save-integrity.md)                    |
| **4E** | Implemented on branch / pending merge — [API / adoption / OpenAPI](../../implementation/wave-4e-insulin-api-adoption-openapi.md) |

**Type contracts.** `InsulinQuickAddEntry` and `InsulinTimelineEvent` carry
optional `preparationId` and `administrationContext` on new writes. Legacy
`context` remains readable on historical rows; new writers do not emit it.

**Quick Add trajectory (current).**

```text
InsulinQuickAddForm
  → prepareInsulinQuickAddSubmit / prepareInsulinNewWrite
  → QuickAddHost.handleInsulinSubmit → onInsulinSubmit
  → createSemanticInsulinTimelineEvent
  → TimelineStore.addEvent (fire-and-forget)
  → IndexedDB TimelineRepository
```

**Quick Add input.** Catalogue IDs with localized labels and grouping chrome
from `apps/web/lib/medical/insulin` and `quick-add.insulin.*` locale keys
(EN/RU/UK/DE). Manual dose parser with a two-decimal policy and a 100 IU UI
typo guard. `insulin.prep.other` requires a user-entered name; a localized
“Other” label is never stored as the snapshot.

**Timeline Edit.** Semantic-aware (Wave 4B-II Option A): preparation identity
and display snapshot move together in one save; an explicit context choice
writes `administrationContext` and removes a contradictory legacy `context`.

**Presentation.** Timeline card, detail, search, and Dashboard Recent Events
use the shared insulin presentation adapter. Insulin Timeline presentation is
localized.

**Medical-domain foundation.** `@diabetes-universe/medical-domain` owns the
insulin catalogue, context taxonomy, dose validation, and
`prepareInsulinNewWrite`. `apps/web/lib/medical/insulin` owns presentation and
edit-transition adaptation.

**Hard gates still open.**

- Insulin Quick Add still uses fire-and-forget `addEvent` and immediate close —
  Wave **4D** is not started.
- `validateSemanticEvent` still rejects `preparationId` and
  `administrationContext` on create, update, and adoption — Wave **4E** is not
  started.
- Shared Quick Add action menu and shared picker chrome remain hardcoded in
  Russian for non-insulin categories.
- Nutrition, medication, activity, and note Quick Add remain incompletely
  localized; UK/DE locale parity is still incomplete across the product.
- Runtime locale switching is not production-ready.

---

## 3. Problem statement

The current insulin path is a usable local manual log, but it is not a safe
canonical recording contract.

**Identity leak.** Display/trade names and Russian labels are persisted as if
they were stable catalogue keys. Catalogue changes, locale switches, and
“Other” entries cannot be distinguished from product identity.

**No semantic context.** Unlike glucose, insulin context cannot be localized,
filtered, or migrated without string matching.

**Split presentation.** Dashboard and Timeline format insulin independently of
any shared domain module. Edit uses a generic title/value form that can
desynchronize semantic fields.

**API allow-list.** Additive TypeScript fields are not sufficient for
create/update/adoption. Unknown keys fail closed today.

**Unsafe product implication risk.** A 100 IU UI guard, a 500 IU transport
ceiling, grouped “rapid/basal” chrome, and a “correction” context can be
misread as dosing advice if architecture does not bind them as recording
metadata only.

**Save integrity gap.** Immediate close after `addEvent` can report success
before IndexedDB commits and cannot retry a failed write without allocating a
new event ID.

Wave 4 must fix these recording problems without becoming a clinical dosing
system.

---

## 4. Approved terminology

| Term                                            | Meaning                                                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Insulin administration event**                | A user-recorded dose that was taken or is being logged as taken                                                                                                                                        |
| **Catalogue entry ID (`preparationId`)**        | Stable **internal** key for one governed local-catalogue entry. It may represent a branded preparation. It is never the localized or user-visible label and must never be compared using display text. |
| **Trade/display name snapshot (`preparation`)** | The name stored on the event at write time (localized catalogue label or user-entered Other name)                                                                                                      |
| **Catalogue metadata**                          | Presentation-only grouping and labels derived from a known `preparationId`. Not persisted on the event in Wave 4.                                                                                      |
| **User-entered Other name**                     | Non-empty free-text snapshot required when the catalogue entry is `insulin.prep.other`                                                                                                                 |
| **Unmatched / unknown preparation**             | Presentation state for a historical event with no `preparationId`. Not a catalogue identity.                                                                                                           |
| **Dose**                                        | Numeric amount entered or imported, stored in international units                                                                                                                                      |
| **Administration context**                      | Semantic reason/timing bucket chosen by the user; not a prescription                                                                                                                                   |
| **Technical validation bound**                  | Input, typo, overflow, or transport protection. Not a safe-dose limit                                                                                                                                  |
| **Therapy profile**                             | Future subject-scoped regimen. **Out of Wave 4**                                                                                                                                                       |
| **Recommendation**                              | Any calculated or suggested dose. **Forbidden in Wave 4**                                                                                                                                              |

Do not use “safe dose”, “recommended dose”, “correct dose”, or “insulin on
board” in Wave 4 product or architecture language except to state that those
capabilities are absent.

Do not call Quick Add rapid/basal grouping a clinical classification.

---

## 5. Canonical target contract

Wave 4A does **not** change production TypeScript. The following is the
**target** contract for later implementation waves.

### 5.1 Compatibility decision

**Optional additive fields on `schemaVersion: 1` are the local/type contract.**

A schema-version bump is **not** required because existing required fields keep
their meaning and new fields can be optional for legacy readers.

**`schemaVersion: 1` may be kept only if every fail-closed reader/validator
that the new writer will reach is updated first.**

That includes, before any semantic insulin writer is allowed on that boundary:

- runtime API allow-list and insulin kind-specific validation;
- adoption validation;
- OpenAPI contract representation of the insulin payload;
- API/domain tests.

Until Wave **4E** lands, new semantic fields are **local-only**. They must not
be sent on create, update, or adoption. Local IndexedDB acceptance is not
permission to sync.

Increment `schemaVersion` only if a later wave removes or redefines
`preparation`, `doseUnits`, or `context`. Wave 4 must not do that.

### 5.2 Target semantic shape (conceptual)

```ts
type InsulinPreparationId =
  | 'insulin.prep.aspart_novorapid'
  | 'insulin.prep.aspart_fiasp'
  | 'insulin.prep.lispro_humalog'
  | 'insulin.prep.glulisine_apidra'
  | 'insulin.prep.glargine_lantus'
  | 'insulin.prep.degludec_tresiba'
  | 'insulin.prep.other';

type InsulinAdministrationContext =
  | 'before_meal'
  | 'after_meal'
  | 'correction'
  | 'basal'
  | 'other'
  | 'unspecified';

interface InsulinTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'insulin';
  readonly preparation: string; // required display/trade or Other-name snapshot
  readonly doseUnits: number; // canonical international units
  readonly context?: string; // legacy free/localized string; read-compatible
  readonly preparationId?: InsulinPreparationId; // omitted on unmatched legacy
  readonly administrationContext?: InsulinAdministrationContext;
  // required on new semantic writes; optional only so legacy events type-check
}
```

`preparationCategory` is **not** part of the event contract in Wave 4.

`InsulinQuickAddEntry` should later carry a catalogue entry ID (or Other), a
display snapshot, a required `administrationContext`, and `doseUnits` / time.
It must not treat a display string as the identifier.

### 5.3 Field decisions

| Field                     | Decision                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preparationId`           | Internal catalogue entry ID on new writes when the selection is a catalogue entry or Other. **Omitted** on unmatched historical events. Never `insulin.prep.unmapped`. |
| `preparation`             | **Required** snapshot: localized catalogue display name, or the user-entered Other name. Never a localized “Other/Другое” chrome label on new semantic writes.         |
| `preparationCategory`     | **Not persisted.** Derive presentation grouping from `preparationId` via catalogue metadata when the ID is known.                                                      |
| `doseUnits`               | Canonical IU. No persisted unit discriminator.                                                                                                                         |
| `CanonicalUnitId`         | Conceptual unit remains `'insulin.international_unit'`. Presentation formats it.                                                                                       |
| Canonical validity        | Finite number, `doseUnits > 0`, `doseUnits <= 500`.                                                                                                                    |
| Manual input policy       | Wave 4C may accept at most two fractional digits.                                                                                                                      |
| Device/import precision   | Must not be rejected only because a manual parser has a two-decimal rule. Persist the given finite value if it is in the canonical bound.                              |
| Rounding                  | Do **not** silently round persisted values.                                                                                                                            |
| `occurredAt`              | Administration time entered by the user (ISO 8601). Not the log timestamp.                                                                                             |
| `createdAt` / `updatedAt` | Local lifecycle metadata. Create sets both; later edit updates `updatedAt` only.                                                                                       |
| `administrationContext`   | Optional in TypeScript so legacy events remain readable. **New semantic writers always set it.** No-choice writes `unspecified`.                                       |
| `context`                 | Legacy string, read-compatible. New writers do **not** write this field.                                                                                               |
| `source`                  | `'manual'` for Quick Add and edit. Other sources reserved.                                                                                                             |
| `provenance`              | Unchanged optional envelope field. Wave 4 does not require it.                                                                                                         |
| `id`                      | Existing semantic ID scheme. One stable full ID per logical submit/retry (see §10).                                                                                    |

### 5.4 Dose unit, bounds, and precision

- Canonical stored unit: **international units**.
- Do not persist U-100/U-200 concentration, pens, or volume.

**Canonical event validity** (domain + future transport alignment):

- `Number.isFinite(doseUnits)`
- `doseUnits > 0`
- `doseUnits <= 500` — existing `MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MAX`

The previous draft 1000 IU ceiling is **withdrawn**. No repository decision
replaces 500.

**Manual input policy (Wave 4C Quick Add / current Edit):**

- UI typo guard remains **`0 < dose <= 100`** (`parseInsulinDoseInput` and
  `validateNumber(..., 100, 'Инсулин')`).
- Wave 4C may accept **at most two fractional digits** in the manual parser.
- This is narrower than the 500 IU transport/domain ceiling.

**Device / import:**

- Validate canonical event validity only.
- Do not reject a value solely because it has more than two fractional digits.
- Do not silently round.

Neither 100 nor 500 is a therapeutic maximum. Copy must not say “safe”,
“maximum recommended”, or “do not exceed for medical reasons”.

The current server minimum of `0` is noted as existing transport code.
Canonical administration validity is **`> 0`**. Wave 4E must keep max 500 and
reject non-positive insulin administration doses.

### 5.5 “Other” preparation (resolved)

A localized “Other” / “Другое” **chrome label must not** be stored as
`preparation` on a new semantic event.

| Case                               | `preparationId`           | `preparation` snapshot                         |
| ---------------------------------- | ------------------------- | ---------------------------------------------- |
| Known catalogue selection          | That entry’s catalogue ID | Localized catalogue display name at write time |
| User chooses Other                 | `insulin.prep.other`      | **Required** non-empty user-entered name       |
| Historical unmatched string        | **omit** `preparationId`  | Original stored string                         |
| Blank Other name or blank snapshot | Reject write              | —                                              |

Wave 4C cannot submit Other until the UI collects a non-empty user-entered
name. If that field is not implemented, the Other option **must not ship** as a
semantic writer. The picker label stays localized; the persisted snapshot is
the user-entered name.

A resolution-status field is **not** required by current consumers and is
deferred. Do not encode unmatched status inside `preparationId`.

### 5.6 Catalogue change preservation

When a catalogue display name or grouping chrome changes:

- existing events keep their `preparation` snapshot;
- presentation prefers the event snapshot for title;
- current catalogue grouping may be derived only when `preparationId` is
  present and still in the catalogue;
- deleted catalogue entries remain readable through the snapshot;
- unmatched events stay unmatched (`preparationId` omitted);
- do not rewrite historical events on startup.

---

## 6. Preparation model

### 6.1 Boundaries

```text
Product catalogue (Wave 4 owned, local, finite)
        ↓
preparationId (internal catalogue entry ID) when known
        ↓
Event snapshot: preparation (display/trade name or user-entered Other name)
        ↓
Presentation / localization
        ↓
Optional grouping chrome derived from catalogue metadata via preparationId
```

| Concern                                   | Owner in Wave 4                                                 | Not in Wave 4                          |
| ----------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| Stable catalogue entry ID                 | Local product catalogue in types/domain                         | External medication database           |
| Trade/display name                        | Locale resources (known entries) or user-entered Other snapshot | Using display text as the identity     |
| Grouping chrome (rapid/basal/unspecified) | Catalogue metadata → presentation only                          | Persisted event field; clinical class  |
| Historical snapshot                       | Event `preparation`                                             | Live catalogue overwrite of history    |
| Unmatched historical string               | Omit `preparationId`; present as unmatched                      | Fake catalogue ID                      |
| User medication / therapy profile         | Deferred (Wave 2A §14)                                          | Linking events to a prescribed regimen |
| External medication catalogue             | Future bounded context                                          | RxNorm/ATC/vendor import               |

### 6.2 Approved Wave 4 local catalogue

Wave 4 may encode the **current** Quick Add list as a governed local catalogue.

| Catalogue entry ID              | Default EN display (locale-owned) | Presentation grouping (not persisted) |
| ------------------------------- | --------------------------------- | ------------------------------------- |
| `insulin.prep.aspart_novorapid` | NovoRapid                         | rapid-acting chrome                   |
| `insulin.prep.aspart_fiasp`     | Fiasp                             | rapid-acting chrome                   |
| `insulin.prep.lispro_humalog`   | Humalog                           | rapid-acting chrome                   |
| `insulin.prep.glulisine_apidra` | Apidra                            | rapid-acting chrome                   |
| `insulin.prep.glargine_lantus`  | Lantus                            | long-acting chrome                    |
| `insulin.prep.degludec_tresiba` | Tresiba                           | long-acting chrome                    |
| `insulin.prep.other`            | Other (picker label only)         | unspecified chrome                    |

`insulin.prep.unmapped` is **not** a catalogue identity and must not be
written.

Display strings live in `@diabetes-universe/locales`. Equality uses the
catalogue entry ID, never display text. Tokens after `insulin.prep.` are
developer mnemonics. A branded product may have a catalogue entry; the brand
string is still not the identifier.

Adding products later is a catalogue change, not a schema change.

### 6.3 Grouping rule

Rapid-acting / long-acting / unspecified chrome is **presentation grouping**
derived from a known `preparationId`. It is not a persisted pharmacological
class and not a therapy role.

Do **not** infer grouping from a display name, user Other text, or legacy
string unless a **governed mapping table** lists that exact source string for
presentation only. Ungoverned strings stay unmatched: no `preparationId`,
unspecified chrome.

“Basal” on an administration-context value (user-marked timing bucket) is
unrelated to this grouping and must not be copied onto the event as a
preparation class.

---

## 7. Administration context taxonomy

Replace the free/localized string model with semantic identifiers.

### 7.1 Approved values

| ID            | Recording meaning                     | Must not imply                          |
| ------------- | ------------------------------------- | --------------------------------------- |
| `before_meal` | User marked the dose as before a meal | That the dose is a correct meal bolus   |
| `after_meal`  | User marked the dose as after a meal  | Post-prandial protocol                  |
| `correction`  | User marked the dose as a correction  | Calculated correction or hypo treatment |
| `basal`       | User marked the dose as basal/routine | That a basal rate is appropriate        |
| `other`       | User chose Other                      | A clinical “miscellaneous” protocol     |
| `unspecified` | User chose no specific context        | That missing data is clinically unsafe  |

Labels for EN/RU/UK/DE belong only in locale resources.

### 7.2 Cardinality and writer rules

There is **one** representation of “no specific context” for new writes:
`administrationContext: 'unspecified'`.

| Writer / reader                  | Rule                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| TypeScript field                 | `administrationContext` remains **optional** so legacy events without it remain readable                      |
| New semantic writes              | **Always set** `administrationContext`                                                                        |
| User chooses no specific context | Write `administrationContext: 'unspecified'`                                                                  |
| New writers                      | Do **not** write legacy `context`                                                                             |
| Readers                          | Prefer `administrationContext` if present; else governed legacy `context` mapping; else presentation fallback |

When **both** fields exist, `administrationContext` wins. Legacy `context` may
still be shown only if a later edit/migration UI needs a raw snapshot; it must
not override the semantic value.

Quick Add must not require a specific meal/correction/basal choice. Choosing
none is valid and writes `unspecified`.

### 7.3 Legacy string mapping (read/import only)

Governed mapping for **existing** stored Russian demo strings:

| Stored `context` | Maps to                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `Перед едой`     | `before_meal`                                                                |
| `После еды`      | `after_meal`                                                                 |
| `Коррекция`      | `correction`                                                                 |
| `Базальный`      | `basal`                                                                      |
| `Другое`         | `other`                                                                      |
| missing / other  | presentation fallback (`unspecified` semantics, keep raw snapshot if needed) |

This table is a compatibility adapter, not medical advice.

---

## 8. Safety invariants

These invariants are binding for every Wave 4 implementation PR.

1. Diabetes Universe **records a dose entered by the user**.
2. It does **not** calculate or recommend insulin in Wave 4.
3. It does **not** confirm that a dose is clinically safe.
4. Wave 4 must not implement correction factor, carbohydrate ratio, target
   calculation, insulin on board, stacking warning, basal adjustment, or pump
   command.
5. Validation bounds (100 IU UI guard, 500 IU transport/domain ceiling) are
   **technical** constraints, not therapeutic limits.
6. **No default dose** may be suggested, pre-filled from a prior event, or
   derived from settings.
7. **No glucose value may automatically generate an insulin dose.**
8. Future dosing features require separate clinical architecture, risk review,
   regulatory assessment, and explicit user confirmation.
9. Copy must not present totals, context, or grouping chrome as treatment advice.
10. Day Summary insulin total is an arithmetic sum of recorded IU, not a
    prescribed daily dose.
11. Semantic insulin events are v1-transport compatible after Wave 4E updates
    fail-closed API/adoption/OpenAPI validators. Continuous cloud sync remains
    out of scope.

Wave 2A therapy/regimen deferral remains in force. Event-level recording is not
a Therapy Profile.

---

## 9. Ownership and dependency boundaries

### 9.1 Approved direction

```text
Canonical insulin data (types + SemanticTimelineEvent)
        ↓
@diabetes-universe/medical-domain insulin foundation
        ↓
apps/web insulin presentation / localization adapter
        ↓
Dashboard / Timeline / Quick Add
```

Dashboard and Timeline must **not** independently implement insulin semantics
(parse rules, context taxonomy, preparation identity, or dose meaning).

### 9.2 Ownership

| Concern                             | Owner                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Canonical types                     | `@diabetes-universe/types`                                               |
| Parse + technical validation        | `medical-domain` insulin foundation                                      |
| Catalogue entry IDs and context IDs | `medical-domain` + types                                                 |
| Legacy string mapping               | `medical-domain` (pure functions)                                        |
| Dose formatting (number + unit)     | Platform formatting + web adapter                                        |
| Localized labels                    | `@diabetes-universe/locales`                                             |
| Timeline card/detail/search mapping | Web presentation adapter, then Timeline mapper consumes it               |
| Quick Add orchestration             | `apps/web` Quick Add host/forms                                          |
| Local persistence                   | `TimelineStore` → `TimelineRepository` → IndexedDB                       |
| Cloud create/update/adoption        | Medical API validators + OpenAPI — Wave 4E (this branch / pending merge) |
| Future continuous sync              | Existing P10–P12 architecture; not started in Wave 4E                    |

`@diabetes-universe/ui` remains presentation primitives only. It must not own
insulin catalogue IDs or validation.

---

## 10. Persistence and save integrity

Target contract for a **future** implementation wave (Wave 4D). **Do not
implement in Wave 4A.**

Mirror the approved glucose Wave 3D path:

```text
InsulinQuickAddForm
  → prepareInsulinQuickAddSubmit (validate + stable full event ID)
  → [valid only] pending + host dismiss lock
  → persistPreparedInsulinQuickAddSubmit
  → QuickAddHost → screen onInsulinSubmit
  → createSemanticInsulinTimelineEvent(entry, { id: eventId })
  → TimelineStore.addEventAsync
  → IndexedDB TimelineRepository
  → applied
  → release pending → closeQuickAdd('success') + focus return
```

### 10.1 Invariants

1. Invalid input never enters pending state.
2. No event identity is allocated for invalid input.
3. One stable full event ID is retained for a logical submit and all retries.
4. Persistence is awaited before success close.
5. Double submit is single-flight.
6. Escape, backdrop, header Back, Cancel, and mutable controls are blocked
   during persistence.
7. Persistence failure keeps the form and entered values available for retry.
8. Failure releases the pending/dismiss lock.
9. Success clears the retry identity and closes once.
10. Retry must not create a second insulin event (same full ID upsert).
11. Dashboard and Timeline share one save contract.

Insulin, nutrition, medication, activity, and note remain on fire-and-forget
`addEvent` until their own approved waves. Wave 4D must not silently convert
those categories.

Wave 4D is **local IndexedDB** save integrity. It does not make events
cloud-compatible.

---

## 11. Compatibility and migration

### 11.1 Existing event shape remains readable

```ts
{
  kind: 'insulin',
  preparation: string,
  doseUnits: number,
  context?: string
}
```

plus the current envelope. Wave 4 readers must accept this shape forever for
locally persisted events.

### 11.2 Presentation fallback

| Available fields                | Title                             | Context presentation                                       |
| ------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `preparationId` + `preparation` | Event `preparation` snapshot      | `administrationContext` label                              |
| `preparation` only (no ID)      | Stored snapshot; unmatched chrome | See context precedence                                     |
| `administrationContext` set     | —                                 | Localized semantic label (**wins** if both exist)          |
| legacy `context` only           | —                                 | Governed mapping, else raw snapshot / unspecified fallback |

Do not hide a historical event because it lacks new optional fields.

### 11.3 No destructive rewrite

- Normal application startup must **not** rewrite insulin events in IndexedDB.
- No silent backfill of `preparationId` or `administrationContext` on hydrate.
- Do not invent `insulin.prep.unmapped` or any fake ID for unmatched strings.
- Explicit import/migration utilities may map legacy strings through governed
  tables and record evidence **outside** the event (same P3h rule).
- Preserve existing `id`, `occurredAt`, `createdAt`, `source`.

### 11.4 Timeline Edit hard gate

Current edit (`updateSemanticTimelineEventFromDraft`) spreads the event and then
writes `preparation` and `context` strings. After semantic fields exist, a
generic save can persist **conflicting** representations.

**Hard rollout invariant:** Wave 4C semantic writes **must not ship** until
Timeline Edit implements **one** of:

| Option            | Behavior                                                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A (preferred)** | Edit is semantic-aware: changing preparation updates or clears `preparationId` in the same save; changing context writes `administrationContext` and does not leave a contradictory legacy `context`; unmatched events do not gain a fake ID. |
| **B (temporary)** | Edit **prevents** changing preparation and administration-context fields on events that already have `preparationId` and/or `administrationContext`. Dose/time may still be edited.                                                           |

Preferred trajectory: **Option A in Wave 4B-II**, so 4C can ship a semantic
Quick Add against a safe edit path. If 4B-II cannot land pickers, it must ship
Option B before 4C. Editing must **never** save conflicting semantic and legacy
representations.

Required regression tests (4B-II, before 4C):

1. Saving an edit on a semantic insulin event cannot leave `preparationId`
   referring to catalogue entry A while `preparation` is the display name of
   entry B or a user Other name.
2. Saving an edit cannot leave `administrationContext` stale relative to the
   edited context choice; new semantic saves do not write a contradictory
   localized `context`.
3. A legacy event without `preparationId` remains editable without inventing a
   catalogue ID.
4. Option B (if used): preparation and context controls are disabled or omitted
   for semantic insulin events; save does not mutate those fields.
5. Dose/time edits still update `doseUnits` / `occurredAt` / `updatedAt` only.

Generic edit is **not** compatible with 4C semantic writers unless A or B is
already in production.

### 11.5 Search and totals

- Day Summary continues to sum `doseUnits` for local-today insulin events.
- Search continues to include the display snapshot so historical brand strings
  remain findable.
- Semantic IDs may be added to search haystacks later; they must not replace
  snapshot text.

### 11.6 Cloud / API compatibility impact

| Path                    | Today                                  | After local semantic writes, before 4E                | After 4E                            |
| ----------------------- | -------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| IndexedDB               | Stores objects without this allow-list | May store new fields                                  | Unchanged local role                |
| TypeScript              | Current insulin shape                  | Optional fields for local compile                     | Same                                |
| `validateSemanticEvent` | Rejects unknown keys                   | **Rejects** `preparationId` / `administrationContext` | Must allow and validate them        |
| Adoption                | Same validator                         | **Rejects** those fields                              | Must allow and validate them        |
| OpenAPI                 | Envelope-only `SemanticTimelineEvent`  | Does not describe the new fields                      | Must represent the insulin contract |
| P10–P12 sync            | Not product-activated for these fields | Must not treat local semantic insulin as sync-ready   | Only after 4E + separate sync gates |

Do not claim the existing cloud/adoption path automatically supports the new
fields.

---

## 12. Localization contract

Wave 4 insulin UI must use platform localization (`en-GB`, `ru-RU`, `uk-UA`,
`de-DE`).

| Content                      | Storage                      | Locale resources                      |
| ---------------------------- | ---------------------------- | ------------------------------------- |
| Kind label “Insulin”         | No                           | `timeline.eventKind.insulin` (exists) |
| Unit “U” / “ЕД”              | No                           | `timeline.units.insulinDose` (exists) |
| Catalogue display names      | Snapshot on event at write   | `insulin.preparation.<id>` (new)      |
| Context labels               | Semantic ID only             | `insulin.context.<id>` (new)          |
| Quick Add chrome             | No                           | `quick-add.insulin.*` (new)           |
| Other picker label           | No                           | Locale chrome only                    |
| User-entered Other name      | Event `preparation` snapshot | Not a locale key                      |
| Validation / save-error copy | No                           | Locale keys; technical, not clinical  |

Do not persist translated context or group headings.

Group headings (“Rapid-acting insulin”, “Long-acting insulin”) are
localization-only chrome derived from catalogue metadata via `preparationId`.
They are not event fields and are not a clinical classification.

---

## 13. Product presentation

No visual redesign is required by this architecture. Later waves apply the
contract to existing surfaces.

| Surface                 | Future behavior                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Quick Add               | Localized fields; semantic preparation/context; required Other name; no default dose |
| Dashboard Today insulin | Sum of today’s `doseUnits`; existing visualization; no “prescribed daily” copy       |
| Timeline card           | Title = snapshot; dose + localized unit; context from reader precedence              |
| Event Detail            | Same fields; no recommendation chrome                                                |
| Edit                    | Semantic-aware (4B-II A) or field-locked (4B-II B) before 4C                         |
| Delete                  | Unchanged confirmation; no clinical warning beyond existing delete copy              |
| Locales EN/RU/UK/DE     | All new chrome keys required before Quick Add localization ships                     |
| Loading                 | Existing Timeline/Dashboard loading projections                                      |
| Empty                   | No fabricated insulin total or sample dose                                           |
| Invalid                 | Inline technical validation; stay open                                               |
| Pending                 | Wave 4D: saving status + dismiss lock                                                |
| Error / retry           | Wave 4D: keep values; reuse event ID                                                 |
| Accessibility / mobile  | Existing Quick Add 44px targets, dialog semantics, return-focus rules                |

Direct-open (`openCategory: 'insulin'`) and picker-open return-focus behavior
stay as approved for Quick Add.

---

## 14. Phased implementation plan

Planning labels only. **Do not implement these in Wave 4A.**

| Wave      | Intent                                                                                                    | Depends on             | Must not include                                           |
| --------- | --------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| **4B-I**  | Shared insulin types + `medical-domain` foundation + tests                                                | This document approved | UI, Quick Add rewrite, API, persistence change             |
| **4B-II** | Presentation adapter **and** semantic-safe edit/read compatibility (Option A preferred, or Option B lock) | 4B-I                   | New brands, save-integrity, cloud writes                   |
| **4C**    | Localized semantic Quick Add, including required Other name                                               | 4B-I + 4B-II A or B    | Calculator, default dose, pump, Other without a name field |
| **4D**    | Awaited local IndexedDB persistence / save integrity                                                      | 4C                     | Other Quick Add categories; cloud sync                     |
| **4E**    | API allow-list, kind-specific validation, adoption validation, OpenAPI insulin payload, API/domain tests  | 4B-I types             | Activating P10–P12 sync                                    |

**4E is a hard dependency** before cloud create/update/adoption or later sync
may accept events that contain `preparationId` or `administrationContext`.
That validator/OpenAPI work is [Wave 4E](../../implementation/wave-4e-insulin-api-adoption-openapi.md)
(**Implemented on branch / pending merge**). Continuous sync remains out of
scope.

Each wave is a small PR with its own validation gates. Waves **4B-I**, **4B-II**,
and **4C** are merged on `main`. Wave **4D** (local save integrity) is the next
implementation slice; Wave **4E** remains a hard dependency before cloud
create/update/adoption accepts the new semantic insulin fields.

---

## 15. Risks

| Risk                                                                        | Mitigation                                                  |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Users read “correction” / grouping chrome / 100 or 500 IU as medical advice | Binding safety copy; technical-bound language only          |
| Catalogue IDs contain brand mnemonics and get shown                         | IDs never rendered; locales and snapshots own display       |
| Inferring grouping from leftover display strings                            | Governed table for presentation only; else unmatched, no ID |
| Dual `context` + `administrationContext`                                    | New writes set semantic field only; readers prefer semantic |
| Generic edit desynchronizes semantic fields                                 | Hard gate §11.4; 4C blocked until 4B-II A or B              |
| Treating IndexedDB writes as cloud-ready                                    | Explicit 4E dependency; fail-closed allow-list documented   |
| Scope creep into therapy profile or bolus math                              | Wave 2A §14 + this document’s non-scope                     |

Resolved in this remediation (no longer open product questions):

- Other requires a user-entered name; localized “Other” is not a snapshot.
- Canonical technical ceiling is 500 IU; UI guard remains 100 IU.
- Timeline Edit is a hard gate, not an optional follow-up.

---

## 16. Explicit non-scope

This **documentation PR (Wave 4A)** does **not** include:

- TypeScript production changes;
- database schema changes;
- OpenAPI file changes;
- startup or destructive migrations;
- UI or visual redesign;
- new insulin brands or an external medical catalogue;
- dosing calculator or recommendation;
- alerts, pump control, CGM integration, therapy plan, reminders, or AI advice;
- glucose behavior changes;
- nutrition, non-insulin medication, recipes, or marketplace work;
- cloud sync or outbox;
- starting Wave 4B before approval.

Later Wave 4 slices **may** change types, UI, validators, and OpenAPI as named
above. Those changes are out of Wave 4A, not out of Wave 4 forever.

---

## 17. Acceptance criteria for Wave 4B-I

Wave 4B-I may start only after this document is approved and merged.
The 4B-I implementation is recorded in
[wave-4b-i-insulin-domain-foundation.md](../../implementation/wave-4b-i-insulin-domain-foundation.md).
Approved acceptance criteria below are unchanged.

4B-I is complete when all of the following are true:

1. Canonical insulin types live in `@diabetes-universe/types` without breaking
   existing `InsulinTimelineEvent` readers (`preparation` and `doseUnits`
   remain required; `preparationId` and `administrationContext` are optional
   for legacy readability).
2. `preparationCategory` is **not** added as a persisted event field.
3. There is no `insulin.prep.unmapped` (or equivalent) catalogue identity.
   Unmatched legacy events omit `preparationId`.
4. Domain helpers encode new-write rules: always set
   `administrationContext` (including `'unspecified'`); do not write legacy
   `context`; Other requires a non-empty user-entered snapshot.
5. Canonical dose validity is finite, `> 0`, `<= 500`. Manual two-decimal
   policy is separate from storage/import validation. No silent rounding.
6. `@diabetes-universe/medical-domain` owns parse/technical validation,
   catalogue entry IDs, context taxonomy, and legacy string mapping.
7. API incompatibility is documented in 4B-I notes as a **tracked Wave 4E
   dependency**. 4B-I does not claim cloud compatibility.
8. No UI, Quick Add, Dashboard, or Timeline behavior changes unless a thin
   re-export is required and covered by tests.
9. Safety invariants in §8 are reflected in domain API names and tests (no
   “safe dose”, no default dose, no glucose-to-insulin function).
10. Unit tests cover valid/invalid dose, Other name required, unmatched
    omission of `preparationId`, and legacy context mapping.
11. Documentation points 4B-I implementation at this architecture.
12. `pnpm format:check`, `lint`, `typecheck`, `test`, and `build` pass.

Wave 4B-I must not implement save integrity, Quick Add localization, API
allow-list expansion, or a bolus/calculator surface.
