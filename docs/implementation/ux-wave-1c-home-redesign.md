# UX/UI Wave 1C — Home Redesign

Date: 2026-08-23  
Status: **IMPLEMENTATION CANDIDATE — visual approval required before merge**

## Purpose

Wave 1C turns Home from an admin-like medical dashboard into a bright, consumer-first daily surface while preserving the trust and safety rules established in Wave 1A and the semantic UI foundation from Wave 1B.

The approved visual direction is colorful, warm, rounded and expressive rather than hospital-like. Decorative color is used to make the product feel approachable; it is **not** a medical status signal.

## Information hierarchy

Home remains status-first:

1. Last glucose
2. Today summary
3. One operational next action
4. Recent events

A dedicated Quick Add surface is added as a high-frequency utility. It does not replace the status-first hierarchy or introduce treatment guidance.

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

The Home quick action strip exposes the four highest-frequency entry categories already supported by the existing Quick Add runtime:

- glucose
- insulin
- nutrition
- activity

The buttons reuse existing submission flows and localized Timeline event-kind labels. No duplicate persistence path is introduced.

## Next action

The existing operational/logging-oriented engine remains authoritative. Styling changes do not change its semantics and do not introduce dosing, correction, food or diagnostic advice.

## Recent events

Recent events keep the existing Timeline-derived presentation and handoff to `/timeline`. The redesign changes density, hierarchy and visual treatment only.

## Navigation decision

The approved visual references include a five-item mobile bottom navigation. Wave 1C intentionally does **not** add placeholder/dead destinations for Analytics or Profile. Home retains the functional mobile Quick Add control and the existing Timeline handoff. A global navigation dock should be implemented only after the route/information architecture for its destinations is real and consistent across Home and Timeline.

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
- final Timeline redesign

## Merge gate

This PR must remain unmerged until the product owner reviews the Vercel preview and explicitly approves the visual result.
