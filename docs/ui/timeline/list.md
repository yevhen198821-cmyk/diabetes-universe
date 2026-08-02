# Timeline List UI

## Status

Approved

## Purpose

Describe the visual presentation of grouped Timeline event history.

## Layout

- Mobile: one column with readable spacing and bottom padding for the FAB.
- Tablet: one wide column with comfortable horizontal padding.
- Desktop: one readable-width column; the list does not stretch excessively.

## Groups

- Group heading uses compact text and a divider line.
- Groups are separated by clear vertical spacing.
- The rail is scoped per group and stops at the last event in that group.
- Older dates are shown as localized date labels.

## Event Cards

- Compact `EventCard` is reused.
- Timeline cards render as visible-focus buttons when opening details.
- The touch target remains at least 44px high through the card surface.

## Responsive Rules

- No horizontal scroll.
- Long date labels wrap safely if needed.
- FAB must not cover the last card or Load More control; the shell provides
  bottom padding.

## Non-Goals

The list view does not own search/filter logic, edit/delete forms, pagination
state, or API transport.
