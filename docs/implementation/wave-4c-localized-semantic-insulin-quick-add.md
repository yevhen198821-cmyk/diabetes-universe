# Wave 4C — Localized Semantic Insulin Quick Add

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4C                                                                           |
| Status       | Implemented                                                                  |
| Date         | 2026-08-30                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Depends on   | [Wave 4B-II](wave-4b-ii-insulin-presentation-edit.md) (Option A, merged)     |
| Base SHA     | `326e67c513b16eef88fcb3daafc7bfa51c4aa45e`                                   |

Insulin Quick Add now writes the Wave 4A semantic contract and is fully
localized. The Wave 4A §11.4 rollout invariant is satisfied because Wave 4B-II
Option A is merged, so a semantic Quick Add write is editable without loss.

## Scope

Implemented:

- `InsulinQuickAddEntry` migrated to the semantic new-write shape;
- Quick Add preparation picker driven by catalogue IDs and the Wave 4B-II
  localized presentation adapter;
- required free-text name for `insulin.prep.other`;
- semantic administration-context picker with domain normalization;
- manual dose parser with a two-fraction-digit policy and a UI typo ceiling;
- `quick-add.insulin.*` chrome in `en-GB`, `ru-RU`, `uk-UA`, `de-DE`;
- `createSemanticInsulinTimelineEvent` writing `preparationId` and
  `administrationContext` and never the legacy `context` key.

Not implemented (unchanged by this slice):

- awaited IndexedDB save integrity, pending state, dismiss lock, stable retry
  identity (Wave 4D);
- medical API allow-list, kind validation, adoption, OpenAPI, cloud
  create/update, outbox/sync (Wave 4E);
- startup IndexedDB rewrites, hydration backfills, `schemaVersion` bump,
  database migrations, new brand preparations;
- other Quick Add categories, the shared Quick Add action menu, glucose
  behavior, Day Summary arithmetic;
- calculator, dose recommendation, correction factor, carbohydrate ratio, IOB,
  glucose-derived dose, pump control, therapy plan.

## Ownership

```text
@diabetes-universe/types                     canonical insulin fields + InsulinQuickAddEntry
        ↓
@diabetes-universe/medical-domain            catalogue identity, context taxonomy,
                                             canonical dose validation, prepareInsulinNewWrite
        ↓
apps/web/lib/medical/insulin                 localized presentation adapter (Wave 4B-II)
apps/web/lib/quick-add                       manual input policy + submit boundary
        ↓
apps/web/components/quick-add                Insulin Quick Add form + localized chrome
        ↓
apps/web/lib/timeline/semantic-creators      createSemanticInsulinTimelineEvent
        ↓
TimelineStore.addEvent  →  IndexedDB
```

| Module                                      | Owns                                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| `insulin-quick-add-dose.ts`                 | Manual syntax, two-decimal policy, UI typo ceiling          |
| `insulin-quick-add-submit.ts`               | Form state → snapshot resolution → `prepareInsulinNewWrite` |
| `insulin-quick-add-labels.ts`               | `quick-add.insulin.*` form chrome only                      |
| `insulin-quick-add-form.tsx`                | Controls, sheets, revealed Other field, accessible errors   |
| `create-semantic-insulin-timeline-event.ts` | Semantic event assembly and envelope                        |

No second preparation catalogue, context vocabulary, grouping resolver, or copy
of domain validation was introduced. Catalogue, context, and grouping labels are
resolved through `resolveInsulinPresentationLabels`,
`resolveInsulinPreparationOptionGroups`, and
`resolveInsulinAdministrationContextOptions`. `@diabetes-universe/ui` remains a
primitive layer and owns no insulin identity.

## Audited trajectories

### Before

```text
InsulinQuickAddForm                       hardcoded Russian labels
  formState { preparation: string, dose, time, context: string }
  preparation options  = insulin-preparation-options.ts  (display strings, RU groups)
  context options      = insulin-context-options.ts      (RU legacy strings)
  dose parse           = parseInsulinDoseInput()          one fractional group, <= 100
  → InsulinQuickAddEntry { preparation, doseUnits, time, context? }
  → createSemanticInsulinTimelineEvent()
        preparation = entry.preparation.trim()
        context     = entry.context?.trim() || undefined
  → TimelineStore.addEvent()   fire-and-forget
  → IndexedDB
```

Identity was the localized display string. Selecting «Другое» stored the literal
label `Другое` with no user-entered name. The context was a localized string, so
an event recorded in Russian rendered Russian text in every locale until
Wave 4B-II presentation mapped the governed legacy values.

### After

```text
InsulinQuickAddForm                       useLocalization + quick-add.insulin.*
  formState { preparationId, otherName, dose, administrationContext, time }
  preparation options  = resolveInsulinPreparationOptionGroups(presentationLabels)
  context options      = resolveInsulinAdministrationContextOptions(presentationLabels)
  → prepareInsulinQuickAddSubmit()
        1. preparationId present?
        2. time present?
        3. snapshot = other ? otherName.trim() : labels.preparations[preparationId]
        4. doseUnits = parseInsulinQuickAddDoseInput(dose)     manual policy
        5. prepareInsulinNewWrite({ preparationId, preparation, doseUnits,
                                    administrationContext })   canonical contract
  → InsulinQuickAddEntry { preparationId, preparation, doseUnits,
                           administrationContext, time }
  → createSemanticInsulinTimelineEvent()
  → TimelineStore.addEvent()   fire-and-forget (unchanged; Wave 4D)
  → IndexedDB
```

Only a successful domain payload can reach `onSubmit`.

## `InsulinQuickAddEntry`

```ts
export interface InsulinQuickAddEntry {
  readonly preparationId: InsulinPreparationId;
  readonly preparation: string;
  readonly doseUnits: number;
  readonly administrationContext: InsulinAdministrationContext;
  readonly time: string;
}
```

The legacy `context?: string` field was removed rather than dual-written. All
production consumers (`quick-add-host.tsx`, `dashboard-root.tsx`,
`timeline-shell.tsx`, the semantic creator) moved in the same change.

## Raw semantic event shape

A Wave 4C Quick Add write produces exactly these own properties:

```json
{
  "administrationContext": "basal",
  "createdAt": "2026-08-02T10:15:00.000Z",
  "doseUnits": 12.25,
  "id": "insulin-0905-<uuid>",
  "kind": "insulin",
  "occurredAt": "2026-08-02T09:05:00.000Z",
  "preparation": "Lantus",
  "preparationId": "insulin.prep.glargine_lantus",
  "schemaVersion": 1,
  "source": "manual",
  "updatedAt": "2026-08-02T10:15:00.000Z"
}
```

Never written: legacy `context`, `preparationCategory`, grouping, a localized
context label, a localized `Other` label as the snapshot, or any calculated or
recommended dose.

## Preparation contract

| Selection                 | Saved `preparationId` | Saved `preparation`             |
| ------------------------- | --------------------- | ------------------------------- |
| Catalogue entry X         | X                     | Localized catalogue label of X  |
| Other, name N (non-blank) | `insulin.prep.other`  | `N.trim()`                      |
| Other, name blank         | — (submit rejected)   | — (localized `otherName` error) |
| none                      | — (submit disabled)   | —                               |

Rules:

- identity comes only from the selected ID; it is never derived from a snapshot
  string, and the picker never matches display names against the catalogue;
- ID and snapshot are produced by one function and travel together, so entry X
  can never be saved with entry Y's label;
- switching from Other to a catalogue entry clears `otherName` in form state, so
  a stale user name cannot be submitted;
- grouping headings are chrome from `resolveInsulinPresentationGrouping` and are
  never persisted;
- a localized `Other` label (`Other` / `Другое` / `Інше` / `Sonstiges`) is never
  stored as the snapshot.

## Administration context contract

Form state and option values use only `before_meal`, `after_meal`, `correction`,
`basal`, `other`, `unspecified`. The UI shows localized labels.

| User action               | Form state      | Saved `administrationContext` |
| ------------------------- | --------------- | ----------------------------- |
| no choice                 | `null`          | `unspecified`                 |
| explicitly Not specified  | `'unspecified'` | `unspecified`                 |
| any other semantic choice | that ID         | that ID                       |

`null` is passed to `prepareInsulinNewWrite` as `undefined`, and
`resolveInsulinNewWriteAdministrationContext` normalizes omitted input to
`unspecified`. A specific context is therefore never required, the new writer
always stores `administrationContext`, and the legacy `context` key is never
written. Context labels are never persisted.

`correction`, `basal`, and grouping headings are recording vocabulary and
catalogue chrome. They are not a recommendation, a therapy confirmation, or a
statement that a dose is appropriate.

## Dose contract

| Layer                     | Rule                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| Manual Quick Add parser   | required, finite, `> 0`, `<= 100`, at most two fractional digits       |
| Accepted separators       | `.` and `,` (`12.25` and `12,25` both parse to `12.25`)                |
| Rounding                  | none; the parsed number is stored exactly                              |
| Meaning of `100`          | UI typo protection only                                                |
| Canonical domain contract | finite, `> 0`, `<= 500`, no precision limit (device/import unaffected) |
| Presentation              | `insulin-presentation-dose-format.ts` (`maximumFractionDigits: 20`)    |

The two-decimal rule lives only in the web manual-input parser
(`insulin-quick-add-dose.ts`). `validateInsulinCanonicalDose` is unchanged and
still has no precision policy.

`100` is not a safe, recommended, correct, or therapeutic maximum. The dose
field ships with placeholder `4` only; no dose is pre-filled, defaulted,
remembered, or suggested.

The previous `formatInsulinDose()` helper (`maximumFractionDigits: 1`) was
removed together with `parseInsulinDoseInput()`. It had no production consumer,
and the approved Wave 4B-II presentation adapter is not duplicated.

## Localization

New keys, present in `en-GB`, `ru-RU`, `uk-UA`, and `de-DE`:

| Key                                        | Purpose                        |
| ------------------------------------------ | ------------------------------ |
| `quick-add.insulin.preparationLabel`       | Preparation field label        |
| `quick-add.insulin.preparationPlaceholder` | Empty preparation trigger text |
| `quick-add.insulin.preparationSheetTitle`  | Preparation sheet title        |
| `quick-add.insulin.otherNameLabel`         | Other name field label         |
| `quick-add.insulin.otherNamePlaceholder`   | Other name placeholder         |
| `quick-add.insulin.otherNameRequiredError` | Blank Other name error         |
| `quick-add.insulin.doseLabel`              | Dose field label               |
| `quick-add.insulin.dosePlaceholder`        | Dose placeholder (`4`)         |
| `quick-add.insulin.doseUnit`               | Dose unit suffix               |
| `quick-add.insulin.doseError`              | Manual dose validation error   |
| `quick-add.insulin.timeLabel`              | Time field label               |
| `quick-add.insulin.contextLabel`           | Context field label            |
| `quick-add.insulin.contextPlaceholder`     | Empty context trigger text     |
| `quick-add.insulin.contextSheetTitle`      | Context sheet title            |
| `quick-add.insulin.save`                   | Submit button                  |
| `quick-add.insulin.cancel`                 | Cancel button                  |

Rules honored:

- catalogue, context, and grouping labels are **not** duplicated into
  `quick-add.insulin.*`; they reuse `timeline.insulinPreparation.*`,
  `timeline.insulinContext.*`, and `timeline.insulinGrouping.*` through the
  Wave 4B-II adapter;
- the form uses the existing platform localization (`useLocalization`), not a
  new React context or a private dictionary;
- no translation is stored in a semantic identity field;
- production insulin Quick Add modules contain no hardcoded Cyrillic (guarded by
  a source assertion);
- copy describes recording and technical validation only.

Remaining localization gaps outside this slice: the shared Quick Add action menu
(`apps/web/lib/quick-add/actions.ts`, all six categories) and shared
`@diabetes-universe/ui` picker chrome (option-sheet overlay label, time-picker
confirm). Both are shared by every Quick Add category, including glucose, and are
untouched here.

## Compatibility

Existing legacy events `{ kind: 'insulin', preparation, doseUnits, context? }`
remain readable, displayable, editable, and searchable:

- Wave 4B-II reader precedence still maps governed legacy Russian context values
  and shows unmatched text verbatim;
- unmatched legacy rows keep their snapshot and omit `preparationId`;
- Timeline Edit legacy behavior is unchanged;
- no startup migration, no hydration backfill, no IndexedDB rewrite;
- `schemaVersion` stays `1`;
- the demo insulin row (`context: 'Перед завтраком'`) still exercises the legacy
  read path end to end.

Other Quick Add categories and the glucose Wave 3D save-integrity contract are
unchanged.

## Current save-integrity gap (Wave 4D dependency)

Wave 4C deliberately keeps the existing trajectory:

- `onInsulinSubmit` is synchronous;
- `TimelineStore.addEvent` stays fire-and-forget;
- Quick Add closes immediately after submit;
- the event ID is allocated inside the creator and is not retained for retry.

Consequences that remain open until Wave 4D: a failed IndexedDB write is not
surfaced, there is no pending state or dismiss lock, and there is no stable
retry identity. Wave 4C does not partially copy the glucose Wave 3D contract,
because an incomplete save-integrity implementation is not permitted.

## Cloud / API status (Wave 4E)

Wave 4C writes remain local IndexedDB fields until the Wave 4E API slice. See
[Wave 4E](wave-4e-insulin-api-adoption-openapi.md) for the additive medical API
v1 / adoption / OpenAPI contract (**Implemented on branch / pending merge**).

## Safety and non-scope

The application records the dose the user entered. This slice adds no bolus
calculator, dose recommendation, correction-factor or carbohydrate-ratio
calculation, insulin-on-board, glucose-derived dose, default or recent dose,
clinical safety confirmation, pump control, therapy plan, alert, reminder, CGM
integration, new preparation brand, marketplace, recipe, or nutrition change.

No copy in any locale uses “safe dose”, “recommended dose”, “correct dose”,
“maximum safe dose”, or “suggested insulin”.

## Validation

| Gate                                         | Result                                    |
| -------------------------------------------- | ----------------------------------------- |
| `pnpm format:check`                          | pass                                      |
| `pnpm lint`                                  | pass (5 pre-existing warnings, unchanged) |
| `pnpm typecheck`                             | pass                                      |
| `pnpm test`                                  | pass                                      |
| `pnpm build`                                 | pass                                      |
| `pnpm test:e2e`                              | pass (169)                                |
| `pnpm validate:openapi`                      | pass                                      |
| `pnpm validate:openapi:breaking`             | pass                                      |
| `pnpm test:openapi-diff`                     | pass                                      |
| `python3 scripts/validate-markdown-links.py` | pass                                      |

Behavioral coverage lives in:

- `apps/web/lib/quick-add/insulin-quick-add-dose.test.mjs`
- `apps/web/lib/quick-add/insulin-quick-add-submit.test.mjs`
- `apps/web/components/quick-add/insulin-quick-add-form.integration.test.mjs`
- `apps/web/components/quick-add/insulin-quick-add-resources.test.mjs`
- `apps/web/lib/timeline/semantic-creators/create-semantic-insulin-timeline-event.test.mjs`
- `apps/web/lib/timeline/semantic-creators/semantic-creators.test.mjs`
- `packages/types/src/semantic-timeline.type-test.ts`
- `apps/web/e2e/insulin-quick-add-wave-4c.spec.ts`

### DOM harness limitation

The integration harness runs on happy-dom, where React does not receive
`onChange` for controlled text inputs from dispatched events. Click-driven
behavior (option sheets, the revealed Other field, validation that rejects the
empty initial state, locale chrome) is asserted at DOM level; typed dose and
Other-name success paths are asserted in the Playwright suite, which also reads
the raw IndexedDB record and checks key presence and absence.

## Wave dependencies after this slice

| Wave  | Status                                                                    |
| ----- | ------------------------------------------------------------------------- |
| 4A    | Approved and merged                                                       |
| 4B-I  | Implemented                                                               |
| 4B-II | Implemented (Option A)                                                    |
| 4C    | Implemented (this document)                                               |
| 4D    | Implemented — awaited local save integrity and retry identity             |
| 4E    | Implemented on branch / pending merge — API allow-list, adoption, OpenAPI |

Wave 4D is merged. Wave 4E is documented separately and is not claimed on
`main` until that PR merges.
