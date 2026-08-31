# Wave 4B-II — Insulin Presentation Adapter and Semantic-Safe Timeline Edit

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4B-II                                                                        |
| Status       | Implemented                                                                  |
| Date         | 2026-08-30                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Depends on   | [Wave 4B-I](wave-4b-i-insulin-domain-foundation.md)                          |
| Base SHA     | `157708e989e0ccc940ffd18e9c293a6877b45e83`                                   |

This slice implements the shared insulin presentation adapter and the
semantic-safe Timeline Edit path required by Wave 4A §11.4.

**Option A was implemented.** The temporary Option B field lock was not used.
Edit is semantic-aware: preparation identity and its display snapshot move
together in one save, an explicit administration-context choice writes
`administrationContext` and removes the contradictory legacy `context`, and a
legacy event without `preparationId` never gains a fabricated identity.

## Scope

Implemented:

- presentation-neutral application adapter at `apps/web/lib/medical/insulin`;
- Timeline card, detail, and search routed through that single adapter;
- Dashboard Recent Events fed by the same Timeline presentation trajectory;
- insulin-specific semantic edit state and controls replacing the generic
  title/context strings;
- EN/RU/UK/DE preparation, context, grouping, and edit chrome.

Not implemented (unchanged by this slice):

- Quick Add insulin migration or localization (Wave 4C);
- awaited IndexedDB save integrity / `addEventAsync` (Wave 4D);
- API allow-list, adoption validation, OpenAPI (Wave 4E);
- startup IndexedDB rewrites or hydration backfills;
- `schemaVersion` bump, new insulin brands, database migrations;
- Day Summary dose arithmetic;
- calculator, recommendation, pump, therapy plan, IOB, glucose-derived dose;
- glucose, nutrition, medication, activity, or note edit behavior.

## Ownership

```text
@diabetes-universe/types                     canonical insulin fields
        ↓
@diabetes-universe/medical-domain            catalogue identity, grouping resolver,
                                             context guards, exact legacy mapping,
                                             canonical dose validation and bounds
        ↓
apps/web/lib/medical/insulin                 presentation + edit-transition adapter
                                             (including Intl dose formatting policy)
        ↓
Timeline card / detail / search  +  Timeline Edit  +  Dashboard Recent Events
```

The adapter consumes 4B-I helpers through the `@diabetes-universe/medical-domain`
package root only. Catalogue IDs, context vocabularies, the legacy mapping
table, and grouping logic are not duplicated in `apps/web`.

| Module                                   | Owns                                                  |
| ---------------------------------------- | ----------------------------------------------------- |
| `insulin-presentation-labels.ts`         | Localized context / grouping / preparation chrome     |
| `insulin-presentation-dose-format.ts`    | Intl fraction-digit policy for dose presentation      |
| `present-insulin-from-timeline-event.ts` | Reader precedence, title, grouping, search projection |
| `insulin-edit-options.ts`                | Grouped picker options derived from the catalogue     |
| `resolve-insulin-edit-transition.ts`     | Edit initialization and one atomic save transition    |
| `timeline-insulin-edit-fields.tsx`       | Insulin edit controls                                 |
| `timeline-insulin-edit-copy.ts`          | Localized edit copy injection                         |

## Audited trajectories

### Presentation — before

```text
SemanticTimelineEvent (insulin)
  → mapInsulinPresentation()            inline in timeline-presentation-mapper.ts
      title    = event.preparation
      context  = event.context          raw string, no mapping, no fallback
      search   = [preparation, doseUnits, context]
  → card / detail / search
  → Dashboard Recent Events via mapTimelineEventCardPresentation()
```

Semantic fields were ignored. A legacy Russian `context` was rendered verbatim
in every locale, and an event with no context rendered no context at all.

### Presentation — after

```text
SemanticTimelineEvent (insulin)
  → mapInsulinPresentation()
      → presentInsulinFromTimelineEvent()      apps/web/lib/medical/insulin
          title            = stored preparation snapshot
          context          = reader precedence below
          grouping         = resolveInsulinPresentationGrouping(preparationId)
          isUnmatched      = !isInsulinPreparationId(preparationId)
          search           = user content + additive localized labels
  → card / detail / search
  → Dashboard Recent Events via the same card presentation
```

### Edit — before

```text
TimelineEventEditDraft { title, value, context, unit, note, date, time }
  → updateSemanticTimelineEventFromDraft()
      preparation = draft.title.trim()
      context     = draft.context.trim() || undefined
```

One flat string draft for every kind. `preparationId` and
`administrationContext` were never read or written, so a generic save could
leave an identity pointing at entry A while the snapshot said entry B.

### Edit — after

```text
TimelineInsulinEventEditDraft {
  variant: 'insulin', date, time,
  insulin: { preparationId, otherName, dose, administrationContext, contextEdited },
  storedPreparation, storedPreparationIsUnmatched, storedContextWasAbsent,
  legacyContextText
}
  → updateTimelineEventFromDraft()
      → updateInsulinTimelineEventFromDraft()
          → resolveInsulinEditTransition()      one atomic decision
              preparation: { preparation, preparationId }
              context:     { kind: 'preserve' } | { kind: 'semantic', administrationContext }
              doseUnits:   UI guard 0 < dose <= 100, no rounding
```

The draft is a discriminated union. Non-insulin kinds keep the generic string
draft (`variant: 'generic'`) and their existing save behavior.

## Reader precedence

Applied by `resolveInsulinContextPresentation` in this exact order.

| #   | Condition                                                       | Displayed context          | `contextSource` |
| --- | --------------------------------------------------------------- | -------------------------- | --------------- |
| 1   | `administrationContext` passes `isInsulinAdministrationContext` | Localized semantic label   | `semantic`      |
| 2   | `context` is an exact governed legacy match                     | Localized semantic label   | `legacy_mapped` |
| 3   | `context` is a non-empty unmatched string                       | The original stored string | `legacy_raw`    |
| 4   | otherwise                                                       | Localized `unspecified`    | `unspecified`   |

Additional reader rules:

- **Semantic wins.** When both `administrationContext` and `context` exist,
  branch 1 applies and the legacy string is not shown as the context.
- **Title.** Always the stored `preparation` snapshot. It is never derived from
  a catalogue label, and `preparationId` is never derived from display text.
- **Unmatched identity.** A missing or unknown-at-runtime `preparationId` is a
  presentation state (`isUnmatchedPreparation: true`, `preparationId: null`).
  It is not `insulin.prep.unmapped` and no identity is fabricated.
- **Grouping.** Only `resolveInsulinPresentationGrouping(preparationId)`.
  Grouping is chrome, never persisted, and never inferred from a snapshot such
  as the literal string `Lantus`.
- **Invalid runtime semantic value.** A corrupted `administrationContext` falls
  through to branches 2–4 so the recorded text stays readable.
- **Search.** `userContent` remains `[preparation, doseUnits, context ?? '']`.
  Localized labels are additive (`kindLabel`, unit, semantic context label,
  grouping label) and never replace user content. A `legacy_raw` context is not
  duplicated into the localized list because it is already user content.

## Edit transition table

`resolveInsulinEditTransition`. “Unchanged” means the user did not touch that
control.

### Preparation

| Stored event               | User action                       | Saved `preparationId` | Saved `preparation`         |
| -------------------------- | --------------------------------- | --------------------- | --------------------------- |
| ID = A, snapshot S         | unchanged                         | A                     | S (byte-for-byte)           |
| ID = A, snapshot S         | selects catalogue entry B         | B                     | Localized display name of B |
| ID = A, snapshot S         | selects Other, name N (non-blank) | `insulin.prep.other`  | `N.trim()`                  |
| ID = A, snapshot S         | selects Other, name blank         | — (save rejected)     | — (`otherName` error)       |
| ID = Other, snapshot S     | unchanged                         | `insulin.prep.other`  | S (byte-for-byte)           |
| ID = Other, snapshot S     | edits name to N                   | `insulin.prep.other`  | `N.trim()`                  |
| no ID, snapshot S (legacy) | unchanged                         | **omitted**           | S (byte-for-byte)           |
| no ID, snapshot S (legacy) | edits dose or time only           | **omitted**           | S (byte-for-byte)           |
| no ID, snapshot S (legacy) | selects catalogue entry B         | B                     | Localized display name of B |
| no ID, snapshot S (legacy) | selects Other, name N             | `insulin.prep.other`  | `N.trim()`                  |

Identity and snapshot are produced by one function that returns both, so
saving ID A with entry B’s snapshot or an unrelated Other name is not
representable. A semantic event is offered no control that clears its identity.

### Administration context

| Stored event                                  | Initialized selection        | User action                                           | Saved context fields                                      |
| --------------------------------------------- | ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `administrationContext` = C                   | C                            | unchanged                                             | `administrationContext` = C, `context` as stored          |
| `administrationContext` = C                   | C                            | selects D                                             | `administrationContext` = D, legacy `context` **removed** |
| governed legacy `context` (e.g. `Перед едой`) | mapped value (`before_meal`) | unchanged                                             | legacy `context` preserved, no semantic write             |
| governed legacy `context`                     | mapped value                 | selects D                                             | `administrationContext` = D, legacy `context` **removed** |
| unmatched legacy `context` text T             | `null` (keep T)              | unchanged                                             | legacy `context` = T preserved                            |
| unmatched legacy `context` text T             | `null` (keep T)              | selects D                                             | `administrationContext` = D, legacy `context` **removed** |
| unmatched legacy `context` text T             | `null` (keep T)              | selects, then reverts to “keep recorded text”         | legacy `context` = T preserved                            |
| no context at all                             | absence (`null`)             | unchanged                                             | no context fields written                                 |
| no context at all                             | absence (`null`)             | selects another context, then **No context recorded** | no context fields written                                 |
| no context at all                             | absence (`null`)             | selects `unspecified`                                 | `administrationContext` = `unspecified`                   |

`contextEdited` separates an initialized selection from an explicit choice.
This is why a dose/time-only save on a governed legacy event preserves
`Перед едой` instead of silently converting it, while an explicit choice writes
the semantic value and drops the contradictory legacy string. `unspecified` is
a real semantic value for explicit edits. Translated context labels are never
persisted.

### Dose and envelope

| Concern            | Behavior                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI guard           | `0 < dose <= 100` (`INSULIN_EDIT_UI_DOSE_MAXIMUM`), unchanged                                                                                                       |
| Meaning of 100     | Technical UI typo protection, not a clinical ceiling                                                                                                                |
| Domain bound       | Unchanged at 500 (`INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM`)                                                                                                       |
| Rounding           | None; web presentation uses `insulin-presentation-dose-format.ts` (`maximumFractionDigits: 20`) so stored values such as `12.25` and `4,5` display without rounding |
| Preserved          | `id`, `kind`, `source`, `createdAt`, `schemaVersion`, `provenance`                                                                                                  |
| `updatedAt`        | Set on every successful save                                                                                                                                        |
| `occurredAt`       | Changes only through the existing date/time edit contract                                                                                                           |
| Legacy `context`   | Omitted as a key on a semantic save, never written as `undefined`                                                                                                   |
| Validation failure | Dialog stays open; errors are announced with `role="alert"`                                                                                                         |

Delete, close, focus trap, return focus, mobile layout, and all other Timeline
event kinds are unchanged.

## Localization

New keys, present in `en-GB`, `ru-RU`, `uk-UA`, and `de-DE`:

| Namespace                        | Keys                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `timeline.insulinPreparation.*`  | 7 catalogue entries (6 trade names + `other` picker chrome)                |
| `timeline.insulinContext.*`      | `before_meal`, `after_meal`, `correction`, `basal`, `other`, `unspecified` |
| `timeline.insulinGrouping.*`     | `rapid_acting`, `long_acting`, `unspecified`                               |
| `timeline.detail.form.insulin.*` | Field labels, legacy hints, keep-recorded options, error copy              |

Rules honored:

- production insulin presentation and edit modules contain no hardcoded Russian
  labels (guarded by a source assertion over those specific modules);
- translated context labels and group headings are never persisted;
- trade display names resolve identically across locales because they are
  presentation snapshots, not chrome; only the `other` picker label localizes;
- copy describes recording and technical validation only. There is no “safe
  dose”, recommended dose, calculator, therapy, IOB, or clinical
  classification wording in any locale.

Grouping headings (“Rapid-acting insulin”, “Long-acting insulin”, “Other
insulin”) are catalogue chrome per Wave 4A §12, not a clinical classification.

## Compatibility

`{ kind: 'insulin', preparation, doseUnits, context? }` plus the current
envelope remains fully readable, editable, and searchable:

- unmatched legacy events keep their snapshot and omit `preparationId`;
- unmatched legacy context text stays visible verbatim in every locale;
- the demo insulin event (`context: 'Перед завтраком'`) is an unmatched legacy
  row and exercises this path end to end;
- no startup rewrite, no hydration backfill, no migration;
- `schemaVersion` stays `1`.

## Validation

| Gate                                         | Result                                    |
| -------------------------------------------- | ----------------------------------------- |
| `pnpm format:check`                          | pass                                      |
| `pnpm lint`                                  | pass (5 pre-existing warnings, unchanged) |
| `pnpm typecheck`                             | pass                                      |
| `pnpm test`                                  | pass                                      |
| `pnpm build`                                 | pass                                      |
| `pnpm test:e2e`                              | pass                                      |
| `pnpm validate:openapi`                      | pass                                      |
| `pnpm validate:openapi:breaking`             | pass                                      |
| `pnpm test:openapi-diff`                     | pass                                      |
| `python3 scripts/validate-markdown-links.py` | pass                                      |

Behavioral regression coverage lives in:

- `apps/web/lib/medical/insulin/present-insulin-from-timeline-event.test.mjs`
- `apps/web/lib/medical/insulin/resolve-insulin-edit-transition.test.mjs`
- `apps/web/lib/medical/insulin/insulin-presentation-locales.test.mjs`
- `apps/web/lib/timeline/presentation/timeline-insulin-presentation-parity.test.mjs`
- `apps/web/components/timeline/timeline-insulin-edit-model.test.mjs`
- `apps/web/components/timeline/timeline-insulin-edit-fields.integration.test.mjs`
- `apps/web/components/timeline/timeline-other-kinds-edit-regression.test.mjs`
- `apps/web/e2e/timeline-insulin-semantic-edit.spec.ts`

## Wave dependencies after this slice

| Wave  | Status at merge (2026-08-30)                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| 4B-II | Implemented (this document)                                                                                    |
| 4C    | **Unblocked only after this PR is approved and merged.** The Wave 4A §11.4 edit gate is satisfied by Option A. |
| 4D    | Still required for awaited local IndexedDB save integrity                                                      |
| 4E    | **Still required** for API allow-list, kind validation, adoption, and OpenAPI                                  |

Semantic insulin fields remain **not cloud-compatible** until Wave 4E.
`validateSemanticEvent` still allow-lists only `preparation`, `doseUnits`, and
`context`, so `preparationId` and `administrationContext` are rejected on
create, update, and adoption. Nothing in this slice sends them to that
boundary.

**Scope note:** Wave 4C is not started here — Quick Add insulin migration and
localization were explicitly out of scope for 4B-II.

**Current state (post–Wave 4C):** Wave 4C has since been implemented and merged
on `main` (PR #142). That subsequent slice localized the Insulin Quick Add form
and routed new writes through `prepareInsulinNewWrite`; it was not part of
4B-II. Waves **4D** (awaited local save integrity) and **4E** (API/adoption/
OpenAPI) remain not started.
