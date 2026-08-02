# Dashboard Recent Events Specification

## Status

Approved

## Overview

The Dashboard Recent Events block shows a bounded preview of the latest recorded
events by category. It remains in its approved grid position when data is
loading, missing, or unavailable and does not block other Dashboard content.

## Functional Requirements

### Typed Inputs

| Input          | Type                               | Required | Purpose                                           |
| -------------- | ---------------------------------- | -------- | ------------------------------------------------- |
| `state`        | `loading \| ready \| empty \| error` | Yes    | Selects the block presentation state              |
| `events`       | `DashboardRecentEventSource[]`     | Yes in `ready` | Supplies candidate recent events          |
| `viewAllHref`  | `string`                           | Yes in `ready` | Supplies navigation target for **Все события** |
| `loadingLabel` | `string`                           | No       | Overrides the default loading announcement        |
| `message`      | `string`                           | No in `empty` / `error` | Supplies user-facing empty or error copy |

`DashboardRecentEventSource` contains:

| Field         | Type                           | Rule                                                       |
| ------------- | ------------------------------ | ---------------------------------------------------------- |
| `id`          | `string`                       | Trimmed non-empty stable event identifier                  |
| `category`    | `DashboardRecentEventCategory` | One of `insulin`, `nutrition`, `medication`, `activity`    |
| `title`       | `string`                       | Trimmed non-empty event title                              |
| `value`       | `string`                       | Trimmed non-empty primary display value                    |
| `unit`        | `string`                       | Trimmed display unit; may be empty when not applicable     |
| `context`     | `string`                       | Trimmed contextual text; may be empty                      |
| `displayTime` | `string`                       | Trimmed non-empty visible event time                       |
| `dateTime`    | `string`                       | Trimmed non-empty ISO 8601 instant used for sorting        |

### States

| State     | Required behavior                                                         |
| --------- | ------------------------------------------------------------------------- |
| `loading` | Preserve card geometry and announce loading without plausible event cards   |
| `ready`   | Show up to four sorted previews and the **Все события** navigation action   |
| `empty`   | Communicate that no recent events are available without fabricated cards    |
| `error`   | Show a user-facing failure message without fabricated cards               |

### Selection Rules

1. Accept only the approved categories:
   - **Инсулин** → `insulin`
   - **Питание** → `nutrition`
   - **Лекарства** → `medication`
   - **Активность** → `activity` when present
2. Keep only the latest event per category by `dateTime`.
3. Sort the remaining events by `dateTime` descending.
4. Render at most **4** cards.
5. Do not reserve an activity slot when no activity event exists.

### Fallback Rules

Ready-input fallback priority:

1. Valid events with a non-empty `viewAllHref` produce the ready state.
2. No valid events after selection downgrade to empty.
3. Blank `viewAllHref` downgrades to unavailable empty.
4. Invalid event records are ignored without failing the whole block.

Additional rules:

- Empty custom `message` values in `empty` and `error` use approved defaults.
- Loading uses the approved default loading label when `loadingLabel` is absent.
- Invalid ready input never throws.

## User Flow

1. The Dashboard renders Recent Events after Day Summary.
2. The user reads up to four latest event previews sorted by time.
3. The user may activate **Все события** to leave the Dashboard preview.
4. If no events are available, the user reads the empty-state message.
5. If loading fails, the user reads the error-state message inside the same card
   area.

## Business Rules

- Approved title: **Недавние события**.
- Approved action label: **Все события**.
- Glucose events are excluded from this block.
- The block is a preview, not Timeline.
- No filtering, search, editing, or deletion is available in v1.0.
- Event cards are informational and non-interactive.
- Sorting is by latest event time, not by category label.

## Validation Rules

- Trim all string fields.
- Reject events with blank `id`, `title`, `value`, `displayTime`, or `dateTime`.
- Reject events with unparsable ISO `dateTime`.
- Reject unknown categories.
- Require non-empty trimmed `viewAllHref` in ready state.

## Edge Cases

- Multiple events in one category keep only the latest by `dateTime`.
- Two categories with the same timestamp preserve stable relative order only
  after timestamp comparison.
- Fewer than four categories render fewer than four cards.
- Activity is omitted entirely when absent.
- Whitespace-only `viewAllHref` downgrades to unavailable empty.
- The block may be in `error` while other Dashboard blocks remain visible.

## Dependencies

- [Dashboard Recent Events Architecture](../../architecture/dashboard/recent-events.md)
- [Dashboard Recent Events UI](../../ui/dashboard/recent-events.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)
- [Event Card System](../../ui-bible/002-event-card-system.md)

## Acceptance Criteria

1. All inputs use exported TypeScript contracts.
2. Ready state shows at most four cards.
3. Only the latest event per approved category is shown.
4. Cards are sorted by `dateTime` descending.
5. Activity appears only when supplied.
6. **Все события** is visible in ready state and uses `viewAllHref`.
7. No Timeline, filter, search, edit, or delete behavior is introduced.
8. Loading, empty, and error states remain local to the block.
9. The block is mounted in `DashboardShell` after Day Summary.
10. Grid placement follows `col-span-full` and `lg:col-span-8`.
11. No API integration is introduced.
