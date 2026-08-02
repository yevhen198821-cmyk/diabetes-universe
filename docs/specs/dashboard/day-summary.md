# Dashboard Day Summary Specification

## Status

Approved

## Overview

The Dashboard Day Summary block shows current-day recorded totals and counts as
a neutral status card. It remains in its approved grid position when data is
loading, missing, or unavailable and does not block other Dashboard content.

## Functional Requirements

### Typed Inputs

| Input          | Type                               | Required | Purpose                                           |
| -------------- | ---------------------------------- | -------- | ------------------------------------------------- |
| `state`        | `loading \| ready \| empty \| error` | Yes    | Selects the block presentation state              |
| `summary`      | `DashboardDaySummaryData`          | Yes in `ready` | Supplies current-day metrics              |
| `loadingLabel` | `string`                           | No       | Overrides the default loading announcement        |
| `message`      | `string`                           | No in `empty` / `error` | Supplies user-facing empty or error copy |

`DashboardDaySummaryData` contains:

| Field                 | Type     | Rule                                                          |
| --------------------- | -------- | ------------------------------------------------------------- |
| `dayDate`             | `string` | Trimmed `YYYY-MM-DD` for the current summary day              |
| `displayDayLabel`     | `string` | Trimmed non-empty localized day label shown to the user       |
| `glucoseMeasurements` | `number` | Non-negative integer count of glucose measurements today      |
| `totalInsulin`        | `string` | Trimmed non-empty display total including units when supplied |
| `totalCarbohydrates`  | `string` | Trimmed non-empty display total including units when supplied |
| `medicationDoses`     | `number` | Non-negative integer count of registered medication doses     |
| `remindersCompleted`  | `number` | Non-negative integer count of completed reminders today       |
| `remindersTotal`      | `number` | Non-negative integer total reminders scheduled for today      |

The day label factory accepts:

| Factory input | Type     | Rule                                                                |
| ------------- | -------- | ------------------------------------------------------------------- |
| `currentDate` | `Date`   | Must be a valid instant supplied by the owner                       |
| `locale`      | `string` | Must be a supported locale; runtime-default fallback is not allowed |
| `timeZone`    | `string` | Must be a valid IANA time-zone identifier                           |

The factory returns:

- `dayDate` as `YYYY-MM-DD` calculated in the supplied time zone;
- `displayDayLabel` formatted in the supplied locale and time zone.

### States

| State     | Required behavior                                                              |
| --------- | ------------------------------------------------------------------------------ |
| `loading` | Preserve card geometry and announce loading without plausible summary values   |
| `ready`   | Show current-day label and all approved primary and secondary metrics          |
| `empty`   | Communicate that no current-day summary is available without fabricated totals |
| `error`   | Show a user-facing failure message without fabricated totals                   |

### Metric Groups

Primary metrics:

1. Glucose measurements count.
2. Total insulin display total.
3. Total carbohydrates display total.

Secondary metrics:

1. Registered medication doses count.
2. Reminders completed / reminders total.

### Fallback Rules

Ready-input fallback priority:

1. Valid current-day summary data produces the ready state.
2. Invalid `dayDate`, blank labels or totals, invalid counts, or
   `remindersCompleted > remindersTotal` downgrade to empty.
3. Empty fallback uses the approved default empty message when no custom message
   is supplied.

Additional rules:

- Empty custom `message` values in `empty` and `error` use approved defaults.
- Loading uses the approved default loading label when `loadingLabel` is absent.
- Invalid ready input never throws and never fabricates summary values.

## User Flow

1. The Dashboard renders Day Summary beside Last Glucose.
2. The user reads the current-day label.
3. The user reads primary totals for glucose measurements, insulin, and
   carbohydrates.
4. The user reads secondary counts for medication doses and reminders.
5. If no summary exists, the user reads the empty-state message.
6. If loading fails, the user reads the error-state message inside the same card
   area.

## Business Rules

- Approved title: **Сводка дня**.
- Approved eyebrow: **Текущий день**.
- Only the current calendar day may be shown.
- The block does not compare today with previous days.
- The block does not show TIR, GMI, charts, or AI insight.
- Display totals for insulin and carbohydrates are owner-prepared strings.
- Reminder progress is shown as `completed / total`.
- The block is not interactive in v1.0.

## Validation Rules

- Reject an invalid `Date` in the day-label factory.
- Reject malformed or unsupported locales.
- Reject invalid or empty time zones.
- Validate `dayDate` as a real Gregorian calendar date.
- Require non-negative integers for all count fields.
- Require `remindersCompleted <= remindersTotal`.
- Trim all string fields.
- Treat blank display totals as invalid ready input.

## Edge Cases

- A valid instant may resolve to different calendar dates in different time
  zones; `dayDate` and `displayDayLabel` must use the same supplied time zone
  when the factory is used.
- True zero counts and zero totals are allowed only when explicitly supplied in
  ready state.
- Whitespace-only ready fields downgrade to empty.
- The block may be in `error` while other Dashboard blocks remain visible.
- No retry action is defined in v1.0.

## Dependencies

- [Dashboard Day Summary Architecture](../../architecture/dashboard/day-summary.md)
- [Dashboard Day Summary UI](../../ui/dashboard/day-summary.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)

## Acceptance Criteria

1. All inputs use exported TypeScript contracts.
2. Ready state shows only current-day data with primary and secondary metrics.
3. Invalid ready input downgrades to empty without throwing.
4. `dayDate` and `displayDayLabel` are exposed separately.
5. No TIR, GMI, chart, comparison, or AI fields are exposed.
6. Loading, empty, and error states remain local to the block.
7. The block is mounted in `DashboardShell` immediately after Last Glucose.
8. Grid placement follows `sm:col-span-1` and `lg:col-span-5`.
9. No API integration is introduced.
