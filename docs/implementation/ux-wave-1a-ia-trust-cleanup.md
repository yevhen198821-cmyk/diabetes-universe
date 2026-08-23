# UX Wave 1A — Information Architecture & Trust Cleanup

Date: 2026-08-23  
Status: **IMPLEMENTATION CANDIDATE**  
Baseline: `main` @ `d19765f9fda3ae148ea926da0315de36e861ab37`  
Branch: `implementation/ux-wave-1a-ia-trust-cleanup`

## Objective

First production UX/UI changes for Dashboard + Timeline focused on trust, hierarchy, loading semantics, and locale consistency — not a visual redesign.

## Dashboard hierarchy decision

**Before (shell order):** Next Action → Last Glucose → Day Summary → Recent Events → AI Insight

**After (status-first):**

1. Last Glucose (current status)
2. Day Summary (today context)
3. Next Action (operational logging prompt)
4. Recent Events
5. Quick Add remains header/FAB entry points

Navigation label on Dashboard header: **Home** (`dashboard.header.title`). Product metadata/titles remain "Diabetes Universe"; only the in-app dashboard chrome uses Home.

Main landmark id unified to `#main-content` (Dashboard and Timeline).

## Removed trust-breaking elements

| Element                              | Action                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Mock AI Insight block                | Removed from `DashboardRoot` / `DashboardShell` (component files retained for future architecture) |
| Fake reminders metric (`1/3`)        | Removed from Day Summary model, integration, and UI                                                |
| Hardcoded user name (`Анна Иванова`) | Removed; header uses neutral avatar when no auth profile is wired on Dashboard                     |

## Loading / empty semantics

- Dashboard blocks read `useTimelineStore().status`.
- While `status === 'loading'` (IndexedDB hydration): Last Glucose, Day Summary, Recent Events, Next Action, and Header show **loading** skeletons — not empty states or zero counts.
- On `status === 'error'`: affected blocks show error state.
- After hydration: zero event counts in Day Summary are valid when data is known (e.g. `0 insulin entries` today).

## Last Glucose trust model

- Value formatted with explicit unit via existing presentation mapper.
- Timestamp shown with `<time dateTime>`.
- Stale state: text + `ClockAlert` icon + `role="status"` (not color-only).
- Source shown only for `manual` / `device` / `import` when present on event data; **not fabricated**; `demo` excluded from medical provenance on Dashboard.

## Timeline localization cleanup

Hardcoded Russian shell strings moved to `timeline.*` keys via `resolveTimelineUiLabels()`:

- Shell eyebrow/title, loading, empty, filtered-empty, error
- Toolbar, search, filters, load more, history load error
- TopBar home link aria-label
- Event detail modal chrome (view/edit/delete confirm, form labels)
- FAB uses existing `quick-add.button.label`

Edit-form validation messages in `timeline-event-detail-model.ts` remain Russian (deferred to Wave 1C full content migration).

## Empty vs filtered-empty (Timeline)

- Toolbar visible whenever store `status === 'ready'` (including zero global events).
- **True empty:** no events in store → empty state with Quick Add CTA.
- **Filtered empty:** criteria active + source events exist → filters/search remain visible; list shows "No matching events" with reset action.

## Provenance behavior

- Event detail: `manual` / `device` / `import` shown as normal source field.
- `demo` shown with dashed amber styling and "Demo data" label — not as normal medical provenance.
- Unknown/missing source: field omitted.

## Next Action safety

Existing next-action engine unchanged. Copy remains logging-oriented (e.g. add insulin/meal entries via Quick Add). No treatment advice, diagnosis, or dose-change language added.

## Accessibility quick wins

- Skip link (`common.accessibility.skipLink`) → `#main-content`
- Stale glucose: icon + status text + ARIA
- Avatar image `alt` uses avatar label
- Timeline/FAB/header actions maintain ≥44px touch targets on modified controls
- Localized aria-labels for timeline search clear, filters, top bar home

## Explicit deferred items

- Full design system / color polish (Wave 1B)
- Timeline edit validation i18n (Wave 1C)
- AI insight product UI
- Reminders product
- Charts / analytics
- P11/P12 sync UI
- Timezone preference settings
- Full Wave 1F accessibility redesign
- New `/dashboard` route (kept `/` as Dashboard/Home)

## Medical safety decisions

- No mock clinical interpretation
- No placeholder reminders
- No fabricated glucose source
- Units explicit via existing formatters
- Demo source visually distinct from medical provenance

## Tests added/updated

- `dashboard-wave-1a-trust.test.mjs` — stale/source/trust unit checks
- `timeline-ui-labels.test.mjs` — toolbar/source helpers
- `timeline-list-model.test.mjs` — injected error/unknown date labels
- `dashboard-day-summary-model.test.mjs` — reminders removed
- E2E: `dashboard-wave-1a-trust.spec.ts`; removed `dashboard-ai-insight-i18n.spec.ts`
- Updated dashboard/timeline E2E for Home + English detail chrome

## Self-audit checklist

1. ✅ No fake AI medical interpretation in production Dashboard
2. ✅ No fake reminders metric
3. ✅ Dashboard status-first (Last Glucose before Next Action)
4. ✅ Loading distinguishable from empty
5. ✅ Missing ≠ zero during hydration
6. ✅ Stale state not color-only
7. ✅ Application chrome uses active locale (EN canonical for Timeline shell)
8. ✅ Filtered-empty distinct from true-empty
9. ✅ Provenance shown only when known; demo distinct
10. ✅ No medical treatment advice introduced
11. ✅ No route/backend semantics changed
12. ✅ No P11/P12 scope entered
