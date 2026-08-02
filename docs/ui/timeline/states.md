# Timeline States UI

## Status

Approved

## Purpose

Describe Timeline list visual states.

## Loading

- Card-like container.
- Three compact skeleton rows.
- `motion-reduce` disables animation where requested.
- Screen-reader status announces loading.

## Empty

- Centered card.
- Title: `Событий пока нет`.
- Description: `Добавьте первое событие, чтобы начать вести историю.`
- Primary CTA: `Добавить событие`.

## Filtered Empty

- Centered card.
- Title: `Ничего не найдено`.
- Description: `Измените запрос или сбросьте фильтры.`
- Secondary CTA style: `Сбросить фильтры`.
- Quick Add remains available through FAB, but is not the primary action.

## Error

- Card-like container with rose border and text.
- Title: `Не удалось загрузить события`.
- Description is safe and non-technical.
- No retry button until retry is implemented in store.

## Ready

- Grouped sections.
- Existing compact Event Cards.
- Timeline rail scoped to each day group.

## Accessibility

- Visible focus on CTA.
- Error uses alert semantics from the component.
- Loading and empty states do not trap focus.
- Event cards remain semantic articles, not buttons.
