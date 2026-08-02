# Timeline Event Deletion Architecture

## Purpose

Define destructive deletion of an existing Timeline event through the details
dialog.

## Status

Approved

## Responsibility

Deletion owns:

- opening a separate confirmation dialog from event details;
- requiring explicit confirmation;
- calling shared store `deleteEvent`;
- closing details after successful deletion;
- moving focus to a predictable Timeline target.

Deletion does not own undo, inline swipe actions, card-level delete buttons, or
API transport.

## Notes

- The confirmation dialog title is `Удалить событие?`.
- The description is `Это действие нельзя отменить.`
- Default focus is on the safe cancel action, not the destructive action.
- Successful deletion triggers neutral/success haptic feedback.
- Dashboard updates automatically because selectors read from the shared store.
