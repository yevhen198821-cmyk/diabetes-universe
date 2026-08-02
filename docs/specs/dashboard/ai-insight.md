# Dashboard AI Insight Specification

## Status

Approved

## Overview

The Dashboard AI Insight block shows one confirmed automatically generated
explanation as a secondary supporting card. It remains in its approved grid
position when data is loading, missing, or unavailable and does not block other
Dashboard content.

## Functional Requirements

### Typed Inputs

| Input          | Type                                 | Required                | Purpose                                    |
| -------------- | ------------------------------------ | ----------------------- | ------------------------------------------ |
| `state`        | `loading \| ready \| empty \| error` | Yes                     | Selects the block presentation state       |
| `insight`      | `DashboardAiInsightData`             | Yes in `ready`          | Supplies one confirmed AI Insight          |
| `loadingLabel` | `string`                             | No                      | Overrides the default loading announcement |
| `message`      | `string`                             | No in `empty` / `error` | Supplies user-facing copy                  |

`DashboardAiInsightData` contains:

| Field             | Type       | Rule                                                      |
| ----------------- | ---------- | --------------------------------------------------------- |
| `id`              | `string`   | Trimmed non-empty stable insight identifier               |
| `title`           | `string`   | Trimmed non-empty short headline                          |
| `summary`         | `string`   | Trimmed non-empty neutral explanation                     |
| `displayTime`     | `string`   | Trimmed non-empty visible generation time                 |
| `generatedAt`     | `string`   | Trimmed non-empty ISO 8601 generation instant             |
| `relatedEventIds` | `string[]` | Trimmed confirmed related event identifiers; may be empty |

### Future AI Engine Contract

The block exports but does not implement:

```ts
interface DashboardAiInsightEngine {
  generateInsight(
    request: DashboardAiInsightEngineRequest,
  ): Promise<DashboardAiInsightEngineResponse>;
}
```

`DashboardAiInsightEngineRequest` contains `locale`, `referenceTime`, and
`timeZone`.

`DashboardAiInsightEngineResponse` contains `insight: DashboardAiInsightData | null`.

No engine implementation is required in v1.0.

### States

| State     | Required behavior                                                           |
| --------- | --------------------------------------------------------------------------- |
| `loading` | Preserve card geometry and announce loading without plausible insight text  |
| `ready`   | Show one confirmed insight, disclaimer, and related-event reference         |
| `empty`   | Communicate that no insight is available without fabricating an explanation |
| `error`   | Show a user-facing failure message without fabricated insight text          |

### Fallback Rules

Ready-input fallback priority:

1. Valid confirmed insight data produces the ready state.
2. Blank required fields, invalid `generatedAt`, or prohibited content downgrade
   to unavailable empty.
3. Empty custom `message` values in `empty` and `error` use approved defaults.

Additional rules:

- Only one insight is accepted in ready state.
- Loading uses the approved default loading label when `loadingLabel` is absent.
- Invalid ready input never throws and never fabricates insight content.

## User Flow

1. The Dashboard renders AI Insight after Recent Events.
2. The user reads the automatic-explanation disclaimer.
3. The user reads one confirmed insight preview and its related-event reference.
4. If no insight is available, the user reads the empty-state message.
5. If loading fails, the user reads the error-state message inside the same card
   area.

## Business Rules

- Approved title: **ИИ-объяснение**.
- Approved eyebrow: **Автоматическое объяснение**.
- Approved disclaimer: **Не является диагнозом или назначением лечения.**
- Exactly one insight may be shown.
- Only confirmed owner-supplied data may be rendered.
- The block must not diagnose conditions.
- The block must not assign treatment.
- The block must not recommend dosing changes.
- The block must not provide forecasts or predictions.
- The block is not interactive in v1.0.

## Validation Rules

- Trim all string fields.
- Reject blank `id`, `title`, `summary`, `displayTime`, or `generatedAt`.
- Reject unparsable ISO `generatedAt`.
- Ignore blank related-event identifiers.
- Reject ready content that matches prohibited diagnosis, treatment, dosing, or
  forecast language patterns.

## Edge Cases

- An insight may have zero related events and still render in ready state.
- Whitespace-only ready fields downgrade to unavailable empty.
- Prohibited language in either `title` or `summary` downgrades to unavailable
  empty.
- The block may be in `error` while other Dashboard blocks remain visible.
- No retry action is defined in v1.0.

## Dependencies

- [Dashboard AI Insight Architecture](../../architecture/dashboard/ai-insight.md)
- [Dashboard AI Insight UI](../../ui/dashboard/ai-insight.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)
- [Event Card System](../../ui-bible/002-event-card-system.md)

## Acceptance Criteria

1. All inputs use exported TypeScript contracts.
2. Ready state shows exactly one confirmed insight.
3. Invalid or prohibited ready input downgrades to empty without throwing.
4. `DashboardAiInsightEngine` is exported without implementation.
5. No diagnosis, treatment, dosing, or forecast fields are exposed.
6. Loading, empty, and error states remain local to the block.
7. The block is mounted in `DashboardShell` after Recent Events.
8. Grid placement follows `col-span-full` and `lg:col-span-4`.
9. The preview uses the shared `EventCard` `ai_insight` type.
10. No API integration or AI generation is introduced.
