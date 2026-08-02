# Dashboard Recent Events

## Purpose

Provide a bounded preview of the user's latest recorded events by category on
the Dashboard without reproducing Timeline structure or behavior.

## Status

Approved

## Responsibility

- Show up to four recent event previews.
- Keep only the latest event for each approved category.
- Sort previews by the latest event time, not by category name.
- Expose a visible **Все события** navigation action.
- Communicate loading, empty, and error states locally inside the block.
- Reject invalid ready inputs and fall back to a safe empty presentation.
- Keep previews informational: no filtering, search, edit, delete, or nested
  Timeline.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Recent Events Specification](../../specs/dashboard/recent-events.md)
- [Dashboard Recent Events UI](../../ui/dashboard/recent-events.md)
- Shared `EventCard` from `@diabetes-universe/ui`
- `History` icon from `lucide-react`

## Architectural Boundaries

- The block belongs to the web application because it composes Dashboard layout,
  approved copy, and event-preview presentation.
- Event acquisition, category mapping, and sorting happen outside the render
  path or through the exported selection logic supplied with typed event
  sources.
- The block does not fetch data, call APIs, or embed Timeline components.
- The block does not show glucose events; glucose belongs to Last Glucose.
- The block does not provide filtering, search, editing, or deletion.
- The Dashboard shell owns screen-level placement after Day Summary.
- **Все события** navigates through `viewAllHref`; the block does not own
  Timeline routing logic beyond the supplied href.

## Notes

- Approved categories: insulin, nutrition, medication, and activity when
  present.
- Activity appears only when an activity event is supplied.
- Event cards use the shared `EventCard` standard variant without click
  handlers.
