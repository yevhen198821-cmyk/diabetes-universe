# Diabetes Universe

Frontend monorepo for the Diabetes Universe commercial product.

## Current scope

This repository currently contains only the project foundation:

- a Next.js web application;
- a shared React UI package;
- a shared TypeScript contracts package;
- architecture, product, and developer documentation.

Backend services, databases, authentication, APIs, mobile applications,
marketplace capabilities, and AI features are intentionally out of scope.

## Technology

- Turborepo and pnpm workspaces
- Next.js and React
- TypeScript in strict mode
- Tailwind CSS
- ESLint and Prettier

## Requirements

- Node.js 22 or later
- pnpm 10.33.3

Enable the package manager through Corepack if pnpm is unavailable:

```bash
corepack enable
```

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm dev           # Start applications in development mode
pnpm build         # Create production builds
pnpm lint          # Run static analysis
pnpm typecheck     # Check all TypeScript workspaces
pnpm format        # Format supported files
pnpm format:check  # Verify formatting without writing files
```

## Repository structure

```text
apps/
  web/                 Next.js web application
packages/
  ui/                  Shared React UI primitives
  types/               Shared platform-agnostic types
docs/
  architecture/        Architecture decisions and boundaries
  product-bible/       Product principles and scope
  developer-bible/     Engineering workflow and conventions
```

## Documentation

- [Documentation Index](docs/INDEX.md)
- 00 Project Constitution — repository implementation pending a separate lifecycle
- [01 Project Development Specification](docs/project/01-project-development-specification.md)
- [02 Project Governance Specification](docs/project/02-project-governance-specification.md)
- [Architecture](docs/architecture/README.md)
- [Product Bible](docs/product-bible/README.md)
- [Developer Bible](docs/developer-bible/README.md)
