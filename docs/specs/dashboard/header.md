# Dashboard Header Specification

## Status

Approved

## Overview

The Dashboard Header provides product identity, a localized current date, user
identity presentation, and the desktop Quick Add action. It remains available
when its user data is loading or unavailable and does not block other Dashboard
content.

## Functional Requirements

### Typed Inputs

| Input              | Type                          | Required | Purpose                                                           |
| ------------------ | ----------------------------- | -------- | ----------------------------------------------------------------- |
| `state`            | `loading \| ready \| error`   | Yes      | Selects the Header presentation state                             |
| `date`             | `DashboardHeaderDate \| null` | Yes      | Supplies a stable localized date label and machine date           |
| `user`             | `DashboardHeaderUser \| null` | Yes      | Supplies optional display name and avatar URL                     |
| `onAddEvent`       | `() => void`                  | Yes      | Requests opening Quick Add                                        |
| `addEventDisabled` | `boolean`                     | No       | Disables the desktop action while its owner cannot open Quick Add |
| `onAvatarClick`    | `() => void`                  | No       | Enables avatar interaction without defining a profile menu        |
| `errorMessage`     | `string`                      | No       | Supplies a user-facing Header error                               |

`DashboardHeaderUser` supports:

- `displayName?: string | null`;
- `avatarUrl?: string | null`.

`DashboardHeaderDate` is created before interactive rendering from:

| Factory input | Type     | Rule                                                                |
| ------------- | -------- | ------------------------------------------------------------------- |
| `currentDate` | `Date`   | Must be a valid instant supplied by the owner                       |
| `locale`      | `string` | Must be a supported locale; runtime-default fallback is not allowed |
| `timeZone`    | `string` | Must be a valid IANA time-zone identifier                           |

The resulting date contains the localized display label, a `YYYY-MM-DD`
machine value calculated in the same time zone, and the validated locale and
time zone.

### States

| State     | Required behavior                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `loading` | Keep brand and desktop action stable; replace date and avatar with non-interactive loading presentations |
| `ready`   | Show the prepared date and the best available avatar presentation                                        |
| `error`   | Show a compact error fallback, suppress a potentially stale avatar image, and preserve available actions |

### Callbacks

- The desktop “Добавить событие” control calls `onAddEvent` exactly once per
  activation while enabled.
- The avatar calls `onAvatarClick` only when that callback is supplied.
- Without `onAvatarClick`, the avatar is informational and is not placed in the
  keyboard focus order.
- The Header does not implement either callback's resulting UI.

### Fallback Rules

Avatar priority in the ready state:

1. Valid supplied avatar image.
2. Initials derived from the trimmed display name.
3. Generic user icon.

Additional rules:

- An image load failure falls back to initials or the generic icon.
- The same failed URL is not requested repeatedly during the mounted Header
  lifetime.
- A changed avatar URL is eligible for a new load attempt.
- Missing or invalid date presentation displays “Дата недоступна”.
- Missing custom error text uses the approved generic Header error.

## User Flow

1. The Dashboard renders the Header in its current state.
2. The user reads the product identity and current localized date.
3. On desktop, the user may activate “Добавить событие”.
4. If avatar interaction is enabled, the user may activate the avatar.
5. Callback owners decide what opens and return focus when their interaction
   closes.

## Business Rules

- The product identity is Diabetes Universe.
- The action label is “Добавить событие”.
- The Header does not display a greeting.
- The Header does not infer or hardcode a user, avatar, date, locale, or time
  zone.
- Locale and time zone affect only date preparation; Header UI copy remains the
  approved product copy.
- Header errors remain local and must not hide or disable unrelated Dashboard
  content.
- Quick Add availability is controlled by `addEventDisabled`; the Header does
  not inspect Quick Add state.
- The Header must not add search, notifications, navigation redesign, profile
  menus, authentication, or data loading.

## Validation Rules

- Reject an invalid `Date`.
- Reject a malformed or unsupported locale instead of using the runtime's
  default locale.
- Reject an invalid or empty time zone.
- Trim display names, avatar URLs, and custom error messages.
- Use no more than two initials: the first character of a single name, or the
  first characters of the first and last name parts.
- Treat an empty avatar URL as missing.
- Treat an empty custom error message as absent.

## Edge Cases

- A valid instant may resolve to different calendar dates in different time
  zones; display and machine values must use the same supplied time zone.
- The locale may use non-Latin characters or locale-specific casing.
- The user may be `null`, have no name, have no avatar, or have both missing.
- The avatar URL may fail after initially rendering.
- A new avatar URL may arrive after a previous URL failed.
- The Header may be in `error` while the prepared date and callbacks remain
  valid.
- The avatar callback may be absent.
- The desktop action may be disabled while Quick Add is already open.

## Dependencies

- [Dashboard Header Architecture](../../architecture/dashboard/header.md)
- [Dashboard Header UI](../../ui/dashboard/header.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)
- [Quick Add approved behavior](../../ui-bible/003-quick-add.md)

## Acceptance Criteria

1. All inputs and callbacks use exported TypeScript contracts.
2. The ready state shows product identity, the prepared localized date, and an
   avatar image or fallback.
3. The loading state preserves Header geometry and exposes a loading status.
4. The error state remains local and leaves the rest of Dashboard usable.
5. Invalid dates, unsupported locales, and invalid time zones produce the date
   fallback without throwing.
6. The machine date matches the supplied time zone.
7. Missing names and avatars resolve to the generic avatar fallback.
8. A failed avatar URL cannot create an image retry loop.
9. The required desktop action invokes its callback only while enabled.
10. Avatar interaction is focusable only when its callback is present.
11. All interactive targets are at least 44 × 44 px and keyboard accessible.
12. Mobile and tablet do not show the desktop action.
13. Server and client render the same prepared date strings.
14. No API, authentication, profile menu, navigation change, or additional
    Dashboard block is introduced.
