# 01. Project Development Specification

## Purpose

Define the approved project development methodology, document lifecycle, and
repository implementation process for Diabetes Universe.

This specification is the first document in the official project documentation
sequence. It governs how approved requirements become Feature Complete repository
artifacts without independent architectural changes.

## Status

Approved — Feature Complete

## Methodology

Diabetes Universe follows **Architecture-Driven Development (ADD)**. Platform
Foundation and product modules are delivered through explicit architecture
decisions, bounded responsibilities, and verifiable completion criteria.

See [ADR-0011 — Platform Infrastructure Layer](../adr/0011-platform-infrastructure-layer.md).

## Scope

This specification covers:

- project development lifecycle and completion criteria;
- repository implementation workflow for approved documents;
- references to project standards that must not be duplicated here.

This specification does **not** define:

- product vision, principles, or roadmap content (reserved for later documents
  in the approved sequence);
- feature behavior, UI design, or system architecture for individual modules;
- implementation details for code not yet approved by architecture review.

## Document suite

The Project Development Specification is implemented as one canonical document
plus linked standards. Do not copy their content into this file.

| Document                                            | Role                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| [Development Standard](development-standard.md)     | Engineering workflow, quality gates, and review expectations  |
| [Documentation Standard](documentation-standard.md) | Documentation structure, placement, and maintenance rules     |
| [Project Rules](project-rules.md)                   | Mandatory project constraints and exceptions process          |
| [Glossary](glossary.md)                             | Canonical terminology with links to authoritative definitions |

Related product direction remains in the [Product Bible](../product-bible/README.md)
until dedicated project documents in the approved sequence are implemented.

## Development lifecycle

Each approved document or module follows the same lifecycle:

1. **Architecture approval** — document structure and requirements are approved
   before repository implementation begins.
2. **Repository implementation** — place the document in the official
   documentation structure or implement approved code in the owning workspace.
3. **Documentation update** — update navigation, changelog, and cross-links without
   duplication.
4. **Validation** — verify structure, links, formatting, and absence of
   contradictions with approved architecture.
5. **Git workflow** — commit, push, and open a pull request from a dedicated
   branch.
6. **Continuous integration** — all required checks must pass before merge.
7. **Final review** — perform an engineering audit against the approved scope.
8. **Merge and cleanup** — merge to `main`, delete temporary branches, and
   synchronize local `main` with `origin/main`.

If contradictions with approved architecture are discovered at any step, work
must stop and be reported. Do not resolve contradictions by making independent
architectural decisions.

## Feature Complete definition

A document or module is **Feature Complete** only when all of the following are
true:

- the approved content is implemented in the repository;
- required navigation documents are updated (`INDEX`, `CHANGELOG`, and linked
  README files when applicable);
- internal links are valid and there is no unintended duplication;
- required validation and CI checks pass;
- merge to `main` is complete;
- the working tree is clean and `main` matches `origin/main`;
- temporary implementation branches are removed.

Feature Complete does not imply future documents, locales, backend services, or
product capabilities outside the approved scope.

## Repository implementation process

Use this process for TASK-style repository implementation of approved documents.

### 1. Create a working branch

Create a dedicated branch from current `main`. Use a descriptive `docs/` or
`cursor/` branch name that identifies the document being implemented.

### 2. Repository implementation

Place the document in the official structure defined in
[Documentation Standard](documentation-standard.md).

If the structure requires improvement, report the proposal in the implementation
summary. Do not change approved document architecture independently.

### 3. Documentation update

Update at minimum:

- [Documentation Index](../INDEX.md);
- [Changelog](../CHANGELOG.md);
- root [README](../../README.md) when the document is part of top-level project
  navigation;
- cross-links between related documents.

Do not create duplicate copies of the same content in multiple locations.

### 4. Validation

Verify:

- documentation structure;
- link correctness;
- absence of broken links;
- absence of unintended duplication;
- consistent formatting with repository conventions.

### 5. Git workflow

Commit with a clear message, push the branch, and open a pull request targeting
`main`.

### 6. Continuous integration

Wait for all required CI checks. If checks fail, fix the problems on the same
branch and push again.

### 7. Preview

When documentation is published automatically from pull requests, verify the
preview before merge.

### 8. Final review

Perform an engineering audit confirming that implementation matches the approved
scope and that no architectural requirements were changed.

### 9. Merge

Merge only after CI and review requirements are satisfied.

### 10. Cleanup

After merge:

- delete the local implementation branch;
- delete the remote implementation branch;
- run `git fetch --prune`;
- confirm work continues from an up-to-date `main`.

## Quality gates

Repository changes must satisfy the gates defined in
[Development Standard](development-standard.md):

- formatting check;
- lint;
- typecheck;
- production build.

Documentation-only changes must still pass formatting validation and link
review.

## Dependencies

- [ADR-0011 — Platform Infrastructure Layer](../adr/0011-platform-infrastructure-layer.md)
- [Development Standard](development-standard.md)
- [Documentation Standard](documentation-standard.md)
- [Project Rules](project-rules.md)
- [Developer Bible](../developer-bible/README.md)
- [Product Bible](../product-bible/README.md)

## Notes

- Document `01` must be Feature Complete before later documents in the approved
  sequence are implemented.
- Do not begin the next document, create new specifications, or change the
  approved development sequence without architecture review.
- Engineering conventions for day-to-day coding remain in the
  [Developer Bible](../developer-bible/README.md).
