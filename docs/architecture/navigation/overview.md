# Navigation Overview

## Purpose

Define approved application routes and navigation contracts between the home
Dashboard screen and the Timeline journal screen.

## Status

Approved

## Responsibility

- `/` is the canonical home route and renders Dashboard.
- `/timeline` is the canonical journal route and renders Timeline.
- `/dashboard` is a temporary compatibility alias that redirects to `/`.
- Dashboard links **Все события** to `/timeline`.
- Timeline provides explicit back navigation to `/`.
- Dashboard and Timeline remain separate screens with separate responsibilities.

## Dependencies

- [Dashboard Overview](../dashboard/overview.md)
- [Timeline Overview](../timeline/overview.md)
- [Timeline Shared State](../timeline/shared-state.md)

## Notes

### Route map

| Route        | Screen    | Behavior                         |
| ------------ | --------- | -------------------------------- |
| `/`          | Dashboard | Home screen                      |
| `/timeline`  | Timeline  | Event journal                    |
| `/dashboard` | —         | Server redirect to `/` (308/307) |

### Navigation flows

- Dashboard → Timeline: **Все события** (`viewAllHref="/timeline"`).
- Timeline → Dashboard: Top Bar back link (`href="/"`, label **На главную**).
- SPA navigation between `/` and `/timeline` keeps the app-level Timeline store
  mounted, so demo events added on one screen remain visible on the other.

### Responsibility split

**Dashboard** aggregates current state: Next Action, Last Glucose, Day Summary,
Recent Events, AI Insight, Quick Add.

**Timeline** is the event journal: search, filters, grouped history, details,
edit, delete, Quick Add, pagination / load more. Timeline must not duplicate
Dashboard summary blocks.

Future modules should link to these canonical routes rather than introducing
duplicate aliases.
