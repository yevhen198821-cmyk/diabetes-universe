# Dashboard AI Insight

## Purpose

Present one confirmed AI-generated explanation as secondary supporting context
on the Dashboard without competing with recorded health data or Next Action.

## Status

Approved

## Responsibility

- Display exactly one confirmed AI Insight preview.
- Mark the content as automatically generated and non-clinical.
- Reference only confirmed related event identifiers supplied by the owner.
- Communicate loading, empty, and error states locally inside the block.
- Reject invalid or prohibited ready input and fall back to a safe empty
  presentation.
- Export a future AI Engine contract without implementing generation in v1.0.
- Keep the block informational: no diagnosis, treatment assignment, dosing
  advice, or forecasts.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard AI Insight Specification](../../specs/dashboard/ai-insight.md)
- [Dashboard AI Insight UI](../../ui/dashboard/ai-insight.md)
- Shared `EventCard` from `@diabetes-universe/ui`
- `Sparkles` icon from `lucide-react`

## Architectural Boundaries

- The block belongs to the web application because it composes Dashboard layout,
  approved copy, and AI-insight presentation rules.
- Insight acquisition and confirmation happen outside the render path. Ready
  state accepts only owner-supplied confirmed `DashboardAiInsightData`.
- The exported `DashboardAiInsightEngine` interface defines the future
  generation contract; no engine implementation ships in v1.0.
- The block does not fetch data, call APIs, or generate insights locally.
- The block does not diagnose conditions, prescribe treatment, recommend doses,
  or predict future outcomes.
- The Dashboard shell owns screen-level placement after Recent Events.

## Notes

- Related event identifiers are informational references only in v1.0.
- Prohibited medical language in ready input downgrades to unavailable empty.
- The block uses the shared `ai_insight` EventCard type for the confirmed
  preview card.
