# 12. UI Component Specification

## Purpose

Define the approved architecture of the reusable UI component system for the
Diabetes Universe Design System: objectives, component structure, principles,
hierarchy, component categories, states, accessibility, internationalization,
cross-platform behavior, and governance.

This document is the authoritative UI component specification. It defines how
reusable components are organized and consumed without implementing components,
application screens, Storybook, platform code, or production assets.

## Status

Feature Complete

## Objectives

The UI component architecture must provide a scalable, shared foundation for:

- Web;
- iOS;
- Android;
- Desktop;
- future Diabetes Universe products.

Components must:

- consume design tokens from
  [11 Design Tokens Specification](11-design-tokens-specification.md) without
  redefining them;
- preserve semantic meaning across platforms;
- support accessibility and localization by default;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md);
- enable product features to compose governed UI structures without duplicating
  visual architecture.

## Component Architecture

Reusable UI components sit between governed design tokens and product features.
Layers must not be merged or bypassed.

```text
Design Tokens (Foundation → Semantic → Component)
        ↓
Components (Foundation → Primitive → Composite)
        ↓
Product Features (Feature-level composition)
```

| Layer                | Role                                                             |
| -------------------- | ---------------------------------------------------------------- |
| **Design Tokens**    | Governed visual primitives and semantic roles from document `11` |
| **Semantic Tokens**  | Purpose-driven roles consumed by component styling               |
| **Components**       | Reusable UI structures with stable semantic behavior             |
| **Product Features** | Application screens and flows composing governed components      |

Consumption rules:

1. Components consume component and semantic tokens from document `11`.
2. Components must not redefine design tokens, semantic roles, or brand rules.
3. Product features compose components; they must not fork component architecture.
4. Feature-level composition must not bypass primitive or composite layers where
   a governed component exists.
5. Medical and AI presentation must use approved medical and AI component
   categories.

This document does not define token values, component APIs, or implementation code.

## Component Principles

All reusable components must follow these approved principles:

- **single responsibility** — each component addresses one clear UI responsibility;
- **composability** — components combine predictably without hidden coupling;
- **consistency** — shared behavior and presentation across surfaces and platforms;
- **accessibility by default** — accessible interaction and presentation are required;
- **semantic behavior** — components express purpose, state, and domain meaning;
- **predictable API** — naming, structure, and behavior follow governed patterns;
- **platform adaptation without architectural divergence** — native interaction may
  vary; semantic identity and token consumption must not.

## Component Hierarchy

Components are organized into four architectural levels. Levels must not be merged.

```text
Foundation
        ↓
Primitive
        ↓
Composite
        ↓
Feature-level composition
```

| Level                         | Role                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| **Foundation**                | Token-bound structural and visual primitives                    |
| **Primitive**                 | Single-purpose interactive or presentational building blocks    |
| **Composite**                 | Multi-part components combining primitives with shared behavior |
| **Feature-level composition** | Product screens and flows assembling composite components       |

Foundation and primitive components belong to the design system. Composite
components bridge the design system and product domains. Feature-level
composition belongs to product implementation and must not redefine lower layers.

## Foundation Components

Foundation components are architectural categories only. They provide token-bound
structural primitives consumed by primitives and composites.

| Category     | Description                                             |
| ------------ | ------------------------------------------------------- |
| **text**     | Typography-bound text presentation primitives           |
| **icon**     | Icon presentation primitives with semantic sizing roles |
| **surface**  | Background and container primitives                     |
| **divider**  | Structural separation primitives                        |
| **spacer**   | Layout rhythm primitives                                |
| **media**    | Image, illustration, and avatar presentation primitives |
| **skeleton** | Loading placeholder primitives                          |

Foundation components carry no product, medical, or feature semantics.

This document does not define APIs, variants, or implementation.

## Input Components

Input component families support data entry, selection, and user control.

Required families (architecture only):

- text input;
- numeric input;
- password and secure input;
- search input;
- textarea;
- select and picker;
- checkbox;
- radio;
- switch and toggle;
- slider;
- date and time input;
- file and media input;
- form field wrapper with label, hint, and validation presentation.

Input components must:

- consume semantic tokens for states, focus, and validation;
- support keyboard, pointer, and assistive-technology interaction;
- preserve unit clarity for medical numeric entry where applicable.

This document does not define APIs, validation logic, or implementation.

## Navigation Components

Navigation component categories support wayfinding and structural movement.

| Category                 | Description                                        |
| ------------------------ | -------------------------------------------------- |
| **primary navigation**   | Top-level app and section navigation               |
| **secondary navigation** | Subsection and contextual navigation               |
| **tab navigation**       | Parallel view switching within a context           |
| **breadcrumb**           | Hierarchical location context                      |
| **pagination**           | Sequential content navigation                      |
| **link**                 | Inline and standalone navigational affordances     |
| **back and close**       | Exit and return affordances                        |
| **bottom navigation**    | Mobile primary destination switching               |
| **sidebar navigation**   | Persistent lateral navigation on expanded surfaces |

Navigation components must preserve information architecture from
[04 Product Architecture Specification](../project/04-product-architecture-specification.md)
without redefining it.

## Feedback Components

Feedback component categories communicate system, data, and interaction status.

| Category         | Description                                           |
| ---------------- | ----------------------------------------------------- |
| **loading**      | In-progress operations and data retrieval             |
| **success**      | Completed actions and positive confirmation           |
| **warning**      | Caution requiring attention without immediate harm    |
| **critical**     | Errors, failures, and safety-relevant alerts          |
| **empty**        | Absence of expected content or data                   |
| **offline**      | Connectivity loss and degraded availability           |
| **permission**   | Access denial and consent requirements                |
| **partial data** | Incomplete, stale, or partially available information |

Feedback must use semantic tokens and non-color indicators. Critical and medical
feedback must not be conveyed through color alone.

## Data Display Components

Data display components present structured information without domain-specific
business logic.

| Category          | Description                               |
| ----------------- | ----------------------------------------- |
| **list**          | Vertical collections of homogeneous items |
| **table**         | Tabular data with headers and rows        |
| **card**          | Grouped content with optional actions     |
| **badge**         | Compact status and count indicators       |
| **tag**           | Categorization and filter labels          |
| **avatar**        | User and entity identity presentation     |
| **key-value**     | Label and value pairs                     |
| **statistic**     | Highlighted numeric or summary metrics    |
| **timeline item** | Chronological event presentation          |
| **progress**      | Completion and capacity indicators        |

Data display components must support localization, dynamic type, and readable
numeric presentation.

## Medical Components

Medical components present health-related information with clarity and safety.

| Category               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| **glucose reading**    | Current and historical glucose value presentation |
| **unit display**       | Explicit measurement units                        |
| **time context**       | Reading time, recency, and temporal framing       |
| **range indicator**    | Normal, elevated, and critical range presentation |
| **trend indicator**    | Directional glucose change presentation           |
| **medication display** | Medication and insulin information presentation   |
| **dose input**         | Governed dose entry presentation                  |
| **data provenance**    | Source device, manual entry, and sync context     |
| **uncertainty**        | Missing, estimated, or unverified data treatment  |
| **medical disclaimer** | Non-diagnostic context and safety messaging       |

Medical components must:

- prioritize accuracy and readability;
- consume medical tokens from document `11`;
- not imply diagnosis, treatment, or clinical authority.

This document does not define clinical logic, thresholds, or APIs.

## AI Components

AI components present AI-generated and AI-assisted content distinctly from
clinical presentation.

| Category                  | Description                                         |
| ------------------------- | --------------------------------------------------- |
| **insight card**          | AI-generated summary and recommendation surfaces    |
| **confidence indicator**  | Uncertainty and confidence presentation             |
| **source context**        | Available provenance and reference treatment        |
| **limitation notice**     | Scope, disclaimer, and boundary messaging           |
| **user control**          | Dismiss, feedback, and preference affordances       |
| **generation state**      | In-progress, streaming, and completion presentation |
| **distinction treatment** | Visual separation from clinical authority           |

AI components must consume AI tokens from document `11` and must not visually
impersonate a clinician or authoritative medical decision-maker.

## Overlay Components

Overlay components present transient, layered UI above the current context.

| Category    | Description                                              |
| ----------- | -------------------------------------------------------- |
| **dialog**  | Modal confirmation, alert, and focused task presentation |
| **sheet**   | Bottom or side contextual panels                         |
| **popover** | Anchored contextual content                              |
| **menu**    | Action and option lists                                  |
| **tooltip** | Supplementary non-critical information                   |
| **drawer**  | Persistent or dismissible lateral overlay                |

Architectural rules:

- overlays must preserve focus management and escape behavior;
- modal overlays must trap focus appropriately per platform conventions;
- medical and AI overlays must not obscure safety-critical information without
  explicit user intent;
- overlay density must adapt to compact and expanded layouts.

This document does not define animation, API, or platform implementation details.

## Layout Components

Layout components define structural composition without product-specific content.

| Category          | Description                                   |
| ----------------- | --------------------------------------------- |
| **stack**         | Vertical spacing and alignment composition    |
| **inline**        | Horizontal spacing and alignment composition  |
| **grid**          | Responsive column and row composition         |
| **container**     | Max-width and horizontal padding boundaries   |
| **section**       | Semantic content grouping with spacing rhythm |
| **header region** | Top app and page header structure             |
| **footer region** | Bottom action and supplementary structure     |
| **split layout**  | Primary and secondary pane composition        |
| **safe area**     | Platform inset and notch adaptation           |

Layout components must consume spacing, grid, and breakpoint tokens from
document `11` and align with layout principles in document `10`.

## Charts and Visualization Components

Charts and visualization components present data trends and comparisons.

| Category           | Description                                     |
| ------------------ | ----------------------------------------------- |
| **trends**         | Time-series directional presentation            |
| **timelines**      | Chronological event and reading sequences       |
| **statistics**     | Aggregated metrics and summary visualization    |
| **glucose charts** | Glucose-specific range and pattern presentation |
| **comparisons**    | Side-by-side and before/after data comparison   |

Architectural rules:

- charts must consume semantic and medical tokens;
- color must not be the sole data differentiator;
- axes, units, and legends must remain readable at all supported densities;
- reduced-motion preferences must be respected;
- medical charts must not imply diagnosis.

This document does not define chart libraries, rendering APIs, or data logic.

## Component States

All interactive and status-bearing components must support these mandatory states
where applicable:

| State         | Description                                        |
| ------------- | -------------------------------------------------- |
| **default**   | Resting presentation                               |
| **hover**     | Pointer-over affordance where platform supports it |
| **focus**     | Keyboard and assistive-technology focus            |
| **active**    | Pressed or engaged interaction                     |
| **disabled**  | Non-interactive presentation                       |
| **loading**   | In-progress operation                              |
| **error**     | Validation or operation failure                    |
| **success**   | Completed positive outcome                         |
| **selected**  | Chosen item in a selection context                 |
| **empty**     | No data or content available                       |
| **read-only** | Visible but not editable                           |

States must map to semantic tokens. State meaning must not depend on color alone.

## Accessibility Requirements

All reusable components must support WCAG-compatible presentation and interaction:

- sufficient color contrast through governed tokens;
- visible focus indicators;
- keyboard operability for interactive components;
- screen-reader-compatible semantics and labels;
- touch-target sizing through spacing tokens;
- non-color state and status indicators;
- reduced-motion compatibility;
- scalable typography and layout adaptation;
- readable medical and AI presentation.

Accessibility is a release requirement for component production and consumption.

## Internationalization Requirements

All reusable components must be localization-safe:

- text expansion and contraction without layout failure;
- right-to-left layout adaptation where required;
- locale-aware number, date, time, and unit formatting hooks;
- no hardcoded user-facing strings within component architecture;
- culturally neutral iconography where semantics are not universal;
- dynamic type and platform text-scaling support.

Internationalization requirements align with localization architecture in
document `10` and product scope in document `04`.

## Cross-Platform Principles

Components must preserve semantic behavior while allowing platform-native
interaction.

| Principle                     | Requirement                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| **Semantic parity**           | Same meaning and state across web, iOS, Android, desktop     |
| **Token parity**              | Same token consumption hierarchy across platforms            |
| **Native interaction**        | Platform-appropriate gestures, focus, and navigation         |
| **No architectural fork**     | Platform differences affect delivery, not component identity |
| **Consistent medical safety** | Medical and AI presentation rules apply on every platform    |

Platform-specific implementation details belong to later approved work governed
by this specification. This document does not create platform component code.

## Component Governance

Changes to UI components must:

- follow
  [01 Project Development Specification](../project/01-project-development-specification.md),
  [02 Project Governance Specification](../project/02-project-governance-specification.md),
  and [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md);
- consume
  [11 Design Tokens Specification](11-design-tokens-specification.md) without
  redefining tokens;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md);
- not redefine documents `05`–`09`;
- preserve the four-level component hierarchy.

| Document | Scope                                     |
| -------- | ----------------------------------------- |
| **10**   | Visual design system architecture         |
| **11**   | Design token architecture                 |
| **12**   | UI component architecture (this document) |

No component may redefine design tokens. Token changes belong to document `11`.

## Dependencies

- [00 Project Constitution](../project/00-project-constitution.md)
- [01 Project Development Specification](../project/01-project-development-specification.md)
- [02 Project Governance Specification](../project/02-project-governance-specification.md)
- [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md)
- [04 Product Architecture Specification](../project/04-product-architecture-specification.md)
- [05 Brand Architecture Specification](../brand/05-brand-architecture-specification.md)
- [06 Logo Architecture Specification](../brand/06-logo-architecture-specification.md)
- [07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
- [08 Brand Governance Specification](../brand/08-brand-governance-specification.md)
- [09 Brand Book](../brand/09-brand-book.md)
- [10 Visual Design System Specification](10-visual-design-system-specification.md)
- [11 Design Tokens Specification](11-design-tokens-specification.md)

## Success Criteria

The UI component specification is successful when:

- objectives and component architecture are documented with clear relationships
  between design tokens, semantic tokens, components, and product features;
- approved component principles and four-level hierarchy are explicit;
- foundation, input, navigation, feedback, data display, medical, AI, overlay,
  layout, and chart component categories are defined without APIs or
  implementation;
- mandatory component states, accessibility, internationalization, and
  cross-platform principles are documented;
- governance rules require consumption of document `11` without token redefinition;
- documentation navigation reflects the specification entry;
- no component code, Storybook, platform implementation, screen implementation, or
  production assets are produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent component redesign.

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- Component implementation, APIs, and platform exports belong to later approved
  work governed by this specification.
- Design token values remain authoritative in document `11`.
