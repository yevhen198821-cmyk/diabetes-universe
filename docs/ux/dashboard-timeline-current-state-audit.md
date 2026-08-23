# Dashboard + Timeline — Current-State UX/UI Audit

Date: 2026-08-23  
Repository baseline: `main` @ `1be172a` (P10 merged via PR #104)  
Status: **Audit only** — no production UI/runtime changes in this task  
Audience: Product, design, engineering — Wave 1 planning

## Executive summary

Diabetes Universe today offers a **functional prototype** of two linked surfaces:

1. **Dashboard (`/`)** — a same-day summary and action-oriented home screen derived from local timeline data.
2. **Timeline (`/timeline`)** — a chronological event journal with search, filters, pagination, and modal-based CRUD.

Both share a **single IndexedDB-backed timeline store** seeded with demo data. The architecture for localization, accessibility scaffolding, and semantic event modeling is **ahead of the product polish layer**. Visual design tokens are documented but **not implemented in code**. Several dashboard blocks mix **real derivations** with **hardcoded mock content**, and Timeline chrome is **split between i18n keys and hardcoded Russian strings**.

The product does **not** yet meet world-class clarity targets for people living with diabetes, but it has a solid foundation for Wave 1: information architecture cleanup, design-system implementation, unified localization, and medical-safe presentation rules.

---

## 1. Current implementation inventory

See companion map: [dashboard-timeline-component-map.md](./dashboard-timeline-component-map.md).

### Routes

- **`/`** — Dashboard (canonical)
- **`/dashboard`** — redirects to `/`
- **`/timeline`** — Timeline journal

### Real vs placeholder functionality

| Capability                                                          | Status              | Source                                         |
| ------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| Glucose / insulin / nutrition / medication / activity / note events | **Real (local)**    | IndexedDB + Quick Add semantic creators        |
| Cross-surface sync (Dashboard ↔ Timeline)                           | **Real**            | Shared `TimelineStoreProvider`                 |
| Reload persistence                                                  | **Real**            | E2E-proven; demo does not re-seed after empty  |
| Last glucose, day summary, recent events, next action               | **Real derivation** | Timeline selectors + rules engine              |
| Reminders (1/3 in day summary)                                      | **Placeholder**     | Hardcoded in `dashboard-root.tsx`              |
| AI insight card                                                     | **Placeholder**     | Hardcoded mock in `dashboard-root.tsx`         |
| User name / avatar                                                  | **Placeholder**     | Hardcoded `'Анна Иванова'`                     |
| Device / import events in UI                                        | **Partial**         | Source badge exists; seed is all `demo`        |
| Cloud medical sync / adoption UI                                    | **Not in UI**       | P10 backend only                               |
| Charts / trends                                                     | **Absent**          | Card/list metrics only                         |
| Dark mode toggle                                                    | **Absent**          | Dashboard has `dark:` classes; no theme switch |
| Deep-linked event URLs                                              | **Absent**          | Detail is in-page modal                        |

### Demo data

~31 seeded events in `apps/web/lib/mocks/timeline.ts` (7 curated + 24 history notes). First IndexedDB bootstrap only.

---

## 2. Dashboard UX audit

### Current primary purpose

The Dashboard acts as a **“today at a glance + nudge to act”** screen. It answers:

- What was my last glucose reading?
- What happened today (counts/totals)?
- What should I do next?
- What recent non-glucose events matter?
- (Surface) What might AI notice? — **mock only**

It does **not** yet reliably answer **“What is happening with me right now?”** because:

- No live device/sync status
- No explicit “in range / out of range” clinical framing (by design — no diagnosis)
- Stale glucose warning exists (>24h) but is easy to miss
- Mock AI insight can imply interpretation without engine backing

### Block-by-block evaluation

#### Header

| Question         | Assessment                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Why exists?      | Brand anchor, date context, add-event entry (desktop), profile affordance |
| User question    | “What day is it? How do I add data? Who am I?”                            |
| Actionable?      | Add event (lg+); avatar is display-only                                   |
| Frequency        | Daily                                                                     |
| Duplicated?      | Date also in Day Summary                                                  |
| Clinical utility | Low                                                                       |
| Cognitive load   | Low–medium (mock user breaks trust)                                       |
| Verdict          | **IMPROVE** — real identity; reduce date duplication                      |

#### Next Action

| Question         | Assessment                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Why exists?      | Reduce decision fatigue — suggest next logging action                                         |
| User question    | “What should I do now?”                                                                       |
| Actionable?      | Yes — opens Quick Add (insulin default or staleness rule)                                     |
| Frequency        | Several times daily for active loggers                                                        |
| Duplicated?      | Overlaps Quick Add/FAB purpose                                                                |
| Clinical utility | Medium (staleness nudge only; no treatment advice)                                            |
| Cognitive load   | Low when single CTA                                                                           |
| Verdict          | **KEEP** — core Wave 1 anchor; **IMPROVE** engine→UI mapping (`navigate` intent not rendered) |

#### Last Glucose

| Question         | Assessment                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| Why exists?      | Most frequent diabetes status check                                                 |
| User question    | “What was my last reading and when?”                                                |
| Actionable?      | No direct action on card                                                            |
| Frequency        | Very high                                                                           |
| Duplicated?      | Partially in Timeline                                                               |
| Clinical utility | **High** if units/timezone clear                                                    |
| Cognitive load   | Low                                                                                 |
| Verdict          | **KEEP** — hero metric; **IMPROVE** unit prominence, trend context, tap-to-timeline |

#### Day Summary

| Question         | Assessment                                                          |
| ---------------- | ------------------------------------------------------------------- |
| Why exists?      | Same-day totals                                                     |
| User question    | “How much insulin/carbs/meds today?”                                |
| Actionable?      | No                                                                  |
| Frequency        | Daily                                                               |
| Duplicated?      | Timeline filters could answer with effort                           |
| Clinical utility | Medium                                                              |
| Cognitive load   | Medium (5 metrics + fake reminders)                                 |
| Verdict          | **IMPROVE** — remove placeholder reminders; clarify zero vs missing |

#### Recent Events

| Question         | Assessment                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Why exists?      | Quick scan of latest non-glucose activity                                                  |
| User question    | “What did I log recently besides glucose?”                                                 |
| Actionable?      | Cards open… **only on Timeline** (not on Dashboard)                                        |
| Frequency        | Medium                                                                                     |
| Duplicated?      | Yes — subset of Timeline                                                                   |
| Clinical utility | Medium                                                                                     |
| Cognitive load   | Medium (4 cards, mixed languages in demo)                                                  |
| Verdict          | **KEEP** as entry to Timeline; **IMPROVE** — tappable cards or merge with timeline preview |

#### AI Insight

| Question         | Assessment                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| Why exists?      | Future differentiated value                                                         |
| User question    | “What pattern should I notice?”                                                     |
| Actionable?      | No                                                                                  |
| Frequency        | Unknown (not real)                                                                  |
| Duplicated?      | N/A                                                                                 |
| Clinical utility | **Risk** — reads like interpretation; mock Russian copy                             |
| Cognitive load   | High trust risk                                                                     |
| Verdict          | **REMOVE** from production UI until engine + safety review; or **RELOCATE** to labs |

### Dashboard information hierarchy (current)

Visual order: Next Action → Last Glucose → Day Summary → Recent Events → AI Insight.

**Issue:** Next Action precedes Last Glucose. For many users, **status before action** is more natural (“see glucose, then act”). AI Insight at bottom is correct given mock status.

### Dashboard loading / empty / error

Components support `loading | ready | empty | error`. **`dashboard-root.tsx` never passes loading/error**; store hydration can flash empty states. Application-level gate handles bootstrap only.

---

## 3. Timeline UX audit

### Coherence as longitudinal history

Timeline **works as a coherent local journal** for manual/demo events:

- Strong chronological grouping (Today / Yesterday / Earlier)
- Compact cards with type iconography
- Search + 7 filter pills
- Client pagination (20) + repository history pages (100)
- Modal detail/edit/delete with focus management

**Gaps for a central medical history surface:**

| Gap                                                     | Impact                                        |
| ------------------------------------------------------- | --------------------------------------------- |
| No deep links / shareable event URLs                    | Cannot reference or support care-team review  |
| Generic edit form for all event kinds                   | Error-prone; poor kind-specific validation UX |
| Empty state hides search/filters                        | Discoverability loss for new users            |
| No multi-day calendar jump                              | Hard to navigate long history                 |
| No export / report handoff                              | Dead end for clinical visits                  |
| Device/import sources not demonstrated                  | User cannot learn provenance UX               |
| Notes dominate demo seed (24/31)                        | Skews perception of typical history           |
| No aggregation views (daily glucose curve, insulin TDD) | Limits pattern recognition without AI         |

### Event type coverage

| Type                   | Listed     | Quick Add | Filter | Detail edit  |
| ---------------------- | ---------- | --------- | ------ | ------------ |
| Glucose                | Yes        | Yes       | Yes    | Generic form |
| Insulin                | Yes        | Yes       | Yes    | Generic form |
| Nutrition              | Yes        | Yes       | Yes    | Generic form |
| Medication             | Yes        | Yes       | Yes    | Generic form |
| Activity               | Yes        | Yes       | Yes    | Generic form |
| Note                   | Yes        | Yes       | Yes    | Generic form |
| Device/import (source) | Badge only | No        | No     | N/A          |

### Mobile usability (code + E2E)

- Safe-area padding on content and FAB
- Bottom-sheet detail on narrow viewports
- Filter pill horizontal scroll
- Touch targets generally ≥44px (`min-h-11`)
- FAB vs load-more overlap tested at 390px
- Timeline max-width `3xl` — readable single column

---

## 4. User-journey audit

Interaction counts from E2E specs and code paths (approximate **user gestures**):

| Flow                               | Steps         | >3?                              | Notes                                                  |
| ---------------------------------- | ------------- | -------------------------------- | ------------------------------------------------------ |
| A. Open app → understand status    | 0–1           | No                               | Land on Dashboard; last glucose visible if data exists |
| B. Open app → find today's events  | 1–2           | No                               | Scroll dashboard or tap “All events”                   |
| C. Timeline → understand today     | 1             | No                               | Today group default                                    |
| D. Add event (Quick Add glucose)   | 4–8           | **Yes**                          | FAB → category → form fields → time picker → save      |
| E. Edit event                      | 4–6           | **Yes**                          | Card → Edit → fields → Save → Close                    |
| F. Delete event                    | 3–4           | Borderline                       | Card → Delete → Confirm                                |
| G. Reload → history understandable | 0             | No                               | Persistence works                                      |
| H. Mobile use                      | Same + scroll | Quick Add heavy on small screens |

**Frequent actions >3 interactions:** Add event, Edit event — primary Wave 1 optimization targets.

---

## 5. Medical UX safety audit

| Risk                              | Finding                                                                                                              | Severity                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Ambiguous glucose units           | Values formatted with locale; unit label depends on presentation mapper — generally shown but not duplicated in hero | P2                                               |
| Ambiguous insulin units           | Units on cards; edit form exposes unit field generically                                                             | P2                                               |
| Timestamps                        | Local timezone via `Intl`; ADR-0012 policy exists; time-only on dashboard cards                                      | P1 — date context sometimes omitted on dashboard |
| Timezone interpretation           | Uses browser TZ; no explicit TZ indicator in UI                                                                      | P2                                               |
| Color-only communication          | Event type uses icon + color; stale glucose uses amber text                                                          | P2                                               |
| Misleading medical interpretation | **AI insight mock** implies post-meal glucose interpretation                                                         | **P0**                                           |
| Accidental delete                 | Two-step confirm in modal                                                                                            | OK                                               |
| Stale data                        | >24h warning on last glucose                                                                                         | P2 — not on timeline list                        |
| Missing vs zero                   | Day summary shows `0` counts — may confuse “none logged” vs “value is zero”                                          | P1                                               |
| Inaccessible status               | Skeletons have sr-only; good patterns                                                                                | P2 gaps on FAB RU label                          |
| Diagnosis/treatment advice        | Presentation safety filter exists for AI; **not applied to mock**                                                    | **P0**                                           |

**Principle upheld in code:** Next Action engine avoids treatment verbs; AI insight mapper filters forbidden patterns — but mock bypasses this.

---

## 6. Responsive audit (expected breakpoints)

Reviewed via Tailwind classes + E2E viewports (390, 768, 1280):

| Width   | Dashboard                                | Timeline                                   |
| ------- | ---------------------------------------- | ------------------------------------------ |
| 360–412 | Single column; FAB for add; header 2-row | Narrow column; bottom sheet; filter scroll |
| 768     | 2-col glucose+summary                    | Comfortable toolbar                        |
| 1024+   | 12-col grid; header add button           | Still `max-w-3xl` — large empty margins    |
| 1440    | Wide dashboard grid                      | Timeline stays narrow — intentional?       |

Issues: Timeline does not scale horizontally on desktop; dashboard header hides add on mobile (FAB dependency); no landscape-specific tuning documented.

---

## 7. Accessibility audit (WCAG 2.2 AA target)

### Strengths

- Landmark structure (`header`, `main`, `section`)
- `aria-labelledby`, `aria-busy`, live regions for loading/empty/error
- Focus return from Quick Add and event detail dialogs
- Dialog focus trap + Escape
- `motion-reduce:animate-none` on skeletons
- Keyboard: filter pills, search Escape clear

### Gaps (potential AA blockers)

| Gap                                               | WCAG concern            |
| ------------------------------------------------- | ----------------------- |
| Mixed language (EN chrome + RU hardcoded strings) | 3.1.1 Language of parts |
| FAB / back link Russian only                      | 3.1.1                   |
| No skip link to main content                      | 2.4.1 Bypass blocks     |
| Avatar `alt=""` when image present                | 1.1.1                   |
| Color-only stale indicator without icon           | 1.4.1 Use of color      |
| Contrast not systematically verified in code      | 1.4.3                   |
| Timeline toolbar/filter strings not in i18n       | 3.1.1                   |

---

## 8. Visual system audit

Documented: `docs/design-system/10–20`. **Implemented:** ad hoc Tailwind (slate/teal), no CSS custom properties.

| Element     | Current state                                                                        |
| ----------- | ------------------------------------------------------------------------------------ |
| Colors      | `slate-*` neutrals, `teal-*` primary, per-type accents in `event-type-appearance.ts` |
| Typography  | Inter (globals.css); scale inconsistent between dashboard blocks                     |
| Radii       | `rounded-xl` inputs/buttons, `rounded-2xl` cards, `rounded-3xl` modals               |
| Shadows     | `shadow-sm` cards, `shadow-2xl` modals                                               |
| Dark mode   | Dashboard `dark:` present; **no toggle**; Timeline mostly light                      |
| Form fields | **Three parallel style definitions** (ui-styles, QuickAddFields, event-detail)       |

Design-system debt is **high** relative to documented specifications.

---

## 9. Product classification (major elements)

| Element                  | Classification             | Why                                  |
| ------------------------ | -------------------------- | ------------------------------------ |
| Last Glucose             | **KEEP** + **IMPROVE**     | Core diabetes status                 |
| Next Action              | **KEEP** + **IMPROVE**     | Action clarity; wire navigate intent |
| Day Summary              | **IMPROVE**                | Remove fake reminders; clarify zeros |
| Recent Events            | **KEEP** + **IMPROVE**     | Bridge to Timeline                   |
| AI Insight (mock)        | **REMOVE** or **RELOCATE** | Safety/trust until real engine       |
| Header user mock         | **IMPROVE**                | Real identity                        |
| Quick Add (6 categories) | **KEEP** + **IMPROVE**     | Reduce steps                         |
| Timeline list + grouping | **KEEP** + **IMPROVE**     | Core history                         |
| Search/filters           | **KEEP** + **IMPROVE**     | i18n + empty-state access            |
| Event detail modal       | **IMPROVE**                | Kind-specific forms                  |
| FAB                      | **KEEP**                   | Mobile primary action                |
| Demo seed data           | **IMPROVE**                | Production onboarding strategy       |
| Design token docs        | **IMPROVE** → implement    | Close spec/code gap                  |

### NEW REQUIREMENTS (product, not designed here)

- Explicit “no medical advice” boundary in any insight surface
- Onboarding for empty real users (no demo re-seed confusion)
- Timezone / unit preferences surfacing
- Caregiver-readable history export (future)
- Device/import provenance in realistic demo or live data

---

## 10. Priority matrix

### P0 — medical/safety/accessibility blockers

1. Mock AI insight presents interpretive medical narrative without engine/safety path
2. Mixed-language UI (screen readers / comprehension)
3. Placeholder reminders imply tracking capability that does not exist

### P1 — major UX problems

1. Quick Add and edit flows exceed 3 interactions for frequent tasks
2. Dashboard store hydration — no block-level loading; empty flash
3. Dashboard status-vs-action hierarchy (action before glucose)
4. Timeline empty state hides search/filter affordances
5. No deep link / routable event detail
6. Generic edit form for all clinical event types
7. Missing vs zero ambiguity in day summary
8. Hardcoded user identity breaks trust

### P2 — important usability

1. Timeline narrow on large screens
2. Recent Events not interactive on Dashboard
3. Stale glucose not visible on Timeline cards
4. i18n split (dashboard keys vs timeline hardcoded RU)
5. Dark mode half-implemented
6. Date context omitted on some dashboard time displays

### P3 — visual polish

1. Token/spec implementation gap
2. Triple form-field styling paths
3. Inconsistent focus ring tokens (`teal-600` vs `teal-700`)
4. Dashboard/Timeline header visual parity

---

## 11. Recommended final purposes (target state — not designed here)

**Dashboard:** “What is my current glycemic context, what happened today, and what is the single best next step to keep my log complete?” — status-first, action-second, no faux intelligence.

**Timeline:** “What happened, when, and from what source — my trustworthy longitudinal diabetes log.” — navigable, provenance-clear, kind-aware editing, deep-linkable.

---

## 12. Validation note

This document is audit-only. Production UI/runtime unchanged. See PR for doc paths and CI evidence.
