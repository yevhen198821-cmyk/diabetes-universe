# Timeline Pagination UI

## Status

Approved

## Load More

The Timeline uses an explicit `Показать ещё` button. There is no auto infinite
scroll and no IntersectionObserver in this stage.

## Accessibility

- Load More is a native button.
- Minimum touch target is 44px high.
- `aria-controls` points to the Timeline list when the list is rendered.
- A polite live region announces how many events were added.
- Focus remains on the button after activation.
- Keyboard Enter and Space work through native button behavior.

## Responsive behavior

- Mobile: the button uses the available width and remains clear of the floating
  add button.
- Tablet/Desktop: the button uses comfortable readable width and aligns with the
  Timeline column.
- The shell keeps enough bottom padding so the FAB does not cover the control.
- No horizontal scroll is introduced.

## Visual style

Load More is a secondary action, not a primary medical action. It uses neutral
border/background styling with visible focus, hover, and dark-mode contrast.
