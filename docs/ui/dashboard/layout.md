# Dashboard Layout UI Specification

- **Version:** 1.0
- **Status:** Draft

## Purpose

This document defines the spatial structure, responsive behavior, ordering, and
screen-level states of the Dashboard. It is the layout contract for the
Dashboard UI and does not define component internals, business logic, data
contracts, or implementation technology.

## Scope

The specification covers only these approved Dashboard blocks:

1. Header
2. Next Action
3. Last Glucose
4. Day Summary
5. Recent Events
6. AI Insight
7. Quick Add

No additional Dashboard block is introduced by this document.

## Screen Goals

- Give the user one clear next step immediately after the Header.
- Present the latest health context and the current day summary without making
  the user scan the full event history.
- Provide a concise preview of recent activity without duplicating Timeline.
- Keep AI Insight visually secondary to recorded health data and the next
  action.
- Keep event capture available through one clear Quick Add entry point for the
  current viewport.
- Preserve the same content, meaning, and block order across supported screen
  sizes.

## Visual Hierarchy

The Dashboard has one primary visual focus: **Next Action**. Its placement,
available width, and visual weight must make it the first content block noticed
after the Header.

The remaining hierarchy is:

1. **Next Action** — primary task and only dominant content card.
2. **Last Glucose** and **Day Summary** — current status information.
3. **Recent Events** — a bounded recap of recent activity.
4. **AI Insight** — supporting interpretation, never stronger than recorded
   data.
5. **Quick Add** — a persistent utility action, not a competing content card.

The Header establishes page identity and global actions but must not compete
with Next Action as the content focus. Cards other than Next Action use
comparable neutral visual weight unless their own approved UI specification
defines a state that requires emphasis.

The Dashboard must not use gesture-only actions, undisclosed card actions, or
unlabeled icon actions. If a block is interactive, the affordance and result
must be visible or explicitly described by that block's specification.

Recent Events is a preview, not a compact Timeline. It must not introduce a
timeline rail, infinite history, date-group navigation, or independent event
history controls.

## Block Order

| Order | Block         | Layout role                                       |
| ----- | ------------- | ------------------------------------------------- |
| 1     | Header        | Page identity and viewport-specific global action |
| 2     | Next Action   | Primary full-width content block                  |
| 3     | Last Glucose  | Current-status card                               |
| 4     | Day Summary   | Current-day summary card                          |
| 5     | Recent Events | Bounded recent-activity preview                   |
| 6     | AI Insight    | Secondary supporting card                         |
| 7     | Quick Add     | Event-capture entry point                         |

The semantic reading order must follow this sequence. Responsive placement may
put Last Glucose beside Day Summary and Recent Events beside AI Insight, but it
must not reverse their reading or keyboard order.

Quick Add is the seventh functional block but does not occupy a card in the
normal content flow. On mobile and tablet it is represented by a floating
action button. On desktop it is represented by the Header action button.

## Container

The Header content and the Dashboard content grid share the same horizontal
alignment.

### Maximum Width

- Maximum content width: **1152 px**.
- The container is centered when the viewport is wider than the maximum width
  plus horizontal page padding.
- Cards never extend outside the container.
- Full-width means the full width of this container, not the viewport.

### Responsive Behavior

- The container is fluid below its maximum width.
- Layout changes occur at **640 px** and **1024 px**.
- The minimum supported viewport width is **320 px**.
- Content must reflow without horizontal scrolling at every supported width.

### Horizontal Padding

| Viewport          | Left and right padding |
| ----------------- | ---------------------- |
| 320–639 px        | 16 px                  |
| 640–1023 px       | 24 px                  |
| 1024 px and wider | 24 px                  |

Safe-area insets are added to these minimum values when required by the device.

### Vertical Spacing

- Mobile content starts **24 px** below the Header.
- Tablet and desktop content starts **32 px** below the Header.
- Standard desktop bottom padding is **40 px**.
- Mobile and tablet bottom padding must reserve at least **96 px** plus the
  bottom safe-area inset so the FAB does not cover the final block.

### Section Spacing

| Viewport          | Vertical space between grid rows |
| ----------------- | -------------------------------- |
| 320–639 px        | 16 px                            |
| 640–1023 px       | 20 px                            |
| 1024 px and wider | 24 px                            |

No block may add an external margin that changes this screen-level rhythm.
Spacing inside a block belongs to that block's UI specification.

## Grid

### Mobile

- One column.
- Every content card occupies the full container width.
- Blocks appear as one vertical sequence in the approved order.
- Grid gap: **16 px**.

### Tablet

- Two equal columns.
- Column gap: **20 px**.
- Row gap: **20 px**.
- Next Action spans both columns.
- Last Glucose occupies the first column.
- Day Summary occupies the second column.
- Recent Events spans both columns.
- AI Insight spans both columns.

### Desktop

- Twelve equal columns.
- Column gap: **24 px**.
- Row gap: **24 px**.
- Next Action spans columns 1–12.
- Last Glucose spans columns 1–7.
- Day Summary spans columns 8–12.
- Recent Events spans columns 1–8.
- AI Insight spans columns 9–12.

### Columns

The column system controls only screen-level placement. A block must not expose
its internal columns to adjacent blocks or align internal content by relying on
another block's content.

### Gap

The grid gap is the only horizontal distance between adjacent cards. Cards must
not add outer horizontal spacing.

### Margins

- At widths below the container maximum, outer margins are provided by page
  padding.
- Above the container maximum, remaining viewport space is divided equally
  between the left and right sides.
- Negative outer margins are not permitted.

## Block Spacing

### Distance Between Cards

- Mobile: **16 px**.
- Tablet: **20 px**.
- Desktop: **24 px**.
- A loading, empty, or error state must preserve the same distance.

### Card Width Rules

- Every card fills its assigned column area.
- Cards do not set an independent screen-level maximum width.
- Card content may wrap but must not increase the assigned grid width.
- No card may create horizontal page scrolling.
- Recent Events remains one Dashboard block even when it contains multiple
  event previews.

### Card Height Rules

- Card height is content-driven; fixed card heights are not permitted.
- Last Glucose and Day Summary use equal row height when displayed side by
  side.
- Recent Events and AI Insight align at their top edge on desktop and retain
  independent content-driven heights.
- Critical values, labels, controls, and error messages must not be clipped to
  preserve equal height.
- Loading placeholders reserve a representative block height to prevent large
  layout shifts when data appears.

## Scroll Behavior

- The page uses one vertical document scroll.
- Horizontal page scrolling is not permitted.
- The Header remains visible at the top while Dashboard content scrolls.
- Dashboard cards must not create nested vertical scroll regions.
- Recent Events displays only the bounded preview defined by its own
  specification; it must not become an independently scrolling Timeline.
- Opening Quick Add suspends background-page scrolling according to the
  approved Quick Add behavior.
- Closing Quick Add restores the previous Dashboard scroll position and returns
  focus to the control that opened it.

## Safe Areas

- The Header accounts for the top safe-area inset when the application occupies
  the full display.
- Horizontal container padding includes left and right safe-area insets where
  present.
- Mobile and tablet content includes bottom clearance for both the FAB and the
  bottom safe-area inset.
- No interactive control or critical value may be placed inside a device
  cutout, home-indicator area, or rounded-corner exclusion area.

## FAB Position

### Mobile

The mobile FAB is the Quick Add entry point for viewports below **1024 px**.

- Position: fixed to the bottom-right of the usable viewport.
- Size: **48 × 48 px**.
- Mobile offset: **16 px** from the right edge and **16 px** above the bottom
  safe-area inset.
- Tablet offset: **24 px** from the right edge and **24 px** above the bottom
  safe-area inset.
- The button remains visible while the Dashboard scrolls.
- The button is hidden while the Quick Add panel is open.
- The FAB contains a visible add symbol and an accessible name equivalent to
  “Add event.”
- It must not cover content, card controls, messages, or the final line of the
  final block.

### Desktop

At **1024 px and wider**, the Header action button is the required Quick Add
entry point. A desktop FAB is optional and is omitted by default in v1.0 to
avoid duplicate visual emphasis.

If a future approved variant enables the desktop FAB, it uses a **24 px**
right offset and a **24 px** bottom offset, preserves safe-area clearance, and
opens the same Quick Add flow. It must not introduce different behavior.

## Desktop Action Button

### Location

- Located at the trailing end of the Header's aligned content area.
- Remains visible without horizontal scrolling.
- Does not move into the Dashboard content grid.
- Replaces the FAB as the primary desktop Quick Add entry point.

### Size

- Minimum height: **44 px**.
- Width: content-driven.
- Minimum interactive width: **44 px**.
- Horizontal internal space: **16 px** on each side of the label.
- A visible text label equivalent to “Add event” is required; the desktop
  action must not be icon-only.

### Behavior

- Opens the same Quick Add panel and initial state as the mobile FAB.
- Does not submit, preselect, or create an event by itself.
- Remains a single action; it must not reveal hidden options on hover.
- Is unavailable while its Quick Add panel is already open.
- Returns keyboard focus when the panel closes.
- Is replaced by the FAB below the desktop breakpoint.

## Empty Dashboard

An empty Dashboard preserves the approved block order and does not introduce a
new global empty-state block.

- Header remains visible.
- Quick Add remains available.
- Next Action remains in position and presents its approved no-action state.
- Last Glucose explicitly communicates that no measurement is available.
- Day Summary communicates that no summary data is available; missing data must
  not be represented as a real zero.
- Recent Events communicates that there are no recent events and does not
  render an empty Timeline structure.
- AI Insight presents its approved unavailable state and does not fabricate an
  insight.
- Empty-state text and actions remain inside their owning cards.
- Empty cards are not removed or reordered.

## Loading Dashboard

- Header geometry remains stable while content loads.
- Blocks 2–6 reserve their final grid positions and present block-level loading
  placeholders.
- Loading placeholders reflect each block's general silhouette without showing
  plausible health values.
- A full-screen spinner must not replace the Dashboard layout.
- Blocks may resolve independently without changing order.
- Loading state is programmatically exposed and announced once without
  repeatedly interrupting assistive technology.
- Quick Add availability is not changed solely because Dashboard summary data
  is loading.
- The transition from loading to content should not produce a large page jump.

## Error Dashboard

- A block-level failure is displayed inside the failed block's existing grid
  area.
- Other successfully loaded blocks remain visible and retain their positions.
- A full data failure keeps the Header, approved section order, and Quick Add
  entry point available.
- Errors use user-facing language and never expose technical details.
- Failed health values are shown as unavailable, never as zero or stale data
  presented as current.
- Retry controls appear only when the owning block specification defines a
  retry action; they must be visible and labeled.
- Error states must not add a new Dashboard block, reorder cards, or redirect
  the user to Timeline automatically.

## Accessibility

- The page exposes one main content landmark and one clearly identified
  top-level page heading.
- Every Dashboard block is a named section with a unique heading.
- The semantic reading order follows Header, Next Action, Last Glucose, Day
  Summary, Recent Events, AI Insight, and the viewport-specific Quick Add
  control.
- Keyboard focus order follows the visible order; positive focus-order
  overrides are not permitted.
- All controls have a minimum **44 × 44 px** interactive area.
- Focus indicators are visible against every supported state and surface.
- Information, selection, loading, success, and error states do not rely on
  color alone.
- Text and essential controls meet WCAG 2.2 AA contrast requirements.
- At 200% zoom, content reflows without overlap or loss of functionality.
- At 400% zoom and a 320 px effective width, the content uses the mobile
  single-column layout.
- Dynamic loading and error changes are announced without moving focus
  unexpectedly.
- Decorative imagery and icons are ignored by assistive technology; meaningful
  icons have an accessible text equivalent.
- Reduced-motion preferences are respected for layout transitions and Quick Add
  presentation.
- A whole card is not interactive unless its block specification defines that
  behavior and provides a visible affordance.

## Responsive Rules

| Range             | Content grid | Page padding | Gap   | Quick Add entry      |
| ----------------- | ------------ | ------------ | ----- | -------------------- |
| 320–639 px        | 1 column     | 16 px        | 16 px | FAB                  |
| 640–1023 px       | 2 columns    | 24 px        | 20 px | FAB                  |
| 1024 px and wider | 12 columns   | 24 px        | 24 px | Header action button |

Additional rules:

- No approved block is removed because of viewport width.
- Content meaning and actions remain equivalent across breakpoints.
- Last Glucose precedes Day Summary whenever their row collapses.
- Recent Events precedes AI Insight whenever their row collapses.
- Text wraps before a card is allowed to overflow.
- Controls may wrap within their owning block but must not reorder blocks.
- The Header action and FAB must not both be required to discover Quick Add.
- Responsive changes must not turn Recent Events into Timeline.
- Viewport height does not change the selected column layout; it affects only
  the amount of content visible before scrolling.

## Layout Acceptance Criteria

1. The Dashboard contains exactly the seven approved blocks.
2. Blocks retain the approved semantic order at every supported width.
3. Next Action is the first and only dominant content card.
4. The content container is centered and never exceeds 1152 px.
5. A 320 px viewport has no horizontal scrolling or clipped critical content.
6. Mobile uses one column with 16 px page padding and 16 px gaps.
7. Tablet uses two columns with the documented spans, 24 px page padding, and
   20 px gaps.
8. Desktop uses twelve columns with the documented spans, 24 px page padding,
   and 24 px gaps.
9. Last Glucose and Day Summary remain in that order and share a row only when
   space permits.
10. Recent Events and AI Insight remain in that order and use the documented
    desktop spans.
11. Recent Events is a bounded preview and does not reproduce Timeline
    structure or behavior.
12. Cards fill their assigned grid areas and use content-driven height.
13. The page has one vertical scroll and no nested card scrolling.
14. Safe-area insets protect the Header, content, and Quick Add controls.
15. Below 1024 px, a 48 × 48 px FAB opens Quick Add and content has sufficient
    bottom clearance.
16. At 1024 px and wider, a visible Header action button opens Quick Add.
17. A desktop FAB is not required and is absent by default.
18. Empty, loading, and error states preserve block ownership, order, and grid
    position.
19. Missing or failed health data is never represented as a valid zero or
    fabricated value.
20. All interactive controls are visible, labeled, keyboard accessible, and at
    least 44 × 44 px.
21. Focus returns to the Quick Add trigger after its panel closes.
22. The layout remains usable at 200% zoom and reflows to one column at a
    320 px effective width.
23. No breakpoint introduces a new block, hidden action, or different Quick Add
    behavior.

## Dependencies

- [Dashboard Architecture Overview](../../architecture/dashboard/overview.md)
- [Dashboard Layout Architecture](../../architecture/dashboard/layout.md)
- [Dashboard Responsive Architecture](../../architecture/dashboard/responsive.md)
- [Dashboard States Architecture](../../architecture/dashboard/states.md)
- [Header Architecture](../../architecture/dashboard/header.md)
- [Next Action Architecture](../../architecture/dashboard/next-action.md)
- [Last Glucose Architecture](../../architecture/dashboard/last-glucose.md)
- [Day Summary Architecture](../../architecture/dashboard/day-summary.md)
- [Recent Events Architecture](../../architecture/dashboard/recent-events.md)
- [AI Insight Architecture](../../architecture/dashboard/ai-insight.md)
- [Quick Add Integration Architecture](../../architecture/dashboard/quick-add-integration.md)
- [Quick Add UI](quick-add.md)
- [Quick Add Approved Behavior](../../ui-bible/003-quick-add.md)
- [Event Card System](../../ui-bible/002-event-card-system.md)

## Notes

This document defines only screen-level layout. Typography, color, card
anatomy, content rules, validation, data behavior, and interaction details
remain the responsibility of the corresponding block specifications.
