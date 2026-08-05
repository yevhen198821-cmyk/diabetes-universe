# Developer Bible

## Workflow

1. Install dependencies with `pnpm install`.
2. Run the workspace with `pnpm dev`.
3. Keep changes inside the package that owns the concern.
4. Before review, run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`,
   `pnpm test`, `pnpm build`, and `python3 scripts/validate-markdown-links.py`.

## Conventions

- TypeScript strict mode is mandatory.
- Prefer named exports in shared packages.
- Keep React components small, accessible, and presentation-focused.
- Do not introduce cross-package deep imports; use package exports.
- Do not place web-specific behavior in shared type contracts.
- Add dependencies to the narrowest workspace that needs them.
- Avoid adding infrastructure before a validated requirement exists.

## Package ownership

| Workspace                  | Responsibility                   |
| -------------------------- | -------------------------------- |
| `@diabetes-universe/web`   | Web routing and page composition |
| `@diabetes-universe/ui`    | Shared React UI primitives       |
| `@diabetes-universe/types` | Shared platform-agnostic types   |

## Definition of done

A change is complete when its behavior is verified, documentation is updated
where needed, formatting and static checks pass, and the production build
succeeds.
