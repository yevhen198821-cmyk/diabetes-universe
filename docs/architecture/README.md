# Architecture

## Purpose

This section documents system structure, boundaries, responsibilities, and dependencies.

## Status

<!-- Allowed values: Draft | Approved | Deprecated -->

## Responsibility

Architecture documents define ownership and relationships between system areas.

## Dependencies

Architecture documentation depends on approved project requirements and architecture decisions.

## What Belongs Here

System boundaries, component responsibilities, dependencies, quality attributes, and architecture constraints belong here.

## What Does Not Belong Here

Feature acceptance criteria, visual design rules, source code, and transient implementation notes should not be stored here.

## System shape

Diabetes Universe starts as a frontend monorepo. Turborepo coordinates tasks,
while pnpm provides deterministic workspace dependency management.

```text
apps/web ───────> packages/ui
     │
     └──────────> packages/types (when shared contracts are required)
```

## Boundaries

- `apps/web` owns routing, page composition, metadata, and web-only concerns.
- `packages/ui` owns reusable, presentation-focused React primitives.
- `packages/types` owns platform-agnostic contracts, not runtime behavior.
- Applications may depend on packages; packages must not depend on applications.
- Domain and infrastructure layers will be introduced through explicit
  architecture decisions when their requirements exist.

## Deliberate exclusions

The current foundation contains no backend, database, authentication, API,
mobile, marketplace, or AI implementation. Adding any of these requires a
documented architecture decision and an explicit product requirement.

## Quality attributes

- Strict static typing
- Accessible UI primitives
- Explicit package ownership
- Reproducible builds
- Minimal dependency surface

## Platform modules

- [Localization Platform Overview](localization/overview.md)
- [Platform Readiness](localization/platform-readiness.md)
- [Web Composition Root](composition-root/web-composition-root.md)
- [@diabetes-universe/web](../../../apps/web/README.md) — thin Next.js bootstrap (CR-02, Feature Complete)
- [@diabetes-universe/platform-web](../../../packages/platform-web/README.md)

## Notes
