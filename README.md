# Diabetes Universe

Frontend monorepo for the Diabetes Universe commercial product.

## Current scope

This repository contains the approved frontend foundation and a **demo web
application** with Dashboard (`/`) and Timeline (`/timeline`) surfaces:

- a Next.js web application (`apps/web`);
- platform packages (localization, formatting, runtime aggregate, web composition
  root) per [ADR-0011](docs/adr/0011-platform-infrastructure-layer.md);
- shared React UI primitives (`packages/ui`);
- shared platform-agnostic contracts (`packages/types`);
- architecture, product, and developer documentation.

**Not implemented in this repository (future / out of scope):** backend
services, databases, authentication, production AI, marketplace runtime, native
mobile applications, offline/sync persistence, analytics domain, and device
integrations (CGM, insulin pumps, wearables, and similar connected devices are
not product capabilities today).

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
pnpm test          # Run unit tests across all workspaces
pnpm test:e2e      # Run Playwright end-to-end tests (requires browser install)
pnpm format        # Format supported files
pnpm format:check  # Verify formatting without writing files
```

## Local validation

Run the standard validation sequence before review:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
python3 scripts/validate-markdown-links.py
```

## Repository structure

Per [ADR-0011 — Platform Infrastructure Layer](docs/adr/0011-platform-infrastructure-layer.md):

```text
apps/
  web/                          Next.js application (Composition Root wiring)

packages/
  platform/                     Platform Runtime aggregate (createPlatformRuntime)
  platform-web/                 Web Composition Root adapter
  i18n/                         Localization Platform contracts + runtime
  i18n-locales/                 Localization Infrastructure adapters (in-memory loaders)
  locales/                      Canonical translation resources
  formatting/                   Platform Formatting library
  ui/                           Shared React UI primitives
  types/                        Shared platform-agnostic contracts

docs/
  architecture/                 System boundaries and dependencies
  product/                      Product policies and living backlogs
  product-bible/                Product principles and scope
  developer-bible/              Engineering workflow and conventions
```

Dependency direction (simplified):

```text
apps/web
  → platform-web, ui, types
  → platform, i18n, i18n-locales, locales, formatting (via composition paths)

packages/platform, i18n, formatting, locales
  → no dependency on apps/web
```

## Documentation

- [Documentation Index](docs/INDEX.md)
- [00 Project Constitution](docs/project/00-project-constitution.md)
- [01 Project Development Specification](docs/project/01-project-development-specification.md)
- [02 Project Governance Specification](docs/project/02-project-governance-specification.md)
- [03 Engineering Standards Specification](docs/project/03-engineering-standards-specification.md)
- [04 Product Architecture Specification](docs/project/04-product-architecture-specification.md)
- [05 Brand Architecture Specification](docs/brand/05-brand-architecture-specification.md)
- [06 Logo Architecture Specification](docs/brand/06-logo-architecture-specification.md)
- [07 Brand Identity Specification](docs/brand/07-brand-identity-specification.md)
- [08 Brand Governance Specification](docs/brand/08-brand-governance-specification.md)
- [09 Brand Book](docs/brand/09-brand-book.md)
- [10 Visual Design System Specification](docs/design-system/10-visual-design-system-specification.md)
- [11 Design Tokens Specification](docs/design-system/11-design-tokens-specification.md)
- [12 UI Component Specification](docs/design-system/12-ui-component-specification.md)
- [13 DU Standard Specification](docs/project/13-du-standard-specification.md)
- [14 App Icon Architecture Specification](docs/design-system/14-app-icon-architecture-specification.md)
- [15 Brand Logo System Specification](docs/design-system/15-brand-logo-system-specification.md)
- [16 Color System Specification](docs/design-system/16-color-system-specification.md)
- [17 Typography System Specification](docs/design-system/17-typography-system-specification.md)
- [18 Iconography System Specification](docs/design-system/18-iconography-system-specification.md)
- [19 Illustration System Specification](docs/design-system/19-illustration-system-specification.md)
- [20 Motion System Specification](docs/design-system/20-motion-system-specification.md)
- [Architecture](docs/architecture/README.md)
- [ADR Index](docs/adr/index.md)
- [Product Bible](docs/product-bible/README.md)
- [Developer Bible](docs/developer-bible/README.md)

## Licensing

This repository is proprietary. See [LICENSE](LICENSE) for terms. Diabetes Universe
is not currently distributed as open source.
