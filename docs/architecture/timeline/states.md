# Timeline States Architecture

## Purpose

Define Timeline list states and their architectural boundaries.

## Status

Approved

## Responsibility

Timeline list states are derived from the shared Timeline store status plus the
event collection.

Supported states:

- `loading`;
- `ready`;
- `empty`;
- `filtered-empty`;
- `error`.

## Dependencies

- [Timeline List Architecture](list.md)
- [Timeline Shared State](shared-state.md)

## Notes

### Loading

Loading renders a compact skeleton and exposes `aria-busy="true"`. No artificial
timeout is introduced.

### Ready

Ready renders grouped event sections from `TimelineListModel`.

### Empty

Empty renders:

- title: `Событий пока нет`;
- description: `Добавьте первое событие, чтобы начать вести историю.`;
- CTA: `Добавить событие`.

The CTA opens the existing Timeline Quick Add host. It does not create another
Quick Add implementation.

### Filtered empty

Filtered empty renders when the shared store has events but local search/filter
criteria produce zero results.

It renders:

- title: `Ничего не найдено`;
- description: `Измените запрос или сбросьте фильтры.`;
- action: `Сбросить фильтры`.

It does not make Quick Add the primary action.

### Error

Error renders:

- title: `Не удалось загрузить события`;
- safe description from the model;
- `role="alert"`.

No retry button is shown until the store exposes a real retry/reset API.

### Boundaries

Top Bar and Quick Add remain available around the list states. Search, filters,
details, edit, delete, and pagination remain separate concerns layered around
state rendering.
