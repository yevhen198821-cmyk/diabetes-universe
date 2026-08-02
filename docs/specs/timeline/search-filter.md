# Timeline Search and Filters Specification

## Status

Approved

## Purpose

Specify quick text search and single type filtering for Timeline.

## Search Requirements

- Input hint: `Поиск событий`.
- Search updates results immediately on input.
- Enter does not navigate.
- Escape clears the query when focus is in the search input.
- Clear button appears only when query is non-empty.
- Query is trimmed, lower-cased, and repeated spaces are collapsed.
- Search uses partial matching.

## Searchable Fields

- title;
- value;
- unit;
- context;
- note;
- kind display label.

## Filter Requirements

Filters:

1. Все
2. Глюкоза
3. Инсулин
4. Питание
5. Лекарства
6. Активность
7. Заметки

Rules:

- one filter is active at a time;
- `all` does not restrict events;
- filter and search criteria combine;
- filters do not update the shared store;
- date filters are out of scope.

## Result Summary

- No active criteria: `{count} событий`.
- Active criteria with results: `Найдено: {count}`.
- Active criteria without results: `Ничего не найдено`.

## Empty States

- Store empty uses the Timeline empty state and offers Quick Add.
- Filtered empty uses `Ничего не найдено`, description
  `Измените запрос или сбросьте фильтры.`, and action `Сбросить фильтры`.

## Non-Goals

- Fuzzy search.
- Date filtering.
- Saved filters.
- URL query synchronization.
- Backend/API search.
