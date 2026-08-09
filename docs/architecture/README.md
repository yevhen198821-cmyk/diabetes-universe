# Architecture

## Purpose

This section documents system structure, boundaries, responsibilities, and dependencies.

## Status

Approved

## Responsibility

Architecture documents define ownership and relationships between system areas.

## Dependencies

Architecture documentation depends on approved project requirements and architecture decisions.

## What Belongs Here

System boundaries, component responsibilities, dependencies, quality attributes, and architecture constraints belong here.

## What Does Not Belong Here

Feature acceptance criteria, visual design rules, source code, and transient implementation notes should not be stored here.

## System shape

Diabetes Universe is a frontend monorepo. Turborepo coordinates tasks, while pnpm
provides deterministic workspace dependency management.

Layering follows [ADR-0011 — Platform Infrastructure Layer](../adr/0011-platform-infrastructure-layer.md):

```text
apps/web (Application + Web Composition Root wiring)
  → packages/platform-web
  → packages/platform, i18n, i18n-locales, locales, formatting
  → packages/ui, packages/types

packages/platform, i18n, formatting, locales
  → must not depend on apps/web
```

## Boundaries

| Workspace               | Responsibility                                                           |
| ----------------------- | ------------------------------------------------------------------------ |
| `apps/web`              | Routing, page composition, Dashboard/Timeline demo, web Composition Root |
| `packages/platform-web` | Web-specific platform runtime assembly                                   |
| `packages/platform`     | `PlatformRuntime` aggregate (`createPlatformRuntime`)                    |
| `packages/i18n`         | Localization Platform contracts and runtime                              |
| `packages/i18n-locales` | In-memory translation bundle loaders (Infrastructure adapter)            |
| `packages/locales`      | Canonical translation resources                                          |
| `packages/formatting`   | Platform Formatting library                                              |
| `packages/ui`           | Reusable, presentation-focused React primitives                          |
| `packages/types`        | Platform-agnostic contracts, not runtime behavior                        |

Applications may depend on packages; packages must not depend on applications.

## Current demo surfaces

- **Dashboard** (`/`) — seven approved blocks with shared Timeline store integration
- **Timeline** (`/timeline`) — event journal, search, filters, edit/delete, Quick Add

## Deliberate exclusions (future / not implemented)

The repository does **not** currently provide:

- backend services, databases, or APIs;
- authentication or authorization;
- production AI runtime;
- marketplace runtime;
- native mobile applications;
- offline/sync persistence;
- analytics domain;
- device integrations (CGM, insulin pumps, wearables, and similar connected
  devices).

Adding any of these requires a documented architecture decision and an explicit
product requirement.

## Quality attributes

- Strict static typing
- Accessible UI primitives
- Explicit package ownership
- Reproducible builds
- Minimal dependency surface

## Platform modules

- [Localization Platform Overview](localization/overview.md)
- [Dashboard Header Localization Migration (I18N-02A)](localization/dashboard-header-migration.md) — Feature Complete
- [Dashboard Next Action Localization Migration (I18N-02B1)](localization/dashboard-next-action-migration.md) — Feature Complete
- [Dashboard Last Glucose Localization Migration (I18N-02B2)](localization/dashboard-last-glucose-migration.md) — Feature Complete
- [Dashboard Day Summary Localization Migration (I18N-02B3)](localization/dashboard-day-summary-migration.md) — Feature Complete
- [Dashboard Recent Events Localization Migration (I18N-02B4)](localization/dashboard-recent-events-migration.md) — Feature Complete
- [Dashboard AI Insight Localization Migration (I18N-02B5)](localization/dashboard-ai-insight-migration.md) — Feature Complete
- [Platform Readiness](localization/platform-readiness.md)
- [Web Composition Root](composition-root/web-composition-root.md)
- [Presentation Context Foundation](presentation/presentation-context.md) — CR-03A, Feature Complete
- [React Platform Provider Foundation](presentation/react-platform-provider.md) — CR-03B, Feature Complete
- [Application Platform Integration](presentation/application-platform-integration.md) — CR-03C, Feature Complete (ADR-0013)
- [@diabetes-universe/web](../../apps/web/README.md) — thin Next.js bootstrap (CR-02, Feature Complete)
- [@diabetes-universe/platform-web](../../packages/platform-web/README.md)

## Notes

- Dashboard block localization (I18N-02A–02B5) is complete; Timeline and Quick Add
  localization migrations remain future work.
- Runtime locale switching is not production-ready.
