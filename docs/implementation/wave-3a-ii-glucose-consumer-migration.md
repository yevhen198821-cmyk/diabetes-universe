# Wave 3A-II — Glucose Consumer Migration

Migrates Dashboard, Timeline, and Quick Add onto the shared glucose foundation from Wave 3A-I.

## Consumers migrated

| Surface                              | Before                              | After                                                     |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------- |
| Dashboard Last Glucose               | `lib/timeline/presentation` helpers | `lib/medical/glucose` (`presentGlucoseFromTimelineEvent`) |
| Dashboard day summary glucose        | `formatTimelineGlucoseDisplayValue` | `presentGlucoseFromTimelineEvent`                         |
| Timeline glucose cards/detail/search | Inline formatting in mapper         | `presentGlucoseFromTimelineEvent` via mapper              |
| Quick Add bounds                     | Local mg/dL rounding                | `toGlucoseDisplayNumericValue()` from medical-domain      |

## Removed compatibility layers

- `apps/web/lib/timeline/presentation/glucose-presentation-compat.ts` (deleted)

## Target range in presentation

- `useGlucosePresentationDependencies()` fetches `GlucoseTargetProfile.defaultRange` when diabetes settings exist.
- Passed into `presentGlucoseFromTimelineEvent` → `buildGlucosePresentation()`.
- Localized range labels via `glucose.range.*` keys (EN/RU/UK/DE).
- No label shown when target is missing (`unknown` range state).

## Reference time

- `buildGlucosePresentation()` requires explicit `referenceTime`.
- Dashboard passes `props.referenceTime` from `dashboard-root` (single mount-time `Date`).
- Timeline presentation dependencies carry `referenceTime` (default `new Date()` at UI boundary).

## Temporary legacy freshness policy

`DASHBOARD_LEGACY_FRESHNESS_POLICY` in `apps/web/lib/medical/glucose/dashboard-legacy-freshness-policy.ts`:

- `{ currentWithinMs: null, recentWithinMs: 24h }`
- Preserves Dashboard fresh/stale UX until Wave 3A-III GP-001 wiring.

## Deferred (3A-III)

- Source-aware freshness thresholds (CGM vs manual)
- GP-001 next-action integration with last-glucose hero
- Latest eligible reading selection hardening
- Semantic design tokens (`glucose-below`, etc.) if not yet in design system

## Regression guard

`apps/web/lib/medical/glucose/glucose-consumer-boundary.test.mjs` prevents Dashboard from re-importing Timeline glucose presentation helpers.
