# Dashboard + Timeline — Component & Dependency Map

Date: 2026-08-23  
Scope: Current-state inventory from repository code (post–P10 merge `1be172a`).  
Purpose: UX/UI Wave 1 audit support — **no runtime changes**.

## Route map

| Route        | File                              | Renders         | Notes                    |
| ------------ | --------------------------------- | --------------- | ------------------------ |
| `/`          | `apps/web/app/page.tsx`           | `DashboardRoot` | Canonical dashboard home |
| `/dashboard` | `apps/web/app/dashboard/page.tsx` | `redirect('/')` | Alias only               |
| `/timeline`  | `apps/web/app/timeline/page.tsx`  | `TimelineShell` | Event journal            |

Navigation between surfaces:

- Dashboard → Timeline: Recent Events “All events” (`viewAllHref="/timeline"`)
- Timeline → Dashboard: `TopBar` back link (`href="/"`)
- No shared app shell; each page owns its header/layout

## App composition root

```
apps/web/app/layout.tsx
└── ApplicationRuntimeGate          (bootstrap / i18n / formatting gate)
    └── PlatformProvider
        └── AppProviders
            └── TimelineStoreBoundary (IndexedDB repository + demo seed)
                └── {page}
```

Shared store: `apps/web/lib/timeline/timeline-store/timeline-store-boundary.tsx`  
Repository factory: `apps/web/lib/timeline/create-web-timeline-repository.ts`  
Persistence: `packages/timeline-web/src/persistence/indexeddb/*` (IDB v2)

## Dashboard dependency map

```
DashboardRoot (dashboard-root.tsx)
├── useTimelineStore() ────────────────────────────┐
├── useLocalization() / useFormatter()             │
├── useTimelinePresentationDependencies()          │
├── deriveDashboardQuickAddBlocks()                │
├── resolveDashboardNextActionPresentation()       │
├── prepareDashboardAiInsightPresentation()        │
├── QuickAddHost ──────────────────────────────────┤
└── DashboardShell                                 │
    ├── DashboardHeader                            │
    ├── DashboardNextAction                        │
    ├── DashboardLastGlucose                       │
    ├── DashboardDaySummary                        │
    ├── DashboardRecentEvents ──► Link /timeline   │
    └── DashboardAiInsight                         │
                                                   │
Timeline store (events[]) ◄────────────────────────┘
```

### Dashboard block files

| Block         | Component                     | Model                              | Labels                              | Integration / derivation                                                        |
| ------------- | ----------------------------- | ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| Header        | `dashboard-header.tsx`        | `dashboard-header-model.ts`        | `dashboard-header-labels.ts`        | Hardcoded user in root                                                          |
| Next Action   | `dashboard-next-action.tsx`   | `dashboard-next-action-model.ts`   | `dashboard-next-action-labels.ts`   | `dashboard-next-action-integration.ts`, engine in `lib/dashboard/next-action/*` |
| Last Glucose  | `dashboard-last-glucose.tsx`  | `dashboard-last-glucose-model.ts`  | `dashboard-last-glucose-labels.ts`  | `getLatestGlucoseEvent()` via quick-add integration                             |
| Day Summary   | `dashboard-day-summary.tsx`   | `dashboard-day-summary-model.ts`   | `dashboard-day-summary-labels.ts`   | Today totals from timeline selectors                                            |
| Recent Events | `dashboard-recent-events.tsx` | `dashboard-recent-events-model.ts` | `dashboard-recent-events-labels.ts` | `dashboard-recent-events-derivation.ts`, card mapper                            |
| AI Insight    | `dashboard-ai-insight.tsx`    | `dashboard-ai-insight-model.ts`    | `dashboard-ai-insight-labels.ts`    | **Mock object in root**; presentation safety filter exists but engine not wired |

Layout: `dashboard-shell.tsx` — responsive 12-column grid (`max-w-6xl`).

Quick Add entry points (dashboard):

- Header button (lg+ only)
- FAB (`dashboard-fab lg:hidden`)
- Next Action primary CTA

## Timeline dependency map

```
TimelineShell (timeline-shell.tsx)
├── useTimelineStore()
├── useTimelinePresentationDependencies()
├── TopBar (back to /)
├── TimelineToolbar (search + filters) — hidden when zero events
│   ├── TimelineSearch
│   └── TimelineFilters
├── TimelineList
│   └── EventCard (compact) via timeline-event-card.mapper.ts
├── TimelineLoadMore
├── QuickAddRoot → QuickAddHost + FloatingActionButton
└── TimelineEventDetail (modal: view / edit / delete confirm)
```

Supporting models:

- `timeline-list-model.ts` — grouping (Today / Yesterday / Earlier)
- `timeline-search-filter-model.ts` — 7 filter pills + search normalization
- `timeline-pagination-model.ts` — client slice (20) + repo page (100)
- `timeline-event-detail-model.ts` — edit validation, field layout

Quick Add forms (6 categories):

| Category                    | Form location                           | Field styles            |
| --------------------------- | --------------------------------------- | ----------------------- |
| Glucose, insulin, nutrition | `apps/web/components/quick-add/*`       | `timeline/ui-styles.ts` |
| Activity, medication, note  | `@diabetes-universe/ui` QuickAdd fields | `QuickAddFields.tsx`    |

## Shared packages

| Package                               | Role in Dashboard/Timeline                                       |
| ------------------------------------- | ---------------------------------------------------------------- |
| `@diabetes-universe/timeline`         | Repository contract, in-memory test repo                         |
| `@diabetes-universe/timeline-web`     | IndexedDB persistence, adoption stores (P10 backend only; no UI) |
| `@diabetes-universe/ui`               | `Button`, `EventCard`, QuickAdd panel suite                      |
| `@diabetes-universe/types`            | `SemanticTimelineEvent`, quick-add entry types                   |
| `@diabetes-universe/i18n` / `locales` | Dashboard chrome keys; timeline partial                          |
| `@diabetes-universe/formatting`       | Date/time/number formatting via platform                         |
| `@diabetes-universe/platform-web`     | Runtime wiring (no layout components)                            |

## Data flow (current)

```
demoTimelineEvents (apps/web/lib/mocks/timeline.ts)
    └── IndexedDB bootstrap (first run only)
            └── TimelineStore (in-memory + queued mutations)
                    ├── Dashboard derivations (selectors)
                    └── Timeline list / detail / filters
```

**Not connected to UI today:** P10 medical adoption API, cloud medical persistence, authenticated user profile, reminders backend, AI insight engine.

## Design / styling touchpoints

| Layer                          | Path                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| Global CSS                     | `apps/web/app/globals.css` (Tailwind v4, FAB helpers, no CSS variables) |
| Event type colors              | `packages/ui/src/theme/event-type-appearance.ts`                        |
| Timeline local styles          | `apps/web/components/timeline/ui-styles.ts`                             |
| Dashboard                      | Inline Tailwind per component (`dark:` on dashboard only)               |
| Spec (not implemented in code) | `docs/design-system/11-design-tokens-specification.md`                  |

## Test coverage map (UX-relevant)

| Area               | E2E specs                                                                                                                                 | Integration tests                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Dashboard blocks   | `dashboard-*-i18n.spec.ts`, `dashboard-quick-add.spec.ts`, `dashboard-day-summary-i18n.spec.ts`                                           | `*.integration.test.mjs` per block |
| Timeline           | `timeline-event-details.spec.ts`, `timeline-pagination.spec.ts`, `timeline-reload-persistence.spec.ts`, `quick-add-activity-note.spec.ts` | Model tests in components          |
| Cross-surface sync | `application-platform-integration.spec.ts`, `dashboard-quick-add.spec.ts`                                                                 | Store + selector tests             |

## P10 / medical boundary (audit note)

P10 local adoption orchestrator lives in `packages/timeline-web/src/adoption/*` with **no Dashboard/Timeline UI entry point**. Audit scope excludes medical API and adoption runtime from UI evaluation.
