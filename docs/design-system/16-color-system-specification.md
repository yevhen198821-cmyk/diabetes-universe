# 16. Color System Specification

## Purpose

Define the architectural foundation for the complete color system used throughout
the Diabetes Universe ecosystem.

This document is the authoritative Color System specification. It establishes
color philosophy, role hierarchy, semantic relationships, surface and content
architecture, interactive states, theme architecture, accessibility,
internationalization, design token integration, evolution, and governance
without defining palettes, theme implementations, color values, or platform
exports.

This is not a palette document. This is not a theme implementation. This
document defines only the architecture of color roles, relationships, and
governance.

## Status

Architecture Approved

## Objectives

The Color System must:

- define color as **role**, not value — every governed color has a semantic
  purpose independent of any specific hue;
- provide a single architectural framework for color across Web, iOS, Android,
  Desktop, and future platforms including watch and print contexts;
- support calm, medically responsible experiences without relying on color alone
  for safety-critical communication;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md),
  [11 Design Tokens Specification](11-design-tokens-specification.md),
  [12 UI Component Specification](12-ui-component-specification.md), and
  [15 Brand Logo System Specification](15-brand-logo-system-specification.md);
- enable future palette production and theme implementation without redefining
  architectural intent;
- align with quality expectations in
  [13 DU Standard Specification](../project/13-du-standard-specification.md).

## Color Philosophy

The Color System follows these approved principles:

- **Meaning before aesthetics** — color communicates purpose; decorative color
  without semantic role is prohibited in product UI.
- **Consistency before variation** — the same role must carry the same meaning
  across surfaces, platforms, and themes unless a governed theme variant
  explicitly defines an alternate mapping.
- **Accessibility first** — contrast, non-color communication, and cognitive
  clarity take priority over visual novelty.
- **Calm medical experience** — color treatment must support trust and reduce
  anxiety; alarming or clinical clichés are prohibited as default patterns.
- **Long-term durability** — role architecture must survive palette refreshes
  without breaking semantic contracts.
- **Brand recognition without color dependence** — brand identity must remain
  recognizable through structure, typography, and symbol when color is removed.

### Color is role, not value

The Color System describes **roles** only. Governed role families include:

- Brand
- Primary
- Secondary
- Surface
- Background
- Border
- Success
- Warning
- Error
- Information

No role may be permanently bound to a specific hue. Production palettes assign
values to roles; changing a palette must not require redefining role architecture.

### No hue-named primary roles

Role names must express purpose, not pigment. **Primary Brand Color** is
architecturally correct; hue-specific names such as “Primary Blue” are
prohibited because they couple architecture to a replaceable value.

### Color does not belong to components

Color ownership follows a strict chain:

```text
Color Role
    ↓
Semantic Token
    ↓
Component Token
    ↓
Component
```

Components consume component tokens; they do not own color identities. Renaming
or restyling a button must not redefine global color architecture.

## Color Architecture

The Color System is organized as a governed hierarchy of role families. Each
family serves distinct architectural purposes while sharing theme and
accessibility rules.

```text
Brand Colors
    ↓
Neutral Colors ──→ Surface Colors
    ↓                    ↓
Semantic Colors    Content Colors
    ↓                    ↓
              Border Colors
                    ↓
              Overlay Colors
```

| Family              | Architectural role                                       |
| ------------------- | -------------------------------------------------------- |
| **Brand Colors**    | Identity, emphasis, and brand-recognition anchors        |
| **Neutral Colors**  | Non-semantic structure, hierarchy, and calm backgrounds  |
| **Semantic Colors** | Meaningful state and feedback (success, warning, error…) |
| **Surface Colors**  | Layered UI planes that hold content                      |
| **Content Colors**  | Text, icons, and readable foreground on surfaces         |
| **Border Colors**   | Separation, focus containment, and structural edges      |
| **Overlay Colors**  | Scrim, modal dimming, and temporary visual interruption  |

Relationships:

- Brand and Semantic colors apply **on top of** Surface and Background roles;
- Content colors derive legibility requirements from the Surface they occupy;
- Border colors separate surfaces without replacing semantic meaning;
- Overlay colors temporarily modify perceived surface relationships without
  redefining underlying roles;
- Neutral colors provide the structural baseline from which themed surfaces are
  composed.

This document does not define color values, scales, or ramps.

## Brand Color Roles

Brand colors express Diabetes Universe identity without encoding hue in role
names.

### Primary brand role

The **Primary Brand Color** role anchors brand recognition in interactive and
marketing contexts. It signals official brand presence and primary emphasis. It
is not a component color and must not be named after a pigment.

### Secondary brand role

The **Secondary Brand Color** role supports brand expression where Primary would
overpower content or reduce legibility. It complements Primary without
competing for hierarchy.

### Accent role

The **Accent** role draws limited, purposeful attention to highlights,
progress, or brand moments. Accent must not replace Semantic roles for feedback
or medical state communication.

Brand color production values belong to approved brand identity work governed by
documents `05`–`09` and the logo system in document `15`. This section defines
roles only.

## Neutral Color Architecture

Neutral colors provide non-semantic structure. They establish calm hierarchy
without implying medical meaning.

### Backgrounds

Background roles define the outermost visual plane — application canvas, page
shell, and ambient environment behind primary content.

### Surfaces

Surface roles within the neutral family define intermediate planes that group
related content without assigning semantic state.

### Containers

Container roles hold bounded content regions within surfaces — sections, panels,
and grouped fields — using neutral differentiation only.

### Dividers

Divider roles separate content structurally. Dividers must not convey semantic
state; state belongs to Semantic colors paired with non-color indicators.

### Elevation

Elevation is expressed through neutral surface layering and shadow relationships,
not through hue shifts alone. Higher elevation must preserve content legibility
and calm visual rhythm.

Neutral scales, ramps, and values belong to production implementation. This
section defines hierarchy only.

## Semantic Color Architecture

Semantic colors communicate governed meaning. Each semantic role must always be
paired with text, iconography, structure, or pattern — never color alone.

| Role            | Architectural meaning                                  |
| --------------- | ------------------------------------------------------ |
| **Success**     | Completed, confirmed, or within expected safe bounds   |
| **Warning**     | Attention required; proceed with care                  |
| **Error**       | Failure, blocking condition, or action cannot complete |
| **Information** | Neutral guidance, education, or non-critical notice    |
| **Disabled**    | Unavailable interaction or inactive state              |
| **Pending**     | In progress, awaiting result, or not yet finalized     |

### Medical safety rules

For Diabetes Universe, semantic color must not be the sole carrier of medical
meaning:

- **Error** must not rely on red alone as the only danger signal;
- **Success** must not rely on green alone as the only normal-state signal;
- any medical or health-related state must be accompanied by explicit text, an
  icon, structural placement, or another non-color indicator;
- semantic roles describe interaction and system feedback; clinical interpretation
  belongs to content and medical UX rules in document `10`, not to color alone.

Semantic palettes and contrast pairs belong to production implementation governed
by accessibility requirements in this document and document `11`.

## Surface Architecture

Surfaces are layered UI planes. Each surface role occupies a defined level in the
visual stack.

| Surface role   | Architectural purpose                                        |
| -------------- | ------------------------------------------------------------ |
| **Page**       | Root application canvas behind primary experience            |
| **Card**       | Grouped, elevated content on the page plane                  |
| **Modal**      | Focused, blocking dialog above page content                  |
| **Sheet**      | Partial-height or edge-attached overlay for contextual tasks |
| **Overlay**    | Scrim or dimming layer beneath modal or sheet                |
| **Navigation** | Persistent chrome: headers, sidebars, tab bars, toolbars     |

Rules:

- each surface role maps to governed Surface colors, not ad-hoc fills;
- surface stacking order must remain predictable across platforms;
- modal and sheet surfaces must preserve content legibility against overlay
  scrims;
- navigation surfaces must not compete with primary content for semantic color
  emphasis.

Surface values and elevation tokens belong to production implementation.

## Content Colors

Content colors govern readable foreground elements on surfaces.

| Role                 | Architectural purpose                               |
| -------------------- | --------------------------------------------------- |
| **Primary text**     | Headlines, primary labels, critical reading content |
| **Secondary text**   | Supporting descriptions and metadata                |
| **Tertiary text**    | De-emphasized, supplementary, or hint-level content |
| **Icons**            | Foreground glyphs and symbolic marks                |
| **Placeholders**     | Empty-field and preview text before user input      |
| **Disabled content** | Foreground in inactive or non-interactive contexts  |

Rules:

- content role contrast must be evaluated against the Surface role it occupies;
- primary text hierarchy must remain legible in light, dark, and future high
  contrast themes;
- icon content colors must not replace Semantic roles for state communication;
- placeholder content must not be mistaken for entered values or medical data.

## Interactive States

Interactive elements consume semantic and content roles through tokens; state
architecture is uniform across components.

| State        | Architectural behavior                                    |
| ------------ | --------------------------------------------------------- |
| **Default**  | Resting appearance; no user interaction in progress       |
| **Hover**    | Pointer or focus-proximate emphasis on capable platforms  |
| **Pressed**  | Active press or tap confirmation                          |
| **Focused**  | Keyboard or assistive-technology focus indicator          |
| **Selected** | Persistent chosen state within a set                      |
| **Disabled** | Non-interactive; must not imply semantic error or success |

Rules:

- focus indicators must meet accessibility contrast requirements without relying
  on color alone;
- hover and pressed states must preserve semantic meaning of the underlying role;
- disabled state must use governed Disabled semantic and content roles, not
  arbitrary opacity shortcuts that break contrast rules;
- selected state must be distinguishable by more than hue change alone.

State production values belong to component and semantic tokens in document `11`.

## Theme Architecture

Themes remap role-to-value assignments without redefining role meaning.

### Light Theme

Light Theme assigns values optimized for light ambient environments. Surface
stacking uses lighter backgrounds with darker content roles. Brand and Semantic
roles must preserve meaning and non-color redundancy.

### Dark Theme

Dark Theme assigns values optimized for low-light environments. Dark Theme must
not be produced through simple color inversion. Surface relationships, elevation,
and semantic pairing rules remain identical to Light Theme; only value mappings
change.

### Future theme support

Architecture must accommodate themes not yet in production:

| Theme             | Architectural intent                                       |
| ----------------- | ---------------------------------------------------------- |
| **High Contrast** | Enhanced figure-ground separation for low-vision contexts  |
| **AMOLED**        | Deep surface strategy for OLED power and contrast (future) |
| **Print**         | Monochrome-safe mappings for documentation and export      |

Future themes extend value mappings; they do not create parallel role systems
without architectural approval.

## Accessibility

Color architecture must satisfy accessibility as a release requirement.

- **WCAG AA** — minimum contrast for text, icons, and interactive boundaries in
  default themes;
- **AAA targets where practical** — pursued for primary reading content and
  critical medical information surfaces when achievable without harming calm
  visual rhythm;
- **Non-color communication** — semantic, medical, and interactive meaning must
  never depend on hue alone;
- **Color blindness** — information hierarchy and state must remain perceivable
  under protanopia, deuteranopia, and tritanopia simulations;
- **Cognitive accessibility** — restrained palette complexity, consistent role
  meaning, and clear content hierarchy reduce cognitive load.

Accessibility validation aligns with
[13 DU Standard Specification](../project/13-du-standard-specification.md) and
consumes principles from document `10` without duplicating them.

## Internationalization

Color interpretation must remain culturally neutral within product UI.

- semantic roles use universal interaction language (success, warning, error) with
  mandatory non-color redundancy;
- avoid culture-specific color symbolism as the sole meaning carrier;
- marketing and localized campaigns may adapt surrounding context; in-product
  role meanings must not change per locale without architectural approval;
- right-to-left layout changes must not alter color role assignments.

## Design Token Integration

The Color System maps to implementation through governed token layers defined in
[11 Design Tokens Specification](11-design-tokens-specification.md).

```text
Color System (roles)
        ↓
Semantic Tokens
        ↓
Component Tokens
        ↓
Implementation
```

Integration rules:

- Color System defines **what** roles exist and **how** they relate;
- Foundation tokens hold raw values assigned to roles in production palettes;
- Semantic tokens express Color System roles in product language;
- Component tokens alias semantic tokens for specific UI parts;
- implementation code and stylesheets consume component tokens only;
- no component, framework utility, or platform API may introduce parallel color
  identities outside this chain.

This document does not define token names, JSON structure, CSS variables,
Tailwind configuration, or platform export formats.

## Future Evolution

The Color System is a living specification. It evolves through governed
architectural review without breaking role semantics or accessibility contracts.

### Evolution principles

- role meaning is stable; palette values may change within a major version when
  migration guidance is provided;
- new roles require architectural approval before production use;
- medical safety and non-color redundancy rules are non-negotiable across evolution
  cycles;
- evolution strengthens — not fragments — cross-platform color consistency.

### Backward compatibility

| Change type                        | Compatibility expectation                          |
| ---------------------------------- | -------------------------------------------------- |
| Clarifications to role definitions | Backward-compatible within the same major version  |
| New theme mapping (e.g., AMOLED)   | Additive when roles unchanged                      |
| New semantic role                  | Additive; requires documentation and token mapping |
| Renamed or merged roles            | Major version; migration required                  |
| Removed role                       | Major version; deprecation process required        |

### Theme expansion

New themes adopt existing role architecture before introducing platform-specific
delivery rules. Theme expansion must not create independent color systems per
product or platform.

### New semantic roles

Additional semantic roles may be introduced for new product capabilities (e.g.,
AI insight, sync status). Each new role must include non-color communication
requirements and accessibility review before approval.

### Periodic review

Color System architecture undergoes periodic review at least once per major product
phase or annually, whichever comes first.

Periodic review evaluates:

- alignment with documents `00`–`15`;
- effectiveness of role hierarchy and medical safety rules;
- theme coverage and accessibility outcomes;
- gaps revealed by DU Reviews, audits, or platform expansion;
- need for minor clarifications or major version increments.

### Versioning

| Version  | Meaning                                                             |
| -------- | ------------------------------------------------------------------- |
| **v1.0** | First Feature Complete Color System architecture release            |
| **v1.x** | Backward-compatible clarifications, theme additions, or corrections |
| **v2.0** | Breaking changes to roles, hierarchy, or semantic contracts         |

## Governance

### Ownership

Color System architecture is owned by design system and brand governance authority
defined in
[02 Project Governance Specification](../project/02-project-governance-specification.md)
and [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Review

- architectural changes require review against documents `00`–`15` and DU Standard
  design review criteria;
- palette production is validated against this specification before approval;
- accessibility review is mandatory for any semantic or content role change.

### Approval

- role additions, removals, or redefinitions require explicit architectural
  approval;
- production palette releases require approval through brand governance and
  design system governance;
- exceptions require documented approval per document `08`.

### Lifecycle

Color System architecture follows the governed document lifecycle in
[01 Project Development Specification](../project/01-project-development-specification.md):

Draft → Architecture Review → Repository Implementation → Validation → DU Review →
Certification → Feature Complete.

Current status: **Architecture Approved** — ready for Final Architecture Review.

### Change management

Changes to Color System architecture must:

- follow documents `01`–`03` governance and engineering change rules;
- remain compatible with documents `05`–`09` and `10`–`15`;
- not introduce palettes, HEX/RGB/HSL values, CSS variables, Tailwind config, or
  implementation exports in this specification;
- receive explicit architectural approval before implementation.

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
- [12 UI Component Specification](12-ui-component-specification.md)
- [13 DU Standard Specification](../project/13-du-standard-specification.md)
- [14 App Icon Architecture Specification](14-app-icon-architecture-specification.md)
- [15 Brand Logo System Specification](15-brand-logo-system-specification.md)

## Success Criteria

Color System architecture is successful when:

- purpose, objectives, and color philosophy are documented;
- role hierarchy (Brand, Neutral, Semantic, Surface, Content, Border, Overlay)
  is defined with relationships and without color values;
- brand, neutral, semantic, surface, content, and interactive state architectures
  are documented at architecture level only;
- theme architecture covers Light, Dark, and future High Contrast, AMOLED, and
  Print themes without value definitions;
- medical safety rules prohibit color-only health communication;
- color-to-token integration chain (role → semantic → component → implementation)
  is explicit;
- accessibility, internationalization, evolution, and governance rules are
  enforceable;
- documentation navigation reflects the specification entry;
- no palettes, HEX, RGB, HSL, CSS variables, Tailwind configuration, token values,
  or implementation assets are produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through ad-hoc palette decisions.

## Notes

- This document is at **Architecture Approved** status and awaits Final Architecture
  Review before **Feature Complete** may be recorded.
- Palette production, theme implementation, and token value catalogs belong to
  later approved work governed by this specification and document `11`.
- Brand color direction remains authoritative in
  [07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
  and [10 Visual Design System Specification](10-visual-design-system-specification.md).
