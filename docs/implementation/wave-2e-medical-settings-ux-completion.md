# Wave 2E — Medical Settings UX Completion

Implementation documentation for authoritative glucose display-unit consumption across Diabetes Universe medical UI.

## Starting point

- Base: Wave 2D merged into `main`
- Branch: `implementation/medical-settings-wave-2e`

## Authoritative unit architecture

There is **one** persisted user preference:

`DiabetesSettings.glucoseDisplayUnit` (`mmol_per_l` | `mg_per_dl` | `null`)

| Layer                               | Responsibility                                 |
| ----------------------------------- | ---------------------------------------------- |
| Medical API / persistence           | Canonical storage of preference and targets    |
| `DiabetesSettingsProvider`          | Single client fetch boundary for read surfaces |
| `diabetes-settings-display.ts`      | Presentation conversion from canonical mmol/L  |
| `@diabetes-universe/medical-domain` | Conversion factor `18.0182`                    |
| `packages/formatting`               | Locale number formatting only (ADR-0010)       |

No second preference is stored in localStorage, Timeline, Dashboard, Quick Add, or component-local persistence.

## Canonical mmol/L invariant

- All glucose events remain `concentrationMmolPerL`
- Target ranges remain `lowMmolPerL` / `highMmolPerL`
- Changing display unit updates presentation only
- Historical events are never rewritten

When the display unit is unset or unavailable, read surfaces fall back to **canonical mmol/L presentation** without persisting a preference.

## Conversion boundary

- Input/display conversion uses `convertGlucoseMmolPerLToMgPerDl` / `convertGlucoseMgPerDlToMmolPerL`
- Timeline/Home use `formatGlucoseValueForLocalizedDisplay`
- Target editor and Quick Add convert at input boundary before API submission
- Generic locale formatting does not perform medical conversion

## Save / error UX (`/account/diabetes`)

Each mutation group exposes explicit states:

`idle` → `saving` → `saved` | `error`

- Duplicate submission prevented while `saving`
- `saved` appears only after server acknowledgement
- Errors are inline, localized, and screen-reader visible via `role="status"` / `role="alert"`
- `412` / `428` reload authoritative server state and show conflict copy

## Manual-entry unit gate (Quick Add)

When `glucoseDisplayUnit` is unset:

1. Inline unit picker is shown
2. Numeric input is disabled until a unit is chosen
3. Authenticated users persist the choice through `PATCH /api/v1/medical/me/diabetes-settings`
4. Unauthenticated demo users may choose a session-only unit without persisting

Ambiguous numeric submission is blocked. Locale does not infer units.

## Integration surfaces

| Surface                       | Integration                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| Timeline cards/details/search | `useTimelinePresentationDependencies` + `glucoseDisplayUnit` |
| Dashboard last glucose        | Reuses timeline glucose presentation                         |
| Quick Add glucose             | Unit gate + localized labels + canonical submit payload      |
| Diabetes settings screen      | Provider-backed settings state + per-section save status     |

## Deferred capabilities (explicit)

- Alert thresholds / notification policy
- Therapy, devices, CGM, caregiver editing
- Analytics TIR runtime
- Target segments / scheduling

## Remaining technical debt

- Quick Add non-glucose forms still contain legacy hardcoded RU copy in `packages/ui`
- `QuickAddFormActions` default submit label remains Russian until a shared i18n pass
- Dashboard day-summary target bands not wired (no target visualization in Wave 2E scope)

## Tests

| Area                     | Path                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| Display conversion       | `apps/web/lib/medical/client/diabetes-settings-display.test.mjs`           |
| Quick Add parsing / gate | `apps/web/lib/quick-add/format-glucose.test.mjs`                           |
| Provider boundary        | `apps/web/lib/medical/react/diabetes-settings-provider.test.mjs`           |
| Timeline presentation    | `apps/web/lib/timeline/presentation/timeline-presentation-mapper.test.mjs` |
| Settings panel           | `apps/web/components/profile/profile-diabetes-management.test.mjs`         |
| E2E settings             | `apps/web/e2e/profile-diabetes-management.spec.ts`                         |
| E2E dashboard glucose    | `apps/web/e2e/dashboard-last-glucose-i18n.spec.ts`                         |

## Key files

| Area            | Path                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Provider        | `apps/web/lib/medical/react/diabetes-settings-provider.tsx`          |
| App wiring      | `apps/web/app/providers.tsx`                                         |
| Display helpers | `apps/web/lib/medical/client/diabetes-settings-display.ts`           |
| Timeline mapper | `apps/web/lib/timeline/presentation/timeline-presentation-mapper.ts` |
| Quick Add form  | `apps/web/components/quick-add/glucose-quick-add-form.tsx`           |
| Settings panel  | `apps/web/components/profile/profile-diabetes-management-panel.tsx`  |
| Save status UI  | `apps/web/components/profile/mutation-save-status.tsx`               |
