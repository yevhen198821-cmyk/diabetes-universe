# Wave 2A — Diabetes Settings Architecture

## Document status

| Field | Value |
| --- | --- |
| Wave | 2A — Architecture only |
| Status | **Architecture Proposal** |
| Date | 2026-08-26 |
| Scope | Profile → Управление диабетом |
| Out of scope | UI, migrations, API routes, production code |

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Repository audit](#2-repository-audit)
3. [Existing domain conflicts and duplication](#3-existing-domain-conflicts-and-duplication)
4. [Domain boundaries](#4-domain-boundaries)
5. [Person-of-care ownership decision](#5-person-of-care-ownership-decision)
6. [Diabetes type recommendation](#6-diabetes-type-recommendation)
7. [Glucose unit architecture](#7-glucose-unit-architecture)
8. [Target-range architecture](#8-target-range-architecture)
9. [Alert-threshold decision](#9-alert-threshold-decision)
10. [Therapy-data decision](#10-therapy-data-decision)
11. [Security and data classification](#11-security-and-data-classification)
12. [AI access rules](#12-ai-access-rules)
13. [Audit and history rules](#13-audit-and-history-rules)
14. [Canonical conceptual data model](#14-canonical-conceptual-data-model)
15. [Field-level matrix](#15-field-level-matrix)
16. [API boundary proposal](#16-api-boundary-proposal)
17. [UX information architecture](#17-ux-information-architecture)
18. [Defaults and onboarding rules](#18-defaults-and-onboarding-rules)
19. [Internationalization rules](#19-internationalization-rules)
20. [Edge cases and validation](#20-edge-cases-and-validation)
21. [Migration impact](#21-migration-impact)
22. [Architecture options comparison](#22-architecture-options-comparison)
23. [Final recommendation](#23-final-recommendation)
24. [Proposed Wave 2B–2F roadmap](#24-proposed-wave-2b2f-roadmap)
25. [Open questions requiring product-owner decision](#25-open-questions-requiring-product-owner-decision)

---

## 1. Executive summary

Diabetes Universe already has a strong **event-centric medical domain** (`SemanticTimelineEvent` with canonical `concentrationMmolPerL`) and an approved **subject-centric ownership model** (P5/P7: Account ≠ Medical Subject). Profile Wave 1 delivered account identity UX only. **No persisted diabetes settings, glucose display preference, target ranges, therapy profile, or alert thresholds exist today.**

Wave 2A recommends introducing **Diabetes Settings as a subject-scoped configuration resource** attached to the existing `MedicalSubject`, not to the authenticated `Account` or Profile identity record. This aligns with approved backend architecture, preserves caregiver/clinician futures, and keeps Profile from becoming an electronic health record.

**Canonical glucose storage remains mmol/L.** User display unit preference is a presentation setting stored separately and applied at presentation boundaries via a new domain conversion helper (ADR-0010: formatting library does not convert).

**Wave 2 initial scope (settings content):**

| Setting | Wave 2 recommendation |
| --- | --- |
| Glucose display unit | **Ship** — required for international product |
| Diabetes type | **Ship optional** — informational, extensible taxonomy |
| Global glucose target range | **Ship optional** — simple low/high; extensible model |
| App alert thresholds | **Defer** — separate concept; product/clinical policy needed |
| Therapy / regimen | **Defer minimal flag only** — optional `usesInsulin` for UX; no medication system |
| Device/CGM configuration | **Defer** — separate bounded context (Profile menu already defers) |

**Critical principle preserved:**

```text
Account Profile  ≠  Diabetes Settings  ≠  Medical Record
```

Implementation must not begin in Wave 2A. Next step is Wave 2B (data contracts/schema design).

---

## 2. Repository audit

### 2.1 Domain contracts — glucose and events

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/types/src/semantic-timeline.ts` | `GlucoseTimelineEvent.concentrationMmolPerL` | Canonical glucose concentration | **Production domain** | **Reuse** — single storage unit |
| Same file | `CanonicalUnitId` includes `'glucose.mmol_per_l'` | Unit identifier for medication; glucose canonical unit documented | **Domain policy** | **Reuse** |
| Same file | `GlucoseMeasurementContext` | Measurement context enum | **Production domain** | **Reuse** — not a settings field |
| Same file | Comment L16–17 | Display conversion belongs to presentation | **Architecture policy** | **Reuse** |
| `packages/types/src/quick-add.ts` | `GlucoseQuickAddEntry.valueMmol` | Quick Add input always mmol/L | **Domain input contract** | **Reuse**; wire to display preference in presentation |
| `packages/types/src/timeline.ts` | `TimelineEvent`, `DaySummary.timeInRange`, `LastGlucose` | Legacy presentation DTOs | **Legacy/demo** | **Deprecate** for new features |
| `packages/types/src/timeline-migration.ts` | Migration/quarantine types | Legacy lift audit | **Production migration** | **Reuse** for import paths |

### 2.2 Formatting and presentation

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/formatting/src/types/measurement-unit.ts` | `MeasurementUnit = 'mmol/L' \| 'mg/dL'` | Display unit enum | **Presentation contract** | **Reuse** for display preference output |
| `packages/formatting/src/runtime/measurement.ts` | Precision defaults (mmol/L: 0–1 digits; mg/dL: 0) | Rounding at format boundary | **Production** | **Reuse** |
| `docs/adr/0010-platform-formatting-library.md` | No medical conversion in formatting | Architectural boundary | **Approved ADR** | **Reuse** — domain owns conversion |
| `apps/web/lib/timeline/presentation/timeline-presentation-mapper.ts` | Always labels mmol/L | Timeline display | **Production (incomplete)** | **Migrate** to preference-driven display |
| `apps/web/lib/quick-add/format-glucose.ts` | Hardcoded RU + mmol/L | Quick Add display | **Transitional debt** | **Migrate** |
| `apps/web/components/quick-add/glucose-quick-add-form.tsx` | Hardcoded RU strings, mmol/L suffix | Quick Add UI | **Production (i18n debt)** | **Migrate** in Wave 2E |

### 2.3 Identity, account, and profile (Wave 1)

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/identity/src/server/database/auth-schema.ts` | `user`, `session`, `passkey`, `userAvatarObject` | Authentication and avatar | **Production** | **Leave untouched** — no medical fields |
| `packages/identity/src/contracts/auth-contracts.ts` | `AuthenticatedPrincipal` | Account identity DTO | **Production** | **Reuse** — exclude diabetes settings |
| `apps/web/components/profile/profile-menu.tsx` | Disabled "Diabetes settings" row | UX placeholder | **Production UI hook** | **Reuse** route entry; enable in Wave 2D |
| `apps/web/components/profile/profile-settings-panel.tsx` | Theme control only | App preferences | **Production** | **Reuse** — keep theme here, not diabetes |
| `packages/locales/src/resources/*/messages.ts` | `account.profile.menu.diabetesSettings.*`, `section.diabetesManagement` | i18n for future screen | **Production i18n** | **Reuse** |
| `docs/architecture/identity/p5-identity-account-data-ownership.md` | Account ≠ Subject separation | Governing architecture | **Approved** | **Reuse** as authority |
| `apps/web/e2e/profile-segmented-wave-1.spec.ts` | Asserts no diabetes type text | Wave 1 guardrail | **Test** | **Update** when Wave 2D ships |

### 2.4 Medical backend and persistence

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/medical-domain/src/types/medical-subject.ts` | `MedicalSubject` shell (`subjectKind: 'person'`) | Person whose data is stored | **Production domain** | **Extend** with settings association, not inline fields |
| `packages/medical-persistence/.../medical-schema.ts` | `medical_subjects`, `account_subject_relationships`, `medical_event_resources` | Cloud persistence | **Production schema** | **Extend** with settings table/resource in Wave 2B |
| `packages/medical-persistence/.../medical-schema.ts` | `medical_audit_events` | Audit trail | **Production** | **Reuse** for settings changes |
| `docs/architecture/backend/p7-backend-medical-data-architecture.md` | Subject-centric storage selected | Approved backend model | **Approved** | **Reuse** |
| `docs/architecture/api/p8-medical-api-contracts.md` | `/api/v1/medical/me/...` self-subject resolution | API style | **Approved** | **Extend** with settings routes in Wave 2C |

### 2.5 Local timeline persistence

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/timeline-web/.../timeline-indexeddb-schema.ts` | `timeline_events` store | Local semantic events | **Production** | **Leave untouched** — settings not in events |
| Same | Validation requires `concentrationMmolPerL` | Local integrity | **Production** | **Reuse** |

### 2.6 Policies, thresholds, and analytics (absent by design)

| Location | Artifact | Purpose | Class | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/platform/src/contracts/glucose-data-staleness-policy.ts` | GP-001 contract | Data freshness policy | **Policy shell** | **Leave untouched** until approved parameters |
| `apps/web/.../dashboard-last-glucose-model.ts` | `DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS` (24h) | UX staleness, not clinical | **Production UX** | **Reuse** — not a diabetes setting |
| `docs/architecture/dashboard/last-glucose.md` | Explicitly no target range | Product boundary | **Approved** | **Reuse** until targets ship |
| `docs/architecture/analytics/overview.md` | Empty stub | Future module | **Placeholder** | **Leave untouched** |
| `docs/architecture/reports/overview.md` | Empty stub | Future module | **Placeholder** | **Leave untouched** |
| `docs/architecture/settings/overview.md` | Empty stub | Settings architecture | **Placeholder** | **Fill** from this document in Wave 2B |

### 2.7 OpenAPI

| Location | Gap | Recommendation |
| --- | --- | --- |
| `docs/api/openapi/medical-v1.yaml` | `SemanticTimelineEvent` schema missing kind-specific fields (`concentrationMmolPerL`, etc.) | **Migrate** in Wave 2B/C — align with `medical-api-validation.ts` |
| Same | No diabetes settings schemas | **Add** in Wave 2B/C |

### 2.8 Demo and fixture data

| Location | Purpose | Class | Recommendation |
| --- | --- | --- | --- |
| `apps/web/lib/mocks/timeline.ts` | Semantic demo events with `concentrationMmolPerL` | **Demo** | **Reuse** — does not include settings |
| `apps/web/lib/mocks/preserved-legacy-demo-timeline-events.ts` | Legacy migration regression | **Fixture** | **Leave untouched** |

### 2.9 Concepts searched but not found

No production models exist for: `diabetesType`, `glucoseDisplayUnit` preference persistence, target low/high, hypo/hyper thresholds, therapy type, CGM device config, `MedicalProfile` entity, time-in-range computation, or clinician-defined targets.

---

## 3. Existing domain conflicts and duplication

### 3.1 Competing glucose representations

| Representation | Storage semantics | Risk |
| --- | --- | --- |
| `SemanticTimelineEvent.concentrationMmolPerL` | Canonical numeric mmol/L | **Authoritative** |
| Legacy `TimelineEvent.value` + `unit` string | Presentation string | **Deprecated** — migration only |
| Dashboard spec note: "owner-prepared display strings" for mmol/L and mg/dL | Historical spec language for legacy path | **Conflict with P3** for semantic path — semantic owners must convert, not pass strings |
| Quick Add hardcoded `ммоль/л` | UI assumption | **Duplication** — bypasses platform formatting |

**Resolution:** One canonical numeric storage (mmol/L). All surfaces convert at presentation boundary using user display preference.

### 3.2 Settings location ambiguity (future risk)

| Surface | Current content | Risk if diabetes settings added here |
| --- | --- | --- |
| Profile → Settings tab (`/account/settings`) | Theme only | Users may conflate app theme with medical configuration |
| Profile menu → Diabetes settings (disabled) | Placeholder | Correct IA hook — should become dedicated route |
| Profile menu → Language/region (disabled) | Placeholder | Locale must not silently change glucose unit |
| `PresentationContext` / `PresentationSnapshot` | locale, timeZone, hourCycle | Must not absorb medical settings without subject scope |

**Resolution:** Diabetes settings live under Profile → **Управление диабетом** (dedicated route), backed by subject-scoped API — not under generic Settings tab or presentation snapshot alone.

### 3.3 Staleness vs clinical thresholds

| Concept | Implementation | Confusion risk |
| --- | --- | --- |
| GP-001 glucose data staleness | Policy contract; always `unavailable`/`indeterminate` today | Could be mistaken for hypo/hyper |
| Dashboard 24h UX stale indicator | Implemented | Informational only — document separation |
| Target range | Not implemented | Must not be inferred from staleness |

**Resolution:** Never merge staleness, targets, and alert thresholds.

### 3.4 Account vs subject ownership

P7 already rejected account-owned medical records. Any diabetes settings on `Account` would **conflict** with approved backend architecture.

---

## 4. Domain boundaries

### A. Account Identity

**Belongs here:** display name, email, avatar, authentication credentials, sessions, passkeys, account lifecycle status.

**Storage/API:** Identity schema (`packages/identity`), future `/api/v1/identity/me/...`.

**Why:** Security principal for authentication and authorization. Not the person whose glucose is measured in caregiver scenarios.

### B. Application Preferences

**Belongs here:** theme (light/dark), future language/locale selection UI, hour cycle display where not medically meaningful, non-medical notification preferences (account security alerts).

**Storage/API:** Client-persisted or account-scoped preference resource — **not subject-scoped**.

**Why:** Affects application chrome and formatting dimensions that should follow the **viewer/account** (caregiver may prefer dark mode while viewing child's data).

**Boundary note:** Locale affects number formatting (decimal separator) but **must not** change glucose unit preference automatically.

### C. Diabetes Settings

**Belongs here:** glucose display unit, optional diabetes type (informational), optional user-defined target range, future app-side alert preferences tied to **presentation/notification** of data about a **specific person**.

**Storage/API:** Subject-scoped `DiabetesSettings` resource.

**Why:** These settings change how diabetes information is **presented or interpreted** for a person. They are user-controlled configuration, not historical clinical facts. They must travel with the **person of care**, not the login account.

### D. Clinical / Medical Record

**Belongs here:** `SemanticTimelineEvent` records (glucose measurements, insulin doses, nutrition, etc.), future clinician-authored diagnoses, prescriptions, lab results, official device downloads as events.

**Storage/API:** `MedicalEventResource` envelope around semantic events; future clinical document types.

**Why:** Immutable or auditable **historical** medical information. Diabetes type entered by user as self-identification is **not** the same as a clinical diagnosis record — if both ever exist, diagnosis stays in medical record; self-reported type stays in settings unless product decides otherwise (**PRODUCT DECISION REQUIRED** for dual-track).

### E. Device / Data Source Configuration

**Belongs here:** CGM/pump/meter pairings, HealthKit/Health Connect permissions, device alert profiles, sync credentials.

**Storage/API:** Separate **Device Integration** bounded context (Profile menu already lists "Devices and sources" separately).

**Why:** Operational integration state with different lifecycle, security, and regulatory requirements. Must not imply app settings change device medical alert thresholds.

```text
┌─────────────────────┐     ┌──────────────────────┐
│   Account Identity  │     │ Application Prefs    │
│  auth, avatar, email│     │ theme, language UI   │
└──────────┬──────────┘     └──────────┬───────────┘
           │                           │
           │         ┌─────────────────┴─────────────────┐
           │         │                                   │
           ▼         ▼                                   ▼
    ┌───────────────AccountSubjectRelationship────────────────┐
    │  self | caregiver | clinician (future)                  │
    └──────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    MedicalSubject      │
                    │  (person of care)      │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────────┐ ┌─────────────┐ ┌───────────────────┐
     │DiabetesSettings│ │ Medical     │ │ Device/Data Source│
     │ (configuration)│ │ Events      │ │ Configuration     │
     └────────────────┘ │ (record)    │ │ (integrations)    │
                        └─────────────┘ └───────────────────┘
```

---

## 5. Person-of-care ownership decision

### Option A — Diabetes settings on user/account

Attach settings columns or JSON to authenticated account / identity user record.

| Dimension | Assessment |
| --- | --- |
| Simplicity | High for single-user MVP |
| Security | Couples health configuration to login; caregiver sees wrong settings or needs duplication |
| UX | Appears simple until multi-profile |
| Database | Minimal initial schema |
| Caregiver future | **Poor** — requires painful migration or duplicated settings per dependent |
| Migration cost | Low now, **high later** |
| Scalability | **Poor** — conflicts with P7 subject-centric model |

### Option B — Diabetes settings on MedicalSubject (recommended)

Settings resource keyed by `subjectId`, authorized via `AccountSubjectRelationship`.

| Dimension | Assessment |
| --- | --- |
| Simplicity | Moderate — reuses existing subject provisioning |
| Security | Least privilege via relationship types; settings access auditable per subject |
| UX | Slightly more indirection; transparent for self-user (1:1) |
| Database | One settings row per subject — aligns with `medical_subjects` |
| Caregiver future | **Strong** — each dependent has own settings; caregiver switches context |
| Migration cost | Low — greenfield settings; no legacy settings data |
| Scalability | **Strong** — matches millions of subjects, multiple relationships |

### Recommendation

**Select Option B.** P7 already selected subject-centric medical resource ownership. Diabetes Settings are configuration **about a person**, not about a login. Wave 2 implements self-subject only (1 account : 1 self subject), but schema and API must use `subjectId` internally even when the route is `/me/...`.

Do **not** implement multi-profile UI in Wave 2. Do encode subject scoping in contracts now.

---

## 6. Diabetes type recommendation

### Is it required for current product behavior?

**No.** Timeline, Quick Add, Dashboard, and Home function without diabetes type. Nothing in the codebase consumes it.

### Is it informational or behavioral?

**Primarily informational** in Wave 2. Future modules (AI tone, analytics cohort defaults, onboarding copy) may use it for **non-prescriptive personalization** only.

It must **not** gate insulin logging, glucose entry, or therapy features in Wave 2.

### Can users change it themselves?

**Yes**, with audit history. Self-reported type is user-controlled settings data, not a clinician diagnosis.

### Should historical changes be retained?

**Yes — simple audit** (prior value + `changedAt` + `changedByAccountId`). Full temporal versioning only if product requires clinical-grade audit (**PRODUCT DECISION REQUIRED** for retention period).

### Should AI/analytics be allowed to use it?

**AI:** Yes, read-only, for contextual explanations ("As someone managing type 1 diabetes…") with mandatory non-diagnostic disclaimers.

**Analytics:** Yes, aggregated with consent/policy guardrails — defer implementation until Analytics module.

### Should absence block functionality?

**No.** `unknown` / `not_specified` must be valid states. Onboarding may **ask** but must allow skip.

### Taxonomy design

Avoid a simplistic closed enum as the **only** extensibility mechanism.

Recommended model:

```text
DiabetesTypeClassification
- category: type_1 | type_2 | gestational | other | unknown
- otherDescriptor?: string   (when category = other)
- source: self_reported
- confidence: user_asserted
```

Do **not** store ICD codes in Wave 2 unless product explicitly wants clinical coding (**PRODUCT DECISION REQUIRED**).

### Recommendation

**Include optional diabetes type in Wave 2 settings** using extensible taxonomy above. Default: `unknown`. Never block features. Never treat as diagnosis.

---

## 7. Glucose unit architecture

### Critical question: single canonical storage?

**Yes.** The repository already decided this in P3:

- Storage: **`concentrationMmolPerL` (number, mmol/L)**
- Events, API validation (`GLUCOSE_MMOL_MIN/MAX`), IndexedDB validation, and cloud JSONB all use this field.

**Do not store duplicate mg/dL values on events.** Do not rewrite historical events when display preference changes.

### Display preference

| Aspect | Owner |
| --- | --- |
| Stored preference | `DiabetesSettings.glucoseDisplayUnit` |
| Allowed values | `mmol_per_l` \| `mg_per_dl` (domain codes); maps to formatting `'mmol/L'` \| `'mg/dL'` |
| Default for new subjects | **No silent locale guess** — see §18 |

### Conversion ownership

| Layer | Responsibility |
| --- | --- |
| Domain (`@diabetes-universe/medical-domain` or `types`) | `convertGlucoseMmolPerLToMgPerDl`, `convertGlucoseForDisplay` — pure functions, deterministic |
| Presentation mappers (Timeline, Dashboard, Quick Add, Reports) | Read canonical mmol/L + display preference → compute display value → pass to `formatMeasurement()` |
| Formatting library | Format number + unit symbol only (ADR-0010) |
| Persistence | Always mmol/L |

**Conversion formula (domain):** `mg/dL = mmol/L × 18.0182` (standard biochemical conversion; document constant; **PRODUCT DECISION REQUIRED** if jurisdiction mandates alternate factor).

### Rounding rules ownership

| Unit | Rule owner | Default |
| --- | --- | --- |
| mmol/L display | Formatting library precision | 1 decimal (0–1 fraction digits) |
| mg/dL display | Formatting library precision | 0 decimals |
| Internal storage | Full IEEE double | No rounding on persist |
| Import | Domain normalizes to mmol/L once at ingest | Round only at display |

Changing display unit **never mutates** stored measurements.

### API representation

| Context | Representation |
| --- | --- |
| Medical events API | Always `concentrationMmolPerL` in semantic payload |
| Settings API | `glucoseDisplayUnit` enum |
| Optional read models | May include **derived** `displayValue` + `displayUnit` for client convenience — must be labeled derived, never persisted |

### Import / device behavior

Devices may report mg/dL. Import pipeline converts **once** to mmol/L at domain boundary before creating `GlucoseTimelineEvent`. Preserve original value in `EventProvenance` if needed for audit (**optional, Wave 2E+**).

### Timeline / Dashboard / reporting behavior

All read paths:

1. Load event canonical mmol/L
2. Resolve subject's `glucoseDisplayUnit` (cached with TTL)
3. Convert if needed
4. Format with locale + unit

Reports exporting raw data should export canonical mmol/L plus metadata of user's display preference.

---

## 8. Target-range architecture

### Wave 2 scope

Ship **one optional global target band** per subject:

```text
GlucoseTargetRange (embedded in DiabetesSettings or separate 1:1 resource)
- lowMmolPerL: number
- highMmolPerL: number
- label?: string (e.g. "My usual range")
- source: user_defined | clinician_defined (future)
- effectiveFrom?: ISO8601 (future temporal targets)
```

Storage **always mmol/L** internally regardless of display unit.

### Future expansion (design now, implement later)

| Future need | Extension mechanism |
| --- | --- |
| Time-of-day segments | `GlucoseTargetProfile` 1:N `GlucoseTargetSegment` with cron/time window |
| Sleep / exercise / pregnancy | `segment.contextTag` or scoped override |
| Clinician-defined targets | `source: clinician_defined`, `authorSubjectRelationshipId`, read-only for patient |
| Temporary targets | `effectiveFrom` / `effectiveUntil` on segment |
| Pediatric | Age-aware profiles (**PRODUCT DECISION REQUIRED**) |
| Device-provided targets | **Device bounded context** — import as read-only reference, not app settings mirror |

### Model shape (extensible)

```text
MedicalSubject 1 ── 1 GlucoseTargetProfile
GlucoseTargetProfile
- profileId
- subjectId
- status: active | archived
- defaultSegmentId (optional)

GlucoseTargetSegment
- segmentId
- profileId
- lowMmolPerL, highMmolPerL
- schedule?: RecurrenceRule (nullable = global default)
- priority: number
- source, effectiveFrom, effectiveUntil
```

Wave 2B may implement **only** a single implicit default segment (or embed in `DiabetesSettings`) while keeping segment table optional for forward compatibility.

### Validation

- `lowMmolPerL < highMmolPerL`
- Bounds aligned with API glucose bounds (0.1–100 mmol/L) or tighter product limits (**PRODUCT DECISION REQUIRED**)
- Missing targets: valid — Dashboard/TIR features show empty/neutral until configured

### TARGET ≠ ALERT

Target range is for **visual reference and analytics (future TIR)**. Alert thresholds are separate (§9).

---

## 9. Alert-threshold decision

### Concepts

| Concept | Purpose | Wave 2 |
| --- | --- | --- |
| Target range | Desired glycemic band for charts/TIR | **Optional settings** |
| App notification threshold | When Diabetes Universe notifies about readings | **Defer** |
| Urgent low / low / high (clinical) | CGM/pump alarms | **Device bounded context** |
| GP-001 staleness | Data freshness attention | **Separate policy** — already exists |

### Recommendation

**Do not include alert thresholds in Wave 2 Diabetes Settings UI or schema.**

Rationale:

- Product has no approved notification policy or clinical thresholds (GP-001 explicitly lacks approved parameters).
- Risk of users believing app thresholds change CGM alarms.
- Requires notification infrastructure not yet built.

**Wave 3+ placeholder entity (design only):**

```text
GlucoseAlertPreferences (subject-scoped, separate resource)
- appNotifyBelowMmolPerL?
- appNotifyAboveMmolPerL?
- notifyUrgentLow?: boolean
- deliveryChannels?: ...
```

Copy must state: **"Does not change device alarms."**

Defer implementation until Notifications module and clinical policy exist.

---

## 10. Therapy-data decision

### Audit: is therapy information required now?

**No.** Insulin appears only as **event-level** data (`InsulinTimelineEvent`, Quick Add). No regimen, pump model, or medication list exists.

### Data minimization recommendation

| Field | Wave 2 | Reason |
| --- | --- | --- |
| Full therapy regimen | **Exclude** | Medication management system out of scope |
| MDI / pump / basal-bolus | **Exclude** | Sensitive; insufficient consumer need |
| Non-insulin medications | **Exclude** | EHR creep |
| `usesInsulin: boolean` optional | **Optional flag only** | Helps Quick Add prominence / copy; derivable from events later |

If `usesInsulin` is included, allow `unknown` and infer suggestion from insulin event history in UX only — **do not auto-write**.

### Recommendation

**Smallest useful model: omit therapy fields in Wave 2B** unless product confirms `usesInsulin` flag adds clear UX value (**PRODUCT DECISION REQUIRED**). Event-level insulin logging remains sufficient.

---

## 11. Security and data classification

### Classification matrix

| Field / resource | Classification | AuthZ | Audit | Encryption | Export | Deletion |
| --- | --- | --- | --- | --- | --- | --- |
| Account email, name, avatar | Account PII | Self; identity APIs | Security events | At rest per platform | Account export | With account deletion |
| Theme, language UI pref | Preference | Self | Optional | Standard | Optional | With account |
| `glucoseDisplayUnit` | Health-related personal data | Subject relationship required | `updated_at` | At rest | Subject export bundle | With subject/account policy |
| `diabetesType` | Health-related personal data | Subject relationship | Change audit | At rest | Subject export | With subject deletion |
| Target range | Health-related personal data | Subject relationship | Change audit | At rest | Subject export | With subject deletion |
| `SemanticTimelineEvent` | Sensitive medical data | Subject relationship | Medical audit events | At rest | Medical export | Distinct from settings deletion |
| Future alert prefs | Health-related + notification | Subject relationship | Change audit | At rest | Export | Configurable |

### Authorization rules

- Deny by default (P5).
- Diabetes settings APIs require validated session + resolved `subjectId` + active relationship (`self` initially).
- **Do not expose** diabetes settings through generic identity `/me` profile endpoints.
- Caregiver/clinician access to settings requires explicit relationship type + policy (future) — not implied by medical event access alone (**PRODUCT DECISION REQUIRED** for caregiver edit rights).

### Least privilege

- AI service receives read-only settings subset via dedicated contract — not broad medical API access.
- Settings write requires stronger authentication freshness if product mandates re-auth for medical settings (**PRODUCT DECISION REQUIRED**).

---

## 12. AI access rules

### AI may read (future)

| Setting | Use |
| --- | --- |
| `glucoseDisplayUnit` | Format explanations consistently |
| `diabetesType` (if set) | Personalize educational tone |
| Target range (if set) | Contextualize readings vs user-stated goals — **not clinical judgment** |

### AI must not

- Diagnose or prescribe
- Autonomously modify any Diabetes Settings
- Change target ranges or therapy
- Silently write settings based on inferred patterns

### AI-proposed changes

Any suggestion to update settings must:

1. Be presented as explicit user action
2. Show before/after
3. Require user confirmation
4. Log audit event on acceptance

AI access uses same subject authorization boundary as deterministic features (P5 Marketplace/AI section).

---

## 13. Audit and history rules

| Change type | History requirement |
| --- | --- |
| Display unit mmol/L ↔ mg/dL | `updated_at` + audit event (non-clinical preference, but health-adjacent) |
| Diabetes type | Audit event with prior value |
| Target range change | Audit event with prior low/high — **clinically meaningful user configuration** |
| Theme / language | `updated_at` only (application preference) |
| View/read settings | No audit (unless regulatory requirement emerges) |

Avoid event sourcing for settings. Use:

- Current row per subject
- Append-only `medical_audit_events` (or dedicated `diabetes_settings_history` if query needs require — defer unless needed)

**Retention:** Follow account/medical retention policy (**PRODUCT DECISION REQUIRED**).

---

## 14. Canonical conceptual data model

### Entity relationship (conceptual)

```text
Account
  │
  └──< AccountSubjectRelationship >── MedicalSubject
                                           │
                                           ├── DiabetesSettings (1:1)
                                           ├── GlucoseTargetProfile (1:1, optional separate)
                                           │     └── GlucoseTargetSegment (1:N, future)
                                           └── MedicalEventResource (1:N)
                                                 └── SemanticTimelineEvent
```

### Entity summaries

**MedicalSubject** (exists — extend associations only)

**DiabetesSettings** (new, 1:1 with subject)

**GlucoseTargetProfile** (new, 1:1 with subject; may embed default range in Wave 2B minimal form)

**DiabetesSettingsAuditEvent** (logical; may reuse `medical_audit_events`)

Local-first note: Until cloud sync of settings is implemented, a **local DiabetesSettings cache** keyed by `subjectId` (or local-only subject placeholder pre-adoption) mirrors server authority post-adoption. Pre-adoption: local settings apply to local unattached timeline namespace (**PRODUCT DECISION REQUIRED** for pre-login behavior).

---

## 15. Field-level matrix

### DiabetesSettings

| Field | Type | Nullable | Default | Owner | Sensitivity | Reason | Consumers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `settingsId` | UUID | No | generated | DiabetesSettings | Internal | Primary key | API, DB |
| `subjectId` | UUID | No | — | MedicalSubject | Internal | Scope | AuthZ, all modules |
| `glucoseDisplayUnit` | enum | No | **none until chosen** | DiabetesSettings | Health-related | Display preference | Timeline, Home, Quick Add, Reports, AI |
| `diabetesTypeCategory` | enum | No | `unknown` | DiabetesSettings | Health-related | Informational self-ID | AI, Analytics (future), onboarding |
| `diabetesTypeOtherText` | string | Yes | null | DiabetesSettings | Health-related | When category=other | AI (filtered) |
| `createdAt` | timestamp | No | now | DiabetesSettings | Internal | Lifecycle | Audit |
| `updatedAt` | timestamp | No | now | DiabetesSettings | Internal | Lifecycle | Cache invalidation |
| `revision` | bigint | No | 1 | DiabetesSettings | Internal | Optimistic concurrency | Sync (future) |

### GlucoseTargetProfile (minimal Wave 2)

| Field | Type | Nullable | Default | Owner | Sensitivity | Reason | Consumers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `profileId` | UUID | No | generated | GlucoseTargetProfile | Internal | PK | API |
| `subjectId` | UUID | No | — | MedicalSubject | Internal | Scope | AuthZ |
| `lowMmolPerL` | decimal | Yes | null | GlucoseTargetProfile | Health-related | Target band | Dashboard, Timeline, Analytics |
| `highMmolPerL` | decimal | Yes | null | GlucoseTargetProfile | Health-related | Target band | Same |
| `source` | enum | No | `user_defined` | GlucoseTargetProfile | Internal | Provenance | Audit, UI badges |
| `updatedAt` | timestamp | No | now | GlucoseTargetProfile | Internal | — | Cache |

Future `GlucoseTargetSegment` fields deferred to Wave 2B schema design.

---

## 16. API boundary proposal

### Namespace separation

```text
/api/v1/identity/me/...          → Account identity (existing)
/api/v1/preferences/me/...       → Application preferences (future: theme, locale UI)
/api/v1/medical/me/settings/...  → Diabetes settings (self-subject resolved)
/api/v1/medical/me/targets/...   → Glucose targets (optional split)
/api/v1/medical/me/medical-events/... → Events (existing)
```

Alternative: combine settings + targets under `/api/v1/medical/me/diabetes-settings` with nested objects — **implementation choice in Wave 2C**; logical separation must remain in domain model even if combined in transport.

### Self-user (Wave 2)

```text
GET  /api/v1/medical/me/diabetes-settings
PUT  /api/v1/medical/me/diabetes-settings   (partial update, If-Match/revision)
```

Server resolves `subjectId` from active `self` relationship — client does not send subject ID for authorization.

### Future caregiver / clinician

```text
GET  /api/v1/medical/subjects/{subjectId}/diabetes-settings
PUT  /api/v1/medical/subjects/{subjectId}/diabetes-settings
```

Requires relationship policy enforcement. Route shape pre-planned; not implemented in Wave 2.

### Versioning

- Include `schemaVersion` on settings resource
- Breaking changes → new API version path (`/v2/`)
- Do not expose DB columns directly; use DTOs with domain enum names

### Local-first

Client maintains settings cache; optimistic UI with revision conflict handling aligned with P11 sync patterns (Wave 2E+).

---

## 17. UX information architecture

### Entry

```text
Profile (account)
  └── Управление диабетом   (/account/diabetes-management or localized slug)
        ├── Overview (Wave 2D landing)
        ├── Glucose units      (primary — may be inline on overview)
        ├── Target range       (secondary screen or expandable section)
        ├── Diabetes type      (secondary — optional)
        └── Advanced           (Wave 3+: alert prefs, archived targets)
```

**Not in this section:** theme ( stays Settings tab ), passkeys/sessions (Security ), devices ( separate menu section ), raw medical events ( Timeline ), export ( Data section ).

### Overview screen (≤ 3 taps to common actions)

**Purpose:** At-a-glance status of how diabetes data is interpreted in the app.

**Sections:**

1. **Glucose display unit** — first-level control (mmol/L vs mg/dL). Single tap to change with confirmation if locale suggests different unit.
2. **Target range** — first-level summary with "Set range" / "Edit" → second screen with low/high inputs in **user's display unit**, stored as mmol/L.
3. **Diabetes type** — second-level row ("Optional") → simple picker + skip.

**Advanced (deeper):**

- History of target changes (read-only audit) — optional Wave 2D or 3
- Alert preferences — hidden until module exists

**Must NOT appear:**

- Medication lists, insulin regimen editor, diagnosis codes, clinician notes, CGM pairing ( lives under Devices ), lab results.

### Tap budget

| Action | Target taps |
| --- | --- |
| Change display unit | 2 (open screen → select) |
| Edit target range | 3 (open → edit range → save) |
| Set diabetes type | 3 (open optional → pick → save) |

---

## 18. Defaults and onboarding rules

| Setting | Default | Onboarding |
| --- | --- | --- |
| `glucoseDisplayUnit` | **No default** — use `unset` state | **Explicit choice required** before first glucose entry OR soft prompt with regional **suggestion** (not auto-apply). Suggest mmol/L for UK/EU, mg/dL for US based on locale — user must confirm. |
| `diabetesTypeCategory` | `unknown` | Optional question; skippable |
| Target range | `null` (unset) | Do not guess clinical targets. Explain benefits; skip allowed. |
| Therapy | n/a | Do not ask in Wave 2 |

**Must NEVER be guessed:** target range, alert thresholds, diabetes type (beyond default `unknown`), therapy.

**Locale inference:** may pre-select **suggested** display unit in onboarding UI only; applying it requires explicit tap.

---

## 19. Internationalization rules

| Rule | Detail |
| --- | --- |
| Separate dimensions | `PresentationContext.locale` ≠ `DiabetesSettings.glucoseDisplayUnit` |
| Language change | Must not mutate glucose unit |
| Number formatting | Locale drives decimal/group separators via formatting library |
| Unit symbols | Via `formatMeasurement()` — mmol/L and mg/dL localized symbols where applicable |
| Clinical conventions | Target range UI shows values in user's **display unit**; storage mmol/L |
| Regulatory | No diagnostic claims in settings copy; localized disclaimers in Wave 2D |
| Accessibility | Unit changes update aria-labels; don't rely on color alone for in-range indicators (future) |

Supported Wave 1 locales: `en-GB`, `uk-UA`, `de-DE`, `ru-RU` — diabetes settings must ship with full translation keys under `account.diabetesManagement.*` (new namespace).

---

## 20. Edge cases and validation

| Case | Behavior | Validation owner |
| --- | --- | --- |
| Diabetes type unknown | Allowed; neutral copy | Domain enum |
| No targets configured | Charts omit bands; no fake defaults | Presentation |
| Imported data different units | Convert at import to mmol/L | Import domain service |
| User changes display unit | Events unchanged; display recalculates | Presentation |
| Invalid target range (low ≥ high) | Reject with field error | Settings domain + API |
| Partial settings (unit set, targets null) | Valid | — |
| Deleted diabetes profile/subject | Settings deleted with subject; UI shows unavailable | Server lifecycle |
| Caregiver loses access | Settings inaccessible; cache invalidated | AuthZ + client cache |
| Stale cached settings | TTL + revision/ETag on GET | Client cache policy |
| Concurrent edits | Optimistic concurrency via `revision` | API |
| Pre-adoption local-only user | **PRODUCT DECISION REQUIRED** — local settings partition vs post-adoption merge | Platform |

---

## 21. Migration impact

| Existing artifact | Action |
| --- | --- |
| `SemanticTimelineEvent.concentrationMmolPerL` | **Reuse** — no migration |
| Legacy `TimelineEvent` | **No change** — continue migration lift |
| Timeline presentation (mmol/L hardcoded) | **Migrate** presentation to read settings |
| Quick Add hardcoded units | **Migrate** |
| `PresentationSnapshot` | **Do not add** glucose unit — subject settings separate |
| Profile menu placeholder | **Enable** link in Wave 2D |
| OpenAPI medical schema | **Extend** |
| `MedicalSubject` table | **Extend** association via new settings table |
| Demo fixtures | **Optional** add demo settings for dev |
| GP-001 / NA-001 | **Leave untouched** |
| Dashboard "no target range" docs | **Update** when targets ship (Wave 2E) |

No migration SQL in Wave 2A. Wave 2B introduces schema additively.

---

## 22. Architecture options comparison

### Option 1 — Minimal account-scoped settings blob

JSON column on identity user: `{ glucoseUnit, diabetesType, targets }`.

| Criterion | Score |
| --- | --- |
| Simplicity | ★★★★★ |
| Safety | ★★★ — conflates account with health config |
| Scalability | ★★ — breaks with caregivers |
| Caregiver future | ★ — requires rewrite |
| API design | ★★★ — tempting but wrong boundary |
| UX | ★★★★ short-term |
| Implementation cost | ★★★★★ lowest |
| Technical debt | ★★★★★ highest long-term |

### Option 2 — Subject-scoped DiabetesSettings + optional GlucoseTargetProfile (recommended)

Dedicated resources on `MedicalSubject`, separate API namespace.

| Criterion | Score |
| --- | --- |
| Simplicity | ★★★★ |
| Safety | ★★★★★ — aligns with P5/P7 |
| Scalability | ★★★★★ |
| Caregiver future | ★★★★★ |
| API design | ★★★★★ — consistent with medical API |
| UX | ★★★★ — transparent for self-users |
| Implementation cost | ★★★★ moderate |
| Technical debt | ★ lowest |

### Option 3 — Full clinical profile (EHR-lite)

Diabetes settings embedded in comprehensive medical profile with diagnoses, medications, allergies.

| Criterion | Score |
| --- | --- |
| Simplicity | ★ |
| Safety | ★★ — scope creep, regulatory exposure |
| Scalability | ★★★ |
| Caregiver future | ★★★★ |
| API design | ★★ |
| UX | ★★ — form fatigue |
| Implementation cost | ★ highest |
| Technical debt | ★★★★ — rejected per task brief |

---

## 23. Final recommendation

Adopt **Option 2 — Subject-scoped DiabetesSettings + GlucoseTargetProfile**.

This is the **smallest architecture that safely supports long-term product** without contradicting approved P3/P5/P7/P8 decisions.

**Wave 2 functional bundle:**

1. `DiabetesSettings` with `glucoseDisplayUnit` (required user choice) and optional `diabetesType`
2. `GlucoseTargetProfile` with optional global low/high (mmol/L storage)
3. Domain glucose display conversion helper + presentation integration plan
4. Subject-scoped API under `/api/v1/medical/me/...`
5. Explicit exclusion of alert thresholds and therapy regimen from Wave 2

**Do not:**

- Store mg/dL on events
- Put settings on Account/Profile identity
- Merge targets and alerts
- Auto-apply locale as medical unit without confirmation

---

## 24. Proposed Wave 2B–2F roadmap

### Wave 2A — Architecture (this document)

Deliverable: approved architecture report. **No code.**

### Wave 2B — Data contracts and schema

- TypeScript domain types in `@diabetes-universe/types` or `@diabetes-universe/medical-domain`
- Drizzle schema: `diabetes_settings`, `glucose_target_profiles` (names TBD)
- Domain conversion functions with unit tests
- OpenAPI schemas for settings resources
- Update stub docs: `docs/data/entities/glucose.md`, `docs/architecture/settings/overview.md`
- Local IndexedDB cache contract for settings (if local-first required pre-sync)

### Wave 2C — API and domain services

- Medical service: settings CRUD with revision, authZ via self-subject
- Validation bounds for targets
- Audit events on changes
- No alert or therapy endpoints

### Wave 2D — UX/UI

- Enable Profile → Управление диабетом route
- Overview + unit picker + target range + optional diabetes type screens
- Onboarding prompt for glucose unit (explicit confirmation)
- i18n keys for en-GB, uk-UA, de-DE, ru-RU
- E2E tests; accessibility audit

### Wave 2E — Integration

- Wire Timeline, Dashboard (Last Glucose, Day Summary bands), Quick Add to settings-driven display
- Target range visual reference on charts (non-diagnostic)
- Cache invalidation strategy across modules
- Update architecture docs for Dashboard/Timeline

### Wave 2F — QA, security, accessibility

- AuthZ tests (deny cross-subject access)
- Audit log verification
- Security review of settings APIs (no leakage via identity endpoints)
- Manual QA: unit switch does not alter stored events
- Performance: settings read on hot paths (cached)

**Optional reorder:** If local-first offline settings are prioritized before cloud API, swap 2C and local cache portions of 2B — **PRODUCT DECISION REQUIRED** based on cloud adoption timeline.

---

## 25. Open questions requiring product-owner decision

| # | Question | Impact |
| --- | --- | --- |
| 1 | Should onboarding **block** glucose entry until display unit is chosen, or allow entry with interim default display? | Onboarding UX |
| 2 | May locale **suggest** pre-selected unit without explicit tap? | i18n vs medical safety |
| 3 | Is optional `usesInsulin` flag worth Wave 2 scope? | Schema size |
| 4 | Should user self-reported diabetes type ever sync to a future clinical diagnosis record? | Dual-track medical record |
| 5 | Retention period for diabetes settings audit history | Compliance |
| 6 | Pre-adoption local-only settings: partition behavior before cloud account | Local-first UX |
| 7 | Caregiver edit rights to child's diabetes settings when caregiver ships | AuthZ policy |
| 8 | Re-auth required for changing target range? | Security UX |
| 9 | Exact mg/dL conversion factor and rounding for edge values (e.g. 3.9 mmol/L) | Display consistency |
| 10 | Clinician-defined targets: read-only for patient when clinician module ships? | Target profile `source` semantics |
| 11 | Export bundle: include settings in medical export, account export, or both? | GDPR/data portability |
| 12 | Combined vs split API resource for settings and targets | API ergonomics |

Items marked **PRODUCT DECISION REQUIRED** in this document must not be resolved by engineering alone.

---

## Governing references

- P3 — Semantic Timeline Event Model (`packages/types/src/semantic-timeline.ts`)
- P5 — Identity, Account & Data Ownership (`docs/architecture/identity/p5-identity-account-data-ownership.md`)
- P7 — Backend Medical Data Architecture (`docs/architecture/backend/p7-backend-medical-data-architecture.md`)
- P8 — Medical API Contracts (`docs/architecture/api/p8-medical-api-contracts.md`)
- ADR-0010 — Platform Formatting Library (no medical conversion in formatting)
- ADR-0012 — User Time Zone Policy
- Presentation Context Foundation (`docs/architecture/presentation/presentation-context.md`)
- Dashboard Last Glucose Architecture (no target range today)

---

## Architecture approval gate (Wave 2A)

Wave 2A is ready for product/architecture review when:

- [ ] Subject-scoped ownership aligns with P7
- [ ] Canonical mmol/L storage preserved
- [ ] Targets and alerts remain distinct
- [ ] Profile ≠ diabetes settings ≠ medical record principle explicit
- [ ] Wave 2B–2F sequence agreed
- [ ] Open questions in §25 assigned to product owners

**Wave 2B must not start until this document is approved.**
