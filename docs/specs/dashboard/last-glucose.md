# Dashboard Last Glucose Specification

## Status

Approved

## Overview

The Dashboard Last Glucose block shows the latest glucose measurement as a
neutral status card. It remains in its approved grid position when data is
loading, missing, stale, or unavailable and does not block other Dashboard
content.

## Functional Requirements

### Typed Inputs

| Input           | Type                               | Required | Purpose                                                      |
| --------------- | ---------------------------------- | -------- | ------------------------------------------------------------ |
| `state`         | `loading \| ready \| empty \| error` | Yes    | Selects the block presentation state                         |
| `glucose`       | `DashboardLastGlucoseMeasurement`  | Yes in `ready` | Supplies value, display time, and machine datetime |
| `loadingLabel`  | `string`                           | No       | Overrides the default loading announcement                   |
| `message`       | `string`                           | No in `empty` / `error` | Supplies user-facing empty or error copy      |
| `referenceTime` | `Date`                             | No       | Evaluates staleness deterministically in tests and owners     |
| `staleAfterMs`  | `number`                           | No       | Overrides the default stale threshold                        |

`DashboardLastGlucoseMeasurement` contains:

| Field         | Type     | Rule                                                                 |
| ------------- | -------- | -------------------------------------------------------------------- |
| `value`       | `string` | Trimmed non-empty display value including units when supplied        |
| `displayTime` | `string` | Trimmed non-empty localized or formatted time shown to the user      |
| `dateTime`    | `string` | Trimmed non-empty ISO 8601 machine-readable measurement instant      |

`DashboardLastGlucoseMeasurement` may be created before render from:

| Factory input | Type     | Rule                                                                |
| ------------- | -------- | ------------------------------------------------------------------- |
| `measuredAt`  | `Date`   | Must be a valid instant supplied by the owner                       |
| `locale`      | `string` | Must be a supported locale; runtime-default fallback is not allowed |
| `timeZone`    | `string` | Must be a valid IANA time-zone identifier                           |
| `value`       | `string` | Must be a trimmed non-empty display value                           |

The factory returns:

- `value` unchanged after trimming;
- `displayTime` formatted in the supplied locale and time zone;
- `dateTime` as the measured instant serialized to ISO 8601.

### States

| State     | Required behavior                                                                 |
| --------- | --------------------------------------------------------------------------------- |
| `loading` | Preserve card geometry and announce loading without plausible glucose values        |
| `ready`   | Show value, display time, and machine datetime; mark stale measurements locally   |
| `empty`   | Communicate that no measurement is available without fabricating a value            |
| `error`   | Show a user-facing failure message without showing stale or fabricated values       |

### Fallback Rules

Ready-input fallback priority:

1. Valid trimmed `value`, `displayTime`, and `dateTime` produce the ready state.
2. Missing or blank `value` or `displayTime` downgrade to the empty state.
3. Missing, blank, or invalid `dateTime` downgrades to the empty state.
4. The empty fallback uses the approved default empty message when no custom
   message is supplied.

Additional rules:

- Empty custom `message` values in `empty` and `error` use the approved defaults.
- Loading uses the approved default loading label when `loadingLabel` is absent.
- Error uses the approved default error message when `message` is absent.
- Invalid ready input never throws and never renders a zero or placeholder
  glucose value.

### Staleness Rules

- Default stale threshold: **24 hours** from `referenceTime`.
- A stale ready measurement remains visible.
- Staleness adds an informational note only; it does not change the value or
  downgrade the block to `empty` or `error`.
- `referenceTime` defaults to the current instant at render time when omitted.

## User Flow

1. The Dashboard renders Last Glucose in its current state after Next Action.
2. The user reads the latest value and measurement time.
3. If the measurement is stale, the user sees an informational stale note.
4. If no measurement is available, the user reads the empty-state message.
5. If loading fails, the user reads the error-state message inside the same
   card area.

## Business Rules

- Approved title: **Последняя глюкоза**.
- Approved eyebrow in ready state: **Последнее измерение**.
- The block does not show a glucose target range.
- The block does not classify the value as high, low, or in range.
- The block does not provide medical recommendations.
- mmol/L and mg/dL are accepted as owner-prepared display strings.
- The block does not convert between glucose units.
- The block does not duplicate Timeline event history.
- The block is not interactive in v1.0.

## Validation Rules

- Reject an invalid `Date` in the measurement factory.
- Reject a malformed or unsupported locale instead of using the runtime default
  locale.
- Reject an invalid or empty time zone.
- Trim `value`, `displayTime`, `dateTime`, `message`, and `loadingLabel`.
- Treat an empty trimmed `value` or `displayTime` as invalid ready input.
- Treat an empty trimmed `dateTime` or unparsable ISO datetime as invalid ready
  input.
- Do not parse, infer, or append a target range to the display value.

## Edge Cases

- A valid instant may resolve to different display times in different time
  zones; display time and machine datetime must come from the same supplied
  instant and time zone when the factory is used.
- Values may use comma or dot decimal separators according to owner formatting.
- Both `6,4 ммоль/л` and `115 mg/dL` are valid display values when supplied by
  the owner.
- A stale measurement older than the threshold still renders in ready state.
- Whitespace-only ready fields downgrade to empty.
- The block may be in `error` while other Dashboard blocks remain visible.
- No retry action is defined in v1.0.

## Dependencies

- [Dashboard Last Glucose Architecture](../../architecture/dashboard/last-glucose.md)
- [Dashboard Last Glucose UI](../../ui/dashboard/last-glucose.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)
- [Glucose entity](../../data/entities/glucose.md)

## Acceptance Criteria

1. All inputs use exported TypeScript contracts.
2. Ready state shows value, display time, and a valid ISO `dateTime`.
3. Empty `value` or `displayTime` downgrades to empty without throwing.
4. Invalid `dateTime` downgrades to empty without throwing.
5. The view model exposes no target range field or derived range text.
6. mmol/L and mg/dL display strings pass through unchanged.
7. Measurements older than the stale threshold expose `isStale: true` and the
   approved stale note.
8. Loading preserves card geometry and exposes a loading status.
9. Error remains local and leaves other Dashboard blocks usable.
10. The block is mounted in `DashboardShell` immediately after Next Action.
11. No API integration, Quick Add wiring, or Timeline duplication is introduced.
