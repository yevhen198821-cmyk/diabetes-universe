# 11. Design Tokens Specification

## Purpose

Define the approved production design-token architecture for the Diabetes Universe
Design System: objectives, token structure, naming, layer hierarchy, token
categories, versioning, cross-platform mapping, accessibility, and governance.

This document is the authoritative design tokens specification. It defines how
tokens are organized and consumed without creating production token files, JSON
exports, Figma variables, component APIs, or application implementation.

## Status

Feature Complete

## Objectives

The design-token architecture must provide a scalable, shared foundation for:

- Web;
- iOS;
- Android;
- Desktop;
- Marketing;
- Admin;
- future Diabetes Universe products.

Tokens must:

- preserve semantic meaning across platforms;
- support light and dark themes;
- support accessibility requirements;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md);
- enable document `12` UI component specifications to consume semantic and
  component tokens without redefining visual architecture.

## Token Architecture

Design tokens are organized into three separate layers. Layers must not be merged.

```text
Foundation Tokens
        ↓
Semantic Tokens
        ↓
Component Tokens
```

| Layer                 | Role                                                 |
| --------------------- | ---------------------------------------------------- |
| **Foundation Tokens** | Raw visual primitives without product or UI meaning  |
| **Semantic Tokens**   | Purpose-driven roles mapped to foundation values     |
| **Component Tokens**  | Component-specific aliases consuming semantic tokens |

Brand principles remain authoritative in documents `05`–`09` and are consumed
through the visual design system architecture in document `10`. This document
defines production token structure only.

## Token Naming Principles

Token names must be:

- **stable** — renaming requires governed versioning and migration;
- **semantic** — express purpose, not implementation detail;
- **platform-independent** — the same token identity maps across web, iOS,
  Android, and desktop;
- **hierarchical** — reflect layer, category, and role;
- **predictable** — follow consistent delimiter and segment order;
- **non-ambiguous** — one name maps to one governed meaning.

Recommended name structure:

```text
<layer>/<category>/<role>[/<variant>]
```

Examples use architecture placeholders only. Final token catalogs belong to
production implementation governed by this specification.

## Token Layer Hierarchy

Consumption rules:

1. **Component tokens** reference semantic tokens.
2. **Semantic tokens** reference foundation tokens.
3. **Foundation tokens** do not reference semantic or component tokens.
4. Components must not consume foundation tokens directly where a semantic token
   exists.
5. Application code must not hardcode raw visual values that have governed token
   equivalents.

## Foundation Tokens

Foundation token categories:

| Category       | Description                                          |
| -------------- | ---------------------------------------------------- |
| **color**      | Raw color primitives without UI role                 |
| **typography** | Size, weight, line-height, and letter-spacing scales |
| **spacing**    | Spatial scale primitives                             |
| **radius**     | Corner radius scale                                  |
| **border**     | Border width scale                                   |
| **elevation**  | Shadow and elevation primitives                      |
| **motion**     | Duration and easing primitives                       |
| **breakpoint** | Responsive width thresholds                          |
| **grid**       | Column, gutter, and margin primitives                |

Foundation tokens carry no product, medical, or component semantics.

This document does not define final numeric values, units, or platform outputs.

## Semantic Tokens

Semantic tokens express purpose-driven roles. Meaning must remain independent
from implementation.

Semantic role groups include:

- surfaces;
- content;
- borders;
- interactive states;
- focus;
- disabled states;
- informational states;
- success;
- warning;
- critical;
- medical data states;
- glucose-related states;
- AI states.

Semantic tokens map to foundation values per theme. Semantic meaning must not
depend solely on color.

## Component Tokens

Component tokens define how reusable UI structures consume semantic tokens.

Examples of component token domains (architecture only):

- button;
- input;
- card;
- navigation;
- badge;
- alert;
- chart;
- medical reading;
- AI insight.

Component tokens alias semantic roles for a specific component context. This
document does not define component APIs, variants, states, or code structure.
Those belong to document `12`.

## Color Tokens

Color token architecture spans three layers:

| Layer      | Scope                                               |
| ---------- | --------------------------------------------------- |
| Foundation | Raw palette primitives                              |
| Semantic   | Surface, content, border, status, medical, AI roles |
| Component  | Component-specific color aliases                    |

Color must never be the only carrier of meaning.

This document does not define HEX, RGB, HSL, CMYK, or platform color values.

## Typography Tokens

Typography token hierarchy:

| Level      | Role                                                 |
| ---------- | ---------------------------------------------------- |
| Foundation | Size, weight, line-height, letter-spacing scales     |
| Semantic   | display, title, headline, body, label, data, caption |
| Component  | Component-specific typography aliases                |

Typography tokens must support localization, dynamic type, and medical-data
readability.

This document does not select a font family or define final size values.

## Spacing Tokens

Spacing token architecture:

- foundation spacing scale;
- semantic spacing roles for layout rhythm, inset, stack, and inline gaps;
- component spacing aliases for padding, margin, and touch-target clearance.

Spacing must support touch targets, hierarchy, responsive layouts, compact and
comfortable densities, and localization expansion.

Final numeric spacing values are not defined in this document.

## Radius Tokens

Radius token architecture:

- foundation radius scale;
- semantic roles for containers, inputs, buttons, and chips;
- component radius aliases.

Shape language must remain consistent with Brand Identity principles in
document `07`.

## Border Tokens

Border token architecture:

- foundation border width scale;
- semantic roles for dividers, focus rings, and state outlines;
- component border aliases.

Borders must communicate structure, separation, focus, or state—not decoration.

## Elevation Tokens

Elevation token architecture:

- foundation shadow and elevation primitives;
- semantic surface elevation roles;
- component elevation aliases.

Elevation must communicate hierarchy and interaction without obscuring medical
information.

## Motion Tokens

Motion token architecture:

- foundation duration and easing primitives;
- semantic motion roles for transition, feedback, and emphasis;
- component motion aliases.

Motion must remain calm, functional, and compatible with reduced-motion
preferences.

## Breakpoint Tokens

Breakpoint token architecture:

- foundation width thresholds;
- semantic layout modes (compact, comfortable, expanded);
- component responsive behavior references.

Breakpoints support responsive layout without duplicating information architecture.

## Grid Tokens

Grid token architecture:

- foundation column, gutter, and margin primitives;
- semantic layout grid roles per breakpoint;
- component layout references.

Grid tokens align with layout principles in document `10`.

## Medical Tokens

Medical tokens use semantic categories for medical UI, including:

- glucose reading presentation;
- unit and value emphasis;
- time context;
- data provenance;
- uncertainty;
- warning hierarchy;
- normal, elevated, and critical ranges (semantic only);
- medication and insulin-related data presentation.

Medical tokens must prioritize clarity, accuracy, and safety. They must not imply
diagnosis or treatment.

## AI Tokens

AI tokens use semantic categories for AI-related UI, including:

- generated content surfaces;
- uncertainty and confidence presentation;
- limitation and disclaimer treatment;
- source context when available;
- user control affordances;
- distinction from clinical authority presentation.

AI tokens must not visually impersonate a clinician or authoritative medical
decision-maker.

## Theme Tokens

Theme tokens define relationships between semantic roles and foundation values
for:

- **Light** theme;
- **Dark** theme.

Both themes are mandatory.

Theme mapping must preserve:

- semantic meaning;
- contrast;
- hierarchy;
- data readability;
- brand identity;
- medical safety.

Dark theme must not be produced through simple color inversion.

Final theme values are not defined in this document.

## Token Versioning

Design tokens use governed semantic versioning aligned with
[08 Brand Governance Specification](../brand/08-brand-governance-specification.md):

| Version  | Meaning                                                       |
| -------- | ------------------------------------------------------------- |
| **v1.0** | First Feature Complete token specification release            |
| **v1.x** | Backward-compatible clarifications, additions, or corrections |
| **v2.0** | Breaking changes to naming, hierarchy, or semantic meaning    |

Token renames and deprecations require migration notes and governed lifecycle
approval. Silent token changes are prohibited.

## Cross-Platform Mapping

Design tokens map to platform implementations through explicit translation rules:

| Platform    | Mapping principle                                                 |
| ----------- | ----------------------------------------------------------------- |
| **Web**     | CSS custom properties or equivalent theme providers               |
| **iOS**     | Asset catalog or Swift token structures with semantic parity      |
| **Android** | Resource qualifiers or Compose theme objects with semantic parity |
| **Desktop** | Platform-native theme integration with shared semantic identity   |

Mapping rules:

- semantic token identity remains identical across platforms;
- foundation values may use platform-appropriate units;
- platform-native conventions may affect delivery format, not meaning;
- accessibility and theme requirements apply on every platform;
- drift between platforms requires governed correction.

This document does not create platform token files.

## Accessibility Requirements

All token categories must support:

- WCAG-aligned contrast when values are defined in production;
- visible focus through semantic focus tokens;
- non-color state indicators;
- scalable typography;
- sufficient touch-target spacing;
- reduced-motion compatibility;
- readable medical and AI presentation.

Accessibility is a release requirement for token production and consumption.

## Governance Rules

Changes to design tokens must:

- follow
  [01 Project Development Specification](../project/01-project-development-specification.md),
  [02 Project Governance Specification](../project/02-project-governance-specification.md),
  and [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md);
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md);
- not redefine documents `05`–`09`;
- preserve the three-layer token hierarchy.

| Document | Scope                                     |
| -------- | ----------------------------------------- |
| **10**   | Visual design system architecture         |
| **11**   | Design token architecture (this document) |
| **12**   | UI component specifications               |

Document `12` consumes this specification. This document does not define
component content.

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

## Success Criteria

The design tokens specification is successful when:

- objectives and three-layer token architecture are documented without merging
  layers;
- naming principles and hierarchy rules are explicit and enforceable;
- foundation, semantic, and component token categories are defined without
  final production values;
- color, typography, spacing, radius, border, elevation, motion, breakpoint, grid,
  medical, AI, and theme token architectures are documented;
- versioning, cross-platform mapping, accessibility, and governance rules align
  with document `10`;
- documentation navigation reflects the specification entry;
- no production token files, JSON exports, Figma variables, or document `12`
  content are produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent token redesign.

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- Production token file formats and platform exports belong to later approved
  implementation work governed by this specification.
- UI component specifications remain authoritative in document `12`.
