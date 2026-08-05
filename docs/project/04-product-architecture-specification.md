# 04. Product Architecture Specification

## Purpose

Define the approved product architecture for the Diabetes Universe ecosystem:
vision, scope, principles, surfaces, modules, responsibilities, user roles,
boundaries, scalability rules, and success criteria.

This document is the authoritative product architecture specification. It governs
how product surfaces and modules are organized without redefining governance,
engineering workflow, or implementation standards defined in documents `00`–`03`.

## Status

Feature Complete

## Product Vision

Create the most useful, reliable, and trusted international digital ecosystem for
people with diabetes.

Diabetes Universe must become a daily digital companion that can serve millions
of people across countries, languages, age groups, platforms, and diabetes types
without changing its fundamental architecture.

See [00 Project Constitution](00-project-constitution.md) for the highest-level
vision and mission.

## Product Scope

Diabetes Universe is a long-term ecosystem rather than a single application.

The product architecture must support:

- web applications;
- iOS and Android applications;
- desktop experiences;
- Dashboard and Timeline;
- analytics and reporting;
- AI-assisted services;
- education;
- marketplace capabilities;
- medical-service integrations;
- notifications and reminders;
- localization;
- public APIs and developer services;
- administrative tools;
- corporate and marketing websites;
- future products that remain consistent with this specification.

No product decision may bind the ecosystem to one country, language, age group,
diabetes type, device, or product surface.

### Current repository milestone

The current repository milestone establishes the frontend engineering foundation
and approved documentation boundaries. Implemented product modules are limited to
Dashboard, Timeline, Navigation, and the Localization Platform. Backend services,
databases, authentication, mobile applications, marketplace capabilities, and AI
implementation remain out of scope until approved requirements and architecture
decisions exist.

## Product Principles

Product architecture follows the core principles defined in
[00 Project Constitution](00-project-constitution.md):

- **User Value First** — every product surface must create clear user value or
  protect safety, reliability, usability, or long-term quality.
- **Safety First** — medical-data confidentiality, user safety, access control,
  auditability, recovery, and reliable operation take priority over convenience
  or aesthetics.
- **Simplicity Over Complexity** — prefer the simpler solution when requirements
  are equally satisfied; frequent actions should require no more than three
  interactions when technically and clinically appropriate.
- **Architecture Before Implementation** — product modules follow approved
  architecture and specifications; temporary shortcuts that create uncontrolled
  technical debt are prohibited.
- **Scalability by Default** — solutions must support long-term growth,
  international localization, multiple platforms, and millions of users without
  redesigning the fundamental architecture.
- **One Source of Truth** — each governed product topic has one authoritative
  document; other documents link to it instead of duplicating normative
  requirements.
- **AI Assists but Does Not Replace Clinical Authority** — AI may analyze data,
  identify patterns, explain results, prepare reports, and assist users; AI must
  not diagnose, prescribe treatment, modify medical records autonomously, or make
  clinical decisions instead of a qualified professional.

## Product Ecosystem

Diabetes Universe is organized as a set of coordinated product surfaces and
platform capabilities.

### Consumer surfaces

- **Web application** — primary delivery surface in the current repository
  (`@diabetes-universe/web`).
- **Mobile applications** — planned iOS and Android surfaces sharing
  platform-agnostic contracts.
- **Desktop experiences** — planned surfaces that reuse shared product modules
  where appropriate.

### Core product modules

- **Dashboard** — home screen that aggregates current state.
- **Timeline** — canonical event journal for diabetes-related events.
- **Navigation** — approved route contracts between primary screens.
- **Quick Add** — shared entry point for recording events on Dashboard and
  Timeline.

### Platform capabilities

- **Localization** — internationalization, locale resources, and presentation-time
  formatting.
- **Presentation platform** — composition root, platform providers, and
  presentation context.
- **Shared UI** — reusable, accessible React primitives (`@diabetes-universe/ui`).
- **Shared contracts** — platform-agnostic types and policies
  (`@diabetes-universe/types` and related platform packages).

### Planned product modules

Architecture placeholders exist for modules not yet implemented:

- Analytics
- AI
- Recipes
- Encyclopedia
- Marketplace
- Reminders
- My Health
- Reports
- Settings

### Supporting surfaces

- **Administrative tools** — planned operational and content-management surfaces.
- **Corporate and marketing websites** — planned public-facing properties.
- **Public APIs and developer services** — planned integration surfaces for
  partners and extensions.
- **Medical-service integrations** — planned connections to clinical and care
  workflows.

### Documentation

Authoritative product, architecture, specification, UX, design-system, and data
documents in `docs/` are part of the product ecosystem and must remain
synchronized with approved implementation.

## Product Modules

| Module       | Surface / area           | Status in repository        | Authoritative architecture                                                   |
| ------------ | ------------------------ | --------------------------- | ---------------------------------------------------------------------------- |
| Dashboard    | Consumer web             | Feature Complete            | [Dashboard Overview](../architecture/dashboard/overview.md)                  |
| Timeline     | Consumer web             | Feature Complete            | [Timeline Overview](../architecture/timeline/overview.md)                    |
| Navigation   | Consumer web             | Approved                    | [Navigation Overview](../architecture/navigation/overview.md)                |
| Localization | Platform                 | In progress / partial       | [Localization Overview](../architecture/localization/overview.md)            |
| Presentation | Platform                 | Feature Complete foundation | [Presentation Context](../architecture/presentation/presentation-context.md) |
| Analytics    | Consumer                 | Planned                     | [Analytics Overview](../architecture/analytics/overview.md)                  |
| AI           | Consumer / platform      | Planned                     | [AI Overview](../architecture/ai/overview.md)                                |
| Recipes      | Consumer                 | Planned                     | [Recipes Overview](../architecture/recipes/overview.md)                      |
| Encyclopedia | Consumer / education     | Planned                     | [Encyclopedia Overview](../architecture/encyclopedia/overview.md)            |
| Marketplace  | Consumer / commerce      | Planned                     | [Marketplace Overview](../architecture/marketplace/overview.md)              |
| Reminders    | Consumer / notifications | Planned                     | [Reminders Overview](../architecture/reminders/overview.md)                  |
| My Health    | Consumer                 | Planned                     | [My Health Overview](../architecture/my-health/overview.md)                  |
| Reports      | Consumer / reporting     | Planned                     | [Reports Overview](../architecture/reports/overview.md)                      |
| Settings     | Consumer                 | Planned                     | [Settings Overview](../architecture/settings/overview.md)                    |

Module behavior, acceptance criteria, and UI details are defined in
`docs/specs/`, `docs/ux/`, and `docs/ui/` rather than in this document.

## Module Responsibilities

### Dashboard

- Serve as the home screen at `/`.
- Present approved aggregation blocks: Header, Next Action, Last Glucose, Day
  Summary, Recent Events, and AI Insight.
- Derive current-state summaries from the shared Timeline event store.
- Provide Quick Add entry and link to Timeline for the full event journal.
- Remain separate from Timeline journal responsibilities.

### Timeline

- Serve as the canonical event journal at `/timeline`.
- Own chronological history, search, filters, grouped history, event details,
  edit and delete flows, Quick Add, and pagination.
- Maintain shared app-level event state consumed by Dashboard derived views.
- Not duplicate Dashboard aggregation blocks.

### Navigation

- Define canonical routes: `/` for Dashboard, `/timeline` for Timeline.
- Preserve backward-compatible redirect from `/dashboard` to `/`.
- Keep Dashboard and Timeline as separate screens with explicit navigation
  contracts.

### Localization and presentation platform

- Provide locale resources, runtime formatting, and presentation context.
- Keep platform contracts platform-agnostic and independent of web-only behavior.
- Integrate through the approved composition root and platform providers.

### Planned modules

Planned modules listed in the Product Modules table remain architecture placeholders
until approved requirements, specifications, and implementation lifecycles are
completed. They must not be implemented ahead of approved architecture.

### Responsibility rules

- one screen has one primary task;
- one module has one clear product purpose;
- each data concern has one authoritative source;
- duplication across modules is prohibited without explicit justification;
- shared contracts remain platform-agnostic.

## User Roles

| Role                        | Responsibility in the ecosystem                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Person with diabetes**    | Primary end user; records events, reviews current state, and uses education and support tools.  |
| **Caregiver**               | Planned supporting user who may assist with monitoring and coordination under explicit consent. |
| **Healthcare professional** | Planned clinical or care participant through approved medical-service integrations only.        |
| **Administrator**           | Planned operator of administrative tools, content, and operational configuration.               |
| **Developer / partner**     | Planned consumer of public APIs and developer services under approved integration policies.     |

Role-specific permissions, consent models, and clinical workflows are defined in
future specifications and ADRs. This document establishes role boundaries only.

## Product Boundaries

### In scope for current foundation

- frontend monorepo delivery through Turborepo and pnpm workspaces;
- Next.js web application bootstrap and page composition;
- shared UI, types, and platform packages introduced through approved decisions;
- Dashboard, Timeline, Navigation, and Localization platform foundations;
- authoritative documentation, navigation, and change history.

### Deliberate exclusions until approved

The current foundation intentionally excludes:

- backend services and persistence;
- databases;
- authentication and authorization systems;
- public APIs;
- mobile, desktop, marketplace, and AI implementation;
- medical-service integrations;
- administrative and corporate website delivery.

Adding any excluded capability requires an approved product requirement, updated
architecture documentation, and an ADR when architecture is affected.

### Screen and data boundaries

- Dashboard aggregates current state; Timeline is the event journal.
- Timeline event data is the temporal source of truth for approved event kinds.
- Search, filter, details, and pagination state remain local to Timeline UI
  boundaries unless a future approved specification states otherwise.
- Product behavior must not imply diagnosis or treatment without required
  clinical, legal, and regulatory review.

### Documentation boundaries

- product architecture is authoritative in this document;
- module behavior is authoritative in architecture and specification documents;
- governance and engineering process remain authoritative in documents `00`–`03`.

## Scalability Principles

Product architecture must remain viable for at least five years of planned
ecosystem growth.

- **International by design** — localization, formatting, and locale resources are
  architectural concerns, not later additions.
- **Multi-platform contracts** — shared types and policies must not depend on a
  single runtime or UI framework.
- **Modular growth** — new modules are introduced through explicit architecture
  decisions with bounded responsibilities.
- **Operational scale** — future backend, notification, analytics, and AI
  services must scale without redesigning consumer module boundaries.
- **Explicit dependencies** — cross-module integration uses documented contracts
  rather than hidden coupling.
- **Minimal surface** — capabilities are introduced only where validated
  requirements and approved architecture exist.

## Product Success Criteria

Product architecture is successful when:

- product surfaces and modules map to explicit responsibilities without overlap;
- Dashboard and Timeline remain distinct with a single shared event source;
- planned modules have reserved architecture boundaries before implementation;
- safety, privacy, and clinical-assistance limits from the constitution are
  preserved across surfaces;
- localization and accessibility remain architectural concerns across modules;
- documentation navigation reflects the approved module map;
- implementation complies with Feature Complete governing documents for delivered
  modules;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent product redesign.

## Dependencies

- [00 Project Constitution](00-project-constitution.md)
- [01 Project Development Specification](01-project-development-specification.md)
- [02 Project Governance Specification](02-project-governance-specification.md)
- [03 Engineering Standards Specification](03-engineering-standards-specification.md)
- [Architecture Overview](../architecture/README.md)
- [Product Bible](../product-bible/README.md)
- [ADR Index](../adr/index.md)

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- Governance hierarchy and change lifecycle remain authoritative in document `02`.
- Engineering standards remain authoritative in document `03`.
