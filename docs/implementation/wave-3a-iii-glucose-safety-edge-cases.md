# Wave 3A-III — Glucose Safety & Edge Cases

Hardens Wave 3A glucose presentation and latest-reading selection for technical safety, deterministic behavior, and source-aware freshness.

## Scope delivered

| Area                          | Implementation                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Source-aware freshness        | `normalizeGlucoseSourceCategory()` + `GLUCOSE_PRODUCT_RECENCY_POLICIES`                       |
| Future/suspect timestamps     | `GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS` + `resolveGlucoseTimestampQuality()`                 |
| Latest eligible selection     | `selectLatestEligibleGlucoseReading()` + web `selectLatestEligibleGlucoseTimelineEvent()`     |
| Quality precedence            | Existing `buildGlucosePresentation()` gate; questionable → `rangeState: unknown`              |
| Duplicate/conflict invariants | Documented + tested; no auto-merge by value/time                                              |
| measuredAt compatibility      | `occurredAt → measuredAt` at `presentGlucoseFromTimelineEvent` and timeline selection adapter |
| Dashboard migration           | Uses eligible selection + source-aware freshness (no legacy policy authority)                 |

## Product recency policy (non-clinical)

> These thresholds describe how Diabetes Universe communicates data recency in the UI. They are not clinical thresholds and must not be used for diagnosis, treatment, alarms, or therapy decisions.

| Source category                 | `currentWithinMs` | `recentWithinMs` |
| ------------------------------- | ----------------: | ---------------: |
| `manual`                        |            15 min |             24 h |
| `cgm`                           |             5 min |              3 h |
| `blood_glucose_meter`           |            15 min |             12 h |
| `health_platform`               |            15 min |              6 h |
| `import`                        |              none |             24 h |
| `other` (conservative fallback) |              none |             12 h |

Runtime mapping from `TimelineEventSource`:

- `manual` → `manual`
- `import` → `import`
- `demo` → `other`
- `device` → provenance hints (`cgm`, `meter`, `health`) when present; otherwise `other`

Vendor names (Libre, Dexcom, etc.) are not inferred from free text beyond conservative keyword hints.

## Future clock-skew tolerance

- Constant: `GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000` (5 minutes)
- Technical only; not clinical
- Within tolerance: timestamp quality remains `valid`, freshness age clamps at `0`
- Beyond tolerance: timestamp quality `suspect_future`, data quality `questionable`, not Dashboard-latest-eligible

## Latest eligible selection algorithm

`selectLatestEligibleGlucoseReading(readings, referenceTime)`:

1. Filter to readings where `isGlucoseReadingEligibleForLatest()` is true:
   - not deleted (`deletedAt` when provided)
   - finite concentration
   - data quality `valid`
   - timestamp quality `valid`
2. Choose `MAX(measuredAt)` among eligible readings
3. Deterministic tie-break (non-clinical):
   1. `measuredAt`
   2. `recordedAt` when both readings provide it
   3. stable `id` (`localeCompare`)

Dashboard and next-action contexts use `selectLatestEligibleGlucoseTimelineEvent()`.

## Quality precedence

Presentation order remains:

`Glucose record → technical quality → target range → range state → freshness → presentation`

When data quality is not `valid`, `rangeState` is `unknown` even if the numeric value would fit the user's target. The value may still display when technically displayable.

## Duplicate and conflict invariants

- Same value + same timestamp does **not** imply duplicate identity
- Integration duplicate identity conceptually uses source/integration identity + external record ID (not implemented in this PR)
- Conflicting readings at the same time are preserved; selection picks one deterministically without averaging or hiding Timeline history

## measuredAt / recordedAt / createdAt

| Concept                   | Runtime representation                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `measuredAt`              | Timeline `occurredAt` (single compatibility boundary)                      |
| `recordedAt`              | Not exposed on current client semantic model; tie-break falls back to `id` |
| `createdAt` / `updatedAt` | Client lifecycle metadata only; not used for freshness or latest selection |

## Deletion behavior

- `isGlucoseReadingEligibleForLatest()` excludes readings with non-empty `deletedAt` when provided
- Current `SemanticTimelineEvent` has no `deletedAt`; server list semantics currently exclude deleted resources
- `selectLatestEligibleGlucoseTimelineEvent()` accepts optional `deletedAtByEventId` for forward compatibility

## Dashboard changes

- Removed `DASHBOARD_LEGACY_FRESHNESS_POLICY` as final Dashboard freshness authority
- `presentGlucoseFromTimelineEvent()` resolves freshness from event source when no explicit policy is passed
- `deriveDashboardQuickAddBlocks()` / next-action context use latest **eligible** glucose selection

## Localization

Added technical timestamp uncertainty copy:

- `timeline.glucose.timestamp.check` (EN/RU/UK/DE)

Surfaced when data quality is `questionable` (e.g. Timeline cards).

## Deferred

- GP-001 platform policy wiring to Dashboard hero
- Semantic design tokens (`glucose-below`, etc.) — audit only; no broad token rollout in 3A-III
- `recordedAt` on client semantic events
- P11 offline sync runtime
- CGM gap synthesis (explicitly prohibited; invariant tested at selection layer)

## Confirmation

- No database migrations
- No Medical API / auth / production configuration changes
- No clinical glucose thresholds introduced
- No physiological hard limits introduced
- Shared time-sensitive medical-domain functions require explicit `referenceTime`
