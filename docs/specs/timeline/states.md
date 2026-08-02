# Timeline States Specification

## Status

Approved

## Purpose

Specify loading, ready, empty, filtered-empty, and error behavior for the
Timeline list.

## State Rules

| State            | Trigger                               | UI                             |
| ---------------- | ------------------------------------- | ------------------------------ |
| `loading`        | Store status is `loading`             | Skeleton, `aria-busy="true"`   |
| `ready`          | Store ready with visible events       | Grouped event list             |
| `empty`          | Store ready with no events            | Empty message + Quick Add CTA  |
| `filtered-empty` | Store ready, criteria hide all events | No-results message + reset CTA |
| `error`          | Store status is `error`               | Alert with safe description    |

## Empty CTA

The empty CTA label is `Добавить событие`. It opens the existing Timeline Quick
Add host and must be keyboard accessible.

## Filtered Empty CTA

The filtered-empty CTA label is `Сбросить фильтры`. It clears query and returns
the active filter to `all`.

## Error

The error title is `Не удалось загрузить события`. Retry is not shown until a
real store retry/reset action exists.

## Accessibility Requirements

- Loading exposes a screen-reader status.
- Error uses `role="alert"`.
- Group headings keep a logical heading hierarchy under the main Timeline
  heading.
- Timeline event cards stay keyboard accessible when details are available.

## Non-Goals

API retry/revalidation states are outside the current client-side demo module.
