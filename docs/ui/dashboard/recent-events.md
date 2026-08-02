# Dashboard Recent Events UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard Recent Events block.

## Status

Approved

## Scope

The block contains only:

- history icon and title in ready state;
- **Все события** navigation action in ready state;
- up to four standard `EventCard` previews;
- loading, empty, and error presentations.

Timeline rails, filters, search, edit controls, delete controls, and nested
history scrolling are outside this block.

## Anatomy

Element hierarchy:

1. `section` landmark with `aria-labelledby`.
2. Card container with neutral border.
3. Ready layout:
   - header row with icon, title, and **Все события** link;
   - unordered list of up to four `EventCard` previews in `standard` variant.
4. Loading layout:
   - visually hidden title and status announcement;
   - decorative skeleton for header and three card placeholders.
5. Empty and error layout:
   - icon;
   - title;
   - message text.

## Variants

- **Light:** white surface, slate text and border, teal icon accent.
- **Dark:** dark slate surface, light text, dark border, and accessible teal
  accents.

## States

### Ready

- Show the title and **Все события** action.
- Render up to four non-interactive event previews.
- Use `EventCard` `standard` variant without `onClick`.
- Show category label through the card subtitle.
- Do not render a Timeline rail or compact Timeline layout.

### Loading

- Keep card dimensions stable.
- Announce loading with a screen-reader-only status.
- Hide decorative skeleton content from assistive technology.
- Do not show plausible event values.

### Empty

- Show the title and approved or custom empty message.
- Do not show event cards or **Все события**.

### Error

- Show the title and approved or custom error message.
- Use error border and text styling without replacing the whole Dashboard.
- Do not show event cards or **Все события**.

## Behavior

- Event previews are informational and not interactive in v1.0.
- **Все события** navigates through `viewAllHref`.
- No filtering, search, editing, or deletion is exposed.
- Invalid ready input downgrades visually to the empty presentation.

## Accessibility

- The block is a named `section` with a unique heading id.
- Loading exposes `aria-busy` and a polite status announcement.
- Empty uses `role="status"` with `aria-live="polite"`.
- Error uses `role="alert"` with `aria-live="assertive"`.
- The history icon is decorative and hidden from assistive technology.
- Event previews rely on `EventCard` accessible labels.
- **Все события** is a visible link with a minimum 44 × 44 px target.
- Reduced-motion preferences disable loading skeleton animation.

## Responsive Behavior

- Mobile: full-width card after Day Summary in the approved order.
- Tablet: spans both columns (`col-span-full`).
- Desktop: spans columns 1–8 (`lg:col-span-8`).
- Header action wraps below the title on narrow widths when needed.
- Event cards stack vertically with 12 px spacing.

## Spacing and Sizing

| Element                 | Rule                   |
| ----------------------- | ---------------------- |
| Card padding            | 20 px (`p-5`)          |
| Card corner radius      | 16 px (`rounded-2xl`)  |
| Icon container          | 44 × 44 px (`size-11`) |
| Header gap              | 16 px (`gap-4`)        |
| Event list gap          | 12 px (`space-y-3`)    |
| View-all minimum height | 44 px (`min-h-11`)     |

## Typography

- Title: 18 px bold.
- View-all action: 14 px semibold.
- Empty and error message: 14 px.
- Event card typography follows the shared `EventCard` standard variant.

## Dependencies

- [Dashboard Recent Events Architecture](../../architecture/dashboard/recent-events.md)
- [Dashboard Recent Events Specification](../../specs/dashboard/recent-events.md)
- [Dashboard Layout UI Specification](layout.md)
- [Event Card System](../../ui-bible/002-event-card-system.md)
- [Buttons](../../design-system/buttons.md)

## Notes

- The block deliberately avoids the Timeline compact card layout and rail.
- The Dashboard shell mounts this block after Day Summary and before AI Insight.
