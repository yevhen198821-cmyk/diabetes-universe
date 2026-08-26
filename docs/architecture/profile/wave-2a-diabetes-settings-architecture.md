# Wave 2A — Diabetes Settings Architecture

## Document status

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| Wave         | 2A — Architecture only                      |
| Status       | **Ready for approval**                      |
| Date         | 2026-08-26 (finalized)                      |
| Scope        | Profile → Управление диабетом               |
| Out of scope | UI, migrations, API routes, production code |
| PR           | #119                                        |

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Architecture invariants](#2-architecture-invariants)
3. [Approved product decisions](#3-approved-product-decisions)
4. [Repository audit](#4-repository-audit)
5. [Repository consistency review](#5-repository-consistency-review)
6. [Existing domain conflicts and duplication](#6-existing-domain-conflicts-and-duplication)
7. [Domain boundaries](#7-domain-boundaries)
8. [Person-of-care ownership decision](#8-person-of-care-ownership-decision)
9. [Diabetes type](#9-diabetes-type)
10. [Glucose unit architecture](#10-glucose-unit-architecture)
11. [Target-range architecture](#11-target-range-architecture)
12. [Target provenance](#12-target-provenance)
13. [Alert-threshold decision](#13-alert-threshold-decision)
14. [Therapy and regimen](#14-therapy-and-regimen)
15. [Device and CGM](#15-device-and-cgm)
16. [Security and data classification](#16-security-and-data-classification)
17. [AI access rules](#17-ai-access-rules)
18. [Audit and history rules](#18-audit-and-history-rules)
19. [Canonical conceptual data model](#19-canonical-conceptual-data-model)
20. [Field-level matrix](#20-field-level-matrix)
21. [API boundary proposal](#21-api-boundary-proposal)
22. [UX information architecture](#22-ux-information-architecture)
23. [Defaults and onboarding rules](#23-defaults-and-onboarding-rules)
24. [Internationalization rules](#24-internationalization-rules)
25. [Edge cases and validation](#25-edge-cases-and-validation)
26. [Migration impact](#26-migration-impact)
27. [Architecture options comparison](#27-architecture-options-comparison)
28. [Final recommendation](#28-final-recommendation)
29. [Wave 2 scope summary](#29-wave-2-scope-summary)
30. [Wave 2B implementation contract](#30-wave-2b-implementation-contract)
31. [Proposed Wave 2C–2F roadmap](#31-proposed-wave-2c2f-roadmap)
32. [Future considerations](#32-future-considerations)

---

## 1. Executive summary

Diabetes Universe already has a strong **event-centric medical domain** (`SemanticTimelineEvent` with canonical `concentrationMmolPerL`) and an approved **subject-centric ownership model** (P5/P7: Account ≠ Medical Subject). Profile Wave 1 delivered account identity UX only. **No persisted diabetes settings, glucose display preference, target ranges, therapy profile, or alert thresholds exist today.**

Wave 2A introduces **Diabetes Settings as a subject-scoped configuration resource** attached to the existing `MedicalSubject`, not to the authenticated `Account` or Profile identity record. This aligns with approved backend architecture, preserves caregiver/clinician futures, and keeps Profile from becoming an electronic health record.

**Critical principle:**

```text
Account Profile  ≠  Diabetes Settings  ≠  Medical Record
```

**Wave 2 approved settings scope:**

| Setting                                    | Wave 2                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| Glucose display unit (`mmol/L` \| `mg/dL`) | **In scope** — required before manual glucose entry    |
| Diabetes type (optional, informational)    | **In scope**                                           |
| Global glucose target range (optional)     | **In scope** — via `GlucoseTargetProfile.defaultRange` |
| App alert / notification thresholds        | **Deferred**                                           |
| Therapy / regimen                          | **Deferred**                                           |
| Device / CGM configuration                 | **Deferred** — separate bounded context                |

Wave 2A is documentation only. **Wave 2B must not start until this document is approved and merged.**

---

## 2. Architecture invariants

These invariants are binding for Wave 2B and all subsequent waves.

### INV-001 — Canonical glucose storage

All persisted glucose concentrations use canonical **mmol/L** (`concentrationMmolPerL` on `SemanticTimelineEvent` and equivalent domain fields).

Display-unit changes **MUST NOT** mutate, rewrite, duplicate, or migrate historical medical events.

### INV-002 — Three-way separation

```text
Account Profile  ≠  Diabetes Settings  ≠  Medical Record
```

Diabetes Settings belong to `MedicalSubject`. They must not be stored on `Account` or conflated with `SemanticTimelineEvent` records.

### INV-003 — Authorization boundary

`AccountSubjectRelationship` is the authorization/ownership boundary between authenticated accounts and medical subjects. Wave 2 exposes self-subject editing via `/me` routes only; the underlying model must support future caregiver/clinician relationships without schema redesign.

### INV-004 — Target ≠ alert ≠ device alarm

These concepts are independent. Changing one must never imply changing another:

- **Glucose target** — user-defined (or future clinician-defined) desired range for presentation/analytics
- **Diabetes Universe notification threshold** — future app notification policy (deferred)
- **External CGM/pump/device alarm** — device bounded context (deferred)

### INV-005 — Diabetes type independence

Diabetes type **MUST NOT** automatically determine, populate, or modify the user's glucose target range. These are independent settings.

### INV-006 — Reference ≠ personalized target

A guideline or `SYSTEM_REFERENCE` range **MUST NOT** silently become the user's personalized target. Explicit user action is required to adopt a reference range as `USER_DEFINED`.

### INV-007 — Locale ≠ medical unit

Application locale/region may suggest or pre-highlight a glucose display unit. It **MUST NOT** silently establish the user's medical display-unit preference. Explicit user confirmation is required.

### INV-008 — Settings are infrequent configuration

Frequent diabetes-management actions belong in their natural workflows (Timeline, Quick Add, Home). Profile → Управление диабетом remains intentionally small.

### INV-009 — No event sourcing for settings

Diabetes Settings use **current state + append-only audit trail**. Event sourcing is not used for settings resources.

### INV-010 — Pre-adoption safety

Unknown legacy/local medical settings must not be automatically promoted into canonical subject medical settings. Only clearly compatible presentation preferences may migrate automatically; medical values require explicit/controlled adoption.

---

## 3. Approved product decisions

All product decisions required for Wave 2B are resolved below.

### 3.1 Glucose display unit

- Supported initial values: **`mmol/L`** and **`mg/dL`**
- `glucoseDisplayUnit` is **required before a user can manually enter glucose**
- Existing/pre-adoption subjects may temporarily have no persisted preference (`unset`)
- The product must resolve that transitional state before manual glucose entry (see §23)

### 3.2 First glucose entry flow

If `glucoseDisplayUnit` has not been explicitly selected:

```text
Add glucose → lightweight unit selection → continue glucose entry
```

The choice normally happens once. The rest of the application is **not permanently blocked**.

### 3.3 Locale behavior

Locale/region may:

- suggest a unit;
- pre-highlight a likely choice.

Locale **MUST NOT** silently establish the user's medical display-unit preference. Explicit user confirmation is required.

### 3.4 Diabetes type

- **Optional** informational metadata
- Extensible taxonomy (see §9)
- Not required for normal application use
- Default: `unknown`
- **MUST NOT** infer or populate glucose targets from diabetes type

### 3.5 Glucose target range

- **Optional** global target range per subject
- Do not silently create a personalized target
- Future guideline/reference ranges (`SYSTEM_REFERENCE`) remain conceptually distinct from user-defined targets
- Diabetes type **MUST NOT** auto-determine or modify targets

### 3.6 Caregiver editing

- Wave 2: **self-subject editing only** through `/me` routes
- Underlying subject-scoped architecture supports future caregiver/clinician authorization
- Caregiver editing is **not implemented** in Wave 2

### 3.7 Re-authentication

- Changing diabetes settings or target range does **not** require forced re-authentication in Wave 2
- Normal authenticated-session authorization is sufficient
- Target changes **must be auditable**

### 3.8 Pre-adoption / local settings

- Do not automatically promote unknown legacy/local medical settings into canonical subject medical settings
- Only clearly compatible **presentation preferences** may migrate automatically
- Medical values require an explicit/controlled adoption strategy (aligned with P10 adoption architecture)

### 3.9 Export

- Diabetes settings are included in the **future medical export bundle** as a distinct settings section
- Export includes current values and relevant timestamp/source metadata
- Settings **must not** be represented as historical `SemanticTimelineEvent` records

### 3.10 Alerts

- Alert thresholds remain **deferred**
- Targets, app notification thresholds, and device alarms are distinct (INV-004)

### 3.11 Therapy

- Therapy/regimen fields are **deferred** for Wave 2 (no `usesInsulin` flag)
- Event-level insulin data remains sufficient

### 3.12 Audit retention

- Settings audit events follow the platform account/medical retention policy (P5/P13)
- No separate retention policy required for Wave 2B

### 3.13 Conversion constant

- Domain conversion uses **`mg/dL = mmol/L × 18.0182`** (standard biochemical factor)
- Rounding at display boundary per formatting library defaults (§10)

### 3.14 Target validation bounds

- Target range validation aligns with existing medical API glucose bounds: **0.1–100 mmol/L** (`medical-api-validation-bounds.ts`), with `lowMmolPerL < highMmolPerL`

### 3.15 API transport shape

- Logical separation of `DiabetesSettings` and `GlucoseTargetProfile` is required in the domain model
- Combined or split HTTP resource for Wave 2C is an **implementation choice**; domain entities remain separate

---

## 4. Repository audit

### 4.1 Domain contracts — glucose and events

| Location                                   | Artifact                                                 | Purpose                                    | Class                     | Recommendation                   |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------ | ------------------------- | -------------------------------- |
| `packages/types/src/semantic-timeline.ts`  | `GlucoseTimelineEvent.concentrationMmolPerL`             | Canonical glucose concentration            | **Production domain**     | **Reuse**                        |
| Same file                                  | `CanonicalUnitId` includes `'glucose.mmol_per_l'`        | Canonical unit ID                          | **Domain policy**         | **Reuse**                        |
| Same file                                  | `GlucoseMeasurementContext`                              | Measurement context enum                   | **Production domain**     | **Reuse** — not a settings field |
| Same file                                  | Comment L16–17                                           | Display conversion belongs to presentation | **Architecture policy**   | **Reuse**                        |
| `packages/types/src/quick-add.ts`          | `GlucoseQuickAddEntry.valueMmol`                         | Quick Add input in mmol/L                  | **Domain input contract** | **Reuse**                        |
| `packages/types/src/timeline.ts`           | `TimelineEvent`, `DaySummary.timeInRange`, `LastGlucose` | Legacy DTOs                                | **Legacy/demo**           | **Deprecate**                    |
| `packages/types/src/timeline-migration.ts` | Migration/quarantine types                               | Legacy lift audit                          | **Production migration**  | **Reuse**                        |

### 4.2 Formatting and presentation

| Location                                                             | Artifact                                | Purpose                     | Class                       | Recommendation                     |
| -------------------------------------------------------------------- | --------------------------------------- | --------------------------- | --------------------------- | ---------------------------------- |
| `packages/formatting/src/types/measurement-unit.ts`                  | `MeasurementUnit = 'mmol/L' \| 'mg/dL'` | Display unit enum           | **Presentation contract**   | **Reuse**                          |
| `packages/formatting/src/runtime/measurement.ts`                     | Precision defaults                      | Rounding at format boundary | **Production**              | **Reuse**                          |
| `docs/adr/0010-platform-formatting-library.md`                       | No medical conversion in formatting     | Approved ADR                | **Policy**                  | **Reuse** — domain owns conversion |
| `apps/web/lib/timeline/presentation/timeline-presentation-mapper.ts` | Always mmol/L                           | Timeline display            | **Production (incomplete)** | **Migrate** in Wave 2E             |
| Quick Add components                                                 | Hardcoded RU / mmol/L                   | UI debt                     | **Production**              | **Migrate** in Wave 2E             |

### 4.3 Identity, account, and profile (Wave 1)

| Location                                                           | Artifact                       | Purpose               | Recommendation                        |
| ------------------------------------------------------------------ | ------------------------------ | --------------------- | ------------------------------------- |
| `packages/identity/.../auth-schema.ts`                             | Auth tables                    | Authentication        | **Leave untouched**                   |
| `packages/identity/.../auth-contracts.ts`                          | `AuthenticatedPrincipal`       | Account DTO           | **Reuse** — exclude diabetes settings |
| `apps/web/components/profile/profile-menu.tsx`                     | Disabled diabetes settings row | UX hook               | **Enable** in Wave 2D                 |
| `apps/web/components/profile/profile-settings-panel.tsx`           | Theme only                     | App preferences       | **Reuse**                             |
| `docs/architecture/identity/p5-identity-account-data-ownership.md` | Account ≠ Subject              | Approved architecture | **Authority**                         |

### 4.4 Medical backend and persistence

| Location                                                            | Artifact                                                                                               | Purpose           | Recommendation              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- |
| `packages/medical-domain/src/types/medical-subject.ts`              | `MedicalSubject` shell                                                                                 | Person entity     | **Extend** via associations |
| `packages/medical-persistence/.../medical-schema.ts`                | `medical_subjects`, `account_subject_relationships`, `medical_event_resources`, `medical_audit_events` | Cloud persistence | **Extend** in Wave 2B       |
| `docs/architecture/backend/p7-backend-medical-data-architecture.md` | Subject-centric storage                                                                                | Approved          | **Authority**               |
| `docs/architecture/api/p8-medical-api-contracts.md`                 | `/api/v1/medical/me/...`                                                                               | API style         | **Extend** in Wave 2C       |

### 4.5 Local timeline persistence

| Location                                                 | Artifact                         | Recommendation                               |
| -------------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| `packages/timeline-web/.../timeline-indexeddb-schema.ts` | Local semantic events            | **Leave untouched** — settings not in events |
| Validation                                               | Requires `concentrationMmolPerL` | **Reuse**                                    |

### 4.6 Policies and analytics (absent by design)

| Location                         | Status                                        | Recommendation                     |
| -------------------------------- | --------------------------------------------- | ---------------------------------- |
| GP-001 glucose staleness policy  | Contract only; no approved numeric parameters | **Leave untouched**                |
| Dashboard 24h UX stale indicator | Implemented; not clinical                     | **Reuse** — not a diabetes setting |
| Analytics / Reports docs         | Empty stubs                                   | **Deferred**                       |

### 4.7 OpenAPI

| Gap                                                            | Recommendation        |
| -------------------------------------------------------------- | --------------------- |
| `SemanticTimelineEvent` schema incomplete in `medical-v1.yaml` | **Extend** in Wave 2B |
| No diabetes settings schemas                                   | **Add** in Wave 2B    |

### 4.8 Concepts not found in repository

No production models exist for: persisted `glucoseDisplayUnit`, diabetes type, target ranges, alert thresholds, therapy profile, CGM config, or `MedicalProfile` entity.

---

## 5. Repository consistency review

Wave 2A recommendations were verified against the current repository. **No contradictions requiring architecture redesign were found.**

| Reference                                            | Verified assumption                                                          | Result                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/types/src/semantic-timeline.ts`            | Canonical mmol/L storage on events                                           | **Confirmed** — `concentrationMmolPerL`; comment defers display conversion  |
| `packages/formatting`                                | Display-only; no conversion (ADR-0010)                                       | **Confirmed** — `formatMeasurement()` does not convert units                |
| `packages/medical-persistence/.../medical-schema.ts` | `MedicalSubject`, `AccountSubjectRelationship`, `medical_audit_events` exist | **Confirmed** — settings extend via new tables, not identity schema         |
| P5                                                   | Account ≠ Medical Subject                                                    | **Confirmed** — no conflict with subject-scoped settings                    |
| P7                                                   | Subject-centric medical resource ownership                                   | **Confirmed** — Option B aligns; account-owned settings would contradict P7 |
| P8                                                   | Self-subject `/me` resolution; server-authoritative authZ                    | **Confirmed** — Wave 2 `/me` routes consistent                              |
| ADR-0010                                             | Domain converts; formatting formats                                          | **Confirmed** — Wave 2B adds domain conversion helper                       |
| Existing medical-event APIs                          | Events stored as JSONB semantic payload                                      | **Confirmed** — settings are separate resources                             |
| `medical-api-validation-bounds.ts`                   | Glucose 0.1–100 mmol/L                                                       | **Confirmed** — adopted for target validation                               |
| OpenAPI `medical-v1.yaml`                            | Incomplete event schema                                                      | **Known gap** — Wave 2B extends; no conflict                                |

**No repository structures were invented.** All proposed entities extend approved P7/P8 patterns.

---

## 6. Existing domain conflicts and duplication

### 6.1 Competing glucose representations

**Resolution:** One canonical numeric storage (mmol/L). All surfaces convert at presentation boundary using subject display preference.

### 6.2 Settings location ambiguity

**Resolution:** Diabetes settings under Profile → **Управление диабетом**, backed by subject-scoped API — not under generic Settings tab (theme) or `PresentationSnapshot`.

### 6.3 Staleness vs targets vs alerts

**Resolution:** GP-001 staleness, Dashboard UX stale indicator, glucose targets, and alert thresholds remain separate concepts (INV-004).

### 6.4 Account vs subject ownership

P7 rejected account-owned medical records. Diabetes settings on `Account` would conflict with approved architecture.

---

## 7. Domain boundaries

### A. Account Identity

Display name, email, avatar, authentication, sessions, passkeys.

**Storage:** Identity schema. **Not** diabetes settings.

### B. Application Preferences

Theme, language/locale UI, non-medical notification preferences.

**Storage:** Account-scoped or client-persisted. **Not** subject-scoped.

Locale affects number formatting but **must not** change glucose unit preference (INV-007).

### C. Diabetes Settings

Glucose display unit, optional diabetes type, optional target range (via linked `GlucoseTargetProfile`).

**Storage:** Subject-scoped `DiabetesSettings` + `GlucoseTargetProfile` on `MedicalSubject`.

**Authorization:** Via `AccountSubjectRelationship`.

### D. Clinical / Medical Record

`SemanticTimelineEvent` records and future clinician-authored clinical documents.

Self-reported diabetes type in settings is **informational metadata**, not a clinical diagnosis. A future clinical diagnosis record, if introduced, would live in the medical record bounded context and remain separate from settings.

### E. Separate future bounded contexts (not in DiabetesSettings)

| Bounded context                  | Examples                                                   | Wave 2                        |
| -------------------------------- | ---------------------------------------------------------- | ----------------------------- |
| **Device Connections**           | CGM pairing, pump config, credentials, device alarm config | Deferred                      |
| **Alert Policy / Notifications** | App notification thresholds, delivery channels             | Deferred                      |
| **Therapy Profile**              | MDI, pump, basal/bolus, medication regimen                 | Deferred                      |
| **Care Relationships**           | Caregiver/clinician delegation UI and policies             | Deferred (architecture ready) |

Do **not** turn `DiabetesSettings` into a generic container for every diabetes-related feature.

```text
┌─────────────────────┐     ┌──────────────────────┐
│   Account Identity  │     │ Application Prefs    │
└──────────┬──────────┘     └──────────┬───────────┘
           │                           │
           ▼                           ▼
    ┌───────────────AccountSubjectRelationship────────────────┐
    │  self (Wave 2) | caregiver | clinician (future)         │
    └──────────────────────────┬──────────────────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │    MedicalSubject      │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
  DiabetesSettings    GlucoseTargetProfile    MedicalEventResource
  (1:1)               (1:1)                   (1:N)
         │                     │
         │              defaultRange            SemanticTimelineEvent
         │              (Wave 2)                (medical record)
         │
    [Future BCs: Devices, Alerts, Therapy, Care — separate]
```

---

## 8. Person-of-care ownership decision

### Selected: Option B — Subject-scoped settings on `MedicalSubject`

P7 already selected subject-centric medical resource ownership. Diabetes Settings are configuration **about a person**, not about a login.

| Wave 2                                    | Future                                               |
| ----------------------------------------- | ---------------------------------------------------- |
| 1 account : 1 self subject                | Multiple subjects per account (caregiver)            |
| `/me` routes; server resolves `subjectId` | `/subjects/{subjectId}/...` with relationship policy |
| No multi-profile UI                       | Context switching without schema change              |

**Rejected:** Account-scoped settings (conflicts with P7, breaks caregiver future).

---

## 9. Diabetes type

| Property          | Decision                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| Required?         | **No** — optional informational metadata                                    |
| Blocks features?  | **No** — `unknown` is valid                                                 |
| Behavioral?       | **No** in Wave 2 — must not gate glucose entry, insulin logging, or targets |
| User changeable?  | **Yes**, with audit                                                         |
| Infers targets?   | **No** (INV-005)                                                            |
| AI/analytics use? | Read-only contextualization when present; non-diagnostic                    |

**Extensible taxonomy:**

```text
DiabetesTypeClassification
- category: type_1 | type_2 | gestational | other | unknown
- otherDescriptor?: string   (when category = other)
- source: self_reported
```

ICD/clinical coding is **out of scope** for Wave 2. Default: `unknown`.

---

## 10. Glucose unit architecture

### Canonical storage (INV-001)

All persisted glucose concentrations use **mmol/L**. Verified in:

- `SemanticTimelineEvent.concentrationMmolPerL`
- `GlucoseQuickAddEntry.valueMmol` (input normalized to mmol/L before persist)
- IndexedDB and cloud JSONB validation

Changing `glucoseDisplayUnit` **must not** rewrite, duplicate, or migrate historical events.

### Display preference

| Aspect                               | Decision                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Field                                | `DiabetesSettings.glucoseDisplayUnit`                                               |
| Values                               | `mmol_per_l` \| `mg_per_dl` (domain codes → `'mmol/L'` \| `'mg/dL'` for formatting) |
| Unset state                          | Allowed for pre-adoption/transitional subjects                                      |
| Required before manual glucose entry | **Yes** — resolved via inline unit selection (§23)                                  |

### Conversion ownership

| Layer                  | Responsibility                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| Domain (Wave 2B)       | Pure conversion functions; factor **18.0182**                    |
| Presentation (Wave 2E) | Read mmol/L + preference → display value → `formatMeasurement()` |
| Formatting library     | Format only (ADR-0010)                                           |
| Persistence            | Always mmol/L                                                    |

### Rounding

| Context        | Owner              | Default        |
| -------------- | ------------------ | -------------- |
| mmol/L display | Formatting library | 1 decimal      |
| mg/dL display  | Formatting library | 0 decimals     |
| Storage        | None               | Full precision |

---

## 11. Target-range architecture

### Conceptual model (Wave 2)

```text
MedicalSubject
  1:1 DiabetesSettings
       1:1 GlucoseTargetProfile
            defaultRange
              lowMmolPerL: number | null
              highMmolPerL: number | null
              source: TargetRangeSource
              updatedAt
```

Storage is always **mmol/L** internally. UI may accept input in user's display unit; domain normalizes before persist.

### Wave 2 scope

- One optional global `defaultRange` per subject
- Unset (`null`) is valid — no silent personalized target
- Used for visual reference and future analytics (TIR); non-diagnostic

### Future extension point (not Wave 2)

```text
GlucoseTargetProfile
  defaultRange          ← Wave 2
  segments[]            ← future: time/context-specific ranges
```

Future `segments[]` may support time-of-day, sleep, exercise, pregnancy, or temporary targets. **Do not implement segments or a scheduling engine in Wave 2.** Document the extension point only.

### Validation

- `lowMmolPerL < highMmolPerL` when both set
- Bounds: 0.1–100 mmol/L (aligned with `medical-api-validation-bounds.ts`)
- Partial configuration invalid; both null (unset) valid

### Independence rules

- Diabetes type **must not** auto-populate targets (INV-005)
- `SYSTEM_REFERENCE` **must not** silently become `USER_DEFINED` (INV-006)

---

## 12. Target provenance

Medically meaningful target values carry **source/provenance** semantics.

### TargetRangeSource (minimum taxonomy)

| Value               | Meaning                                       | Wave 2                         |
| ------------------- | --------------------------------------------- | ------------------------------ |
| `USER_DEFINED`      | User explicitly set their personalized target | **Primary Wave 2 path**        |
| `CLINICIAN_DEFINED` | Set by authorized clinician (future)          | Schema-ready; not exposed      |
| `IMPORTED`          | Imported from external source (future)        | Schema-ready; not exposed      |
| `SYSTEM_REFERENCE`  | Guideline/reference range for display only    | Schema-ready; not auto-applied |

### Semantic rules

- `SYSTEM_REFERENCE` is **not equivalent** to `USER_DEFINED`
- Showing a reference range **must not** silently write `USER_DEFINED` targets
- Adopting a reference as a personal target requires **explicit user action**
- Provenance is stored on `defaultRange` (and future `segments[]`)

Wave 2 does not need to expose every future source path. The model **must not** make provenance impossible to add later.

---

## 13. Alert-threshold decision

**Deferred for Wave 2.** Do not include in Diabetes Settings schema or UI.

### Three-way distinction (INV-004)

| Concept                                  | Owner                           | Wave 2            |
| ---------------------------------------- | ------------------------------- | ----------------- |
| Glucose target                           | `GlucoseTargetProfile`          | Optional settings |
| Diabetes Universe notification threshold | Alert Policy / Notifications BC | **Deferred**      |
| CGM/pump/device alarm                    | Device Connections BC           | **Deferred**      |

Copy for future alert UI must state: **"Does not change device alarms."**

GP-001 data staleness and Dashboard 24h UX stale remain separate policies — not alert thresholds.

---

## 14. Therapy and regimen

**Deferred for Wave 2.**

Existing event-level insulin data (`InsulinTimelineEvent`, Quick Add) remains sufficient for current product requirements.

Do **not** introduce MDI, pump, basal/bolus, or medication regimen models for completeness.

A **Therapy Profile** bounded context should be introduced only when a concrete product capability requires it.

---

## 15. Device and CGM

**Deferred for Wave 2.**

Future device integrations are a **separate bounded context** (Profile menu already lists "Devices and sources" separately).

Do **not** place in `DiabetesSettings`:

- CGM pairing
- Pump configuration
- Device credentials
- Device alarm configuration

---

## 16. Security and data classification

| Field / resource        | Classification               | AuthZ (Wave 2)     | Audit                   | Export                  |
| ----------------------- | ---------------------------- | ------------------ | ----------------------- | ----------------------- |
| Account identity        | Account PII                  | Self               | Security events         | Account export          |
| Theme, locale UI        | Preference                   | Self               | Optional                | Optional                |
| `glucoseDisplayUnit`    | Health-related personal data | Self-subject `/me` | Change audit            | Medical export §3.9     |
| `diabetesType`          | Health-related personal data | Self-subject `/me` | Change audit            | Medical export §3.9     |
| Target range            | Health-related personal data | Self-subject `/me` | Change audit (required) | Medical export §3.9     |
| `SemanticTimelineEvent` | Sensitive medical data       | Self-subject       | Medical audit           | Medical export (events) |

### Authorization (Wave 2)

- Deny by default (P5)
- Settings APIs: validated session + resolved self `subjectId` + active `self` relationship
- **Do not expose** diabetes settings through identity `/me` profile endpoints
- Re-authentication **not required** for settings changes in Wave 2 (§3.7)
- Caregiver/clinician edit rights: **future** — architecture supports via `AccountSubjectRelationship`; not implemented in Wave 2

---

## 17. AI access rules

### AI may read (future)

| Setting                 | Use                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| `glucoseDisplayUnit`    | Format explanations consistently                                  |
| `diabetesType` (if set) | Non-diagnostic contextual tone                                    |
| Target range (if set)   | Compare readings to **user-stated** goals — not clinical judgment |

### AI must not

- Diagnose or prescribe
- Autonomously modify Diabetes Settings
- Change targets or infer targets from diabetes type
- Silently write settings

AI-proposed setting changes require explicit user confirmation and audit on acceptance.

---

## 18. Audit and history rules

Architecture: **current settings state + append-only audit trail** (INV-009). No event sourcing.

### Audit requirements by change type

| Change           | Audit                                      |
| ---------------- | ------------------------------------------ |
| Display unit     | Audit event recommended                    |
| Diabetes type    | Audit event with prior value               |
| Target range     | **Required** audit — medically meaningful  |
| Theme / language | `updated_at` only (application preference) |
| Settings read    | No audit in Wave 2                         |

### Minimum target-change audit semantics

Conceptually capture:

```text
DiabetesSettingsAuditEvent (logical; may use medical_audit_events)
- subjectId
- actorAccountId
- resourceType: diabetes_settings | glucose_target_profile
- field: e.g. defaultRange
- oldValue
- newValue
- changedAt
- source: TargetRangeSource (for target changes)
```

Retention follows platform account/medical retention policy (§3.12).

---

## 19. Canonical conceptual data model

```text
Account
  │
  └──< AccountSubjectRelationship >── MedicalSubject
                                           │
                                           ├── DiabetesSettings (1:1)
                                           │     └── glucoseDisplayUnit
                                           │     └── diabetesTypeClassification
                                           │
                                           ├── GlucoseTargetProfile (1:1)
                                           │     └── defaultRange
                                           │           lowMmolPerL
                                           │           highMmolPerL
                                           │           source
                                           │     └── segments[] (future)
                                           │
                                           └── MedicalEventResource (1:N)
                                                 └── SemanticTimelineEvent
```

### Local-first note

Pre-adoption subjects may have local presentation preferences without cloud canonical settings. Rules (§3.8, INV-010):

- Do not auto-promote unknown legacy medical settings to canonical subject settings
- Only clearly compatible presentation preferences may migrate automatically
- Medical values require explicit/controlled adoption (P10)
- Post-adoption: server-authoritative settings with client cache

---

## 20. Field-level matrix

### DiabetesSettings

| Field                   | Type      | Nullable          | Default            | Sensitivity    | Wave 2 consumers                  |
| ----------------------- | --------- | ----------------- | ------------------ | -------------- | --------------------------------- |
| `settingsId`            | UUID      | No                | generated          | Internal       | API, DB                           |
| `subjectId`             | UUID      | No                | —                  | Internal       | AuthZ                             |
| `glucoseDisplayUnit`    | enum      | **Yes** (`unset`) | unset until chosen | Health-related | Timeline, Home, Quick Add, export |
| `diabetesTypeCategory`  | enum      | No                | `unknown`          | Health-related | AI (future), export               |
| `diabetesTypeOtherText` | string    | Yes               | null               | Health-related | AI (filtered)                     |
| `createdAt`             | timestamp | No                | now                | Internal       | Export metadata                   |
| `updatedAt`             | timestamp | No                | now                | Internal       | Cache                             |
| `revision`              | bigint    | No                | 1                  | Internal       | Concurrency                       |

### GlucoseTargetProfile.defaultRange

| Field          | Type              | Nullable | Default        | Sensitivity    | Wave 2 consumers              |
| -------------- | ----------------- | -------- | -------------- | -------------- | ----------------------------- |
| `profileId`    | UUID              | No       | generated      | Internal       | API, DB                       |
| `subjectId`    | UUID              | No       | —              | Internal       | AuthZ                         |
| `lowMmolPerL`  | decimal           | Yes      | null           | Health-related | Dashboard, Timeline (Wave 2E) |
| `highMmolPerL` | decimal           | Yes      | null           | Health-related | Same                          |
| `source`       | TargetRangeSource | No       | n/a when unset | Internal       | Audit, UI                     |
| `updatedAt`    | timestamp         | No       | now            | Internal       | Export metadata               |
| `revision`     | bigint            | No       | 1              | Internal       | Concurrency                   |

When both `lowMmolPerL` and `highMmolPerL` are null, the range is **unset** (no `source` required).

---

## 21. API boundary proposal

### Namespace separation

```text
/api/v1/identity/me/...                 → Account identity (existing)
/api/v1/preferences/me/...              → Application preferences (future)
/api/v1/medical/me/diabetes-settings/... → Self-subject diabetes settings (Wave 2C)
/api/v1/medical/me/medical-events/...   → Events (existing)
```

Combined or split transport for settings + targets is a Wave 2C implementation choice. Domain entities remain logically separate.

### Wave 2 routes (self-subject only)

```text
GET  /api/v1/medical/me/diabetes-settings
PUT  /api/v1/medical/me/diabetes-settings   (partial update; revision/If-Match)
```

Server resolves `subjectId` from active `self` relationship. Client does not supply `subjectId` for authorization.

### Future (not Wave 2)

```text
GET/PUT /api/v1/medical/subjects/{subjectId}/diabetes-settings
```

Requires caregiver/clinician relationship policy.

---

## 22. UX information architecture

### Product principle (INV-008)

Settings are for **infrequent configuration**. Frequent actions (log glucose, insulin, view Timeline) live in natural workflows — not behind Settings navigation.

Profile → **Управление диабетом** remains intentionally small.

### Entry structure

```text
Profile
  └── Управление диабетом
        ├── Glucose display unit     (first level)
        ├── Target range summary     (first level)
        └── Diabetes type            (first level, optional)
```

**Not here:** theme, devices, medications, CGM, alerts, export, clinical diagnoses.

### Inline glucose entry unit selection (Wave 2D)

When `glucoseDisplayUnit` is unset:

```text
Add glucose → lightweight unit picker → glucose entry form
```

Does not permanently block other app areas.

### Tap budget

| Action                       | Target taps |
| ---------------------------- | ----------- |
| Change display unit          | 2           |
| Edit target range            | 3           |
| Set diabetes type (optional) | 3           |

---

## 23. Defaults and onboarding rules

| Setting                | Default            | Rule                                                                                                                           |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `glucoseDisplayUnit`   | **`unset`**        | Required before manual glucose entry; resolved via inline picker or Управление диабетом; locale may suggest/pre-highlight only |
| `diabetesTypeCategory` | `unknown`          | Optional; skippable                                                                                                            |
| Target range           | **unset** (`null`) | Never guessed; never inferred from diabetes type or locale                                                                     |
| Therapy                | n/a                | Not collected in Wave 2                                                                                                        |

**Must NEVER be guessed:** target range, alert thresholds, therapy, silent locale-based unit assignment.

---

## 24. Internationalization rules

| Rule                  | Detail                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| Separate dimensions   | `PresentationContext.locale` ≠ `DiabetesSettings.glucoseDisplayUnit` (INV-007) |
| Language change       | Must not mutate glucose unit                                                   |
| Locale suggestion     | May suggest/pre-highlight unit; explicit confirmation required                 |
| Number formatting     | Locale drives separators via formatting library                                |
| Target UI input       | May display in user's chosen unit; storage mmol/L                              |
| Translation namespace | `account.diabetesManagement.*` (Wave 2D)                                       |

Supported locales: `en-GB`, `uk-UA`, `de-DE`, `ru-RU`.

---

## 25. Edge cases and validation

| Case                               | Behavior                                                           | Owner                  |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| `glucoseDisplayUnit` unset         | Block manual glucose entry; show inline picker; rest of app usable | Quick Add / Wave 2D    |
| Pre-adoption no cloud settings     | Transitional unset allowed; resolve before manual entry            | Client + adoption flow |
| Diabetes type unknown              | Allowed; neutral copy                                              | Domain                 |
| No targets configured              | No bands/charts reference; no fake defaults                        | Presentation           |
| Imported data in mg/dL             | Convert once to mmol/L at ingest                                   | Import domain          |
| User changes display unit          | Events unchanged; display recalculates                             | Presentation (INV-001) |
| Invalid target (low ≥ high)        | Reject                                                             | Domain + API           |
| Partial settings                   | Valid (e.g. unit set, targets unset)                               | —                      |
| Legacy local settings              | Do not auto-promote to canonical medical settings (INV-010)        | Adoption               |
| Compatible presentation prefs only | May migrate automatically                                          | Adoption (controlled)  |
| Caregiver loses access (future)    | Settings inaccessible; cache invalidated                           | AuthZ                  |
| Concurrent edits                   | Optimistic concurrency via `revision`                              | API                    |
| `SYSTEM_REFERENCE` displayed       | Must not write `USER_DEFINED` without explicit action              | UI + domain            |

---

## 26. Migration impact

| Artifact                        | Action                                        |
| ------------------------------- | --------------------------------------------- |
| `concentrationMmolPerL`         | **Reuse** — no event migration                |
| Legacy `TimelineEvent`          | **No change**                                 |
| Timeline/Quick Add presentation | **Migrate** in Wave 2E                        |
| `PresentationSnapshot`          | **Do not add** glucose unit                   |
| Profile menu placeholder        | **Enable** in Wave 2D                         |
| OpenAPI                         | **Extend** in Wave 2B                         |
| `medical_subjects`              | **Extend** via new settings tables in Wave 2B |
| GP-001 / NA-001                 | **Leave untouched**                           |

No migration SQL in Wave 2A.

---

## 27. Architecture options comparison

**Selected: Option 2 — Subject-scoped `DiabetesSettings` + `GlucoseTargetProfile` on `MedicalSubject`.**

| Option                             | Verdict                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| Account-scoped blob                | **Rejected** — conflicts with P7; breaks caregiver future |
| Subject-scoped settings (Option 2) | **Selected** — smallest safe long-term architecture       |
| EHR-lite clinical profile          | **Rejected** — scope creep; violates task brief           |

---

## 28. Final recommendation

Adopt subject-scoped Diabetes Settings with the approved Wave 2 bundle:

1. `DiabetesSettings`: `glucoseDisplayUnit` (required before manual entry), optional diabetes type
2. `GlucoseTargetProfile.defaultRange`: optional global target with provenance
3. Domain glucose conversion helper (18.0182); formatting unchanged (ADR-0010)
4. Self-subject API under `/api/v1/medical/me/...` (Wave 2C)
5. Explicit deferral of alerts, therapy, devices, segments, caregiver UI

**Do not:** store mg/dL on events; put settings on Account; merge targets/alerts; auto-apply locale as medical unit; infer targets from diabetes type; auto-promote legacy medical settings.

---

## 29. Wave 2 scope summary

### In scope (Wave 2 overall)

| Capability                                  | Wave |
| ------------------------------------------- | ---- |
| Architecture (this document)                | 2A   |
| Types, schema, conversion, OpenAPI          | 2B   |
| API/domain services, audit                  | 2C   |
| Управление диабетом UI + inline unit picker | 2D   |
| Timeline/Dashboard/Quick Add integration    | 2E   |
| QA, security, accessibility                 | 2F   |

### In scope (settings content)

- Glucose display unit (`mmol/L` \| `mg/dL`)
- Optional diabetes type (informational)
- Optional global target range with provenance
- Audit for target changes
- Medical export settings section (future export implementation)

### Deferred

- Alert / notification thresholds
- Therapy / regimen profile
- Device / CGM configuration
- Target segments / scheduling
- Caregiver/clinician editing UI
- Analytics TIR runtime
- Clinical diagnosis / ICD coding
- Re-authentication for settings changes

---

## 30. Wave 2B implementation contract

Wave 2B implements **only** the approved foundation required for shared contracts and schema. It is the direct contract for engineering work after Wave 2A approval.

### Wave 2B MAY implement

- Shared TypeScript domain types (`DiabetesSettings`, `GlucoseTargetProfile`, `TargetRangeSource`, enums)
- Drizzle schema additions (`diabetes_settings`, `glucose_target_profiles` or equivalent)
- Canonical glucose conversion domain primitive(s) with unit tests
- OpenAPI schema definitions for settings resources
- Schema/type validation aligned with domain bounds
- Update stub docs: `docs/data/entities/glucose.md`, `docs/architecture/settings/overview.md` (documentation only)

### Wave 2B MUST NOT implement

- UI or onboarding screens
- Alert engine or notification policy
- CGM/device integrations
- Therapy profile
- Caregiver editing routes or policies
- Analytics runtime or TIR computation
- Target `segments[]` or scheduling engine
- Production API route handlers (Wave 2C)
- Presentation-layer wiring (Wave 2E)
- Any behavior outside this foundation boundary

---

## 31. Proposed Wave 2C–2F roadmap

### Wave 2C — API and domain services

- Settings CRUD with revision; authZ via self-subject
- Target validation; audit events on target changes
- No alert, therapy, or caregiver endpoints

### Wave 2D — UX/UI

- Enable Profile → Управление диабетом
- Inline unit picker on first manual glucose entry
- Target range and optional diabetes type screens
- i18n for supported locales

### Wave 2E — Integration

- Timeline, Dashboard, Quick Add read display preference
- Target range visual reference (non-diagnostic)
- Settings cache invalidation

### Wave 2F — QA, security, accessibility

- AuthZ tests; audit verification
- Confirm unit switch does not alter stored events (INV-001)
- Accessibility audit

---

## 32. Future considerations

Items intentionally deferred beyond Wave 2; not blockers for Wave 2A approval:

| Topic                                    | Notes                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Clinical diagnosis vs self-reported type | Keep separate if clinical module added                                            |
| Pediatric age-aware targets              | Extension via `segments[]`                                                        |
| Caregiver edit policy                    | Relationship-type rules when Care Relationships BC ships                          |
| Clinician-defined read-only targets      | `CLINICIAN_DEFINED` provenance already modeled                                    |
| Local IndexedDB settings cache           | May be specified in Wave 2B if needed for offline; server authority post-adoption |
| Combined vs split HTTP resource          | Wave 2C implementation choice                                                     |

---

## Governing references

- P3 — Semantic Timeline Event Model (`packages/types/src/semantic-timeline.ts`)
- P5 — Identity, Account & Data Ownership (`docs/architecture/identity/p5-identity-account-data-ownership.md`)
- P7 — Backend Medical Data Architecture (`docs/architecture/backend/p7-backend-medical-data-architecture.md`)
- P8 — Medical API Contracts (`docs/architecture/api/p8-medical-api-contracts.md`)
- P10 — Local Data Adoption Architecture
- ADR-0010 — Platform Formatting Library
- ADR-0012 — User Time Zone Policy
- Presentation Context Foundation (`docs/architecture/presentation/presentation-context.md`)

---

## Architecture approval gate (Wave 2A)

Wave 2A is **ready for approval** when reviewers confirm:

- [x] Subject-scoped ownership aligns with P7
- [x] INV-001 canonical mmol/L storage preserved
- [x] INV-004 targets, app alerts, and device alarms remain distinct
- [x] INV-005 diabetes type does not infer targets
- [x] Profile ≠ diabetes settings ≠ medical record (INV-002)
- [x] All Wave 2B-blocking product decisions resolved (§3)
- [x] Wave 2B implementation contract defined (§30)
- [x] Repository consistency verified (§5) — no conflicts

**Wave 2B must not start until this document is approved and merged.**
