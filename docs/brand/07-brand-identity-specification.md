# 07. Brand Identity Specification

## Purpose

Define the approved brand identity system for the Diabetes Universe ecosystem:
identity principles, color and typography strategy, iconography, illustration,
photography, motion, tone of voice, writing rules, accessibility,
internationalization, asset hierarchy, digital and print usage principles,
consistency rules, and prohibited directions.

This document is the authoritative brand identity specification. It governs how
the brand identity system is structured and applied without defining final HEX/RGB
values, typeface families, icons, illustrations, photographs, or UI components.

## Status

Feature Complete

## Brand Identity Principles

Brand identity follows the strategic brand architecture and logo architecture
defined in upstream documents:

- calm, modern, and precise;
- human without childishness;
- medically responsible without clinical clichés;
- minimalist and scalable across digital and print surfaces;
- internationally neutral and culturally adaptable;
- accessible by default;
- consistent across product modules, services, and marketing surfaces;
- aligned with the approved logo symbol architecture without duplicating logo
  concept development rules.

Identity decisions must support the master brand and must not introduce
independent sub-brand systems without separate architectural approval.

## Color Strategy

The approved palette strategy is built on five strategic color roles:

| Role            | Strategic purpose                                                          |
| --------------- | -------------------------------------------------------------------------- |
| **Deep blue**   | Primary trust, stability, and digital credibility                          |
| **Indigo**      | Depth, focus, and premium technology tone                                  |
| **Teal accent** | Calm emphasis, clarity, and supportive highlights without clinical clichés |
| **Graphite**    | Text, structure, and neutral UI hierarchy                                  |
| **Warm white**  | Open backgrounds, breathing space, and human warmth                        |

This document does not define specific HEX, RGB, HSL, or CMYK values.

### Prohibited color directions

- medical green as the primary brand color;
- decorative gradients without functional reason;
- palettes that reduce accessibility or fail contrast requirements.

Color execution tokens belong to later approved brand and design-system documents.

## Typography Strategy

Typography must meet the following requirements:

- modern grotesque character;
- high readability across sizes and densities;
- digital optimization for screens and interfaces;
- international support across scripts and languages;
- minimalist hierarchy with clear role separation.

This document does not select a specific typeface family, font files, or loading
strategy. Final typography choices belong to later approved documents.

## Iconography Principles

Iconography must be:

- minimalist;
- based on unified geometry;
- readable at small sizes;
- scalable across product surfaces;
- aligned with [06 Logo Architecture Specification](06-logo-architecture-specification.md).

Icons must not introduce medical clichés, decorative detail, or styles that
conflict with the approved logo architecture.

## Illustration Principles

Illustration must be:

- informative rather than decorative;
- simple and structurally clear;
- free of medical clichés;
- expressed in one coherent visual language;
- suitable for digital interfaces and documentation.

Illustrations must support understanding without dramatizing illness or replacing
clinical judgment.

## Photography Direction

Photography must show:

- real-life situations;
- diverse users across age, context, and background where appropriate;
- no staged medical aesthetics;
- a calm emotional atmosphere.

Photography must not imply diagnosis, treatment, or hospital-centric identity.

## Motion Principles

Motion must use:

- calm transitions;
- functional purpose tied to orientation, feedback, or hierarchy;
- no decorative animation for its own sake;
- accessibility support including reduced-motion respect.

Motion must remain readable and must not depend on color alone to communicate
state.

## Tone of Voice

Tone of voice must be:

- calm;
- clear;
- respectful;
- precise;
- supportive.

### Prohibited tone

- dramatization;
- aggressive marketing;
- medical promises;
- excessive emotionality.

Tone must align with
[05 Brand Architecture Specification — Brand Communication Principles](05-brand-architecture-specification.md#brand-communication-principles).

## Writing Principles

Written brand communication must use:

- short sentences;
- plain, understandable language;
- no professional jargon unless required for accuracy;
- consistent terminology linked to the project glossary and authoritative
  specifications.

Writing must separate information from medical recommendation and must not
prescribe treatment.

## Accessibility Principles

Brand identity must support:

- WCAG-aligned contrast and readability expectations;
- sufficient contrast between text, icons, and backgrounds;
- readable type at required sizes;
- scalable text without breaking layout intent;
- clear perception for users with visual impairments.

Aesthetics never take priority over safety, readability, or accessibility.

## Internationalization Principles

Brand identity must support:

- multiple languages;
- multiple writing systems;
- cultural neutrality;
- no visual decisions that depend on a single country, locale, or cultural symbol.

Identity assets must work in LTR and potentially RTL contexts without redesigning
the core system.

## Brand Asset Hierarchy

The approved hierarchy of brand assets is:

1. **Brand Symbol** — primary recognizable mark from logo architecture.
2. **Wordmark** — typographic representation of **Diabetes Universe**.
3. **Combined Mark** — approved combination of symbol and wordmark.
4. **Iconography** — functional and navigational icons following identity principles.
5. **Illustration** — explanatory visual language for product and education surfaces.
6. **Motion** — approved movement patterns for brand and product moments.
7. **Photography** — documentary-style imagery following photography direction.

This document defines hierarchy and principles only. It does not produce the assets
themselves.

## Digital Usage Principles

Digital brand identity must:

- remain consistent across web, iOS, Android, desktop, documentation, marketing
  site, and API/developer surfaces;
- preserve recognizability at favicon and app-icon scales;
- support light and dark presentation contexts where applicable;
- avoid visual noise in dense interface environments;
- align with product module boundaries in
  [04 Product Architecture Specification](../project/04-product-architecture-specification.md).

Digital token implementation belongs to later approved design-system documents.

## Print Usage Principles

Print brand identity must:

- preserve hierarchy between symbol, wordmark, and combined mark;
- remain legible in monochrome and limited-color reproduction;
- scale from small collateral to large-format applications;
- maintain clear space and structural integrity without decorative effects.

Print color specifications belong to later approved brand production documents.

## Brand Consistency Rules

All future brand materials must:

- use the approved asset hierarchy;
- follow color, typography, iconography, illustration, photography, and motion
  principles defined in this document;
- remain aligned with
  [05 Brand Architecture Specification](05-brand-architecture-specification.md)
  and [06 Logo Architecture Specification](06-logo-architecture-specification.md);
- apply the same tone of voice and writing principles across languages where
  localized;
- pass accessibility and internationalization requirements before publication;
- not introduce new visual sub-systems without architectural approval.

## Prohibited Identity Directions

The following are prohibited:

- medical clichés;
- inconsistent styles across surfaces;
- random or one-off illustrations;
- decorative effects without functional purpose;
- visual noise;
- elements that contradict Brand Architecture or Logo Architecture.

See also [05 Brand Architecture Specification — Prohibited Brand Directions](05-brand-architecture-specification.md#prohibited-brand-directions)
and [06 Logo Architecture Specification — Prohibited Directions](06-logo-architecture-specification.md#prohibited-directions).

## Dependencies

- [00 Project Constitution](../project/00-project-constitution.md)
- [01 Project Development Specification](../project/01-project-development-specification.md)
- [02 Project Governance Specification](../project/02-project-governance-specification.md)
- [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md)
- [04 Product Architecture Specification](../project/04-product-architecture-specification.md)
- [05 Brand Architecture Specification](05-brand-architecture-specification.md)
- [06 Logo Architecture Specification](06-logo-architecture-specification.md)

## Success Criteria

Brand identity specification is successful when:

- identity principles and strategic color and typography direction are documented
  without final token or font selection;
- iconography, illustration, photography, motion, tone, and writing rules are
  explicit and enforceable;
- accessibility, internationalization, and asset hierarchy are defined;
- digital and print usage principles support ecosystem scaling;
- consistency and prohibited directions align with upstream brand documents;
- documentation navigation reflects the brand identity entry;
- no final visual assets, UI components, or document 08 work are produced in this
  stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent identity redesign.

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- Final color tokens, typography files, icons, illustrations, and photography
  belong to later approved brand documents.
- Logo concept development remains authoritative in
  [06 Logo Architecture Specification](06-logo-architecture-specification.md).
