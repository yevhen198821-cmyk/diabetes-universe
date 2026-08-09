# Product Bible

## Product intent

Diabetes Universe is intended to become a trusted digital health ecosystem.
The foundation does not assume unvalidated features or clinical workflows.

## Principles

1. Safety and user trust take priority over engagement.
2. Health information must be clear, accessible, and evidence-aware.
3. Product behavior must not imply diagnosis or treatment without the required
   clinical, legal, and regulatory review.
4. Sensitive data collection must be purposeful and minimized.
5. Every feature needs an explicit owner, outcome, and acceptance criteria.

## Current milestone

The current milestone delivers a **demo web application** with approved
Dashboard and Timeline surfaces, platform foundation packages (localization,
formatting, runtime), and comprehensive architecture documentation.

Implemented today:

- Dashboard home screen with seven blocks and shared Timeline store
- Timeline event journal with search, filters, edit/delete, and Quick Add
- Platform bootstrap, presentation context, and Dashboard localization
  (I18N-02A–02B5)

This is **demo-scope implementation**, not the full future ecosystem.

## Future ecosystem (not implemented)

The following are architectural placeholders or future targets — **not current
product capabilities**:

- backend services, databases, and APIs
- authentication and authorization
- production AI runtime
- marketplace runtime
- native mobile applications
- offline/sync persistence
- analytics domain
- device integrations (CGM, insulin pumps, wearables, and similar connected
  devices)

Timeline and Quick Add UI localization, runtime locale switching, and
production activation of contextual Next Action rules (e.g. NA-001 registry
wiring) are also future work.

## Before feature development

Define target users, validated problems, geographic and regulatory scope,
clinical governance, privacy requirements, accessibility criteria, and success
metrics.
