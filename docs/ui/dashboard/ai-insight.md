# Dashboard AI Insight UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard AI Insight block.

## Status

Approved

## Scope

The block contains only:

- sparkles icon and title in ready state;
- automatic-explanation eyebrow and disclaimer in ready state;
- one shared `EventCard` `ai_insight` preview;
- loading, empty, and error presentations.

Diagnosis, treatment plans, dosing advice, forecasts, and interactive AI
controls are outside this block.

## Anatomy

Element hierarchy:

1. `section` landmark with `aria-labelledby`.
2. Card container with neutral border.
3. Ready layout:
   - header with icon, eyebrow, title, and disclaimer;
   - one `EventCard` preview in `standard` variant without `onClick`.
4. Loading layout:
   - visually hidden title and status announcement;
   - decorative skeleton for header and one card placeholder.
5. Empty and error layout:
   - icon;
   - title;
   - message text.

## Variants

- **Light:** white surface, slate text and border, teal icon accent.
- **Dark:** dark slate surface, light text, dark border, and accessible teal
  accents.

## States

### Ready

- Show eyebrow, title, disclaimer, and one confirmed insight preview.
- Use the shared `ai_insight` EventCard styling.
- Show related-event reference through card context text.
- Do not show multiple insights.

### Loading

- Keep card dimensions stable.
- Announce loading with a screen-reader-only status.
- Hide decorative skeleton content from assistive technology.
- Do not show plausible insight text.

### Empty

- Show the title and approved or custom empty message.
- Do not show disclaimer, insight preview, or related-event reference.

### Error

- Show the title and approved or custom error message.
- Use error border and text styling without replacing the whole Dashboard.
- Do not show disclaimer, insight preview, or related-event reference.

## Behavior

- The block is informational and not interactive in v1.0.
- Invalid ready input downgrades visually to the empty presentation.
- No diagnosis, treatment, dosing, or forecast content is rendered.

## Accessibility

- The block is a named `section` with a unique heading id.
- Loading exposes `aria-busy` and a polite status announcement.
- Empty uses `role="status"` with `aria-live="polite"`.
- Error uses `role="alert"` with `aria-live="assertive"`.
- The sparkles icon is decorative and hidden from assistive technology.
- The insight preview relies on `EventCard` accessible labels.
- Reduced-motion preferences disable loading skeleton animation.

## Responsive Behavior

- Mobile: full-width card after Recent Events in the approved order.
- Tablet: spans both columns (`col-span-full`).
- Desktop: spans columns 9–12 (`lg:col-span-4`) beside Recent Events.
- Text wraps within the card without creating horizontal page scrolling.

## Spacing and Sizing

| Element            | Rule                          |
| ------------------ | ----------------------------- |
| Card padding       | 20 px (`p-5`)                 |
| Card corner radius | 16 px (`rounded-2xl`)         |
| Icon container     | 44 × 44 px (`size-11`)        |
| Header gap         | 16 px (`gap-4`)               |
| Preview top margin | 16 px (`mt-4`)                |
| Disclaimer size    | 12 px                         |

## Typography

- Eyebrow: 14 px, secondary slate color.
- Title: 18 px bold.
- Disclaimer: 12 px, secondary slate color.
- Empty and error message: 14 px.
- Insight preview typography follows the shared `EventCard` standard variant.

## Dependencies

- [Dashboard AI Insight Architecture](../../architecture/dashboard/ai-insight.md)
- [Dashboard AI Insight Specification](../../specs/dashboard/ai-insight.md)
- [Dashboard Layout UI Specification](layout.md)
- [Event Card System](../../ui-bible/002-event-card-system.md)
- [Typography](../../design-system/typography.md)

## Notes

- AI Insight must remain visually secondary to recorded health data.
- The Dashboard shell mounts this block after Recent Events.
