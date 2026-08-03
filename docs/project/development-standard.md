# Development Standard

## Status

Approved — part of [01 Project Development Specification](01-project-development-specification.md)

## Scope

This standard defines engineering workflow, quality gates, and review
expectations for Diabetes Universe repository work.

It applies to application code, shared packages, and documentation changes that
affect build or review outcomes.

## Requirements

- TypeScript strict mode is mandatory.
- Changes stay inside the workspace that owns the concern.
- Shared packages expose named exports through package entry points.
- Cross-package deep imports are not allowed.
- Web-specific behavior must not leak into platform-agnostic contracts.
- Dependencies are added only to the narrowest workspace that needs them.
- Infrastructure is not introduced before a validated requirement and approved
  architecture decision exist.

See [Developer Bible](../developer-bible/README.md) for package ownership and
conventions.

## Workflow

1. Install dependencies with `pnpm install`.
2. Implement changes on a dedicated branch from current `main`.
3. Keep documentation aligned with behavior in the same change when the update is
   required by the approved scope.
4. Before review, run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

5. Open a pull request and wait for CI.
6. Merge only after required checks pass and the approved scope is satisfied.
7. After merge, synchronize `main` and remove temporary branches.

Repository implementation steps for approved documents are defined in
[01 Project Development Specification](01-project-development-specification.md).

## Quality Gates

| Gate       | Command             | Required for           |
| ---------- | ------------------- | ---------------------- |
| Formatting | `pnpm format:check` | All repository changes |
| Lint       | `pnpm lint`         | All repository changes |
| Typecheck  | `pnpm typecheck`    | TypeScript workspaces  |
| Build      | `pnpm build`        | All repository changes |

Additional test commands apply when the approved scope requires them, for
example Playwright end-to-end tests for user-facing behavior.

A change is not complete until required gates pass and affected documentation is
updated.

## Review

Reviewers confirm:

- the change matches approved architecture and scope;
- package boundaries and ownership are preserved;
- documentation and navigation are updated when required;
- no unrelated refactors or speculative infrastructure were introduced.

Contradictions with approved architecture must be reported and resolved through
architecture review, not ad hoc implementation changes.

## Notes

- Local development starts with `pnpm dev`.
- Node.js 22 or later and pnpm 10.33.3 are required.
- Product safety and trust constraints remain defined in the
  [Product Bible](../product-bible/README.md).
