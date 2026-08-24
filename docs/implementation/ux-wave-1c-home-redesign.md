# UX/UI Wave 1C — Home Redesign

Date: 2026-08-23  
Status: **READY FOR MERGE** (pending final CI on `279a5e2`)

## Purpose

Wave 1C turns Home from an admin-like medical dashboard into a bright, consumer-first daily surface while preserving the trust and safety rules established in Wave 1A and the semantic UI foundation from Wave 1B.

The approved visual direction is colorful, warm, rounded and expressive rather than hospital-like. Decorative color is used to make the product feel approachable; it is **not** a medical status signal.

## Information hierarchy

Home remains status-first:

1. Last glucose
2. Today summary
3. Quick Add (five high-frequency categories)
4. Recent events

`DashboardNextAction` is intentionally removed from Home composition in Wave 1C. The underlying model remains in the repo for future use but is not rendered on Home.

## Last glucose hero

The latest glucose card is the primary visual anchor. It keeps the existing trustworthy data contract:

- localized numeric value and explicit unit
- measurement time
- stale/outdated text and icon when applicable
- source/provenance only when the event actually contains a supported source
- no inferred clinical classification
- no color-only medical meaning

The coral/orange/teal hero gradient and abstract decoration are visual branding only.

## Today summary

The summary continues to render only values derived from the local authoritative Timeline store. Current metrics remain:

- glucose measurement count
- total insulin
- total carbohydrates
- medication dose count

No activity value, target percentage, streak or other metric is fabricated simply to match a mockup. Activity can be promoted into the summary in a later product decision once its aggregation and presentation are explicitly approved.

## Quick Add

The Home quick action strip exposes five high-frequency entry categories already supported by the existing Quick Add runtime:

- glucose
- insulin
- nutrition
- activity
- note

The buttons reuse existing submission flows and localized Timeline event-kind labels. No duplicate persistence path is introduced.

## Branding

Home header uses the approved master PNG at `apps/web/public/brand/diabetes-universe-logo.png`.

- Current asset is **icon-only** (globe + droplet). The separate `DashboardBrandWordmark` renders localized “Diabetes / Universe” text beside the icon.
- If a future PNG includes a baked-in wordmark, remove the separate wordmark to avoid duplicate visible branding.
- Timeline top bar no longer shows the legacy `BrandSymbol` SVG; it uses the same colorful page shell as Home.

## Timeline visual alignment

## Recent events

Recent events keep the existing Timeline-derived presentation and handoff to `/timeline`. The redesign changes density, hierarchy and visual treatment only.

## Navigation decision

Wave 1C uses a three-destination mobile bottom navigation on Home and Timeline: Home, Timeline, Account. Quick Add on Home lives in the page content strip; Timeline uses the nav FAB on mobile and a desktop FAB on large screens. Placeholder Analytics/Profile routes are intentionally omitted.

## Identity and motivational content

Wave 1C does not introduce:

- a fake user name or avatar identity
- unsupported goal percentages
- streak/progress claims
- congratulatory health judgments
- mock AI insights

Authenticated identity can be wired when the profile/session product contract is ready.

## Responsive and theme behavior

The composition is mobile-first and scales through the existing responsive grid to desktop. It preserves the Wave 1B light/dark theme architecture. Bright decorative accents are layered over semantic surfaces rather than replacing semantic loading, error, focus or text states.

## Accessibility and medical UX rules retained

- loading is distinct from empty
- missing is distinct from zero
- stale status includes text/icon, not color alone
- units remain explicit
- known provenance is shown without fabrication
- focus-visible states remain present
- decorative icons are hidden from assistive technology where appropriate
- no treatment or diagnosis language is added

## Explicitly deferred

- app icon / final brand symbol redesign
- global bottom navigation IA
- Analytics destination
- Profile destination
- charts and glucose trend analytics
- AI insight engine
- reminders
- goals/streak gamification
- P11/P12 sync/conflict UI
- deeper Timeline IA / layout redesign beyond the Wave 1C visual shell

## Merge checklist

- [x] Approved master logo integrated at `apps/web/public/brand/diabetes-universe-logo.png`
- [x] Home Wave 1C visual foundation with trust/safety rules preserved
- [x] Timeline colorful shell aligned with Home (no legacy top-bar brand symbol)
- [x] Unit, integration, and E2E coverage updated
- [x] CI green on latest branch head
- [ ] Product owner final visual sign-off on Vercel preview (recommended before merge)
