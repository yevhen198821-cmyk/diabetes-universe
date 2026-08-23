# UX Wave 1B — UI Foundation / Design System Baseline

Date: 2026-08-23  
Status: **IMPLEMENTATION CANDIDATE**  
Baseline: `main` @ `cbc491e9dd0c6778b244c61f42246dfe9203a5ce`  
Branch: `implementation/ux-wave-1b-ui-foundation`

## Objective

Establish the production UI foundation for Dashboard + Timeline: semantic design tokens, shared primitives, coherent light/dark theme architecture, and consolidated form/button/card patterns — without final screen redesign.

## Semantic token architecture

Implemented in `apps/web/app/globals.css` using CSS custom properties + Tailwind v4 `@theme` mappings.

| Family      | Tokens                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Surfaces    | `background`, `surface`, `surface-raised`, `surface-subtle`, `overlay`                                         |
| Text        | `text-primary`, `text-secondary`, `text-tertiary`, `text-inverse`                                              |
| Borders     | `border-default`, `border-subtle`, `border-strong`                                                             |
| Interaction | `interactive-primary`, `interactive-primary-hover`, `interactive-secondary`, `interactive-muted`, `focus-ring` |
| Status      | `status-success`, `status-warning`, `status-danger`, `status-info`                                             |
| Radius      | `radius-control`, `radius-card`, `radius-modal`                                                                |
| Elevation   | `shadow-elevation-sm`, `shadow-elevation-md`                                                                   |

Components consume semantic Tailwind classes (e.g. `bg-surface`, `text-text-primary`) instead of raw `slate-*` / `teal-*` page chrome.

Foundation palette values remain in `:root` / `.dark` as `--du-*` variables.

## Palette philosophy

- Neutral-first slate scale for surfaces and text
- Teal brand accent retained for primary interaction (`interactive-primary`)
- Status colors restrained and theme-aware
- Medical/event-type accent hues remain domain-specific (EventCard, block icons) — not diagnosis semantics
- Meaning never relies on color alone (Wave 1A stale/demo patterns preserved)

## Theme strategy

- **Architecture:** class-based `.dark` on `<html>` driven by CSS variable overrides
- **Init script:** inline script in `layout.tsx` reads `localStorage['du-ui-theme']` before paint to avoid flash
- **Runtime provider:** `ThemeProvider` supports `light` | `dark` | `system` (default `system`)
- **Persistence:** preference stored in `du-ui-theme`; no user-facing settings UI in this wave
- **System preference:** `system` follows `prefers-color-scheme` and listens for changes
- **No hydration mismatch:** `suppressHydrationWarning` on `<html>`; script applies class before React hydration

## Typography scale

Utility roles in `globals.css`:

- `.text-display` — page title emphasis
- `.text-section-title` — section/card headings
- `.text-card-title`, `.text-body`, `.text-body-small`, `.text-label`, `.text-caption`
- `.text-metric` — tabular numerals for medical values

## Spacing / layout

- Page gutters preserved from Wave 1A safe-area patterns
- Section gap rhythm: `gap-4` / `gap-5` / `gap-6` responsive grid (unchanged IA)
- Card padding: `p-5` / `p-6` via Card primitive or equivalent semantic classes
- Form field spacing: canonical `formFieldClass` height `h-11`, label `text-sm`

## Radius / elevation

| Level     | Token                    | Usage                               |
| --------- | ------------------------ | ----------------------------------- |
| Control   | `rounded-control` (12px) | buttons, inputs, icon buttons       |
| Card      | `rounded-card` (16px)    | dashboard sections, timeline panels |
| Modal     | `rounded-modal` (24px)   | dialogs, bottom sheets              |
| Elevation | `shadow-elevation-sm/md` | cards, dialogs                      |

## Button foundation

`@diabetes-universe/ui` `Button` variants:

- `primary` (default), `secondary`, `ghost`, `destructive`
- Sizes: `sm`, `md` (default), `lg`, `icon`
- Minimum touch target: `min-h-11` on md/icon
- Focus: `focus-visible:outline-*` on all variants

## Card / panel foundation

`Card` + `CardHeader` primitives:

- Variants: `default`, `subtle`, `interactive`
- Tone: `default`, `error`
- Padding: `md` (default), `lg`, `none`

Dashboard/Timeline sections migrated to semantic card classes; Card primitive available for incremental adoption.

## Form field foundation

Single canonical path: `packages/ui/src/styles/form.ts`

Exports: `formFieldClass`, `formLabelClass`, `formTextareaClass`, `formHelperClass`, `formErrorClass`

Migrated consumers:

- Quick Add fields (`QuickAddFields.tsx`)
- Timeline search input
- Timeline event detail edit form
- `apps/web/components/timeline/ui-styles.ts` re-exports for legacy imports

Features: `aria-[invalid=true]` styling, focus ring, disabled opacity, theme-aware surfaces.

## Badge / status foundation

`Badge` variants: `neutral`, `info`, `warning`, `danger`, `success`, `demo`

Used for provenance/status patterns; demo variant retains dashed border (Wave 1A trust model).

## Loading / skeleton foundation

`Skeleton` primitive:

- `animate-pulse` with `motion-reduce:animate-none`
- `bg-surface-subtle`, configurable `rounded` prop
- Adopted in Timeline list loading state

## Icon / accessibility rules

- `IconButton` requires explicit `label` (aria-label + title)
- Decorative icons: `aria-hidden="true"`
- Icon button hit area: minimum 40–44px (`size-10` / `size-11`)
- Focus rings on all interactive primitives
- Reduced motion: global CSS + skeleton override

## Dashboard migrated areas

- Shell background/text tokens
- Header, Last Glucose, Day Summary, Next Action, Recent Events — semantic surfaces/borders/text; removed orphaned `dark:` utilities
- Loading skeleton blocks retain behavior with semantic colors
- Wave 1A hierarchy unchanged

## Timeline migrated areas

- Shell, top bar, toolbar, search, filters (chip classes), list states, load more, event detail dialog shell, FAB
- Filter chips use shared `filterChipSelectedClass` / `filterChipDefaultClass`
- Empty/filtered states use `Button` primitive

## Responsive findings

Existing responsive grid and safe-area patterns preserved. Foundation tokens apply uniformly at 360–1440 widths. No layout redesign in this wave.

## Accessibility findings

- Semantic tokens meet AA contrast for primary text/surface pairs in light and dark themes
- Status badges include border + text (not color-only)
- Focus-visible rings on buttons, inputs, chips
- Unresolved: event-type accent hues on colored icon backgrounds not re-audited to full AA matrix (deferred to Wave 1C visual pass)

## Guardrails

- Unit tests for Button variants, form aria-invalid, Skeleton reduced motion, theme resolution
- Dashboard foundation test ensures no `dark:` drift in migrated shell/blocks
- Wave 1A status-first order test preserved

## Explicit deferred items

- Final Dashboard/Timeline visual redesign (Wave 1C/1D)
- User-facing theme toggle UI
- Full Card primitive migration for every dashboard block
- Dialog primitive extraction (classes exported; modals not fully refactored)
- RU/PL/DE token documentation
- Complete removal of raw slate/teal from EventCard and QuickAddPanel shells
- Charts, analytics, P11/P12, settings UX

## Non-scope confirmation

No backend/API/medical contract changes. No P11/P12 work.
