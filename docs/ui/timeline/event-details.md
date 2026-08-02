# Timeline Event Details UI

## Status

Approved

## Layout

Mobile renders as a bottom sheet using available viewport height and safe-area
padding. Tablet and desktop render the same content as a centered dialog with a
readable max width.

## Composition

- Header: event kind label, event title, close button.
- Body: date/time, title, primary value, context, note, source.
- Footer: `Изменить` and `Удалить` actions.

## Accessibility

- Dialog has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and
  `aria-describedby`.
- Focus is trapped inside the open dialog.
- Escape closes the active dialog layer.
- Focus returns to the source card after non-destructive close.
- Focus outlines remain visible in light and dark contexts.
