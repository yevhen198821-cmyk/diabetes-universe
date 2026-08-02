# Dashboard Next Action UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard Next Action block.

## Status

Approved

## Scope

The block contains only:

- ready-state eyebrow title from the shared `NextStep` contract;
- ready-state primary description;
- ready-state action button;
- loading, empty, and error presentations.

Quick Add, Timeline navigation, and action ranking are outside this block.

## Anatomy

Element hierarchy:

1. `section` landmark with `aria-labelledby`.
2. Full-width card with teal emphasis ring in ready and loading states.
3. Ready layout:
   - eyebrow title;
   - primary description heading;
   - shared `Button` action.
4. Loading layout:
   - screen-reader-only status announcement;
   - decorative skeleton matching the ready silhouette.
5. Empty and error layout:
   - title heading;
   - optional description message.

## Variants

- **Light:** white surface, slate text, teal emphasis ring and action accents.
- **Dark:** dark slate surface, light text, and accessible teal accents.
- **Error:** rose border and ring emphasis with error text styling.

## States

### Ready

- Show the `NextStep` title, description, and action label.
- Keep the action enabled unless `actionDisabled` is true.
- Invoke `onAction` from the visible button only.

### Loading

- Keep card geometry stable.
- Announce loading with a screen-reader-only status.
- Hide decorative skeleton content from assistive technology.
- Do not show action content or plausible task text.

### Empty

- Show the supplied title and optional description.
- Do not render an action button.

### Error

- Show the supplied title and optional description.
- Use error border, ring, and text styling.
- Do not render an action button.

## Behavior

- The block is the only dominant Dashboard content card.
- The ready action is a single explicit button; no hover-only affordances.
- The owner may disable the ready action while another blocking flow is open.
- Empty and error states remain in the approved grid position.

## Accessibility

- The block is a named `section` with a unique heading id.
- Loading exposes `aria-busy` and a polite status announcement.
- Empty uses `role="status"` with `aria-live="polite"`.
- Error uses `role="alert"` with `aria-live="assertive"`.
- The ready action uses the shared `Button` focus and disabled semantics.
- Reduced-motion preferences disable loading skeleton animation.

## Responsive Behavior

- The block spans the full Dashboard grid width at every breakpoint.
- On mobile, the action button stacks below the description and fills the card
  width.
- From `sm` upward, the action aligns to the trailing edge in the same row as
  the description when space permits.

## Dependencies

- [Dashboard Next Action Architecture](../../architecture/dashboard/next-action.md)
- [Dashboard Next Action Specification](../../specs/dashboard/next-action.md)
- [Dashboard Layout UI](layout.md)
- [Buttons](../../design-system/buttons.md)

## Notes

- `DashboardRoot` currently supplies a no-op `onAction` callback in the demo
  screen while Quick Add entry remains owned by Header and FAB.
