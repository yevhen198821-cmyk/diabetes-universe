# Diabetes Universe

Monorepo for the Diabetes Universe commercial product — web application,
platform foundation, identity, local Timeline persistence, and cloud medical
persistence foundation.

## Current scope

### Implemented

- **Next.js web application** (`apps/web`) with Dashboard (`/`) and Timeline
  (`/timeline`) surfaces, account security, and auth entry flows
- **Platform / i18n / formatting / UI foundation** per
  [ADR-0011](docs/adr/0011-platform-infrastructure-layer.md)
- **Timeline domain** (`packages/timeline`) and **durable local Timeline
  persistence** via IndexedDB (`packages/timeline-web`, ADR-0015)
- **Identity / authentication foundation** (`packages/identity`) — Better Auth
  with PostgreSQL/Drizzle, magic-link sign-in, passkey (WebAuthn)
  enrollment/sign-in, and session management (P6/P6c)
- **Medical platform packages** (P9 implementation foundation, merged):
  - `@diabetes-universe/medical-domain`
  - `@diabetes-universe/medical-persistence` — PostgreSQL `medical` schema,
    migrations, repositories, revision/CAS, idempotency, audit/outbox atomicity
  - `@diabetes-universe/medical-service` — subject provisioning and transactional
    medical event create (server-side; not exposed via public web routes)
- Architecture, product, and developer documentation through the P7–P13 medical
  platform architecture wave

`apps/web` does **not** import `@diabetes-universe/medical-persistence`
directly; medical persistence remains a server-side bounded context.

### Architecture defined; runtime not yet complete

Design documentation exists for the following stages, but lifecycle approval varies
by stage and product/runtime implementation is **not** yet delivered in this
repository:

- **P10** — local medical data adoption (Draft; approval closure pending)
- **P11** — offline sync (Approved)
- **P12** — conflict / revision / tombstone architecture (Approved with normative clarifications)
- **P13** — security, privacy, and production hardening architecture (Approved)

See [Architecture Overview](docs/architecture/README.md) for authoritative lifecycle
status. A merged architecture document is not, by itself, permission to enable
runtime behavior.

### Not yet implemented

- Public medical API transport (`/api/v1/medical/*`)
- Adoption runtime (P10)
- Continuous offline sync runtime (P11)
- Conflict / tombstone runtime (P12)
- Outbox dispatcher / consumer
- Complete production medical deployment controls (live Neon privilege enforcement,
  P13 operational gates)
- Production AI runtime
- CGM, insulin pump, and wearable device integrations
- Marketplace, Community, and Recipes product runtimes (architecture placeholders
  only unless source code proves otherwise)
- Native mobile applications

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
  timeline/                     Timeline repository contract + in-memory adapter
  timeline-web/                 Web IndexedDB durable Timeline persistence
  identity/                     Authentication, sessions, Better Auth + Drizzle
  medical-domain/               Infrastructure-neutral medical domain types
  medical-persistence/          PostgreSQL medical schema, migrations, repositories
  medical-service/              Server-side medical application services

docs/
  architecture/                 System boundaries and dependencies
  implementation/               Implementation status and closure records
  product/                      Product policies and living backlogs
  product-bible/                Product principles and scope
  developer-bible/              Engineering workflow and conventions
```

Dependency direction (simplified):

```text
apps/web
  → platform-web, ui, types, timeline, timeline-web, identity
  → platform, i18n, i18n-locales, locales, formatting (via composition paths)
  → must NOT import medical-persistence directly

packages/medical-service
  → medical-persistence, medical-domain

packages/medical-persistence
  → medical-domain

packages/platform, timeline, i18n, formatting, locales, identity, medical-*
  → must not depend on apps/web
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
