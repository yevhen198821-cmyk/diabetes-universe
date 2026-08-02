# Timeline Search and Filters UI

## Status

Approved

## Purpose

Describe Timeline search/filter controls across responsive layouts.

## Layout

Search and filters live in a toolbar below the main Timeline heading.

Mobile:

- visible full-width search field;
- horizontally scrollable chip row;
- no horizontal page scroll;
- result summary below controls.

Tablet/Desktop:

- search and chips stay within the readable Timeline column;
- controls remain compact;
- no second add action is introduced while FAB is the primary add entry.

## Search

- Search icon inside the input.
- Clear button with `aria-label="Очистить поиск"` appears only when needed.
- `type="search"` is allowed; behavior remains local and immediate.

## Filters

- Chips are `button` elements.
- Minimum height is 44px.
- Selected state uses `aria-pressed="true"`.
- Visible focus ring is required.
- Filter row can scroll internally on mobile.

## Result Summary

Result text uses `aria-live="polite"` and avoids layout shifts.

## Accessibility

- Search has a programmatic label.
- Escape clears only the focused search input.
- Chips are keyboard accessible by Tab and Enter/Space.
- Focus does not move when results update.

## Out of Scope

Date filters, details, edit, delete, pagination, and API error handling are not
part of this stage.
