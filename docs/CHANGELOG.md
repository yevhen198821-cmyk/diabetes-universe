# Changelog

## Wave 4F — Insulin Vertical Closure & Local Contract Hardening

Дата: 2026-09-02

Статус: **Implemented on branch / pending merge.** Closes the local insulin
recording vertical without new features: shared manual dose policy, explicit
`doseEdited` edit semantics, supplemental IndexedDB insulin validation via
composition-root injection, DE/UK full submit E2E, vertical closure E2E, and
OpenAPI canonical-max parity.

Завершено:

- shared manual insulin dose parser for Quick Add and Edit;
- unchanged canonical stored doses (`125`, `12.125`, `500`) survive non-dose
  edits without manual re-entry;
- `TimelineSemanticEventValidator` injection at web composition root;
- supplemental insulin persistence rules on all durable write and read paths;
- German and Ukrainian full semantic Quick Add submit E2E;
- vertical Quick Add → Dashboard → Timeline → Edit → reload E2E;
- OpenAPI `maximum` bound tied to `INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM`.

Не входило:

- cloud sync, outbox, calculators, pump, therapy plans, new dashboard module.

## Wave 4E — Insulin Medical API / Adoption / OpenAPI

Дата: 2026-09-01

Статус: **Merged / closed** at `6adc95de4625285497a45b13406200bb4966a38b`
(approved HEAD `9459df4be7846bdff3da6b3bfa9a97a22838cda1`, post-merge CI
`33564693833` SUCCESS). Medical API v1 and adoption accept semantic insulin
`preparationId` and `administrationContext` additively. Legacy `context`
remains valid. No cloud sync engine, no `schemaVersion` bump, no
therapy/recommendation logic.

Завершено:

- fail-closed allow-list includes `preparationId` and `administrationContext`;
- those two fields are then rejected unless `kind === 'insulin'`;
- insulin enum validation reuses medical-domain `isInsulinPreparationId` and
  `isInsulinAdministrationContext`;
- `doseUnits` reuses `validateInsulinCanonicalDose` (`finite`, `> 0`,
  `<= 500`, no rounding);
- POST / GET / LIST / PATCH preserve semantic insulin fields verbatim;
- adoption accepts semantic and legacy insulin rows without fabricated IDs;
- OpenAPI `InsulinPreparationId` / `InsulinAdministrationContext` plus enum
  parity tests against types and medical-domain.

Не входило:

- cloud sync, outbox consumer, P11/P12;
- calculators, IOB, pump, therapy plans, Wave 4F;
- production medical-cloud runtime activation.

## Wave 4D — Insulin Quick Add Save Integrity

Дата: 2026-08-31

Статус: **Implemented / merged** at `8c776882c7d7af51655fd0e80b81d513fb148730`.
Insulin Quick Add awaits IndexedDB persistence before success close, uses a
stable retry event ID for the same logical payload, and blocks dismiss while
pending. Wave 4C semantic payload unchanged.

Завершено:

- generalized Quick Add submit identity (`quick-add-submit-identity-model.ts`)
  for glucose and insulin stable event IDs;
- `InsulinQuickAddSubmitRequest` with `{ entry, eventId }` and insulin submit
  controller prepare/persist phases;
- async `onInsulinSubmit` on Dashboard and Timeline via `addEventAsync` and
  `createSemanticInsulinTimelineEvent(entry, { id: eventId })`;
- insulin form pending state, shared host dismiss lock, localized save-error
  chrome (`quick-add.insulin.saving`, `quick-add.insulin.saveError.*`);
- model/controller/integration/store/E2E regression coverage; glucose
  save-integrity contract unchanged.

Не входило:

- medical API allow-list, kind validation, adoption, OpenAPI, cloud
  create/update, outbox/sync — Wave 4E;
- other Quick Add categories, calculator, recommendation, IOB, pump, therapy
  plan, Edit precision cleanup, global localization closure.

## Wave 4C — Localized Semantic Insulin Quick Add

Дата: 2026-08-30

Статус: Implemented. Insulin Quick Add writes the Wave 4A semantic contract and
is localized for EN/RU/UK/DE. No API, OpenAPI, cloud, persistence-integrity, or
`schemaVersion` change.

Завершено:

- migrated `InsulinQuickAddEntry` to the semantic new-write shape
  (`preparationId`, `preparation` snapshot, `doseUnits`,
  `administrationContext`, `time`) and removed the legacy `context` string
  without dual-write;
- routed Quick Add submit through `prepareInsulinNewWrite`, so only a valid
  domain payload can reach `onSubmit`;
- preparation picker now uses catalogue IDs with labels and grouping chrome from
  the Wave 4B-II presentation adapter; identity is never derived from a display
  string and grouping is never persisted;
- `insulin.prep.other` reveals a required free-text name, trims it, blocks a
  blank submit with a localized error, and never stores a translated “Other”
  label as the snapshot;
- switching from Other back to a catalogue entry drops the entered name;
- administration context uses semantic IDs only; no choice and an explicit
  “Not specified” both persist `administrationContext: 'unspecified'`;
- added a manual dose parser (`insulin-quick-add-dose.ts`) accepting at most two
  fractional digits with `.` or `,`, `0 < dose <= 100` as a UI typo guard, and
  no rounding (`12.25` stays `12.25`); canonical domain validity stays
  `> 0`, `<= 500` with no precision policy;
- removed `format-insulin.ts` (`parseInsulinDoseInput` and the unused
  `formatInsulinDose` with `maximumFractionDigits: 1`) and the display-string
  option lists `insulin-preparation-options.ts` / `insulin-context-options.ts`;
- `createSemanticInsulinTimelineEvent` writes `preparationId` and
  `administrationContext`, keeps `source: 'manual'` and `schemaVersion: 1`, and
  never emits `context` or `preparationCategory`;
- added `quick-add.insulin.*` chrome for `en-GB`, `ru-RU`, `uk-UA`, `de-DE`
  reusing the existing insulin catalogue/context/grouping keys.

Не входило:

- awaited IndexedDB save integrity, pending state, dismiss lock, stable retry
  identity — Wave 4D;
- medical API allow-list, kind validation, adoption, OpenAPI, cloud
  create/update, outbox/sync — Wave 4E;
- other Quick Add categories, the shared Quick Add action menu, glucose
  behavior;
- calculator, dose recommendation, IOB, pump, therapy plan, new preparations.

## Wave 4B-II — Insulin Presentation Adapter and Semantic-Safe Timeline Edit

Дата: 2026-08-30

Статус: **Option A** implemented. Shared insulin presentation adapter and
semantic-aware Timeline Edit. No Quick Add, API, OpenAPI, persistence, or
`schemaVersion` change.

Завершено:

- added the `apps/web/lib/medical/insulin` application adapter, consuming the
  Wave 4B-I medical-domain helpers through package-root exports only;
- reader precedence: valid `administrationContext` wins, then the exact
  governed legacy mapping, then unmatched legacy text verbatim, then the
  localized `unspecified` label;
- title always uses the stored `preparation` snapshot; a missing
  `preparationId` stays unmatched and no identity is fabricated;
- grouping chrome comes only from `resolveInsulinPresentationGrouping` and is
  never persisted;
- routed Timeline card/detail/search and Dashboard Recent Events through the
  single shared insulin presentation trajectory;
- replaced generic insulin title/context editing with a discriminated insulin
  edit draft that resolves catalogue identity and display snapshot atomically;
- an explicit semantic context edit writes `administrationContext` and removes
  the contradictory legacy `context`; dose/time-only edits preserve stored
  context and identity fields;
- kept the `0 < dose <= 100` UI typo guard with no silent rounding;
- added EN/RU/UK/DE preparation, context, grouping, and edit chrome; no
  hardcoded Russian labels in the new insulin presentation/edit modules.

Не входит в этот этап:

- 4C localized semantic Quick Add (unblocked only after this PR is approved and
  merged), 4D save integrity, 4E API/adoption/OpenAPI, calculator,
  recommendation, pump, therapy plan, IOB, new brands, database migrations.

Semantic insulin fields remain **not cloud-compatible** until Wave 4E.

---

## Wave 4B-I — Shared Insulin Types and Medical-Domain Foundation

Дата: 2026-08-30

Статус: types + presentation-neutral medical-domain foundation. No UI, API,
OpenAPI, or persistence writer changes.

Завершено:

- added `InsulinPreparationId` and `InsulinAdministrationContext` and optional
  `preparationId` / `administrationContext` on `InsulinTimelineEvent`;
- added `@diabetes-universe/medical-domain` insulin catalogue, grouping
  chrome resolver, canonical 500 IU technical dose validation, context
  guards, exact legacy RU mapping, and `prepareInsulinNewWrite`;
- documented Wave 4E API incompatibility; current allow-list still rejects
  the new fields;
- left `InsulinQuickAddEntry`, Quick Add, Timeline Edit, and OpenAPI
  unchanged.

Не входит в этот этап:

- 4B-II presentation/edit, 4C localized Quick Add, 4D save integrity, 4E
  API/adoption/OpenAPI, calculator/recommendation/pump.

### Hardening (2026-08-30)

- runtime registries are `Object.freeze`d; membership Sets are not public
  exports and cannot be mutated by consumers;
- type and runtime vocabularies are exhaustive via `Record<Union, Metadata>`;
- malformed root input to `prepareInsulinNewWrite` fails closed with
  `insulin.input.invalid` and does not throw.

---

## Wave 4A — Insulin Recording Architecture

Дата: 2026-08-30

Статус: architecture only — **Ready for approval**. No runtime or UI
implementation.

Завершено:

- documented the current insulin Quick Add → semantic event → `addEvent` →
  IndexedDB trajectory and confirmed limitations (free-string preparation and
  context, brand-as-identifier, Russian hardcoded options, demo 0–100 bound,
  fire-and-forget save, no medical-domain foundation);
- defined the target canonical insulin administration contract: catalogue
  `preparationId` plus required display snapshot, IU `doseUnits`, semantic
  `administrationContext`, additive optional fields on `schemaVersion: 1`;
- bound safety invariants: record-only, no dose calculation/recommendation, no
  default or glucose-derived dose, technical validation bounds only;
- specified compatibility for existing `{ preparation, doseUnits, context? }`
  events without destructive startup rewrite;
- planned later slices 4B-I (types/domain), 4B-II (presentation), 4C (Quick
  Add localization), 4D (save integrity) as labels only.

Не входит в этот этап:

- production TypeScript, UI, migrations, OpenAPI, new brands, calculator,
  pump/CGM/therapy, glucose behavior, Wave 4B implementation.

### Remediation (docs only, 2026-08-30)

Corrected Wave 4A after architecture review. No runtime, schema, or OpenAPI
change.

- documented that the current medical API allow-list rejects
  `preparationId` / `administrationContext`; cloud/adoption is not compatible
  until a named Wave 4E slice;
- replaced the invented 1000 IU ceiling with the existing 500 IU server
  technical bound; kept 100 IU as a UI typo guard; separated canonical
  validity from manual two-decimal policy;
- `preparationId` is a catalogue-entry key only; unmatched history omits it;
  `insulin.prep.unmapped` is not an identity;
- `preparationCategory` is not persisted;
- `insulin.prep.other` requires a user-entered name; localized Other is not
  the snapshot;
- new writers always set `administrationContext` (`unspecified` if none);
- Timeline Edit is a hard gate: 4C semantic writes do not ship until Edit is
  semantic-aware or locks those fields.

---

## Wave 3D-IV — Glucose Quick Add Architecture Closure

Дата: 2026-08-30

Статус: closure/remediation wave (docs + regression contract; no new glucose
features).

Завершено:

- reconciled architecture documentation with post–Wave 3D-III production glucose
  Quick Add save path (`prepareGlucoseQuickAddSubmit` → stable event ID → awaited
  `addEventAsync` → IndexedDB → success close);
- corrected stale claims that Quick Add writes legacy `TimelineEvent`, uses
  fire-and-forget glucose persistence, or treats Timeline as in-memory-only demo
  state;
- documented glucose invariants (validate-before-pending, dismiss lock,
  retry identity, Dashboard/Timeline shared contract) in timeline/dashboard
  integration docs, dashboard spec, UI bible, timeline entity doc, and
  `apps/web/README.md`;
- added focused documentation/architecture contract test to prevent regression
  of legacy glucose save descriptions.

Не входит в этот этап:

- API/OpenAPI, schema, cloud sync, outbox, new glucose fields;
- retry framework for non-glucose Quick Add categories;
- Wave 3E or later waves.

---

## P6c — Active Sessions & Account Security Management: Closure Candidate

Дата: 2026-08-13 (обновлено 2026-08-14)

Статус implementation wave:

- P6c-a Identity Core — Accepted & Merged (PR #85)
- P6c-b Web Sessions Surface — Accepted & Merged (PR #86)
- P6c-c E2E / Closure — closure candidate на PR #87; production validation на Vercel завершена; финальный architecture/security audit после merge не выполнен

Завершено в closure candidate (PR #87, HEAD `874f459` + closure work):

- multi-context Playwright coverage, stale-session fixture, regression gates
- Turborepo `build.env` для production auth variables
- production validation: magic-link, sessions UI, remote revoke (desktop ↔ mobile)
- remediation: sessions localization via request locale (global default `en-GB` preserved), proxy stale-cookie redirect-loop fix

Не объявлять **Feature Complete** до post-merge closure acceptance.

Следующий этап:

Финальный P6c architecture/security audit после merge PR #87. OAuth/MFA/sync не начаты.

### Production email (temporary)

До публичного production launch требуется verified custom sending domain в Resend. Текущая production validation использует временный sender `onboarding@resend.dev` — это infrastructure-only, не изменение auth semantics.

---

## P6c — Active Sessions & Account Security Management: Feature Complete (superseded)

Дата: 2026-08-13

Эта секция заменена статусом **Closure Candidate** выше. Feature Complete будет зафиксирован только после post-merge closure acceptance.

## P6b — Passkey Enrollment, Sign-In & Current-Session Sign-Out: Feature Complete

Дата: 2026-08-11

Завершено (architecture + runtime, PR #81 closure HEAD `5c66c3a`):

- passkey enrollment behind `@diabetes-universe/identity` with fresh-session guard
- passkey sign-in on `/auth` with email magic-link fallback
- account-scoped passkey list/add/remove on `/account/security`
- current-session sign-out with server session revocation
- explicit WebAuthn relying-party configuration with fail-closed validation
- auth migrations `0000_auth_foundation.sql` + `0001_passkey_foundation.sql` applied and verified on Neon externally
- auth tables present: `user`, `session`, `account`, `verification`, `passkey`
- Playwright auth baseline **38/38 E2E**
- Timeline/P4 ownership unchanged; no OAuth; no sync

Не входит в этот этап:

- active-session/device listing
- remote session revocation beyond current session
- OAuth/passwords
- Timeline ownership/adoption changes
- backend medical persistence / cloud sync
- P6c sessions/device management

Статус:

**P6b — Passkey Enrollment, Sign-In & Current-Session Sign-Out: Feature Complete**

Следующий этап:

**P6c — Active Sessions & Account Security Management**

## P3 — Semantic Timeline Event Model: Feature Complete

Дата: 2026-08-09

Merge commit: `44ca315` — Merge pull request #67: P3 Semantic Timeline Event
Model (P3a–P3h)

Завершено (P3a–P3h + Final Remediation, merged to `main`):

- canonical `SemanticTimelineEvent` model in `@diabetes-universe/types`
- legacy migration utilities (`liftLegacyToSemantic`, `liftRepositorySnapshot`)
- semantic application store with native repository cutover
- P3d presentation boundary (locale-neutral mapper + i18n labels)
- semantic Quick Add and edit write path (all 6 kinds)
- Dashboard semantic closure (read derivations from semantic fields)
- demo migration closure + preserved legacy fixture
- `TimelineRepositoryEvent = SemanticTimelineEvent` native storage
- 757 unit tests + 29 E2E journeys green on merge commit CI

Статус:

**P3 — Semantic Timeline Event Model: Feature Complete**

Следующий этап:

**P4 — Durable Local Persistence** (architecture design approved for planning;
implementation not started)

## P3 Final Remediation — Documentation & Dead-Surface Cleanup

Дата: 2026-08-09

Завершено:

- reconciled `docs/data/entities/timeline.md` current-state documentation with
  post-P3h semantic repository architecture
- updated stale `SemanticTimelineEvent` type comment in `packages/types`
- removed inert `getMigrationRecord()` from routine `TimelineStoreValue` API
- removed unused legacy `sortTimelineEvents(TimelineEvent[])` helper from
  production timeline utilities
- fixed targeted lint warnings from P3 Final Audit

Не входит в этот этап:

- P3 Feature Complete declaration
- P4 durable persistence
- runtime architecture changes beyond dead-surface removal

Статус:

P3 Final Remediation complete; PR remains Draft

## P3h — Semantic Repository Cutover

Дата: 2026-08-09

Завершено:

- `TimelineRepositoryEvent` cut over to native `SemanticTimelineEvent`
- `InMemoryTimelineRepository` stores semantic records with `occurredAt` + `id`
  ordering
- `TimelineStoreProvider` reads semantic repository snapshots directly (no
  routine `liftRepositorySnapshot()` re-lift)
- removed temporary write projection bridge and `NativeSemanticEventSidecar`
- production demo seed in `apps/web/lib/mocks/timeline.ts` is semantic-native;
  preserved legacy demo fixture retained for migration regression only
- routine store state no longer carries migration sidecar/quarantine state
- `liftLegacyToSemantic()` / `liftRepositorySnapshot()` remain migration/import
  utilities only
- added production-runtime legacy isolation audit test

Не входит в этот этап:

- IndexedDB / SQLite / backend / API / auth / sync / outbox
- P4 durable persistence
- P3 Feature Complete declaration (awaiting Final Audit)

Статус:

P3h — Semantic Repository Cutover complete; PR remains Draft until Final Audit

## P2 Phase C — Timeline Repository Store Integration

Дата: 2026-08-09

Завершено:

- integrated `TimelineStoreProvider` with `TimelineRepository`
- added `apps/web` dependency on `@diabetes-universe/timeline`
- current adapter: `InMemoryTimelineRepository`
- preserved existing Dashboard / Timeline / Quick Add facade methods:
  `addEvent`, `updateEvent`, `deleteEvent`, and `replaceEvents`
- React state now represents loading, ready repository snapshot, and error
  projection state
- added provider integration tests for initialization, mutation delegation,
  missing-ID no-ops, serialization, and unmount safety

Не входит в этот этап:

- durable reload persistence
- IndexedDB
- localStorage persistence
- SQLite
- backend/API
- auth
- sync/outbox/retry/conflict resolution
- semantic TimelineEvent migration
- device integrations
- Dashboard read-model optimization

Статус:

P2 Phase C — Repository Foundation integrated with application store;
current adapter is in-memory only

## ADR-0014 — Local-First Medical Event Persistence Architecture Approved

Дата: 2026-08-09

Завершено:

- ADR-0014 — Local-First Medical Event Persistence Architecture approved via
  Architecture Audit
- lifecycle status advanced from Draft to Approved
- updated [ADR Index](adr/index.md) and [INDEX](INDEX.md)

Не входит в этот этап:

- persistence runtime implementation
- Timeline remains in-memory demo
- IndexedDB not implemented
- backend absent
- auth absent
- sync absent
- device integrations absent
- P2 Repository Foundation not started

Статус:

ADR-0014 — Architecture Approved — Repository Implementation Not Started

## Wave 10 — Documentation Source-of-Truth Remediation

Дата: 2026-08-09

Завершено:

- aligned EB-001 backlog tables with GP-001 and NA-001 Feature Slice Complete status
- separated NA-001 repository completion from production contextual rule registry activation
- updated root, architecture, developer-bible, and apps/web README package and I18N status
- refreshed localization architecture docs (platform foundation vs product-surface migration)
- completed ADR navigation in INDEX (0009–0013); clarified adr/README as pointer to canonical index
- added glossary terms: Feature Slice Complete, Living Backlog, Governed Backlog Item, Candidate Registry Entry
- deprecated legacy design-system stub docs in favor of numbered specifications
- updated Product Bible current milestone vs future ecosystem scope

Не входит в этот этап:

- runtime code changes, NA-001 production registry wiring, Timeline/Quick Add localization,
  Dashboard state wiring, or fixes from Waves 4–9 audits

Статус:

Documentation remediation — Wave 10 complete

## EB-001 — Dependency Type Architecture Refinement Merged

Дата: 2026-08-07

Завершено:

- PR #63 merged into `main`
- recorded that EB-001 Architecture Refinement — Dependency Type is merged into
  the Living Backlog Model
- updated lifecycle documentation in
  [EB-001 — Next Action Engine Epic Backlog](product/dashboard/eb-001-next-action-engine-backlog.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- architecture changes, implementation changes, backlog item modifications,
  GP-001 changes, NA-001 changes, or SD-001 changes

Статус:

EB-001 — Architecture Refinement — Dependency Type merged into Living Backlog Model

## EB-001 — Dependency Type Architecture Refinement

Дата: 2026-08-07

Завершено:

- extended the Governed Backlog Item Contract in
  [EB-001 — Next Action Engine Epic Backlog](product/dashboard/eb-001-next-action-engine-backlog.md)
  with Dependency Type
- defined allowed Dependency Type values: Blocking, Architectural, Optional, and
  Runtime, including the refined Architectural definition for Architecture
  Approval gating
- added the initial usage example: NA-001 depends on GP-001 with Dependency Type
  Blocking
- kept the change as backlog architecture refinement only

Не входит в этот этап:

- changes to GP-001, PR #62, NA-001, SD-001, EA-001, Foundation, or
  implementation code
- runtime dependency modeling or Repository Implementation

Статус:

EB-001 — Architecture Refinement

## NA-001 — Glucose Data Staleness Rule Feature Slice Complete

Дата: 2026-08-07

Завершено:

- PR #60 merged into `main`
- advanced NA-001 lifecycle to Feature Slice Complete
- updated lifecycle status in
  [NA-001 — Glucose Data Staleness Rule](product/dashboard/na-001-glucose-data-staleness-rule.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- architecture changes, implementation changes, new product behavior, GP-001
  changes, or SD-001 resolver/default/fallback changes

Статус:

NA-001 — Feature Slice Complete

## NA-001 — Glucose Data Staleness Rule Final Review

Дата: 2026-08-07

Завершено:

- completed Final Review of the NA-001 Feature Slice against the approved
  architecture, GP-001 Policy contract, SD-001 Engine Foundation, and EA-001 Epic
  Architecture
- verified lifecycle completion through Engineering Review, scope boundaries,
  architecture compliance, GP-001 integration, SD-001 compatibility, rule
  runtime behavior, safety boundaries, repository hygiene, and documentation
  consistency
- updated [NA-001 — Glucose Data Staleness Rule](product/dashboard/na-001-glucose-data-staleness-rule.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- merge, Feature Slice Complete, new functionality, architecture changes, scope
  expansion, GP-001 changes, or SD-001 resolver/default/fallback changes

Статус:

NA-001 — Final Review Complete

## NA-001 — Glucose Data Staleness Rule Engineering Review

Дата: 2026-08-07

Завершено:

- completed Engineering Review of the NA-001 repository implementation against
  the approved NA-001 architecture, GP-001 Policy contract, SD-001 Engine
  Foundation, and EA-001 Epic Architecture
- verified injectable rule factory registration, GP-001 public API consumption,
  rule contract compliance, self-suppression, runtime independence, determinism,
  immutability, explainability identity, SD-001 compatibility, safety
  boundaries, repository structure, tests, and documentation consistency
- updated [NA-001 — Glucose Data Staleness Rule](product/dashboard/na-001-glucose-data-staleness-rule.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- new functionality, architecture changes, scope expansion, GP-001 changes,
  SD-001 resolver/default/fallback changes, Final Review, merge, or Feature Slice
  Complete

Статус:

NA-001 — Engineering Review Ready for Final Review

## NA-001 — Glucose Data Staleness Rule Repository Implementation

Дата: 2026-08-07

Завершено:

- implemented NA-001 as an injectable contextual Next Action rule factory
- consumed only the governed GP-001 Policy Result plus existing SD-001 engine
  context for action availability
- activated only on `attention-required` and suppressed on
  `no-attention-required`, `unavailable`, `indeterminate`, malformed, or
  unsupported Policy Results
- preserved SD-001 resolver/default/fallback ownership and did not register the
  rule globally
- added tests for activation, suppression, determinism, input immutability,
  malformed/unsupported Policy Results, no raw timestamp/glucose access,
  explainability identity, action availability, and SD-001 compatibility
- updated [NA-001 — Glucose Data Staleness Rule](product/dashboard/na-001-glucose-data-staleness-rule.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- medical thresholds, numeric freshness values, glucose interpretation,
  diagnosis, treatment, insulin, dosing, prediction, Dashboard UI,
  localization, GP-001 changes, SD-001 resolver/default/fallback changes, or
  NA-001 Feature Slice Complete

Статус:

NA-001 — Repository Implementation

## NA-001 — GP-001 Dependency Status Update

Дата: 2026-08-07

Завершено:

- rebased PR #60 onto updated `main` after GP-001 reached Feature Slice Complete
- updated NA-001 Repository Implementation dependency status from blocked by
  GP-001 to ready to start
- linked NA-001 to
  [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md)
  as Feature Slice Complete
- updated [INDEX](INDEX.md) and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- NA-001 implementation, architecture changes, policy changes, SD-001 changes, or
  Feature Slice Complete

Статус:

NA-001 — Architecture Approved — Repository Implementation Ready to Start

## GP-001 — Glucose Data Staleness Policy Feature Slice Complete

Дата: 2026-08-07

Завершено:

- PR #62 merged into `main`
- advanced GP-001 lifecycle to Feature Slice Complete
- updated lifecycle status in
  [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- architecture changes, implementation changes, new product behavior, NA-001
  implementation, or additional policy logic

Статус:

GP-001 — Feature Slice Complete

## GP-001 — Glucose Data Staleness Policy Final Review

Дата: 2026-08-07

Завершено:

- completed final repository review for GP-001 before merge
- verified lifecycle completion through Engineering Review with only Feature
  Slice Complete still pending
- verified scope, architecture alignment, public API, runtime behavior,
  dependencies, documentation consistency, and repository structure
- updated lifecycle status in
  [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- merge, branch cleanup, Feature Slice Complete, new functionality,
  architecture expansion, refactoring, or implementation expansion

Статус:

GP-001 — Final Review Complete

## GP-001 — Glucose Data Staleness Policy Engineering Review

Дата: 2026-08-07

Завершено:

- performed complete engineering review of the GP-001 repository implementation
- verified public API, contract compliance, runtime independence, determinism,
  immutability, failure model, outcomes, audit metadata, safety, repository
  structure, tests, and documentation consistency
- corrected malformed policy configuration and malformed evaluation reference
  handling so expected evaluation returns deterministic non-final results
- added focused GP-001 tests for malformed configuration and malformed
  evaluation reference behavior
- updated [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- new product functionality, threshold logic, medical scenarios, Dashboard
  integration, NA-001 integration, Engineering implementation expansion, Final
  Review, Merge, or Feature Slice Complete

Статус:

GP-001 — Engineering Review Ready for Final Review

## GP-001 — Glucose Data Staleness Policy Repository Implementation

Дата: 2026-08-07

Завершено:

- implemented the reusable GP-001 platform Policy contract in
  `@diabetes-universe/platform`
- added public Policy identity, version, outcome, input, result, audit, and
  evaluation contracts
- added a deterministic contract-only evaluator that returns governed
  unavailable/indeterminate outcomes instead of inventing medical thresholds or
  numeric staleness values
- added tests for deterministic behavior, input immutability, identity/version,
  semantic outcomes, unsupported input, unavailable configuration, malformed
  input, indeterminate time semantics, and audit metadata
- updated [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md),
  [INDEX](INDEX.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- actual staleness calculation, numeric policy values, time intervals,
  production decision logic, glucose interpretation, diagnosis, treatment, AI,
  Dashboard integration, or NA-001 integration
- Engineering Review, Final Review, Merge, or Feature Slice Complete

Статус:

GP-001 — Repository Implementation

## GP-001 — Glucose Data Staleness Policy Architecture Approval

Дата: 2026-08-07

Завершено:

- added the informational Known Policy Consumers architecture reference to
  [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md)
- documented NA-001 as the current approved consumer and Timeline, Analytics,
  Reports, AI Services, and Device Integrations as potential future consumers
- clarified that the consumer list does not create implementation dependencies,
  runtime coupling, ownership changes, approval requirements, or Policy contract
  changes
- advanced GP-001 to Architecture Approved with Repository Implementation Not
  Started
- recorded final Architecture Approval verification for policy responsibility,
  source, input, result, time semantics, failure behavior, safety, consumer
  contract, governance, versioning, privacy, implementation gate, and Foundation
  impact
- updated [INDEX](INDEX.md) and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- Repository Implementation, Policy implementation, runtime integration,
  dependency-type modeling, EB-001 refinement, or Feature Slice Complete
- changes to Foundation, SD-001, EA-001, EB-001, NA-001, or PR #60

Статус:

GP-001 — Architecture Approved; Repository Implementation — Not Started

## GP-001 — Glucose Data Staleness Policy Architecture Audit

Дата: 2026-08-06

Завершено:

- performed complete Architecture Audit for
  [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md)
- verified GP-001 as a reusable platform Policy independent from Dashboard, Next
  Action Engine, UI, storage implementation, API payloads, TypeScript models,
  and medical algorithms
- clarified that GP-001 does not assume UTC, device-clock authority, local
  timezone, storage format, database encoding, or API timestamp shape
- clarified cross-consumer obligations for Dashboard, Timeline, Analytics, AI,
  Reports, and future approved modules
- recorded Architecture Audit result, dependency verification, and success
  criteria verification in the GP-001 document
- updated [INDEX](INDEX.md) and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- implementation, code, packages, React, Next.js, UI, localization, storage, APIs,
  TypeScript models, or Policy parameter values
- changes to Foundation, SD-001, EA-001, EB-001, NA-001, or PR #60
- Architecture Approval, Repository Implementation, or Feature Slice Complete

Статус:

GP-001 — Architecture Audit Ready for Review

## GP-001 — Glucose Data Staleness Policy Backlog Qualification and Architecture Draft

Дата: 2026-08-06

Завершено:

- created [GP-001 — Glucose Data Staleness Policy](product/platform/gp-001-glucose-data-staleness-policy.md)
- qualified GP-001 as an Approved Backlog Item in the Platform category
- defined GP-001 as the single governed authority for semantic freshness state
  of an existing glucose record
- documented reusable governed data flow from approved glucose source contract to
  Policy Result to consumers
- defined source boundary, input contract, Policy Result contract, time
  semantics, missing-data boundary, safety, failure behavior, consumer contract,
  versioning, governance, privacy/security, observability, implementation gate,
  and success criteria
- updated [EB-001](product/dashboard/eb-001-next-action-engine-backlog.md) to
  record GP-001 as an approved cross-domain platform dependency for future
  glucose-staleness consumers
- updated [INDEX](INDEX.md), [Documentation README](README.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- implementation, code, TypeScript contracts, storage design, UI, localization,
  Dashboard behavior, Next Action resolution, or SD-001 changes
- numeric staleness intervals, thresholds, tolerances, or algorithms
- glucose value interpretation, diagnosis, treatment, dosing, prediction,
  device-health behavior, AI behavior, or missing-data recommendation behavior
- changes to Foundation, SD-001, EA-001, or PR #60

Статус:

GP-001 — Architecture Draft Ready for Architecture Audit

## NA-001 — Glucose Data Staleness Rule Architecture Approval

Дата: 2026-08-06

Завершено:

- performed Architecture Approval review against nine approval criteria
- approved NA-001 as the official implementation contract for a future contextual
  rule, with Policy dependency preserved
- added Source Boundary and missing-data scope clarification
- recorded Architecture Approval decision and verification table
- lifecycle advanced to Architecture Approved — Repository Implementation Blocked
- updated [INDEX](INDEX.md) and [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- Repository Implementation, code, UI, localization, or Policy approval
- Glucose Data Staleness Policy definition or approval
- changes to Foundation, SD-001, EA-001, or EB-001
- Feature Slice Complete

Статус:

NA-001 — Architecture Approved — Repository Implementation Blocked

## NA-001 — Glucose Data Staleness Rule Architecture Revision

Дата: 2026-08-06

Завершено:

- revised NA-001 against the EA-001 Standard Rule Contract after PR #61 merge
- defined policy boundary: approved glucose source contract → Glucose Data
  Staleness Policy → governed policy evaluation result → NA-001 → SD-001
- added implementation gate: architecture may proceed; Repository Implementation
  blocked until policy is approved with contracts, owner, governance, and source
  data
- separated stale data from missing data: NA-001 evaluates existing records only
- defined architecture-level policy result contract without intervals,
  thresholds, or algorithms
- updated lifecycle to Architecture Revision Ready for Re-Audit
- recorded Standard Rule Contract compliance verification (EA-001 §7.1–7.10)
- updated [INDEX](INDEX.md) and [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- implementation, code, UI, localization, algorithms, intervals, timing values,
  medical thresholds, treatment recommendations, diagnosis, reminders, device
  behavior, AI behavior, personalization, or prediction
- Glucose Data Staleness Policy approval
- changes to Foundation, SD-001, EA-001, or EB-001

Статус:

NA-001 — Architecture Revision Ready for Re-Audit

## EA-001 — Standard Rule Contract Architecture Refinement

Дата: 2026-08-05

Завершено:

- added the Architecture Refinement Principle to
  [01 Project Development Specification](project/01-project-development-specification.md)
- extended EA-001 with the Standard Rule Contract for future Next Action Engine
  rules
- defined mandatory generic contract areas: metadata, purpose, inputs,
  activation, suppression, decision output, explainability, safety,
  dependencies, and testing expectations
- classified the EA-001 Standard Rule Contract update as Architecture Refinement,
  not a new Feature Slice or lifecycle restart
- preserved EA-001 Feature Slice Complete lifecycle status

Не входит в этот этап:

- SD-001, EB-001, NA-001, or Foundation changes
- implementation, algorithms, thresholds, UI, localization, React, TypeScript,
  or concrete rule examples

Статус:

EA-001 — Feature Slice Complete

## NA-001 — Glucose Data Staleness Rule Architecture Draft

Дата: 2026-08-05

Завершено:

- advanced NA-001 from Approved Backlog Item to Architecture Draft
- defined purpose, scope, dependencies, input, activation, suppression, decision,
  explainability, safety, failure behavior, testing requirements, and future
  evolution
- preserved SD-001 resolver ownership and compatibility/default behavior
- kept future Glucose Data Staleness Policy as a required unapproved dependency

Не входит в этот этап:

- implementation, code, UI, localization, algorithms, intervals, timing values,
  medical thresholds, treatment recommendations, diagnosis, reminders, device
  behavior, AI behavior, personalization, or prediction
- changes to Foundation, SD-001, EA-001, or EB-001

Статус:

NA-001 — Architecture Draft

## EB-001 — Next Action Engine Epic Backlog Foundation Complete

Дата: 2026-08-05

Завершено:

- PR #59 merged into `main` (merge commit `af54e93`)
- EB-001 became the living product-management backlog for the Next Action Engine
  Epic
- lifecycle advanced to Backlog Foundation Complete with Operational Status:
  Living

Статус:

EB-001 — Backlog Foundation Complete — Operational Status: Living

## NA-001 — Glucose Data Staleness Rule Backlog Qualification

Дата: 2026-08-05

Завершено:

- created `docs/product/dashboard/na-001-glucose-data-staleness-rule.md`
- qualified NA-001 as an Approved Backlog Item
- updated EB-001 to preserve NA-001 in the Candidate Registry as `Qualified`
  while also recording it as an Approved Backlog Item
- recorded item-specific dependency on future approved Glucose Data Staleness
  Policy
- updated [INDEX](INDEX.md) and [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- architecture draft
- implementation
- algorithms, thresholds, time values, rule logic, UI, reminders, AI, devices,
  or predictions

Статус:

NA-001 — Approved Backlog Item

## EB-001 — Next Action Engine Epic Backlog Foundation Approval

Дата: 2026-08-05

Завершено:

- completed final approval audit of the EB-001 backlog management model
- corrected planning hierarchy terminology across Candidate Registry Entries,
  Backlog Qualification, Governed Backlog Items, Feature Slices, and the Project
  Development Lifecycle
- corrected Evolution Rules to operate on candidates and governed backlog items
  rather than treating every planning record as an active Feature Slice
- lifecycle advanced to Backlog Foundation Approved with Operational Status —
  Living

Статус:

EB-001 — Backlog Foundation Approved — Operational Status Living

## EB-001 — Next Action Engine Epic Backlog Foundation Revision

Дата: 2026-08-05

Завершено:

- separated Candidate Registry Entries from Governed Backlog Items
- added Backlog Qualification gate before `Proposed → Approved`
- clarified status transitions for Deferred, Rejected, and Feature Complete
- separated inherited dependencies from item-specific dependencies
- clarified the living document lifecycle and operational backlog model
- updated success criteria so compact initial entries use the Candidate Registry
  contract while Approved and later items use the Governed Backlog Item contract

Статус:

EB-001 — Backlog Foundation Revision Ready for Re-Review

## EA-001 — Next Action Engine Epic Architecture Feature Slice Complete

Дата: 2026-08-05

Завершено:

- PR #58 merged into `main` (merge commit `d11975b`)
- EA-001 became the official product architecture for the Dashboard Next Action
  Engine Epic
- lifecycle advanced to Feature Slice Complete

Статус:

EA-001 — Feature Slice Complete

## EB-001 — Next Action Engine Epic Backlog v1.0

Дата: 2026-08-05

Завершено:

- created `docs/product/dashboard/eb-001-next-action-engine-backlog.md`
- normalized EB-001 onto `main` after EA-001 completion
- established EB-001 as the single product-management planning source for the
  Next Action Engine Epic
- defined backlog categories, item contract, status model, priority model,
  ownership, dependency rules, Foundation-change gate, evolution rules, initial
  named backlog, expansion governance, and success criteria
- added Backlog Governance for item creation, approval, priority changes,
  Deferred, Rejected, archival, and duplicates
- updated [INDEX](INDEX.md), [Documentation README](README.md), and
  [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- architecture changes
- implementation plans
- rule specifications
- roadmap ordering
- code, UI, medical algorithms, or AI algorithms

Статус:

EB-001 — Backlog Foundation Ready for Review

## EA-001 — Next Action Engine Epic Architecture Approval

Дата: 2026-08-05

Завершено:

- completed final architecture approval review of EA-001
- confirmed EA-001 defines only the Next Action Engine Epic product model
- confirmed SD-001 remains the technical engine foundation and future NA-xxx
  Feature Slices own individual rule definitions
- lifecycle advanced to Architecture Approved

Статус:

EA-001 — Architecture Approved

## EA-001 — Next Action Engine Epic Architecture Audit

Дата: 2026-08-05

Завершено:

- completed architecture audit of EA-001 against SD-001, Dashboard architecture,
  project governance, engineering standards, product architecture, and design
  system references
- clarified that future contextual rule self-suppression does not change SD-001
  compatibility/default or neutral fallback behavior
- added source-domain governance for future Device, Reminder, Medical records,
  AI, Notification, and similar inputs
- added explicit dependencies for architecture traceability

Статус:

EA-001 — Architecture Audit Ready for Review

## EA-001 — Next Action Engine Epic Architecture Draft

Дата: 2026-08-05

Завершено:

- created `docs/architecture/dashboard/ea-001-next-action-engine-epic-architecture.md`
- defined product-level purpose, principles, UX goals, scope, taxonomy, rule
  lifecycle, rule contract, conflict principles, explainability, safety classes,
  ownership model, extensibility, testing expectations, and future directions
- documented EA-001 as above SD-001 without duplicating or changing the SD-001
  engine foundation
- updated [INDEX](INDEX.md) and [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- implementation changes
- specific Next Action rules
- medical thresholds, reminder logic, device logic, or AI logic
- Feature Slice implementation

Статус:

EA-001 — Architecture Draft Ready for Architecture Audit

## SD-001 — Next Action Engine Foundation Feature Slice Complete

Дата: 2026-08-05

Завершено:

- PR #56 merged into `main` (merge commit `602589b`)
- deterministic Next Action Engine Foundation shipped with empty contextual rule
  registry and insulin Quick Add parity preserved
- lifecycle advanced to Feature Slice Complete

Статус:

SD-001 — Feature Slice Complete

## SD-001 — Next Action Engine Foundation Final Review Preparation

Дата: 2026-08-05

Завершено:

- lifecycle status advanced to Architecture Approved — Final Review
- final implementation audit confirms empty contextual registry, governed
  compatibility/default, governed neutral fallback, deterministic priority
  resolution, and no clinical/contextual behavior in SD-001
- validation, visual parity verification, and PR readiness evidence prepared for
  Final Review

Статус:

SD-001 — Ready for Final Review

## SD-001 — Next Action Engine Foundation Engineering Revision

Дата: 2026-08-05

Завершено:

- single source of rule priority: `NextActionRule` owns ranking; evaluate returns payload only
- discriminated `NextActionMappedPresentation` union (quick-add / navigate / none)
- typed localization resolvers without unsafe `as NextStep` cast
- direct `mapNeutralFallbackPresentation()` without synthetic `Date(0)` context
- single governed category source: `DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES`

Статус:

SD-001 — Engineering Revision Ready for Re-Review

## SD-001 — Next Action Engine Foundation Repository Implementation

Дата: 2026-08-05

Завершено:

- production engine в `apps/web/lib/dashboard/next-action/`
- empty contextual rule registry; compatibility/default insulin Quick Add
- neutral fallback localization keys (`dashboard.nextAction.fallback.*`)
- DashboardRoot migration: engine → mapper → `resolveNextActionPresentation`
- retirement `nextStepSource` mock supply и `resolveDashboardNextActionDemoStep`
- unit tests: engine, priority mapping, determinism, integration parity

Статус:

SD-001 — Repository Implementation Ready for Engineering Review

## SD-001 — Next Action Engine Foundation Architecture Revision

Дата: 2026-08-05

Завершено:

- пересмотр scope SD-001: engine-foundation slice, не product-behavior dynamic selection
- разделение contextual rules / compatibility-default / neutral fallback
- exhaustive priority mapping (`NextActionPriority` → `NextStepPriority`)
- документ переименован: `sd-001-next-action-engine-foundation.md`
- обновлены [INDEX](INDEX.md), module README, [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Ключевые решения:

- SD-001 не предоставляет clinically/contextually dynamic selection
- insulin Quick Add — compatibility/default decision, не contextual rule
- neutral fallback только когда default нельзя безопасно показать
- contextual rule registry пуст в initial implementation

Статус:

SD-001 — Architecture Revision Ready for Re-Audit

## SD-001 — Dynamic Next Action Architecture Draft

Дата: 2026-08-05

Завершено:

- Feature Slice SD-001 — Architecture Draft для deterministic Dynamic Next Action
- документ `docs/architecture/dashboard/sd-001-dynamic-next-action.md`
- module boundary README `apps/web/lib/dashboard/next-action/README.md`
- обновлены [INDEX](INDEX.md), [Dashboard Next Action Architecture](architecture/dashboard/next-action.md)

Не входит в этот этап:

- production engine implementation;
- новые правила без approved data;
- Feature Complete (ожидает Architecture Audit и Approval)

Статус:

SD-001 — Architecture Draft Ready for Architecture Audit

## Motion System Specification — Feature Complete

Дата: 2026-08-05

Завершено:

- документ `20 Motion System Specification` — `docs/design-system/20-motion-system-specification.md`
- статус: **Feature Complete**
- merge PR #55; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Motion System Specification (document 20) — Feature Complete ✅

## Motion System Specification — Architecture Approved

Дата: 2026-08-05

Завершено:

- документ `20 Motion System Specification` — `docs/design-system/20-motion-system-specification.md`
- статус: **Architecture Approved**
- motion philosophy, category architecture, motion roles, communication principles, information hierarchy, accessibility, internationalization, theme compatibility, design token integration, evolution, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- animation durations, easing curves, CSS, motion libraries, implementation
- Feature Complete (ожидает Final Architecture Review)

Статус:

Motion System Specification (document 20) — **Architecture Approved** — Ready for Final Architecture Review

## Illustration System Specification — Feature Complete

Дата: 2026-08-05

Завершено:

- документ `19 Illustration System Specification` — `docs/design-system/19-illustration-system-specification.md`
- статус: **Feature Complete**
- merge PR #54; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Illustration System Specification (document 19) — Feature Complete ✅

## Illustration System Specification — Architecture Approved

Дата: 2026-08-05

Завершено:

- документ `19 Illustration System Specification` — `docs/design-system/19-illustration-system-specification.md`
- статус: **Architecture Approved**
- illustration philosophy, category architecture, illustration roles, communication principles, information hierarchy, accessibility, internationalization, theme compatibility, design token integration, evolution, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- illustrations, artwork, colors, style guides, implementation
- Feature Complete (ожидает Final Architecture Review)

Статус:

Illustration System Specification (document 19) — **Architecture Approved** — Ready for Final Architecture Review

## Iconography System Specification — Feature Complete

Дата: 2026-08-05

Завершено:

- документ `18 Iconography System Specification` — `docs/design-system/18-iconography-system-specification.md`
- статус: **Feature Complete**
- merge PR #53; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Iconography System Specification (document 18) — Feature Complete ✅

## Iconography System Specification — Architecture Approved

Дата: 2026-08-05

Завершено:

- документ `18 Iconography System Specification` — `docs/design-system/18-iconography-system-specification.md`
- статус: **Architecture Approved**
- iconography philosophy, category architecture, icon roles, recognition principles, information hierarchy, accessibility, internationalization, theme compatibility, design token integration, evolution, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- SVG assets, icon libraries, sizes, stroke widths, implementation
- Feature Complete (ожидает Final Architecture Review)

Статус:

Iconography System Specification (document 18) — **Architecture Approved** — Ready for Final Architecture Review

## Typography System Specification — Feature Complete

Дата: 2026-08-05

Завершено:

- документ `17 Typography System Specification` — `docs/design-system/17-typography-system-specification.md`
- статус: **Feature Complete**
- merge PR #52; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Typography System Specification (document 17) — Feature Complete ✅

## Typography System Specification — Architecture Approved

Дата: 2026-08-05

Завершено:

- документ `17 Typography System Specification` — `docs/design-system/17-typography-system-specification.md`
- статус: **Architecture Approved**
- typography philosophy, role hierarchy, numeric typography, information hierarchy, reading experience, internationalization, accessibility, theme compatibility, design token integration, evolution, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- font family selection, type scales, px/rem values, CSS, Tailwind config, token values, implementation
- Feature Complete (ожидает Final Architecture Review)

Статус:

Typography System Specification (document 17) — **Architecture Approved** — Ready for Final Architecture Review

## Foundation Freeze — Feature Complete

Дата: 2026-08-05

Завершено:

- merge PR #47 в `main` (merge commit `575e4de`)
- Foundation v1.0: engineering, documentation, design system, product, and repository hygiene gates passed
- удалена ветка `cursor/repo-hygiene-audit-0174`

Статус:

Foundation v1.0 — Feature Complete ✅

## Foundation Freeze Remediation — Lifecycle Synchronization

Дата: 2026-08-05

Завершено:

- синхронизированы lifecycle-статусы документов 00, 02, 04–12 с [INDEX](INDEX.md) → **Feature Complete**
- добавлены `LICENSE` (proprietary notice) и `.env.example` (empty environment contract)
- обновлены root [README](../README.md) и [Developer Bible](developer-bible/README.md): `pnpm test`, стандартная validation sequence
- синхронизированы metadata descriptions (Dashboard, Timeline, layout, PWA manifest)
- CI: markdown link validation; job name отражает все проверки
- разрешены конфликты PR #47 с `main` (сохранены doc 16 Feature Complete и engineering remediation)

Статус:

Foundation Freeze Remediation — Ready for Final Foundation Freeze Audit

## Repository Hygiene and Quality Audit Corrections

Дата: 2026-08-05

Завершено:

- закрыт superseded PR #44; удалена ветка `cursor/official-app-icon-assets-0174`
- исправлены broken internal links в `docs/architecture/README.md`, `docs/specs/dashboard/next-action.md`
- добавлен `pnpm test` в root CI pipeline (`turbo run test`)
- PWA icon matrix: `app-icon-192.png`, `app-icon-512.png`, `app-icon-maskable-512.png`, `apple-touch-icon-180.png`
- единый English baseline description в Next.js metadata и PWA manifest
- добавлен `.github/dependabot.yml` (pnpm + GitHub Actions, weekly)
- добавлен `scripts/validate-markdown-links.py`

Статус:

Repository Hygiene and Quality Audit Corrections — Ready for Final Repository Audit

## Color System Specification — Feature Complete

Дата: 2026-08-05

Завершено:

- документ `16 Color System Specification` — `docs/design-system/16-color-system-specification.md`
- статус: **Feature Complete**
- merge PR #48; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Color System Specification (document 16) — Feature Complete ✅

## Color System Specification — Architecture Approved

Дата: 2026-08-05

Завершено:

- документ `16 Color System Specification` — `docs/design-system/16-color-system-specification.md`
- статус: **Architecture Approved**
- color philosophy, role hierarchy, brand/neutral/semantic/surface/content/border/overlay architecture, interactive states, theme architecture (Light, Dark, High Contrast, AMOLED, Print), accessibility, internationalization, design token integration, evolution, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- palettes, HEX/RGB/HSL values, CSS variables, Tailwind config, theme implementation, token values
- Feature Complete (ожидает Final Architecture Review)

Статус:

Color System Specification (document 16) — **Architecture Approved** — Ready for Final Architecture Review

## Brand Symbol Integration — Feature Complete

Дата: 2026-08-04

Завершено:

- интеграция approved DU + DNA Brand Symbol в web-приложение
- `BrandSymbol` component: Dashboard Header, Timeline Top Bar
- favicon, Apple Touch Icon, PWA manifest, Next.js metadata
- production assets: `apps/web/public/brand/app-icon/`
- удалены временные DU-плейсхолдеры
- merge PR #46

Статус:

Brand Symbol Integration — Feature Complete ✅

## Brand Logo System Specification — Feature Complete

Дата: 2026-08-04

Завершено:

- документ `15 Brand Logo System Specification` — `docs/design-system/15-brand-logo-system-specification.md`
- статус: **Feature Complete**
- merge PR #45; обновлены [INDEX](INDEX.md), статус документа в спецификации

Статус:

Brand Logo System Specification (document 15) — Feature Complete ✅

## Brand Logo System Specification — Architecture Approved

Дата: 2026-08-04

Завершено:

- документ `15 Brand Logo System Specification` — `docs/design-system/15-brand-logo-system-specification.md`
- статус: **Architecture Approved**
- logo philosophy, logo system (Brand Symbol, Primary, Horizontal, Vertical, Symbol-only), wordmark architecture, composition rules, clear space, minimum size principles, color architecture, background compatibility, accessibility, internationalization, asset architecture, versioning, governance, future evolution
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- logo artwork, typography selection, production colors, SVG, PNG, PDF exports, implementation
- Feature Complete (ожидает Final Architecture Review)

Статус:

Brand Logo System Specification (document 15) — **Architecture Approved** — Ready for Final Architecture Review

## App Icon Architecture Specification — Feature Complete

Дата: 2026-08-04

Завершено:

- документ `14 App Icon Architecture Specification` — `docs/design-system/14-app-icon-architecture-specification.md`
- статус: **Feature Complete**
- app icon philosophy, platform scope, Brand Symbol integration, composition, background, shape, scalability, recognition, accessibility, internationalization, motion compatibility, production principles, validation criteria, governance, future evolution
- merge PR #43; обновлены [INDEX](INDEX.md), статус документа в спецификации

Не входит в этот этап:

- icon artwork, mockups, colors, typography, SVG, PNG, implementation
- документ 15 и последующие

Статус:

App Icon Architecture Specification (document 14) — Feature Complete ✅

## App Icon Architecture Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `14 App Icon Architecture Specification` — `docs/design-system/14-app-icon-architecture-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- app icon philosophy, platform scope, Brand Symbol integration, composition, background, shape, scalability, recognition, accessibility, internationalization, motion compatibility, production principles, validation criteria, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [design-system README](design-system/README.md), [glossary](project/glossary.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- icon artwork, mockups, colors, typography, SVG, PNG, implementation
- документ 15 и последующие
- изменения documents 00–13

Статус:

App Icon Architecture Specification (document 14) — Architecture Approved

## DU Standard Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `13 DU Standard Specification` — `docs/project/13-du-standard-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- DU Standard purpose, objectives, scope, core philosophy, twelve DU Principles, design/product/architecture/engineering/AI/accessibility/security/performance review criteria, certification levels, 100-point DU Score model, review workflow, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [glossary](project/glossary.md)
- статус документа 12 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- coding standards, implementation details, изменения documents 00–12
- документ 14 и последующие

Статус:

DU Standard Specification (document 13) — Architecture Approved

## UI Component Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `12 UI Component Specification` — `docs/design-system/12-ui-component-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- component architecture objectives, token-to-feature relationships, component principles, four-level hierarchy, foundation, input, navigation, feedback, data display, medical, AI, overlay, layout, and chart component categories, mandatory states, accessibility, internationalization, cross-platform principles, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [glossary](project/glossary.md)
- статус документа 11 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- React, SwiftUI, Compose implementation, Storybook, component code, screen implementation, production assets
- документ 13 и последующие
- изменения documents 05–11

Статус:

UI Component Specification (document 12) — Architecture Approved

## Design Tokens Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `11 Design Tokens Specification` — `docs/design-system/11-design-tokens-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- token architecture objectives, three-layer hierarchy (foundation, semantic, component), naming principles, foundation and semantic token categories, component token consumption, color, typography, spacing, radius, border, elevation, motion, breakpoint, grid, medical, AI, and theme token architectures, versioning, cross-platform mapping, accessibility, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md), [glossary](project/glossary.md)
- статус документа 10 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- production token files, JSON exports, Figma variables, component APIs, UI implementation
- документ 12 и последующие
- изменения documents 05–10

Статус:

Design Tokens Specification (document 11) — Architecture Approved

## Visual Design System Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `10 Visual Design System Specification` — `docs/design-system/10-visual-design-system-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- design system objectives, principles, platform scope, architecture layers, foundation and semantic token categories, layout, typography, color, spacing, shape, border, elevation, motion, medical and AI interface principles, status treatment, themes, responsiveness, accessibility, internationalization, cross-platform consistency, governance
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- статус документа 09 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- final design-token values, production token files, component APIs, UI implementation
- документ 11 и последующие
- изменения documents 05–09

Статус:

Visual Design System Specification (document 10) — Architecture Approved

## Brand Book — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `09 Brand Book` — `docs/brand/09-brand-book.md`
- статус: **Architecture Approved** (Repository Implementation)
- brand overview, strategy summary, brand DNA, personality, positioning, visual philosophy, logo architecture summary, brand identity summary, brand governance summary, usage principles, tone of voice summary, accessibility summary, internationalization summary, brand do & don't, documentation references, version history (Brand Book v1.0)
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- статус документа 08 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- логотип, SVG, цвета, шрифты, иконки, иллюстрации, фотографии
- документ 10 и последующие

Статус:

Brand Book (document 09) — Architecture Approved

## Brand Governance Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `08 Brand Governance Specification` — `docs/brand/08-brand-governance-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- governance objectives, brand ownership, decision authority, brand change management, brand versioning, review process, approval process, brand asset management, usage compliance, exception management, deprecation policy, documentation requirements, audit requirements
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- статус документа 07 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- изменения documents 05–07, Brand Book
- документ 09 и последующие

Статус:

Brand Governance Specification (document 08) — Architecture Approved

## Brand Identity Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `07 Brand Identity Specification` — `docs/brand/07-brand-identity-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- brand identity principles, color strategy, typography strategy, iconography, illustration, photography, motion, tone of voice, writing principles, accessibility, internationalization, brand asset hierarchy, digital and print usage principles, consistency rules, prohibited identity directions
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- статус документа 06 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- HEX/RGB, шрифты, иконки, иллюстрации, фотографии, UI
- документ 08 и последующие

Статус:

Brand Identity Specification (document 07) — Architecture Approved

## Logo Architecture Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `06 Logo Architecture Specification` — `docs/brand/06-logo-architecture-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- objectives, design principles, mandatory logo requirements, evaluation criteria, rejection criteria, three concept directions (Universe, Orbit, DU Symbol), development and evaluation workflows, scalability, digital, animation, accessibility, brand consistency rules, prohibited directions
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- статус документа 05 в INDEX обновлён на **Feature Complete**

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- логотип, SVG, изображения, App Icon, выбор победившей концепции
- документ 07 и последующие

Статус:

Logo Architecture Specification (document 06) — Architecture Approved

## Brand Architecture Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `05 Brand Architecture Specification` — `docs/brand/05-brand-architecture-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- strategic brand objective, immutable brand decisions, mission, vision, values, positioning, promise, target audiences, personality, archetype, emotional territory, differentiation, communication principles, visual philosophy, scaling principles, distinctive brand assets principles, internationalization, accessibility, trust and safety, quality criteria, prohibited brand directions
- создана директория `docs/brand/`
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- логотип, SVG, цвета, шрифты, App Icon, UI-компоненты
- документ 06 и последующие
- дублирование Product Architecture

Статус:

Brand Architecture Specification (document 05) — Architecture Approved

## Product Architecture Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `04 Product Architecture Specification` — `docs/project/04-product-architecture-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- product vision, scope, principles, ecosystem, modules, module responsibilities, user roles, product boundaries, scalability principles, product success criteria
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)
- реализация planned modules (Analytics, AI, Recipes, Encyclopedia, Marketplace, Reminders, My Health, Reports, Settings)
- дублирование governance и engineering lifecycle из documents 01–03

Статус:

Product Architecture Specification (document 04) — Architecture Approved

## Project Constitution — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `00 Project Constitution` — `docs/project/00-project-constitution.md`
- статус: **Architecture Approved** (Repository Implementation)
- vision, mission, project scope, core principles, decision-making framework, roles and authority, priority hierarchy, architecture principles, quality principles, governance principles, amendment policy
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review и Merge)

Статус:

Project Constitution (document 00) — Architecture Approved

## Engineering Standards Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `03 Engineering Standards Specification` — `docs/project/03-engineering-standards-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- engineering principles, repository standards, naming conventions, code standards, validation standards, ADR format, technical debt management
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review)
- `00 Project Constitution`
- дублирование полного Git/governance lifecycle из documents 01–02

Статус:

Engineering Standards Specification (document 03) — Architecture Approved

## Project Governance Specification — Architecture Approved

Дата: 2026-08-03

Завершено:

- документ `02 Project Governance Specification` — `docs/project/02-project-governance-specification.md`
- статус: **Architecture Approved** (Repository Implementation)
- governance principles, documentation hierarchy, change management lifecycle, versioning policy, exception management, specification lifecycle rules
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- перекрёстные ссылки на [01 Project Development Specification](project/01-project-development-specification.md) и [Project Rules](project/project-rules.md)

Не входит в этот этап:

- Feature Complete (ожидает Final Architecture Review)
- `00 Project Constitution`
- `03 Engineering Standards Specification`
- формат ADR
- дублирование Git workflow и CI/CD из document 01

Статус:

Project Governance Specification (document 02) — Architecture Approved

## Project Development Specification — Feature Complete

Дата: 2026-08-03

Завершено:

- документ `01 Project Development Specification` — `docs/project/01-project-development-specification.md`
- утверждённый ADD lifecycle, Feature Complete criteria, и repository implementation process
- [Development Standard](project/development-standard.md)
- [Documentation Standard](project/documentation-standard.md)
- [Project Rules](project/project-rules.md)
- обновлены [INDEX](INDEX.md), [docs README](README.md), root [README](../README.md)
- link и formatting validation

Не входит в этот этап:

- Vision, Principles, Roadmap (следующие документы утверждённой последовательности)
- изменение архитектуры существующих модулей
- product/feature спецификации вне document 01

Статус:

Project Development Specification (TASK-001 / document 01) — Feature Complete ✅

## Dashboard AI Insight Localization — Feature Complete

Дата: 2026-08-03

Завершено:

- Dashboard AI Insight Localization Migration (I18N-02B5) — `apps/web/components/dashboard/dashboard-ai-insight*`
- шестой и финальный вертикальный Dashboard migration slice: `useLocalization()` (block labels) + `useFormatter()` (container)
- English canonical `dashboard.aiInsight.*` keys (9) в `@diabetes-universe/locales`
- display time via single `PlatformFormatter.formatTime()` call at `dashboard-root` → `prepareDashboardAiInsightPresentation` boundary
- related-events count via `PlatformFormatter.formatNumber()` only when `count > 0`; zero-state via `dashboard.aiInsight.relatedEvents.none` (no ICU)
- `generatedAt` as canonical ISO input; `displayTime` and `relatedEventsLabel` as precomposed presentation strings
- medical-safety guard (`containsForbiddenAiInsightContent`) unchanged; checks only `title` + `summary`
- `DashboardAiInsightEngine.generateInsight()` runtime signature unchanged
- transitional pass-through for `title` and `summary`
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, presentation, integration, resource, and E2E coverage (`dashboard-ai-insight-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #28 (`63cbc4f` → `8556d32` on `main`)
- web tests: 381 total; E2E: 29 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — Feature Complete)
- Dashboard Next Action (I18N-02B1 — Feature Complete)
- Dashboard Last Glucose (I18N-02B2 — Feature Complete)
- Dashboard Day Summary (I18N-02B3 — Feature Complete)
- Dashboard Recent Events (I18N-02B4 — Feature Complete)
- финальный Dashboard localization audit (I18N-02B6+)
- Timeline и Quick Add product source migration
- AI Engine implementation
- ICU MessageFormat interpolation
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- route-aware preload orchestration

Статус:

Dashboard AI Insight Localization (I18N-02B5) — Feature Complete ✅

## Dashboard Recent Events Localization — Feature Complete

Дата: 2026-08-03

Завершено:

- Dashboard Recent Events Localization Migration (I18N-02B4) — `apps/web/components/dashboard/dashboard-recent-events*`
- пятый вертикальный Dashboard migration slice: `useLocalization()` (block chrome, state labels, category subtitles) + `useFormatter()` (container)
- English canonical `dashboard.recentEvents.*` keys (10) в `@diabetes-universe/locales`
- display time via single `PlatformFormatter.formatTime()` call at `dashboard-root` → `deriveDashboardRecentEventSources` boundary
- Dashboard-only formatter derivation layer (`dashboard-recent-events-derivation.ts`); `timeline-selectors.ts` unchanged vs `main`
- two-stage selector pipeline preserved: derivation sort/filter/limit → `selectDashboardRecentEvents()` latest-per-category, sort desc, limit 4
- transitional pass-through for `title`, `context`, `value`, `unit`; glucose/note excluded from Recent Events derivation
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-recent-events-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #27 (`d49f38e` → `52b26ce` on `main`)
- web tests: 364 total; E2E: 27 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — Feature Complete)
- Dashboard Next Action (I18N-02B1 — Feature Complete)
- Dashboard Last Glucose (I18N-02B2 — Feature Complete)
- Dashboard Day Summary (I18N-02B3 — Feature Complete)
- AI Insight (I18N-02B5+)
- Timeline и Quick Add product source migration
- `formatMeasurement()` / structural measurement contract
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Recent Events Localization (I18N-02B4) — Feature Complete ✅

## Dashboard Day Summary Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Day Summary Localization Migration (I18N-02B3) — `apps/web/components/dashboard/dashboard-day-summary*`
- четвёртый вертикальный Dashboard migration slice: `useLocalization()` (labels) + `useFormatter()` (counters + container date)
- English canonical `dashboard.daySummary.*` keys (11) в `@diabetes-universe/locales`
- display day label via single `PlatformFormatter.formatDate()` call at `dashboard-root` → `deriveDaySummary` boundary
- integer counters via `PlatformFormatter.formatNumber()` (glucose, medication, reminders)
- transitional insulin/carbohydrate totals pass-through (no `formatMeasurement()`)
- day-boundary semantics preserved (`getTodayTimelineEvents`, `isSameLocalDay`, `getTimelineCalendarDateKey`)
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-day-summary-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #25 (`9794c88` → `4140bda` on `main`)
- web tests: 342 total; E2E: 26 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — Feature Complete)
- Dashboard Next Action (I18N-02B1 — Feature Complete)
- Dashboard Last Glucose (I18N-02B2 — Feature Complete)
- Recent Events, AI Insight (I18N-02B4+)
- Timeline и Quick Add product source migration
- `formatMeasurement()` / structural measurement contract
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Day Summary Localization (I18N-02B3) — Feature Complete ✅

## Dashboard Last Glucose Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Last Glucose Localization Migration (I18N-02B2) — `apps/web/components/dashboard/dashboard-last-glucose*`
- третий вертикальный Dashboard migration slice: `useLocalization()` (view) + `useFormatter()` (container)
- English canonical `dashboard.lastGlucose.*` keys (7) в `@diabetes-universe/locales`
- display time via single `PlatformFormatter.formatTime()` call at `dashboard-root` → `deriveLastGlucose` boundary
- transitional glucose value contract: `TimelineEvent.value` pass-through (no `formatMeasurement()`)
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-last-glucose-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #24 (`5bf6925` → `ef9a7e0` on `main`)
- web tests: 326 total; E2E: 25 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — Feature Complete)
- Dashboard Next Action (I18N-02B1 — Feature Complete)
- Dashboard Day Summary (I18N-02B3 — Feature Complete)
- Recent Events, AI Insight (I18N-02B4+)
- Timeline и Quick Add product source migration
- `formatMeasurement()` / structural glucose contract
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Last Glucose Localization (I18N-02B2) — Feature Complete ✅

## Dashboard Next Action Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Next Action Localization Migration (I18N-02B1) — `apps/web/components/dashboard/dashboard-next-action*`
- второй вертикальный Dashboard migration slice на `useLocalization()`
- structural `NextStepSource` demo data (`type: 'insulin'`, `priority: 'high'`) без presentation strings в mocks
- localized presentation via `resolveDashboardNextActionDemoStep()` в container boundary
- English canonical `dashboard.nextAction.*` keys (8) в `@diabetes-universe/locales`
- additive product contract: `NextStepSource`, `NextStepActionType`, `NextStepPriority` в `@diabetes-universe/types`
- pure presentation model boundary; preload без изменений (`common` + `dashboard`)
- unit, integration, resource, and E2E coverage (`dashboard-next-action-i18n.spec.ts`)
- architecture documentation и Engineering Audit
- squash merge: PR #23 (`88308ee` → `2679af8` on `main`)
- web tests: 312 total; E2E: 24 total

Не входит в этот этап:

- Dashboard Header (I18N-02A — уже Feature Complete)
- Dashboard Day Summary (I18N-02B3 — Feature Complete)
- Recent Events, AI Insight (I18N-02B4+)
- Timeline и Quick Add product source migration
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Next Action Localization (I18N-02B1) — Feature Complete ✅

## Dashboard Header Localization — Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Header Localization Migration (I18N-02A) — `apps/web/components/dashboard/dashboard-header*`
- первый вертикальный product migration slice на `useLocalization()`, `useFormatter()`, `usePresentationContext()`
- English canonical `dashboard` namespace (7 Header keys) в `@diabetes-universe/locales`
- selective application preload: `common` + `dashboard`
- `dashboard-header-labels.ts` и pure presentation model boundary
- unit, integration, and E2E coverage (`dashboard-header-i18n.spec.ts`)
- architecture documentation и Engineering Audit (preload, technical debt, known limitations)
- merge: PR #22 (`411a40b` → `117967c` on `main`)
- web tests: 303 total; E2E: 23 total

Не входит в этот этап:

- remaining Dashboard blocks (I18N-02B+)
- Timeline и Quick Add product source migration
- `uk`, `de`, `ru` professional translations
- locale switch UI, cookie persistence
- ICU MessageFormat interpolation
- route-aware preload orchestration

Статус:

Dashboard Header Localization (I18N-02A) — Feature Complete ✅

## Application Platform Integration — Feature Complete

Дата: 2026-08-02

Завершено:

- Application Platform Integration (CR-03C) — `apps/web/lib/platform/integration/`
- ADR-0013 — Web Client Runtime Ownership and Bootstrap Gate
- `ApplicationRuntimeGate` — client-realm runtime assembly and product single-mount policy
- serializable `ApplicationPlatformBootstrap` server → client boundary
- readiness marker `data-platform-status="ready"` for E2E/lifecycle contracts
- root layout server bootstrap invocation and `<html lang>` from snapshot/seed
- integration tests: 28; web tests: 298 total; E2E: 22 total

Не входит в этот этап:

- cookie persistence adapter and `PresentationPersistence` wiring
- Dashboard, Timeline, Quick Add hook migration (I18N-02)
- locale switch UI

Статус:

Application Platform Integration — Feature Complete ✅

## React Platform Provider Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- React Platform Provider Foundation (CR-03B) — `apps/web/lib/platform/react/`
- `PlatformProvider` — supplies an already assembled `PlatformRuntime` via React Context
- read-only hooks: `usePlatformRuntime`, `useLocalization`, `useFormatter`, `usePresentationContext`
- internal fail-fast missing-provider guard (plain `Error`, not exported)
- Option A nested-provider policy (nearest provider wins; no nested guard)
- test utilities: `createTestPlatformRuntime`, `TestPlatformProvider`
- architecture documentation (`react-platform-provider.md`)
- react provider tests: 26; web tests: 268 total

Не входит в этот этап:

- route integration and `PlatformProvider` wiring in `app/layout.tsx`
- server bootstrap invocation on routes
- persistence, cookie adapter, and browser bootstrap consumers
- Dashboard, Timeline, Quick Add migration
- platform package public API changes

Статус:

React Platform Provider Foundation — Feature Complete ✅

## Presentation Context Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Presentation Context Foundation (CR-03A) — `apps/web/lib/platform/presentation/`
- `ServerPresentationSeed` в `RequestPlatformBootstrapResult` при `time-zone-required`
- `PresentationContext` (alias `LocaleContext`) и `PresentationSnapshot` (version 1)
- client-only `resolveBrowserTimeZone()` и `createClientPresentationBootstrapResult()`
- validated snapshot create/restore и `PresentationPersistence` contract
- consolidated IANA time zone validation (`is-valid-iana-time-zone.ts`)
- split public API: isomorphic `presentation/index.ts`, client-only `presentation/client.ts`
- architecture documentation и ADR-0012 implementation contract update
- presentation tests: 33; web tests: 242 total

Не входит в этот этап:

- React Provider и hooks (CR-03B)
- route integration и cookie persistence
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- production UI wiring

Статус:

Presentation Context Foundation — Feature Complete ✅

## Thin Next.js Platform Bootstrap — Feature Complete

Дата: 2026-08-02

Завершено:

- Thin Next.js Platform Bootstrap (CR-02) — `apps/web/lib/platform/`
- ADR-0012 — User Time Zone Policy (Option C: required explicit IANA time zone)
- `createRequestPlatformRuntime()` — server-only canonical entry point
- `RequestPlatformBootstrapResult` — discriminated contract (`ready` | `time-zone-required`)
- request-derived locale resolution (Wave 1: `en-GB`, `uk-UA`, `de-DE`, `ru-RU`)
- plain `WebPlatformConfig` assembly and per-call `createWebPlatformRuntime()` delegation
- SSR isolation tests and hydration boundary documentation
- bootstrap tests: 35 (205 total web tests)

Не входит в этот этап:

- React Provider и hooks (CR-03)
- cookie scheme wiring и browser IANA first-visit detection
- production route invocation
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- full translations integration across UI

Статус:

Thin Next.js Platform Bootstrap — Feature Complete ✅

## Platform Runtime & Web Composition Root Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Platform Runtime Foundation (CR-01A) — `@diabetes-universe/platform`
- Web Composition Root (CR-01C/CR-01D) — `@diabetes-universe/platform-web`
- `createPlatformRuntime()` — immutable `PlatformRuntime` aggregate
- `createWebPlatformRuntime()` — framework-independent Web Composition Root
- `LocalizationPlatform.whenReady()` — registry readiness contract
- selective bundle preload via `WebPlatformConfig.preload`
- SSR-safe per-call runtime isolation
- integration: Localization + Formatting + Platform Runtime
- runtime tests: platform (6), platform-web (38), i18n (15, including `whenReady()`)

Не входит в этот этап:

- cookies и URL locale detection (beyond Composition Root contracts)
- React Provider и hooks
- Dashboard, Timeline, Quick Add migration
- locale switch UI
- remote/CDN/OTA adapters
- Backend Composition Root
- Mobile Composition Root

Статус:

Platform Runtime & Web Composition Root Foundation — Feature Complete ✅

## Platform Formatting Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Platform Formatting Foundation (FMT-01)
- Пакет: `@diabetes-universe/formatting`
- Platform Contracts
- PlatformFormatter Runtime implementation
- `createPlatformFormatter()`
- Date / Time / DateTime formatting
- Number formatting
- Percentage formatting
- Currency formatting
- Relative Time formatting
- Duration formatting
- Range formatting
- Measurement formatting
- Runtime cache (Intl formatter instances only)
- Runtime tests (170)

Не входит в этот этап:

- Date/time parsing beyond `DateLike` contract validation
- Medical unit conversion
- Formatting Infrastructure Adapter
- Composition Root wiring
- React hooks и UI integration
- Lint/CI enforcement of the formatting single entry point

Статус:

Platform Formatting Foundation — Feature Complete ✅

## Localization Platform Foundation — Feature Complete

Дата: 2026-08-02

Завершено:

- Localization Platform Foundation (Platform Foundation v1.0)
- Пакеты: `@diabetes-universe/i18n`, `@diabetes-universe/locales`,
  `@diabetes-universe/i18n-locales`
- ADR-0009 (Localization Platform), ADR-0010 (Platform Formatting Library),
  ADR-0011 (Platform Infrastructure Layer)
- Runtime v1.0: `createLocalizationPlatform()`, `translate()`, `hasTranslation()`,
  bundle cache, injected loader interfaces
- Platform Readiness (архитектурное определение)
- Infrastructure adapters вынесены из contract layer (I18N-06)
- Runtime tests (15) и adapter tests (5)

Не входит в этот этап:

- ICU MessageFormat runtime
- React Provider, hooks, Next.js integration
- UI migration приложения на Localization Platform
- locale switching
- CDN / OTA

Статус:

Localization Platform Foundation — Feature Complete ✅

## Timeline Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard и Timeline разделены
- Shared Timeline Store
- TimelineEvent entity model
- ISO dateTime
- Multi-day grouping
- Search
- Filters
- Event Details
- Editing
- Deletion
- Load More
- Dashboard synchronization
- Quick Add:
  - Глюкоза
  - Инсулин
  - Питание
  - Лекарство
  - Активность
  - Заметка
- Next Action → прямое открытие формы инсулина
- Responsive layouts
- Accessibility
- Unit tests
- Playwright E2E
- Final Preview audit

Статус:

Feature Complete ✅

## Dashboard Feature Complete

Дата: 2026-08-02

Завершено:

- Dashboard Architecture
- Dashboard UI Specification
- Dashboard implementation
- Quick Add integration
- Dashboard documentation
- Unit tests
- Playwright E2E
- Accessibility
- Responsive layouts
- Final audit

Статус:

✅ Feature Complete

## Added

## Changed

## Fixed
