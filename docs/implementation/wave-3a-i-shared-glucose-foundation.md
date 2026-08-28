# Wave 3A-I — Shared Glucose Domain & Presentation Foundation

Foundation PR for the approved Wave 3A glucose experience architecture.

## Purpose

Establish a shared, presentation-neutral glucose contract in
`@diabetes-universe/medical-domain` so glucose semantics are no longer owned by
Timeline-specific presentation helpers.

Consumer migration (Dashboard, Timeline, Quick Add) is deferred to **PR 3A-II**.

## Architecture boundary

```text
Canonical glucose data (mmol/L, occurredAt, source)
        ↓
@diabetes-universe/medical-domain glucose foundation
        ↓
Web localization adapter (apps/web/lib/medical/glucose)
        ↓
Future consumers: Dashboard / Timeline / Quick Add / mobile / CGM adapters
```

| Layer                                                      | Responsibility                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `medical-domain`                                           | Range/freshness/quality semantics, display numeric policy, presentation model builder |
| `formatting`                                               | Locale number + unit composition only                                                 |
| `apps/web/lib/medical/client/diabetes-settings-display.ts` | Existing localized formatting bridge (now uses shared numeric policy)                 |
| `apps/web/lib/medical/glucose`                             | Optional localized presentation adapter for future consumers                          |
| Timeline presentation                                      | Unchanged behavior; exports compat surface for 3A-II migration                        |

## Approved range semantics

`GlucoseRangeState`:

- `below_range` — value `<` user target low
- `in_range` — `low <= value <= high` (boundaries inclusive)
- `above_range` — value `>` user target high
- `unknown` — missing/invalid user target or invalid reading quality

No default clinical targets are introduced.

## Freshness policy approach

`GlucoseFreshnessPolicy` accepts explicit caller-provided thresholds
(`currentWithinMs`, `recentWithinMs`).

- No universal 24h default is embedded in the shared contract.
- Future timestamps never resolve to `current`.
- Missing/invalid policy or timestamps resolve to `unknown`.

Dashboard’s existing 24h stale UX remains local until GP-001 / 3A-II wiring.

## Precision

Shared `toGlucoseDisplayNumericValue()`:

- mmol/L → one fractional digit
- mg/dL → integer via existing `18.0182` conversion factor

Canonical persisted mmol/L values are never rewritten.

## Safety constraints

- No clinical labels (`normal`, `hypo`, `hyper`, etc.).
- Range terminology is strictly relative to user-provided targets.
- Technical `GlucoseDataQualityState` is separate from range state.
- Invalid/questionable quality suppresses confident range presentation.

## Compatibility wrappers

- `apps/web/lib/timeline/presentation/glucose-presentation-compat.ts` re-exports shared primitives for Timeline migration debt.
- `diabetes-settings-display.ts` now delegates numeric rounding to medical-domain without changing existing consumer APIs.

## Deferred work

| PR         | Scope                                                                 |
| ---------- | --------------------------------------------------------------------- |
| **3A-II**  | Migrate Dashboard, Timeline, Quick Add to shared glucose presentation |
| **3A-III** | Wire GP-001 freshness policies and richer timestamp-quality handling  |

## Out of scope (confirmed)

Database schema, migrations, Medical API contracts, auth, P11 sync, CGM/device
integrations, UI redesigns, and clinical decision support.
