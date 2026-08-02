# Dashboard Day Summary

## Purpose

Summarize the user's recorded health activity for the current calendar day as
neutral Dashboard status information beside Last Glucose.

## Status

Approved — I18N-02B3 Feature Complete (merged via PR #25)

## Responsibility

- Display current-day totals for glucose measurements, insulin, and
  carbohydrates.
- Display secondary current-day counts for medication doses and reminder
  completion.
- Bind visible day copy to a machine-readable `YYYY-MM-DD` day identifier.
- Communicate loading, empty, and error states locally inside the block.
- Reject invalid ready inputs and fall back to a safe empty presentation.
- Keep the block informational: no charts, comparisons, TIR, GMI, AI, or hidden
  actions.
- Reserve the approved grid position immediately after Last Glucose.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Day Summary Specification](../../specs/dashboard/day-summary.md)
- [Dashboard Day Summary UI](../../ui/dashboard/day-summary.md)
- `CalendarDays` icon from `lucide-react`

## Architectural Boundaries

- The block belongs to the web application because it composes Dashboard layout,
  approved copy, and day-level aggregation presentation.
- Day selection, locale selection, time-zone selection, and metric preparation
  happen outside the render path. The exported day-label factory validates and
  serializes those inputs before they cross the client boundary when used.
- Ready inputs may also supply a pre-validated `DashboardDaySummaryData`
  object created by an upstream owner.
- The block does not fetch data, call APIs, aggregate Timeline events, or
  compute analytics.
- The block does not show time in range, GMI, charts, period comparisons, or AI
  interpretation.
- The Dashboard shell owns screen-level placement and renders Day Summary beside
  Last Glucose according to the layout grid.

## Notes

- Counts and display totals are owner-prepared for the current day only.
- A true zero count or zero total may be shown only when the owner supplies it
  explicitly in ready state.
- Missing summary data must be represented through `empty`, not fabricated zeros.
