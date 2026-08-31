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

Diabetes Universe is a TypeScript monorepo spanning web application composition,
platform infrastructure, identity, local Timeline persistence, and server-side
medical persistence foundation. Turborepo coordinates tasks; pnpm provides
deterministic workspace dependency management.

Layering follows [ADR-0011 — Platform Infrastructure Layer](../adr/0011-platform-infrastructure-layer.md):

```text
apps/web (Application + Web Composition Root wiring)
  → platform-web, ui, types, timeline, timeline-web, identity
  → platform, i18n, i18n-locales, locales, formatting
  → must NOT import medical-persistence directly

packages/medical-service
  → medical-persistence → medical-domain

packages/platform, timeline, i18n, formatting, locales, identity, medical-*
  → must not depend on apps/web
```

## Bounded contexts and layers

| Workspace                      | Layer               | Responsibility                                                               |
| ------------------------------ | ------------------- | ---------------------------------------------------------------------------- |
| `apps/web`                     | Application         | Routing, page composition, Dashboard/Timeline, auth UI, web Composition Root |
| `packages/platform-web`        | Platform            | Web-specific platform runtime assembly                                       |
| `packages/platform`            | Platform            | `PlatformRuntime` aggregate (`createPlatformRuntime`)                        |
| `packages/i18n`                | Platform            | Localization Platform contracts and runtime                                  |
| `packages/i18n-locales`        | Platform            | In-memory translation bundle loaders                                         |
| `packages/locales`             | Platform            | Canonical translation resources                                              |
| `packages/formatting`          | Platform            | Platform Formatting library                                                  |
| `packages/ui`                  | Presentation        | Reusable React UI primitives                                                 |
| `packages/types`               | Contracts           | Platform-agnostic shared types                                               |
| `packages/timeline`            | Domain              | Timeline repository contract and in-memory adapter                           |
| `packages/timeline-web`        | Infrastructure      | Web IndexedDB durable Timeline persistence                                   |
| `packages/identity`            | Identity            | Better Auth, sessions, magic-link, passkey, Drizzle auth DB                  |
| `packages/medical-domain`      | Medical domain      | Infrastructure-neutral medical types and mappers                             |
| `packages/medical-persistence` | Medical persistence | PostgreSQL schema, migrations, repositories (server-only)                    |
| `packages/medical-service`     | Medical application | Server-side medical services (not web-importable persistence)                |

Applications may depend on packages; packages must not depend on applications.

### Medical import boundary

`apps/web` must not import `@diabetes-universe/medical-persistence` or database
internals. Enforcement: `apps/web/lib/medical/medical-import-boundary.test.mjs`.

Server-side medical composition uses `@diabetes-universe/medical-service` in
the merged P8 transport routes under `apps/web/app/api/v1/medical/...`. These
handlers are foundation/implementation-candidate code — they are not an activated
production medical launch.

## Current product surfaces

- **Dashboard** (`/`) — approved blocks with shared Timeline store integration
- **Timeline** (`/timeline`) — event journal, search, filters, edit/delete, Quick Add
- **Auth / account security** — magic-link and passkey sign-in, session management

## Medical platform architecture status

| Phase             | Document                                                                                          | Lifecycle status                                                                                          | Runtime in repo                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P7                | [Backend medical data](backend/p7-backend-medical-data-architecture.md)                           | Approved                                                                                                  | N/A (architecture)                                                                                        |
| P8                | [Medical API contracts](api/p8-medical-api-contracts.md)                                          | Approved                                                                                                  | Transport routes merged under `/api/v1/medical/...`; implementation candidate; production launch deferred |
| P9 design         | [Cloud medical persistence design](backend/p9-cloud-medical-persistence-implementation-design.md) | Approved                                                                                                  | N/A (architecture)                                                                                        |
| P9 implementation | [Medical persistence foundation](../implementation/p9-medical-persistence-foundation.md)          | Implementation complete; PostgreSQL rehearsal validated; production deployment deferred                   | Packages merged; no public routes                                                                         |
| P10               | [Local data adoption](sync/p10-local-data-adoption-architecture.md)                               | Approved ([closure](sync/p10-approval-closure.md), [charter](sync/p10-runtime-implementation-charter.md)) | Not implemented                                                                                           |
| P11               | [Offline sync](sync/p11-offline-sync-architecture.md)                                             | Approved ([closure record](sync/p11-approval-closure.md))                                                 | Not implemented                                                                                           |
| P12               | [Conflict / revision / tombstone](sync/p12-conflict-revision-tombstone-architecture.md)           | Approved with clarifications ([audit closure](sync/p12-architecture-security-audit.md))                   | Not implemented                                                                                           |
| P13               | [Security & privacy hardening](security/p13-security-privacy-hardening.md)                        | Approved (closing architecture gate)                                                                      | Operational controls not fully implemented                                                                |

The table records design and lifecycle state only. A merged or approved architecture
document is not permission to ship runtime behavior without a separate implementation
and security gate; P10 architecture approval is recorded in
[p10-approval-closure.md](sync/p10-approval-closure.md).

## Deliberate exclusions (not yet in repository runtime)

The repository does **not** currently provide product/runtime capabilities for:

- production medical API launch and operational rollout (route handlers exist as
  P8 foundation; public product activation remains deferred);
- P10 adoption runtime, P11 continuous sync runtime, P12 conflict/tombstone runtime;
- medical outbox dispatcher / consumer;
- complete production medical launch controls (production PostgreSQL provider
  selection, backup/PITR/RPO/RTO, live privilege smoke on launch target,
  P13 operational hardening implementation);
- production AI runtime;
- marketplace, community, or recipes product runtimes;
- native mobile applications;
- analytics domain runtime;
- CGM, insulin pump, wearable, and similar device integrations.

Auth databases, local IndexedDB Timeline persistence, and server-side medical
persistence **foundation packages** are implemented; the exclusions above refer
to product/runtime capabilities not yet wired or operational at production scale.

Adding excluded capabilities requires documented architecture decisions, explicit
implementation gates, and product requirements.

## Quality attributes

- Strict static typing
- Accessible UI primitives
- Explicit package ownership
- Reproducible builds
- Minimal dependency surface
- Fail-closed medical and auth configuration in production-capable modes

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
- [@diabetes-universe/web](../../apps/web/README.md) — Next.js application (CR-02, Feature Complete)
- [@diabetes-universe/platform-web](../../packages/platform-web/README.md)

## Medical platform documents

- [P7 — Backend Medical Data Architecture](backend/p7-backend-medical-data-architecture.md)
- [P8 — Medical API Contracts](api/p8-medical-api-contracts.md)
- [P9 — Cloud Medical Persistence Implementation Design](backend/p9-cloud-medical-persistence-implementation-design.md)
- [P9 — Medical Persistence Foundation Implementation](../implementation/p9-medical-persistence-foundation.md)
- [P9 — Medical Persistence Readiness Runbook](../implementation/p9-production-readiness-runbook.md)
- [P10 — Local Medical Data Adoption Architecture](sync/p10-local-data-adoption-architecture.md) · [P10 approval closure](sync/p10-approval-closure.md) · [P10 implementation charter](sync/p10-runtime-implementation-charter.md)
- [P11 — Offline Sync Architecture](sync/p11-offline-sync-architecture.md) · [P11 approval closure](sync/p11-approval-closure.md)
- [P12 — Conflict / Revision / Tombstone Architecture](sync/p12-conflict-revision-tombstone-architecture.md) · [P12 audit closure](sync/p12-architecture-security-audit.md)
- [P13 — Security, Privacy, and Production Hardening](security/p13-security-privacy-hardening.md)

## Notes

- Dashboard block localization (I18N-02A–02B5) is complete.
- Insulin Quick Add form and insulin Timeline presentation are localized
  (Wave 4C / 4B-II). The shared Quick Add action menu and shared picker chrome
  still contain Russian hardcode; nutrition, medication, activity, and note Quick
  Add remain incompletely migrated; UK/DE locale parity is still incomplete.
- Runtime locale switching is not production-ready.
