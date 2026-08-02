# Dashboard Last Glucose

## Purpose

Present the user's most recent glucose measurement as neutral current-status
information on the Dashboard without competing with Next Action or duplicating
Timeline history.

## Status

Approved — I18N-02B2 Feature Complete (merged via PR #24)

## Responsibility

- Display the latest glucose value with its measurement time.
- Preserve a machine-readable measurement instant separate from the visible
  time label.
- Communicate loading, empty, error, and stale measurement states locally
  inside the block.
- Reject invalid or incomplete ready inputs and fall back to a safe empty
  presentation instead of showing fabricated values.
- Keep the block informational: no target range, no medical interpretation, and
  no hidden actions.
- Reserve the approved grid position immediately after Next Action.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Last Glucose Specification](../../specs/dashboard/last-glucose.md)
- [Dashboard Last Glucose UI](../../ui/dashboard/last-glucose.md)
- Shared `LastGlucose` display conventions from Timeline
- `Droplets` icon from `lucide-react`

## Architectural Boundaries

- The block belongs to the web application because it composes Dashboard layout,
  approved copy, and glucose presentation rules.
- Measurement acquisition, locale selection, time-zone selection, and staleness
  evaluation happen outside the interactive render. The exported measurement
  factory validates and serializes those inputs before the value crosses the
  client boundary when a factory is used.
- Ready inputs may also supply a pre-validated `DashboardLastGlucoseMeasurement`
  created by an upstream owner.
- The block does not fetch data, call APIs, open Quick Add, or update Timeline.
- The block does not compute or display a glucose target range.
- The Dashboard shell owns screen-level placement and renders Last Glucose
  immediately after Next Action.
- Quick Add owners may update the block later, but this block does not own that
  wiring.

## Notes

- Stale measurement is informational only; it does not invalidate the displayed
  value.
- mmol/L and mg/dL values are display strings prepared by their owner; the
  block does not convert units.
- I18N-02B2 audit: see
  [Dashboard Last Glucose Localization Migration](../localization/dashboard-last-glucose-migration.md).
- Empty ready inputs downgrade to the approved empty state rather than throwing.
