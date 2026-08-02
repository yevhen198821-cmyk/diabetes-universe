# Timeline Event Deletion UI

## Status

Approved

## Presentation

Deletion uses a nested confirmation dialog above the event details dialog.
The destructive button is visually distinct with rose/red styling and readable
contrast in light and dark contexts.

## Accessibility

- Confirmation has `role="dialog"` and `aria-modal="true"`.
- Title and description are associated through ARIA.
- Focus trap is scoped to the confirmation while it is open.
- Escape closes the confirmation.
- Initial focus is not placed on the destructive action.

## Constraints

- No swipe actions.
- No inline delete buttons on compact Timeline cards.
- No undo in the current stage.
