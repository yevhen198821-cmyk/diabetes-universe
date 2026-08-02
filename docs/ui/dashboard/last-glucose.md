# Dashboard Last Glucose UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard Last Glucose block.

## Status

Approved

## Scope

The block contains only:

- glucose status icon;
- eyebrow and title in ready state;
- latest value and measurement time in ready state;
- optional stale-measurement note in ready state;
- loading, empty, and error presentations.

Target ranges, event actions, Timeline controls, and Quick Add entry points are
outside this block.

## Anatomy

Element hierarchy:

1. `section` landmark with `aria-labelledby`.
2. Card container with neutral border and `h-full` height for row alignment.
3. Ready layout:
   - decorative droplet icon;
   - eyebrow **Последнее измерение**;
   - title **Последняя глюкоза**;
   - primary value;
   - `time` element with machine `dateTime` and visible display time;
   - optional stale note.
4. Loading layout:
   - visually hidden title and status announcement;
   - decorative skeleton matching the ready silhouette.
5. Empty and error layout:
   - icon;
   - title;
   - message text.

## Variants

- **Light:** white surface, slate text and border, sky icon accent.
- **Dark:** dark slate surface, light text, dark border, and accessible sky
  accents.
- **Stale ready:** same ready layout with an additional informational note; no
  error styling on the value itself.

## States

### Ready

- Show eyebrow, title, value, and display time.
- Bind the visible time to a machine-readable ISO `dateTime`.
- Show the stale note when the measurement exceeds the approved threshold.
- Do not show a target range or in-range indicator.

### Loading

- Keep card dimensions stable.
- Announce loading with a screen-reader-only status.
- Hide decorative skeleton content from assistive technology.
- Do not show plausible glucose values.

### Empty

- Show the title and approved or custom empty message.
- Do not show value, time, or stale note.

### Error

- Show the title and approved or custom error message.
- Use error border and text styling without replacing the whole Dashboard.
- Do not show value, time, or stale note.

## Behavior

- The block is informational and not interactive in v1.0.
- The block does not open Quick Add, Timeline, or event details.
- Invalid ready input downgrades visually to the empty presentation.
- Stale measurements remain visible with an informational note only.
- No hover-only or gesture-only actions are exposed.

## Accessibility

- The block is a named `section` with a unique heading id.
- Loading exposes `aria-busy` and a polite status announcement.
- Empty uses `role="status"` with `aria-live="polite"`.
- Error uses `role="alert"` with `aria-live="assertive"`.
- The droplet icon is decorative and hidden from assistive technology.
- The visible measurement time uses a `time` element with ISO `dateTime`.
- Stale note text is exposed to assistive technology when present.
- Reduced-motion preferences disable loading skeleton animation.
- The whole card is not focusable because the block defines no interaction.

## Responsive Behavior

- Mobile: full-width card in the approved block order after Next Action.
- Tablet: occupies the first column (`sm:col-span-1`) beside Day Summary.
- Desktop: spans columns 1–7 (`lg:col-span-7`) beside Day Summary.
- `h-full` preserves equal row height with Day Summary when side by side.
- Text wraps within the card without creating horizontal page scrolling.

## Spacing and Sizing

| Element              | Rule                                      |
| -------------------- | ----------------------------------------- |
| Card padding         | 20 px (`p-5`)                             |
| Card corner radius   | 16 px (`rounded-2xl`)                     |
| Icon container       | 44 × 44 px (`size-11`)                    |
| Content gap          | 16 px (`gap-4`)                           |
| Title size           | 18 px bold                                |
| Value size           | 20 px bold                                |
| Display time size    | 14 px, tabular nums                       |
| Stale note size      | 12 px                                     |

## Typography

- Eyebrow: 14 px, secondary slate color.
- Title: 18 px bold.
- Value: 20 px bold, primary text color.
- Display time: 14 px, secondary slate color, tabular numerals.
- Empty and error message: 14 px.
- Stale note: 12 px, amber informational color.

## Dependencies

- [Dashboard Last Glucose Architecture](../../architecture/dashboard/last-glucose.md)
- [Dashboard Last Glucose Specification](../../specs/dashboard/last-glucose.md)
- [Dashboard Layout UI Specification](layout.md)
- [Typography](../../design-system/typography.md)
- [Spacing](../../design-system/spacing.md)

## Notes

- Visual baseline follows the Timeline `LastGlucoseCard` ready layout.
- Dark-theme styles are required even though the Timeline reference is
  light-only.
- The Dashboard shell mounts this block immediately after Next Action.
