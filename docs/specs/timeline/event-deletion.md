# Timeline Event Deletion Spec

## Status

Approved

## Dialog

Title: `Удалить событие?`

Description: `Это действие нельзя отменить.`

Buttons:

- `Отмена`
- `Удалить`

## Behavior

- Delete is available only from event details.
- Escape closes only the topmost confirmation dialog.
- Cancel closes confirmation and leaves details open.
- Confirm calls shared store `deleteEvent`, closes details, and returns focus to
  the Timeline list heading or another predictable Timeline target.
- The event disappears from Timeline and Dashboard derivations immediately.
- Undo is not implemented in this stage.
