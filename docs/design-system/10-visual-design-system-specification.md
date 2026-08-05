# 10. Visual Design System Specification

## Purpose

Define the approved visual design system architecture for the Diabetes Universe
ecosystem: objectives, principles, platform scope, architecture layers, foundation
and semantic token categories, component relationships, layout, typography, color,
spacing, shape, border, elevation, motion, iconography, illustration, data
visualization, medical and AI interface rules, status treatment, themes,
responsiveness, accessibility, internationalization, cross-platform consistency,
and governance.

This document is the authoritative visual design system specification. It defines
the shared visual foundation across products without specifying final token
values, production token files, component APIs, UI implementation, or finished
visual assets.

## Status

Feature Complete

## Design System Objectives

The visual design system must provide a unified foundation for:

- Web;
- iOS;
- Android;
- Desktop;
- Marketing Site;
- Admin Panel;
- future Diabetes Universe products.

The system must support:

- millions of users;
- international localization;
- accessibility as a default requirement;
- long-term evolution without visual fragmentation;
- platform-specific implementation where required without breaking shared meaning.

## Design System Principles

- **Safety before aesthetics** — medical clarity and user safety take priority over
  visual novelty.
- **Reliability before novelty** — predictable patterns outweigh experimental styling.
- **Simplicity before decoration** — remove visual noise that does not aid
  comprehension.
- **Consistency before local convenience** — shared meaning outweighs one-off
  surface shortcuts.
- **Accessibility by default** — accessible design is required, not optional.
- **Semantic meaning before raw styling** — tokens and components express purpose,
  not arbitrary values.
- **Reusable foundations before one-off solutions** — shared primitives precede
  custom styling.
- **Platform adaptation without brand fragmentation** — native behavior may vary;
  identity and meaning must not.
- **Progressive evolution without breaking architectural compatibility** — changes
  follow governed lifecycle and versioning.

## Platform Scope

Shared visual rules apply across all supported platforms.

Platform-native behavior may vary where required by:

- accessibility requirements;
- operating-system conventions;
- platform interaction models.

Platform differences must not:

- create conflicting product identities;
- duplicate design logic with divergent meaning;
- override approved semantic states or brand identity rules.

## Architecture Layers

The visual design system is organized into four separate layers. Layers must not
be merged.

```text
Brand Foundation Layer
        ↓
Foundation Token Layer
        ↓
Semantic Token Layer
        ↓
Component Layer
```

| Layer                      | Role                                                            |
| -------------------------- | --------------------------------------------------------------- |
| **Brand Foundation Layer** | Approved brand principles consumed from documents `05`–`09`     |
| **Foundation Token Layer** | Raw visual scales and primitives without product meaning        |
| **Semantic Token Layer**   | Purpose-driven tokens mapped to UI states and domains           |
| **Component Layer**        | Reusable UI structures consuming semantic and foundation tokens |

Final production token values belong to document `11`. Final component
specifications belong to document `12`.

## Brand Foundation Layer

The Brand Foundation Layer consumes approved principles from documents `05`–`09`
without redefining brand strategy:

- brand personality and positioning from
  [05 Brand Architecture Specification](../brand/05-brand-architecture-specification.md)
  and [09 Brand Book](../brand/09-brand-book.md);
- visual philosophy and distinctive asset principles from document `05`;
- logo architecture constraints from
  [06 Logo Architecture Specification](../brand/06-logo-architecture-specification.md);
- brand color direction, typography direction, iconography, illustration, motion,
  tone, accessibility, and internationalization from
  [07 Brand Identity Specification](../brand/07-brand-identity-specification.md);
- brand governance and change control from
  [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

This layer links to brand rules. It does not restate normative brand content.

## Foundation Token Layer

Foundation tokens define raw visual categories only:

- raw color values;
- typography scales;
- spacing scales;
- radius scales;
- border widths;
- shadows;
- elevation;
- motion duration;
- motion easing;
- breakpoints;
- grids.

Foundation tokens carry no product or medical semantics. Final numeric or platform
production values belong to document `11`.

## Semantic Token Layer

Semantic tokens map foundation values to purpose-driven categories:

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

Semantic meaning must not depend solely on color. Text, iconography, structure,
and labels must reinforce state and hierarchy.

## Component Layer

The Component Layer defines how semantic and foundation tokens support reusable
UI structures across platforms.

This document establishes:

- components consume semantic tokens, not raw foundation values directly where
  semantics exist;
- components preserve shared meaning across web, mobile, and desktop;
- medical, AI, and status patterns use approved semantic categories.

This document does not specify final component APIs, variants, states, or code
implementation. Those belong to document `12`.

## Layout and Grid Principles

Layout must provide:

- responsive behavior across breakpoints;
- grid consistency within each platform;
- clear content hierarchy;
- safe spacing around interactive and medical content;
- readable content widths;
- adaptive density for compact and comfortable modes;
- platform-specific layout adaptation without changing information architecture.

Frequent actions should remain accessible within three interactions where
technically and clinically appropriate.

## Typography System Principles

Typography must support:

- readable hierarchy;
- scalable text;
- localization across scripts and languages;
- dynamic type support where platforms provide it;
- semantic typography roles (display, title, body, label, data, caption);
- medical-data readability with explicit units and values.

This document does not select a font family or define final typography token
values.

## Color System Principles

The color system must define roles for:

- brand colors;
- semantic colors;
- medical colors;
- status colors;
- data visualization colors;
- surface hierarchy;
- light and dark themes.

Color must never be the only carrier of meaning. Pair color with typography,
iconography, labels, structure, or pattern where required.

This document does not define final HEX, RGB, HSL, or platform color values.

## Spacing Principles

Spacing must be based on a shared scale and support:

- touch targets;
- visual hierarchy;
- responsive layouts;
- compact and comfortable densities;
- localization expansion without layout failure.

Spacing expresses rhythm and separation. It must not be used as arbitrary
decoration.

Final numeric spacing values belong to document `11`.

## Shape and Radius Principles

Shape language must remain consistent with
[07 Brand Identity Specification](../brand/07-brand-identity-specification.md):

- controlled, cohesive forms;
- minimal decorative variation;
- scalable radii suitable for components, cards, and inputs;
- no excessive geometric variation.

## Border Principles

Borders must communicate:

- structure;
- separation;
- focus;
- state.

Decorative borders without functional purpose are prohibited.

## Elevation and Shadow Principles

Elevation must communicate:

- hierarchy;
- interaction affordance;
- layering without obscuring medical information.

Shadows must remain:

- subtle;
- consistent;
- accessible;
- compatible with light and dark themes.

## Motion Principles

Motion must:

- explain change;
- preserve context;
- provide feedback;
- remain calm and functional;
- support reduced-motion preferences.

Decorative or distracting animation is prohibited. Motion aligns with brand and
identity motion principles in documents `05` and `07`.

## Iconography Integration

Icons must follow
[07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
and [06 Logo Architecture Specification](../brand/06-logo-architecture-specification.md)
with consistent:

- geometry;
- stroke behavior;
- optical size;
- alignment;
- state representation.

Icons must remain readable at small sizes and must not introduce medical clichés.

## Illustration Integration

Illustrations must:

- support comprehension and communication;
- follow approved illustration principles in document `07`;
- remain informative rather than decorative.

Illustrations must not replace critical text, medical information, or status
indicators.

## Data Visualization Principles

Data visualization must support:

- charts;
- trends;
- ranges;
- thresholds;
- comparisons;
- annotations;
- missing data;
- uncertainty.

Charts must remain understandable without relying only on color. Use labels,
patterns, markers, and structure alongside color where needed.

## Medical Interface Principles

Medical UI must prioritize:

- clarity;
- accuracy;
- safety;
- explicit units;
- time context;
- data provenance;
- uncertainty;
- warning hierarchy.

Decorative styling must never obscure medical information. Medical states use
approved semantic categories and must not imply diagnosis or treatment.

## AI Interface Principles

AI must be integrated into normal product workflows.

AI UI must communicate:

- generated content;
- uncertainty;
- limitations;
- source context when available;
- user control.

AI must not visually impersonate a clinician or authoritative medical
decision-maker. AI states use dedicated semantic categories distinct from clinical
authority presentation.

## Status and Feedback Principles

The system must provide consistent treatment for:

- loading;
- empty;
- success;
- informational;
- warning;
- critical;
- offline;
- partial data;
- unavailable data;
- permission-restricted states.

Status presentation must use semantic tokens and non-color indicators where
required.

## Light and Dark Theme Principles

Light and dark themes are mandatory.

Both themes must preserve:

- semantic meaning;
- contrast;
- hierarchy;
- data readability;
- brand identity;
- medical safety.

Dark theme must not be produced through simple color inversion.

## Responsive Design Principles

Layouts must adapt across screen sizes and input modes without:

- duplicating product functionality;
- creating separate information architectures;
- hiding critical medical context.

Responsive behavior must preserve hierarchy, readability, and access to frequent
actions within approved interaction limits.

## Accessibility Requirements

The visual design system requires:

- WCAG compliance;
- keyboard navigation support in applicable platforms;
- visible focus indicators;
- screen-reader compatibility;
- sufficient contrast;
- scalable text;
- reduced-motion support;
- touch-target compliance;
- non-color state indicators.

Accessibility is a release requirement, not an optional enhancement.

## Internationalization Requirements

The system must support:

- variable text length;
- multiple scripts;
- locale-aware formatting through platform presentation layers;
- right-to-left layouts where required;
- translated labels without layout failure;
- culturally neutral visual communication.

Visual rules must not depend on language-specific wordplay or single-country
symbolism.

## Cross-Platform Consistency

Shared concepts must retain the same meaning across platforms:

- terminology;
- hierarchy;
- semantic states;
- brand identity;
- medical and AI presentation rules.

Platform-native interaction patterns may differ when required, but semantic intent
must remain consistent.

## Governance and Change Control

Changes to the visual design system must:

- follow documents
  [01 Project Development Specification](../project/01-project-development-specification.md),
  [02 Project Governance Specification](../project/02-project-governance-specification.md),
  and [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md);
- not redefine documents `05`–`09`;
- preserve the four-layer architecture.

| Document | Scope                                             |
| -------- | ------------------------------------------------- |
| **10**   | Visual design system architecture (this document) |
| **11**   | Production design tokens                          |
| **12**   | UI component specifications                       |

Brand changes remain governed by
[08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

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

## Success Criteria

The visual design system specification is successful when:

- objectives, principles, platform scope, and four architecture layers are
  documented without merging layers;
- foundation and semantic token categories are defined without final production
  values;
- layout, typography, color, spacing, shape, border, elevation, and motion
  principles are explicit;
- medical, AI, data visualization, and status rules align with product and brand
  requirements;
- light/dark, responsive, accessibility, internationalization, and cross-platform
  rules are enforceable;
- governance clearly separates documents `10`, `11`, and `12`;
- documentation navigation reflects the specification entry;
- documents `05`–`09` remain unchanged;
- no production token files, component APIs, or document `11` work are produced in
  this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent redesign.

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- Existing guides under `docs/design-system/` remain supporting material until
  superseded by Feature Complete numbered specifications.
- Final token values and component specifications belong to documents `11` and
  `12`.
