# Timeline Event Details Spec

## Status

Approved

## Behavior

- Open details by activating a Timeline event card with click, Enter, or Space.
- Render a mobile sheet and desktop dialog with `role="dialog"` and
  `aria-modal="true"`.
- Close via close button, backdrop, or Escape.
- Return focus to the originating card when the event still exists.
- Keep the route unchanged.

## Detail model

`createTimelineEventDetailModel(event)` prepares:

- kind label;
- title;
- primary text (`value` plus `unit` when unit is separate);
- formatted date;
- formatted time;
- context;
- note;
- source label;
- edit/delete availability.

Source labels:

- `manual` -> `Вручную`
- `demo` -> `Демо-данные`
- `device` -> `Устройство`
- `import` -> `Импорт`

Absent source and optional fields are not rendered.
