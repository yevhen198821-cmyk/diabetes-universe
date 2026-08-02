# Timeline Event Editing UI

## Status

Approved

## Layout

Editing uses the same dialog/sheet container as details. The body becomes a
scrollable form, and save/cancel actions remain reachable on mobile.

## Form

The form exposes shared Timeline fields:

- date input;
- time input;
- title input;
- value textarea;
- unit input;
- context input;
- note textarea.

Validation errors are shown next to fields, fields use `aria-invalid`, and error
messages are connected through `aria-describedby`.

## Interaction

- `Отмена` returns to detail view without mutating the store.
- `Сохранить` validates and writes to the shared store.
- Successful save triggers success haptic feedback.
- No inline card editing is provided.
