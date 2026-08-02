# Dashboard Header

## Purpose

Provide stable Dashboard identity, current-date context, user identity
presentation, and the desktop entry point to Quick Add.

## Status

Approved

## Responsibility

- Display the Diabetes Universe brand.
- Display a deterministic localized calendar date prepared from an explicit
  instant, locale, and time zone.
- Represent the current user through an avatar image, initials, or generic
  fallback.
- Expose the desktop “Добавить событие” action without owning the Quick Add
  panel.
- Keep Header failures local so they do not block the remaining Dashboard.
- Preserve the approved Header geometry across loading, ready, and error
  states.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)
- [Dashboard Header Specification](../../specs/dashboard/header.md)
- [Dashboard Header UI](../../ui/dashboard/header.md)
- Shared `Button` from `@diabetes-universe/ui`

## Architectural Boundaries

- The Header belongs to the web application because it composes product,
  user, date, and Dashboard-specific behavior.
- Generic buttons remain in `@diabetes-universe/ui`; the Header does not create
  replacement button, avatar, or skeleton primitives.
- User data, state, prepared date presentation, and callbacks enter through
  typed props.
- Date acquisition, locale selection, and time-zone selection happen outside
  the interactive Header render. The exported date factory validates and
  serializes those inputs before the value crosses the client boundary.
- The Header may invoke Quick Add and avatar callbacks but does not own Quick
  Add state, authentication, profile navigation, or a profile menu.
- The Header does not fetch data, call APIs, or infer a user, locale, time zone,
  or current instant.
- The Dashboard shell owns the page container and responsive content grid. It
  remains server-compatible and accepts the Header as a composed node.
- No other Dashboard block is implemented or controlled by the Header.

## Notes

- The desktop Quick Add trigger may be disabled by its owner while Quick Add is
  open.
- The mobile and tablet Header intentionally omit the desktop action; the
  separate Quick Add block owns the FAB.
- Greetings and time-of-day messaging are outside the approved Header.
