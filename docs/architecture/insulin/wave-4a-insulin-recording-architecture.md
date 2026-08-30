# Wave 4A — Insulin Recording Architecture

## Document status

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Wave         | 4A — Architecture only                                  |
| Status       | **Ready for approval**                                  |
| Date         | 2026-08-30                                              |
| Scope        | Canonical insulin administration recording              |
| Out of scope | Runtime, UI, migrations, OpenAPI, production TypeScript |
| Base SHA     | `1067b9f9221ba2406c97078846dd7343533524e9`              |

Wave 4A is documentation only. **Wave 4B must not start until this document is
approved and merged.**

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
- forbids dosing calculation, recommendation, or pump control.

This document is the approval gate for later Wave 4 implementation slices.

---

## 2. Current-state inventory

Audited against `origin/main` at
`1067b9f9221ba2406c97078846dd7343533524e9`.

### 2.1 Production type contracts

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
  → TimelineRepository.addEvent
  → IndexedDB (timeline_events)
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
| Dose parse         | `parseInsulinDoseInput()` — `> 0` and `<= 100`                                                              |
| Labels             | Hardcoded Russian in the form and action metadata                                                           |
| Locale keys        | No `quick-add.insulin.*` resources                                                                          |

The selected preparation **label is stored as `preparation`**. Group
classification (rapid/basal) is UI-only and is not persisted.

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

### 2.5 Consumers

| Surface                         | Behavior                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Dashboard Day Summary           | `getTodayInsulinTotal()` sums today's `doseUnits`                                            |
| Dashboard Recent Events         | Insulin cards: title = `preparation`, value = formatted dose, context = stored string        |
| Dashboard Quick Actions         | Opens insulin Quick Add                                                                      |
| Next Action                     | Can open insulin form via `openCategory: 'insulin'`; copy does not recommend a dose          |
| Timeline card / detail          | `mapInsulinPresentation()` — title = `preparation`; search includes preparation/dose/context |
| Timeline edit                   | Generic draft: `title` = preparation, `value` = dose, free-text context; same 0–100 bound    |
| Timeline search / filter        | Kind filter `insulin`; haystack uses stored strings                                          |
| IndexedDB validation            | Requires `preparation` + `doseUnits`; does not validate context taxonomy                     |
| API validation (server, unused) | 0–500 IU technical bound — **not** the Quick Add bound                                       |
| Localization                    | Kind/unit/Day Summary labels exist; Quick Add insulin copy is not localized                  |

### 2.6 Missing foundation

- `@diabetes-universe/medical-domain` has no insulin module.
- `apps/web/lib/medical/` has no insulin adapter.
- There is no bolus calculator, insulin-on-board model, stacking warning,
  correction factor, carbohydrate ratio, pump command, or therapy plan.
- Wave 2A §14 explicitly deferred therapy/regimen. Wave 4A does not reopen that
  decision.

### 2.7 Confirmed limitations

1. Preparation is a free display string.
2. Context is a localized/free string.
3. Preparation and context options are hardcoded in Russian.
4. Brand labels act as identifiers (stored, searched, and compared as titles).
5. The 0–100 unit bound is a demo technical limit, not a medical recommendation.
6. Insulin uses fire-and-forget `addEvent` and immediate close.
7. There is no shared insulin medical-domain/presentation foundation.
8. There is no dosing calculator, active-insulin model, recommendation, pump
   integration, or therapy plan.

---

## 3. Problem statement

The current insulin path is a usable manual log, but it is not a safe canonical
recording contract.

**Identity leak.** Brand names and Russian labels are persisted as if they were
stable medical identifiers. Catalogue changes, locale switches, and “Other”
entries cannot be distinguished from product identity.

**No semantic context.** Unlike glucose, insulin context cannot be localized,
filtered, or migrated without string matching.

**Split presentation.** Dashboard and Timeline format insulin independently of
any shared domain module. Edit uses a generic title/value form that can diverge
from Quick Add.

**Unsafe product implication risk.** A 0–100 bound, grouped “rapid/basal”
labels, and a “correction” context can be misread as dosing advice if
architecture does not bind them as recording metadata only.

**Save integrity gap.** Immediate close after `addEvent` can report success
before IndexedDB commits and cannot retry a failed write without allocating a
new event ID.

Wave 4 must fix these recording problems without becoming a clinical dosing
system.

---

## 4. Approved terminology

| Term                             | Meaning                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Insulin administration event** | A user-recorded dose that was taken or is being logged as taken                                 |
| **Preparation**                  | The insulin product or user-described product used for that administration                      |
| **Preparation ID**               | Stable product-owned catalogue key. Never a brand name, never a localized label                 |
| **Preparation display snapshot** | The name shown for this event at write time; stored on the event                                |
| **Preparation category**         | Optional governed classification (`rapid`, `basal`, `unspecified`) from catalogue metadata only |
| **Dose**                         | Numeric amount entered by the user, stored in international units                               |
| **Administration context**       | Semantic reason/timing bucket chosen by the user; not a prescription                            |
| **Technical validation bound**   | Input/typo/overflow protection. Not a safe-dose limit                                           |
| **Therapy profile**              | Future subject-scoped regimen. **Out of Wave 4**                                                |
| **Recommendation**               | Any calculated or suggested dose. **Forbidden in Wave 4**                                       |

Do not use “safe dose”, “recommended dose”, “correct dose”, or “insulin on
board” in Wave 4 product or architecture language except to state that those
capabilities are absent.

---

## 5. Canonical target contract

Wave 4A does **not** change production TypeScript. The following is the approved
**target** contract for later implementation waves.

### 5.1 Compatibility decision

**Optional additive fields on `schemaVersion: 1` are sufficient.**

A schema-version migration is **not** required for Wave 4 because:

- existing required fields (`kind`, `preparation`, `doseUnits`, envelope)
  keep their meaning;
- new identity/context fields can be optional;
- existing readers can ignore unknown optional fields;
- P3 policy already allows non-breaking optional additions on version 1.

Increment `schemaVersion` only if a later wave removes or redefines
`preparation`, `doseUnits`, or `context`. Wave 4 must not do that.

### 5.2 Target semantic shape (conceptual)

```ts
type InsulinPreparationId = string;
// Product catalogue key. Pattern: insulin.prep.<token>
// Never equal to a brand label. Never user-typed as the identifier.

type InsulinPreparationCategory = 'rapid' | 'basal' | 'unspecified';

type InsulinAdministrationContext =
  | 'before_meal'
  | 'after_meal'
  | 'correction'
  | 'basal'
  | 'other'
  | 'unspecified';

interface InsulinTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'insulin';
  readonly preparation: string; // required historical display snapshot
  readonly doseUnits: number; // canonical international units
  readonly context?: string; // legacy free/localized string; read-compatible
  readonly preparationId?: InsulinPreparationId;
  readonly preparationCategory?: InsulinPreparationCategory;
  readonly administrationContext?: InsulinAdministrationContext;
}
```

`InsulinQuickAddEntry` should later carry semantic identifiers and a display
snapshot, not a single brand string used as both.

### 5.3 Field decisions

| Field                     | Decision                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `preparationId`           | Stable catalogue key on new writes. Optional on historical events                                |
| `preparation`             | **Required** display snapshot. Survives catalogue rename/removal                                 |
| `preparationCategory`     | Optional snapshot copied from catalogue at write time. Never inferred from display name          |
| `doseUnits`               | Canonical IU. No persisted unit discriminator                                                    |
| `CanonicalUnitId`         | Conceptual unit remains `'insulin.international_unit'`. Presentation formats it                  |
| Precision                 | Accept up to **2 decimal places** on input. Persist the parsed number. No clinical rounding      |
| `occurredAt`              | Administration time entered by the user (ISO 8601). Not the log timestamp                        |
| `createdAt` / `updatedAt` | Local lifecycle metadata. Create sets both; later edit updates `updatedAt` only                  |
| `administrationContext`   | Optional semantic identifier. Missing means `unspecified` at presentation                        |
| `context`                 | Legacy string retained for read compatibility. New writes must not persist localized labels here |
| `source`                  | `'manual'` for Quick Add and edit. Other sources reserved                                        |
| `provenance`              | Unchanged optional envelope field. Wave 4 does not require it                                    |
| `id`                      | Existing semantic ID scheme. One stable full ID per logical submit/retry (see §10)               |

### 5.4 Dose unit and precision

- Canonical stored unit: **international units**.
- Do not persist U-100/U-200 concentration, pens, or volume.
- Technical parse: finite number, `doseUnits > 0`, at most two decimal digits.
- Domain overflow/typo ceiling: `doseUnits <= 1000`.
- Quick Add / edit **may** keep a tighter UI ceiling (current demo `100`) as
  accessibility/typo protection.
- Neither ceiling is a therapeutic maximum. Copy must not say “safe”,
  “maximum recommended”, or “do not exceed for medical reasons”.

### 5.5 “Other” and unknown preparation

| Case                       | `preparationId`                                                  | `preparation` snapshot                                          | `preparationCategory` |
| -------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- | --------------------- |
| Known catalogue selection  | Catalogue key                                                    | Localized display name at write time                            | Catalogue category    |
| User chooses Other         | `insulin.prep.other`                                             | User-entered name if collected; else localized “Other” snapshot | `unspecified`         |
| Historical unmapped string | omitted or `insulin.prep.unmapped` after explicit import mapping | Original stored string                                          | `unspecified`         |
| Invalid/blank preparation  | Reject write                                                     | —                                                               | —                     |

Wave 4C should collect an optional user-entered name when Other is selected.
Until that UI exists, storing the localized “Other” snapshot is acceptable only
with `preparationId: 'insulin.prep.other'`.

### 5.6 Catalogue change preservation

When a catalogue display name or grouping changes:

- existing events keep their `preparation` snapshot and optional
  `preparationCategory` snapshot;
- presentation prefers the event snapshot for title;
- current catalogue metadata may be used only as a hint when
  `preparationId` still exists;
- deleted catalogue entries remain readable through the snapshot;
- do not rewrite historical events on startup to the new label.

---

## 6. Preparation model

### 6.1 Boundaries

```text
Product catalogue (Wave 4 owned, local, finite)
        ↓
preparationId + optional governed category
        ↓
Event snapshot: preparation (display) + preparationCategory?
        ↓
Presentation / localization
```

| Concern                           | Owner in Wave 4                                    | Not in Wave 4                          |
| --------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Stable preparation ID             | Local product catalogue in types/domain            | External medication database           |
| User-facing name                  | Locale resources or user-entered Other snapshot    | Brand-as-ID                            |
| Category/classification           | Catalogue metadata only                            | Inference from display name            |
| Historical snapshot               | Event `preparation` (+ optional category snapshot) | Live catalogue overwrite of history    |
| User medication / therapy profile | Deferred (Wave 2A §14)                             | Linking events to a prescribed regimen |
| External medication catalogue     | Future bounded context                             | RxNorm/ATC/vendor import               |

### 6.2 Approved Wave 4 local catalogue

Wave 4 may encode the **current** Quick Add list as a governed local catalogue.
IDs are product keys, not brand names:

| Catalogue ID                    | Default EN display (locale-owned) | Category      |
| ------------------------------- | --------------------------------- | ------------- |
| `insulin.prep.aspart_novorapid` | NovoRapid                         | `rapid`       |
| `insulin.prep.aspart_fiasp`     | Fiasp                             | `rapid`       |
| `insulin.prep.lispro_humalog`   | Humalog                           | `rapid`       |
| `insulin.prep.glulisine_apidra` | Apidra                            | `rapid`       |
| `insulin.prep.glargine_lantus`  | Lantus                            | `basal`       |
| `insulin.prep.degludec_tresiba` | Tresiba                           | `basal`       |
| `insulin.prep.other`            | Other                             | `unspecified` |
| `insulin.prep.unmapped`         | (presentation fallback only)      | `unspecified` |

Display strings live in `@diabetes-universe/locales`. Equality and persistence
use the catalogue ID. Tokens after `insulin.prep.` are developer mnemonics, not
user-visible medical codes.

Adding brands later is a catalogue change, not a schema change.

### 6.3 Classification rule

Do **not** infer `rapid` or `basal` from a display name, user Other text, or
legacy string unless a **governed mapping table** lists that exact source
string.

Ungoverned strings resolve to `preparationId` unmapped/other and category
`unspecified`.

---

## 7. Administration context taxonomy

Replace the free/localized string model with semantic identifiers.

### 7.1 Approved values

| ID            | Recording meaning                     | Must not imply                          |
| ------------- | ------------------------------------- | --------------------------------------- |
| `before_meal` | User marked the dose as before a meal | That the dose is a correct meal bolus   |
| `after_meal`  | User marked the dose as after a meal  | Post-prandial protocol                  |
| `correction`  | User marked the dose as a correction  | Calculated correction or hypo treatment |
| `basal`       | User marked the dose as basal/routine | That basal rate is appropriate          |
| `other`       | User chose Other                      | A clinical “miscellaneous” protocol     |
| `unspecified` | No context chosen or legacy unmapped  | Missing data is unsafe                  |

Labels for EN/RU/UK/DE belong only in locale resources.

### 7.2 Legacy string mapping (presentation/import only)

Governed mapping for **existing** stored Russian demo strings:

| Stored `context` | Maps to       |
| ---------------- | ------------- |
| `Перед едой`     | `before_meal` |
| `После еды`      | `after_meal`  |
| `Коррекция`      | `correction`  |
| `Базальный`      | `basal`       |
| `Другое`         | `other`       |
| missing / other  | `unspecified` |

This table is a compatibility adapter, not medical advice. Unknown strings stay
visible as the original snapshot and resolve semantically to `unspecified`.

Context is optional. Quick Add must not require it and must not default it.

---

## 8. Safety invariants

These invariants are binding for every Wave 4 implementation PR.

1. Diabetes Universe **records a dose entered by the user**.
2. It does **not** calculate or recommend insulin in Wave 4.
3. It does **not** confirm that a dose is clinically safe.
4. Wave 4 must not implement correction factor, carbohydrate ratio, target
   calculation, insulin on board, stacking warning, basal adjustment, or pump
   command.
5. Validation bounds are **technical input constraints and accessibility
   protection**, not therapeutic limits.
6. **No default dose** may be suggested, pre-filled from a prior event, or
   derived from settings.
7. **No glucose value may automatically generate an insulin dose.**
8. Future dosing features require separate clinical architecture, risk review,
   regulatory assessment, and explicit user confirmation.
9. Copy must not present totals, context, or category as treatment advice.
10. Day Summary insulin total is an arithmetic sum of recorded IU, not a
    prescribed daily dose.

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

| Concern                             | Owner                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| Canonical types                     | `@diabetes-universe/types`                                 |
| Parse + technical validation        | `medical-domain` insulin foundation                        |
| Semantic preparation/context IDs    | `medical-domain` + types                                   |
| Legacy string mapping               | `medical-domain` (pure functions)                          |
| Dose formatting (number + unit)     | Platform formatting + web adapter                          |
| Localized labels                    | `@diabetes-universe/locales`                               |
| Timeline card/detail/search mapping | Web presentation adapter, then Timeline mapper consumes it |
| Quick Add orchestration             | `apps/web` Quick Add host/forms                            |
| Persistence                         | `TimelineStore` → `TimelineRepository` → IndexedDB         |
| Future cloud sync                   | Existing P10–P12 architecture; Wave 4 does not add sync    |

`@diabetes-universe/ui` remains presentation primitives only. It must not own
insulin catalogue IDs or validation.

### 9.3 Intended package placement (later waves)

| Wave  | Add                                                                   |
| ----- | --------------------------------------------------------------------- |
| 4B-I  | Types + `packages/medical-domain` insulin module + tests              |
| 4B-II | `apps/web/lib/medical/insulin` adapter; Dashboard/Timeline consume it |
| 4C    | Localized Quick Add form + semantic submit model                      |
| 4D    | Save-integrity controller/host wiring                                 |

No production files are created in Wave 4A.

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

| Available fields                | Title                        | Context presentation          |
| ------------------------------- | ---------------------------- | ----------------------------- |
| `preparationId` + `preparation` | Event `preparation` snapshot | `administrationContext` label |
| `preparation` only              | Stored `preparation`         | Map legacy `context` or hide  |
| `administrationContext` set     | —                            | Localized semantic label      |
| legacy `context` only           | —                            | Mapped label or raw snapshot  |

Do not hide a historical event because it lacks new optional fields.

### 11.3 No destructive rewrite

- Normal application startup must **not** rewrite insulin events in IndexedDB.
- No silent backfill of `preparationId` or `administrationContext` on hydrate.
- Explicit import/migration utilities may map legacy strings through the
  governed tables and record evidence outside the event (same P3h rule).
- Preserve existing `id`, `occurredAt`, `createdAt`, `source`.

### 11.4 Edit after later migration

When the user edits and saves a historical insulin event in a later wave:

- keep `id`, `kind`, `source`, `createdAt`;
- set `updatedAt`;
- write semantic `preparationId` / `administrationContext` when the edit UI
  collected them;
- refresh `preparation` snapshot from the selected display name;
- do not delete legacy `context` unless the edit UI replaced it with a semantic
  value and presentation no longer needs the string.

Until the edit UI is migrated (not Wave 4A), edit remains the current generic
form and continues to write `preparation` / `doseUnits` / optional `context`.

### 11.5 Search and totals

- Day Summary continues to sum `doseUnits` for local-today insulin events.
- Search continues to include the display snapshot so historical brand strings
  remain findable.
- Semantic IDs may be added to search haystacks later; they must not replace
  snapshot text.

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
| Validation / save-error copy | No                           | Locale keys; technical, not clinical  |
| User-entered Other name      | Event `preparation` snapshot | Not a locale key                      |

Do not persist translated context or group headings.

Group headings (“Rapid insulin”, “Basal insulin”) are localization-only chrome
derived from catalogue category. They are not event fields.

---

## 13. Product presentation

No visual redesign is required by this architecture. Later waves apply the
contract to existing surfaces.

| Surface                 | Future behavior                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Quick Add               | Localized fields; semantic preparation/context; no default dose; Other optional name |
| Dashboard Today insulin | Sum of today’s `doseUnits`; existing visualization; no “prescribed daily” copy       |
| Timeline card           | Title = snapshot; dose + localized unit; optional context label                      |
| Event Detail            | Same fields; no recommendation chrome                                                |
| Edit                    | Eventually semantic pickers; until then generic form remains compatible              |
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

| Wave      | Intent                                                            | Must not include                          |
| --------- | ----------------------------------------------------------------- | ----------------------------------------- |
| **4B-I**  | Shared insulin types + `medical-domain` foundation + tests        | UI, Quick Add rewrite, persistence change |
| **4B-II** | Migrate Dashboard and Timeline presentation to the shared adapter | New brands, save-integrity, edit redesign |
| **4C**    | Correct and localize Insulin Quick Add (semantic IDs, locales)    | Calculator, default dose, pump            |
| **4D**    | Insulin save integrity and architecture closure                   | Other Quick Add categories, sync, API     |

Each wave is a small PR with its own validation gates. 4B-I is the next
implementation wave after this document is approved.

---

## 15. Risks

| Risk                                                              | Mitigation                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Users read “correction” / “basal” / 100 U cap as medical advice   | Binding safety copy rules; technical-bound language only                     |
| Catalogue IDs still contain brand mnemonics and get shown in UI   | IDs never rendered; locales own display                                      |
| Inferring category from “Lantus” leftover strings                 | Governed table only; else `unspecified`                                      |
| Dual `context` + `administrationContext` drift                    | New writes set semantic field only; legacy mapping is read-only              |
| Edit UI continues to write free strings after 4C                  | 4B-II/4C acceptance must list edit as follow-up or include a minimal adapter |
| Save-integrity copy-paste from glucose introduces test-only hooks | Reuse glucose controller pattern; no production test branches                |
| Scope creep into therapy profile or bolus math                    | Wave 2A §14 + this document’s non-scope                                      |

### Unresolved product questions (not blocking 4A approval)

1. Whether Wave 4C **must** collect a free-text name for Other, or may ship
   with the localized “Other” snapshot plus `insulin.prep.other`.
2. Whether the Quick Add UI ceiling stays at 100 IU or moves to the domain
   ceiling (1000) with the same “technical only” copy. Default until product
   decides: **keep 100** as typo protection.
3. When Timeline edit leaves the generic title/value form. Default: after 4C
   unless 4B-II can map drafts without a picker redesign.

These do not block Wave 4B-I types/domain work.

---

## 16. Explicit non-scope

Wave 4A and the planned Wave 4 implementation slices do **not** include:

- TypeScript production changes in this PR;
- database schema or OpenAPI changes;
- startup or destructive migrations;
- UI or visual redesign in this PR;
- new insulin brands or an external medical catalogue;
- dosing calculator or recommendation;
- alerts, pump control, CGM integration, therapy plan, reminders, or AI advice;
- glucose behavior changes;
- nutrition, non-insulin medication, recipes, or marketplace work;
- cloud sync or outbox;
- starting Wave 4B before approval.

---

## 17. Acceptance criteria for Wave 4B-I

Wave 4B-I may start only after this document is approved and merged.

4B-I is complete when all of the following are true:

1. Canonical insulin types live in `@diabetes-universe/types` without breaking
   existing `InsulinTimelineEvent` readers (`preparation` and `doseUnits`
   remain required; new fields optional).
2. `@diabetes-universe/medical-domain` owns parse/technical validation,
   catalogue IDs, context taxonomy, and legacy string mapping.
3. No UI, Quick Add, Dashboard, or Timeline behavior changes unless a thin
   re-export is required and covered by tests.
4. Safety invariants in §8 are reflected in domain API names and tests (no
   “safe dose”, no default dose, no glucose-to-insulin function).
5. Unit tests cover valid/invalid dose, Other/unmapped preparation, and legacy
   context mapping.
6. Documentation points 4B-I implementation at this architecture.
7. `pnpm format:check`, `lint`, `typecheck`, `test`, and `build` pass.

Wave 4B-I must not implement save integrity, Quick Add localization, or a
bolus/calculator surface.
