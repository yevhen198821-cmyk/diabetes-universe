# Dashboard Header UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard Header.

## Status

Approved

## Scope

The Header contains only:

- Diabetes Universe brand mark and product name;
- current localized date or date fallback;
- desktop “Добавить событие” action;
- user avatar or fallback;
- compact loading and error presentation.

Search, notifications, greetings, navigation, profile menus, and the mobile FAB
are outside this block.

## Anatomy

Element hierarchy:

1. `header` landmark.
2. Header container aligned to the 1152 px Dashboard container.
3. Brand group:
   - decorative `DU` mark;
   - Diabetes Universe top-level heading.
4. Current-date presentation.
5. Action group:
   - desktop “Добавить событие” button;
   - avatar presentation.
6. Optional loading announcement or error message.

The brand and avatar anchor opposite sides on mobile. The date occupies its own
row on mobile and moves between the brand and action group from tablet upward.

## Variants

- **Light:** white translucent surface, slate text and border, teal brand and
  action accents.
- **Dark:** dark slate translucent surface, light text, dark border, and
  accessible teal accents.
- **Static avatar:** informational avatar when no callback is supplied.
- **Interactive avatar:** button presentation when a callback is supplied.

## States

### Ready

- Show the prepared localized date.
- Show the avatar image when available.
- Fall back to initials, then a generic user icon.
- Keep the desktop action enabled unless `addEventDisabled` is true.

### Loading

- Keep the brand and Header dimensions stable.
- Replace the date with a 192 × 20 px neutral placeholder.
- Replace the avatar with a 44 × 44 px circular placeholder.
- Hide potentially stale avatar content.
- Keep the desktop action available unless explicitly disabled.
- Announce loading without exposing decorative placeholders.

### Error

- Keep brand, date fallback, avatar fallback, and available actions visible.
- Show a compact 12 px error message in a full-width row below the main Header
  content.
- Use error color plus text; color alone must not convey the failure.
- Do not replace or cover Dashboard content.

## Behavior

- The Header remains sticky at the top of the viewport.
- It does not create page-level horizontal scrolling.
- The desktop action invokes the supplied Quick Add callback and exposes no
  hover-only menu.
- A disabled desktop action does not invoke its callback.
- An interactive avatar invokes its callback.
- A static avatar is not focusable.
- An avatar image failure immediately reveals the approved fallback and does
  not retry the same URL repeatedly.
- No greeting or time-of-day content is displayed.

## Mobile Composition

Applies from 320 px through 639 px:

- First row: brand on the left, avatar on the right.
- Second row: localized date aligned to the start.
- Desktop action is not rendered.
- Header content uses one flexible column plus the avatar/action column.

## Tablet Composition

Applies from 640 px through 1023 px:

- Single primary row with brand, centered date, and avatar.
- Error text may occupy a second full-width row.
- Desktop action remains hidden.

## Desktop Composition

Applies at 1024 px and wider:

- Single primary row with brand, centered date, desktop action, and avatar.
- The desktop action appears immediately before the avatar.
- Error text may occupy a second full-width row.
- The separate desktop FAB is not required.

## Spacing and Sizing

| Element                             | Rule                                 |
| ----------------------------------- | ------------------------------------ |
| Header content maximum width        | 1152 px                              |
| Mobile minimum Header height        | 64 px plus top safe-area inset       |
| Desktop minimum Header height       | 72 px plus top safe-area inset       |
| Mobile horizontal inset             | Maximum of 16 px or device safe area |
| Tablet and desktop horizontal inset | Maximum of 24 px or device safe area |
| Header vertical padding             | 12 px                                |
| Brand group gap                     | 12 px                                |
| Action group gap                    | 8 px                                 |
| Brand mark                          | 44 × 44 px                           |
| Avatar                              | 44 × 44 px                           |
| Desktop action minimum height       | 44 px                                |

Header spacing must remain stable across ready, loading, and image-fallback
transitions. Error text may add one compact row without changing the width of
the primary row.

## Typography

- Product name: bold, 16 px on mobile and 18 px from tablet upward.
- Date: 14 px, medium emphasis, subordinate to the product name.
- Desktop action: shared Button typography.
- Avatar initials: 14 px, bold.
- Error message: 12 px, medium emphasis.
- Long product or date text truncates or wraps within its assigned area without
  overlapping controls.

## Avatar Presentation

- Shape: circle.
- Size and interactive target: 44 × 44 px.
- Image: square crop with cover behavior.
- Initials use the first character of one name, or the first characters of the
  first and last name parts.
- Generic fallback uses a user icon.
- The avatar uses supplied user data only; no example user is displayed in the
  product UI.
- An interactive avatar has hover, focus, and dark-theme states.
- A static avatar exposes an image-equivalent accessible label but no button
  semantics.

## Desktop Action Button

- Visible only at 1024 px and wider.
- Uses the shared primary `Button`.
- Visible label: “Добавить событие”.
- Optional leading add icon is decorative.
- Minimum interactive size: 44 × 44 px.
- Disabled presentation uses the shared Button disabled state.
- The button opens no menu and performs no save operation itself.

## Accessibility

- The Header is a landmark and the product name is the single Dashboard
  top-level heading.
- The visible date is represented as time content with a same-time-zone
  `YYYY-MM-DD` machine value.
- Date, avatar action, static avatar, loading, error, and unavailable-date
  presentations have explicit accessible text.
- Decorative brand, action, and fallback icons are hidden from assistive
  technology.
- Keyboard order follows brand context, desktop action when visible, and
  interactive avatar.
- Interactive controls have visible focus indicators in both themes.
- Every interactive target is at least 44 × 44 px.
- Loading uses a polite status announcement; error text remains readable
  without moving focus.
- Reduced-motion preferences disable loading placeholder animation.
- Disabled controls use native disabled semantics.

## Responsive Behavior

- Below 640 px, date moves to a second row.
- At 640 px, brand, date, and avatar share the primary row.
- At 1024 px, the desktop action appears before the avatar.
- Content aligns with the Dashboard container at every breakpoint.
- Top, left, and right safe-area insets are respected.
- The Header must remain usable at 320 px and at 200% zoom.
- Responsive changes do not alter labels, callbacks, or fallback priority.

## Dependencies

- [Dashboard Header Architecture](../../architecture/dashboard/header.md)
- [Dashboard Header Specification](../../specs/dashboard/header.md)
- [Dashboard Layout UI Specification](layout.md)
- [Buttons](../../design-system/buttons.md)
- [Typography](../../design-system/typography.md)
- [Spacing](../../design-system/spacing.md)

## Notes

- Header-local avatar and loading presentations are not exported as general UI
  primitives.
- The Dashboard shell owns the content grid and receives the Header as composed
  content; it does not hydrate solely to render the Header.
