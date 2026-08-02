# Dashboard Day Summary UI

## Purpose

Define the visual hierarchy, responsive composition, states, and accessibility
of the Dashboard Day Summary block.

## Status

Approved

## Scope

The block contains only:

- calendar icon;
- eyebrow and title in ready state;
- current-day label in ready state;
- three primary metric tiles;
- two secondary metric tiles;
- loading, empty, and error presentations.

Charts, comparisons, TIR, GMI, AI insight, and interactive actions are outside
this block.

## Anatomy

Element hierarchy:

1. `section` landmark with `aria-labelledby`.
2. Card container with neutral border and `h-full` for row alignment with Last
   Glucose.
3. Ready layout:
   - decorative calendar icon;
   - eyebrow **Текущий день**;
   - title **Сводка дня**;
   - `time` element with machine `dayDate` and visible day label;
   - primary metric grid;
   - secondary metric grid.
4. Loading layout:
   - visually hidden title and status announcement;
   - decorative skeleton matching the ready silhouette.
5. Empty and error layout:
   - icon;
   - title;
   - message text.

## Variants

- **Light:** white surface, slate text and border, violet icon accent.
- **Dark:** dark slate surface, light text, dark border, and accessible violet
  accents.

## States

### Ready

- Show eyebrow, title, current-day label, and all approved metrics.
- Bind the visible day label to machine-readable `YYYY-MM-DD`.
- Primary metrics use stronger visual weight than secondary metrics.
- Do not show charts, comparisons, TIR, GMI, or AI content.

### Loading

- Keep card dimensions stable.
- Announce loading with a screen-reader-only status.
- Hide decorative skeleton content from assistive technology.
- Do not show plausible summary values.

### Empty

- Show the title and approved or custom empty message.
- Do not show metrics or day label.

### Error

- Show the title and approved or custom error message.
- Use error border and text styling without replacing the whole Dashboard.
- Do not show metrics or day label.

## Behavior

- The block is informational and not interactive in v1.0.
- Invalid ready input downgrades visually to the empty presentation.
- No hover-only or gesture-only actions are exposed.

## Accessibility

- The block is a named `section` with a unique heading id.
- Loading exposes `aria-busy` and a polite status announcement.
- Empty uses `role="status"` with `aria-live="polite"`.
- Error uses `role="alert"` with `aria-live="assertive"`.
- The calendar icon is decorative and hidden from assistive technology.
- Metrics use a semantic `dl` with `dt` labels and `dd` values.
- The visible day label uses a `time` element with `dayDate`.
- Reduced-motion preferences disable loading skeleton animation.

## Responsive Behavior

- Mobile: full-width card after Last Glucose in the approved order.
- Tablet: occupies the second column (`sm:col-span-1`) beside Last Glucose.
- Desktop: spans columns 8–12 (`lg:col-span-5`) beside Last Glucose.
- `h-full` preserves equal row height with Last Glucose when side by side.
- Primary metrics use one column on mobile and three columns from `sm` upward.
- Secondary metrics use one column on mobile and two columns from `sm` upward.

## Spacing and Sizing

| Element              | Rule                           |
| -------------------- | ------------------------------ |
| Card padding         | 20 px (`p-5`)                  |
| Card corner radius   | 16 px (`rounded-2xl`)          |
| Icon container       | 44 × 44 px (`size-11`)         |
| Header gap           | 16 px (`gap-4`)                |
| Primary metric gap   | 12 px (`gap-3`)                |
| Secondary gap        | 12 px (`gap-3`)                |
| Primary value size   | 18 px bold                     |
| Secondary value size | 16 px bold                     |
| Label size           | 12 px primary, 11 px secondary |

## Typography

- Eyebrow: 14 px, secondary slate color.
- Title: 18 px bold.
- Day label: 14 px, secondary text color.
- Primary metric labels: 12 px.
- Secondary metric labels: 11 px.
- Empty and error message: 14 px.

## Dependencies

- [Dashboard Day Summary Architecture](../../architecture/dashboard/day-summary.md)
- [Dashboard Day Summary Specification](../../specs/dashboard/day-summary.md)
- [Dashboard Layout UI Specification](layout.md)
- [Typography](../../design-system/typography.md)
- [Spacing](../../design-system/spacing.md)

## Notes

- Visual baseline is Dashboard-owned; Timeline no longer renders a Day Summary
  panel.
- The Dashboard shell mounts this block immediately after Last Glucose.
