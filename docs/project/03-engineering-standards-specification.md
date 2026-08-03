# 03. Engineering Standards Specification

## Purpose

Define approved engineering standards for the Diabetes Universe repository:
principles, repository layout, naming, code quality, Git practices, validation,
documentation expectations, completion criteria, ADR format, and technical debt
management.

This document is the authoritative engineering standards specification. Linked
standards under document `01` remain in force for workflow details not restated
here.

## Status

Feature Complete

## Engineering Principles

- **Architecture lock** — implementation must not redesign approved architecture.
- **Package ownership** — changes stay inside the workspace that owns the concern.
- **Strict typing** — TypeScript strict mode is mandatory.
- **Explicit boundaries** — platform-agnostic contracts must not depend on web-only
  behavior.
- **Minimal surface** — dependencies and infrastructure are introduced only where
  validated requirements and approved architecture exist.
- **Single source of truth** — authoritative standards are linked, not duplicated.
- **Verifiable completion** — work is complete only when required validation passes
  and documentation is updated for the approved scope.

See [02 Project Governance Specification](02-project-governance-specification.md)
for governance hierarchy and [Development Standard](development-standard.md) for
day-to-day quality gates.

## Repository Standards

Diabetes Universe is a frontend monorepo managed with Turborepo and pnpm
workspaces.

| Area               | Standard                   |
| ------------------ | -------------------------- |
| Package manager    | pnpm 10.33.3               |
| Node.js            | 22 or later                |
| Task orchestration | Turborepo (`turbo.json`)   |
| Applications       | `apps/`                    |
| Shared packages    | `packages/`                |
| Documentation      | `docs/`                    |
| CI                 | `.github/workflows/ci.yml` |

Applications may depend on packages. Packages must not depend on applications.
Shared packages expose public APIs through package entry points only.

Current foundation workspaces include `@diabetes-universe/web`,
`@diabetes-universe/ui`, `@diabetes-universe/types`, and additional platform
packages introduced through approved architecture decisions.

## Naming Conventions

| Artifact                | Convention                                                               | Example                                                |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Project specifications  | `NN-topic-specification.md` in `docs/project/`                           | `03-engineering-standards-specification.md`            |
| Architecture docs       | `kebab-case.md` under `docs/architecture/`                               | `platform-readiness.md`                                |
| Specifications          | `kebab-case.md` under `docs/specs/`                                      | `dashboard/header.md`                                  |
| ADR files               | `NNNN-kebab-case-title.md` under `docs/adr/`                             | `0012-user-time-zone-policy.md`                        |
| Package names           | `@diabetes-universe/<workspace>`                                         | `@diabetes-universe/platform`                          |
| Implementation branches | descriptive `docs/` or `cursor/` prefix                                  | `cursor/docs-engineering-standards-specification-0174` |
| Source files            | match surrounding workspace conventions; prefer `kebab-case` for modules | `dashboard-header-model.ts`                            |

ADR numbers are sequential four-digit identifiers. New ADRs must be registered in
[ADR Index](../adr/index.md).

## Code Standards

- TypeScript strict mode is mandatory in all TypeScript workspaces.
- Prefer named exports in shared packages.
- Do not use cross-package deep imports; consume package public exports only.
- Keep React components small, accessible, and presentation-focused.
- Do not place web-specific behavior in shared type contracts.
- Add dependencies to the narrowest workspace that needs them.
- Match existing formatting, lint, and type conventions in the edited workspace.
- Avoid unrelated refactors outside the approved change scope.

Platform and product code must follow applicable Feature Complete architecture
documents and ADRs.

## Git Standards

Git workflow, pull request preparation, merge authorization, and branch cleanup
are defined in
[01 Project Development Specification](01-project-development-specification.md)
and governed by
[02 Project Governance Specification](02-project-governance-specification.md).

Engineering requirements for Git work:

- create a dedicated branch from current `main` for each approved change;
- use clear, descriptive commit messages in complete sentences;
- keep commits scoped to the approved task;
- open a pull request and wait for required CI checks before merge;
- merge only when explicitly authorized by the active governance process;
- delete temporary branches and synchronize `main` after merge.

This document does not restate the full governance change lifecycle.

## Validation Standards

Required validation commands for repository changes:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

| Gate       | Command             | Required |
| ---------- | ------------------- | -------- |
| Formatting | `pnpm format:check` | Yes      |
| Lint       | `pnpm lint`         | Yes      |
| Typecheck  | `pnpm typecheck`    | Yes      |
| Build      | `pnpm build`        | Yes      |

Additional commands apply when the approved scope requires them, including
Playwright end-to-end tests (`pnpm test:e2e`) for user-facing behavior.

Documentation-only changes must still pass formatting validation and link review.
CI on GitHub Actions must pass before merge unless an approved exception exists.

## Documentation Standards

Documentation structure, placement, writing rules, and maintenance are defined in
[Documentation Standard](documentation-standard.md).

Engineering documentation requirements:

- place documents in the narrowest applicable `docs/` section;
- link to authoritative sources instead of duplicating normative content;
- update [Documentation Index](../INDEX.md) and [Changelog](../CHANGELOG.md) when
  a governed document reaches a lifecycle milestone;
- use relative links between documents in `docs/`;
- keep status and version visible for governed specifications.

Numbered project specifications follow the approved project document sequence.

## Definition of Done

A change is done when all of the following are true for its approved scope:

- behavior is implemented and verified as required by the task or specification;
- affected documentation and navigation are updated when required;
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass;
- required CI checks pass on the pull request;
- no contradiction with Feature Complete governing documents or applicable ADRs;
- no unintended duplication, broken links, or scope expansion into the next
  document in the approved sequence.

Feature Complete status for governed documents follows
[02 Project Governance Specification](02-project-governance-specification.md).

## Architecture Decision Records (ADR)

ADR format is authoritative in this section per
[02 Project Governance Specification](02-project-governance-specification.md).

### When an ADR is required

Create an ADR when a decision affects:

- system boundaries or layer ownership;
- platform contracts or infrastructure placement;
- cross-cutting policies with long-term maintenance impact;
- approved specification structure or governance boundaries.

### ADR file location

- path: `docs/adr/NNNN-kebab-case-title.md`
- index: [ADR Index](../adr/index.md)

### Required sections

Every ADR must contain these sections in order:

1. **Title** — `ADR-NNNN — Short Title`
2. **Status** — `Proposed`, `Approved`, `Deprecated`, or `Superseded`
3. **Context** — problem, constraints, and background
4. **Decision** — approved architectural choice
5. **Consequences** — positive, negative, and follow-up effects
6. **Alternatives** — rejected options and why
7. **Date** — decision date (`YYYY-MM-DD`)
8. **Author** — decision author or owning role

Use [ADR Template](../adr/template.md) when creating a new record.

### ADR maintenance

- register every new ADR in [ADR Index](../adr/index.md);
- mark superseded ADRs with replacement references;
- do not delete historical ADRs; deprecate or supersede them explicitly.

## Technical Debt Management

Technical debt must be visible, owned, and time-bounded.

| Requirement | Rule                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Recording   | document debt in an ADR note, specification, issue, or changelog entry |
| Scope       | state affected modules, documents, or workspaces                       |
| Risk        | describe user, safety, or maintenance impact                           |
| Owner       | assign an accountable maintainer                                       |
| Remediation | define a concrete reduction plan or expiry condition                   |

Silent accumulation of permanent workarounds is prohibited. Unmanaged permanent
exceptions are governed by
[02 Project Governance Specification](02-project-governance-specification.md).

Prefer removing debt through approved follow-up tasks rather than expanding scope
in unrelated changes.

## Engineering Success Criteria

Engineering standards are successful when:

- repository layout and naming remain consistent with this specification;
- code changes respect package boundaries and strict typing;
- validation gates pass before merge;
- documentation updates accompany governed changes;
- significant architectural decisions are recorded as ADRs using the approved
  format;
- technical debt is explicit and remediated through approved follow-up work;
- implementation complies with Feature Complete governing documents;
- contradictions with approved architecture are reported as **Blocked** instead
  of being fixed independently.

## Dependencies

- [01 Project Development Specification](01-project-development-specification.md)
- [02 Project Governance Specification](02-project-governance-specification.md)
- [Development Standard](development-standard.md)
- [Documentation Standard](documentation-standard.md)
- [Project Rules](project-rules.md)
- [ADR Index](../adr/index.md)
- [Developer Bible](../developer-bible/README.md)

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Git workflow details remain authoritative in document `01`; governance lifecycle
  remains authoritative in document `02`.
