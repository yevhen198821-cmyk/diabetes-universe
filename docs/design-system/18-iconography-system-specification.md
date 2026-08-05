# 18. Iconography System Specification

## Purpose

Define the architectural foundation for the complete iconography system used
throughout the Diabetes Universe ecosystem.

This document is the authoritative Iconography System specification. It establishes
iconography philosophy, category architecture, icon roles, recognition principles,
information hierarchy, accessibility, internationalization, theme compatibility,
design token integration, evolution, and governance without defining SVG assets,
icon libraries, stroke widths, pixel sizes, or platform implementation exports.

This is not an icon library. This is not an SVG specification. This is not an
implementation guide. This document defines iconography architecture only.

## Status

Architecture Approved

## Objectives

The Iconography System must:

- define icons as **role**, not artwork — every governed icon role has a semantic
  purpose independent of any specific glyph, library, or rendering technology;
- provide a single architectural framework for iconography across Web, iOS,
  Android, Desktop, watch, print, and future platforms;
- prioritize medical clarity, recognition, and accessibility in all product
  surfaces including dashboards, timelines, devices, and safety-critical flows;
- treat medical, status, and device iconography as governed categories with
  distinct architectural requirements;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md),
  [11 Design Tokens Specification](11-design-tokens-specification.md),
  [12 UI Component Specification](12-ui-component-specification.md),
  [14 App Icon Architecture Specification](14-app-icon-architecture-specification.md),
  [15 Brand Logo System Specification](15-brand-logo-system-specification.md),
  [16 Color System Specification](16-color-system-specification.md), and
  [17 Typography System Specification](17-typography-system-specification.md);
- enable future icon production and library selection without redefining
  architectural intent;
- align with quality expectations in
  [13 DU Standard Specification](../project/13-du-standard-specification.md).

## Iconography Philosophy

The Iconography System follows these approved principles:

- **Meaning before decoration** — icons communicate function and status; decorative
  icons without informational role are prohibited in product UI.
- **Recognition before detail** — icons must remain identifiable at small sizes
  and under cognitive load; ornamental detail that reduces recognition is
  prohibited.
- **Consistency before variety** — the same semantic meaning must use the same
  governed category and role across surfaces, platforms, and themes unless an
  approved exception is documented.
- **Accessibility first** — icons must never be the sole carrier of safety-critical
  or medical meaning; touch targets, contrast, and non-visual redundancy are
  mandatory.
- **Medical clarity** — health-related icons must support accurate interpretation
  without alarmist defaults or ambiguous metaphors.
- **Minimal cognitive load** — limit simultaneous icon signals; each icon must
  justify its presence in dense medical interfaces.
- **Platform independence** — icon roles are platform-agnostic; rendering
  technology and library selection are downstream production decisions.
- **Long-term durability** — category and role architecture must survive icon
  library changes without breaking semantic contracts.

### Icons are role, not artwork

The Iconography System describes **roles** and **categories** only. Governed
roles include Navigation, Action, State, Indicator, Decorative, and Functional
icons. No role may be permanently bound to a specific glyph, vendor library, or
stroke style. Production icon sets assign artwork to roles; changing a library
must not require redefining role architecture.

### Icons do not belong to components

Icon ownership follows a strict chain:

```text
Icon Role
    ↓
Semantic Icon Token
    ↓
Component Icon Token
    ↓
Implementation
```

Components consume component icon tokens; they do not own icon identities.
Restyling a button must not redefine global iconography architecture.

## Iconography Architecture

The Iconography System is organized as a governed hierarchy of categories and
roles serving system-wide consistency, semantic organization, and
recognition-first behavior across platforms.

```text
Icon Categories (semantic domains)
        ↓
Icon Roles (functional purpose)
        ↓
Information Hierarchy Layer
        ↓
Theme & Accessibility Rules
```

### System-wide consistency

All product surfaces draw from the same governed category and role architecture.
Independent icon vocabularies per module, partner, or platform are prohibited
without architectural approval.

### Semantic organization

Icons are grouped by **what they represent** (category) and **how they function**
(role). Category defines domain; role defines interaction and hierarchy behavior.

### Cross-platform behavior

The same semantic meaning must map to the same category and role on Web, mobile,
desktop, and future platforms. Platform-specific delivery may differ; meaning must
not.

### Scalability

Icon architecture must support recognition from compact watch surfaces to large
dashboard modules without redefining categories or roles per breakpoint.

### Recognition-first approach

Architectural decisions prioritize instant identification over stylistic
uniqueness. Novel metaphors require governance review before adoption.

Iconography architecture is complementary to
[15 Brand Logo System Specification](15-brand-logo-system-specification.md) and
[14 App Icon Architecture Specification](14-app-icon-architecture-specification.md).
Brand Symbol and app icon assets are governed separately; UI iconography must not
substitute or mimic approved brand marks.

## Icon Categories

Architecture only. No icon lists, glyph names, or library references.

### Navigation

Icons that support wayfinding between modules, screens, and structural regions.
Navigation icons must pair with text labels or redundant wayfinding cues in
production.

### Actions

Icons representing user-initiated operations such as add, edit, delete, save,
share, and confirm. Action icons must not stand alone for destructive or
safety-critical operations without explicit confirmation patterns.

### Status

Icons communicating operational or data states such as success, warning, error,
pending, sync, and connectivity. Status icons must map to governed semantic color
roles from [16 Color System Specification](16-color-system-specification.md)
without relying on color alone.

### Medical

Icons for health concepts including glucose, insulin, nutrition, medication,
activity, symptoms, and clinical workflows. Medical icons require heightened
clarity and non-iconic redundancy for safety-critical meaning.

### Devices

Icons for connected hardware, sensors, pumps, meters, and device pairing states.
Device icons must remain distinguishable from generic settings or status icons.

### Communication

Icons for messaging, notifications delivery channels, and interpersonal features
within governed product boundaries.

### Marketplace

Icons for commerce, catalog, partner offerings, and transactional surfaces.
Marketplace icons must not introduce independent brand or semantic systems.

### AI

Icons for AI-generated insights, assistants, and automated recommendations.
AI icons must not imply clinical authority beyond governed product claims.

### Analytics

Icons for charts, trends, reports, and aggregated data views. Analytics icons
extend Status and Medical categories without creating chart-specific glyph
families outside governance.

### Settings

Icons for configuration, preferences, account controls, and system options.
Settings icons must remain visually distinct from Action icons that modify health
data.

### Notifications

Icons for alerts, reminders, badges, and attention signals. Notification icons
must support non-color and non-icon-only communication for critical alerts.

### Files

Icons for documents, exports, imports, attachments, and report artifacts.

### Media

Icons for images, audio, video, and rich content where product scope permits.

### Security

Icons for authentication, privacy, permissions, and data protection. Security
icons must avoid fear-based metaphors as defaults.

### Profile

Icons for user identity, avatar placeholders, roles, and account representation.
Profile icons must not conflict with Brand Symbol or logo system assets.

## Icon Roles

Architecture only. Roles describe function; they do not prescribe artwork.

### Navigation Icon

Supports wayfinding and structural orientation. Must appear with labels or
equivalent accessible names in production.

### Action Icon

Triggers an operation. Destructive and irreversible actions require redundant
text and confirmation architecture beyond the icon alone.

### State Icon

Represents a persistent or transient condition. Must pair with text, color role,
or pattern redundancy per accessibility rules.

### Indicator Icon

Compact signal attached to another element (badge, dot, overlay). Indicators must
not replace full status communication for medical-critical states.

### Decorative Icon

Non-essential visual accent with no informational duty. Decorative icons are
discouraged in medical-primary surfaces and must be `aria-hidden` in production.

### Functional Icon

Primary functional affordance within a control when text is also present or an
accessible name is provided. Functional icons must meet minimum touch-target
architecture in production.

## Recognition Principles

Icons must be recognizable under real product conditions — not only in design
review at large size.

### Instant recognition

Users must identify icon meaning within a single glance during dashboard and
timeline scanning. Recognition time is a quality criterion in DU review.

### Visual consistency

Icons within a category share structural vocabulary in production without
requiring identical glyphs across unrelated domains.

### Cognitive simplicity

Prefer established metaphors over clever novelty. Each new metaphor increases
learning cost across international audiences.

### Familiarity

Leverage cross-platform conventions where they do not conflict with medical
clarity or brand governance. Unfamiliar metaphors require explicit onboarding
or labels.

### Recognition before uniqueness

Brand expression must not compromise recognition. Stylistic differentiation
belongs to governed production rules, not ad-hoc per-screen icons.

No artwork, stroke specifications, or library references belong in this section.

## Information Hierarchy

Icons support information hierarchy; they do not replace typography or labels
from [17 Typography System Specification](17-typography-system-specification.md).

### Primary

Icons accompanying the user's main task or health-critical reading target on a
surface. Primary iconography must always pair with text or accessible names.

### Secondary

Icons supporting Primary content — contextual actions, related status, adjacent
metadata. Secondary icons must not compete visually with Primary indicators.

### Supporting

Non-critical hints, affordances, and decorative-adjacent cues. Supporting icons
must not carry safety-critical meaning alone.

### Critical indicators

Alert, warning, and mandatory-action signals. Critical indicators require
redundant text, color role, and/or haptic or auditory patterns per platform;
icons alone are insufficient.

**Icons must never become the only carrier of important information.** This rule
is non-negotiable for medical, safety, and accessibility compliance.

## Accessibility

Icon accessibility is mandatory across all categories and roles.

Requirements:

- **WCAG compatibility** — icon contrast against surfaces must meet governed
  requirements; icon-only controls must meet contrast and target-size expectations
  in production;
- **Screen readers** — every functional icon has an accessible name; decorative
  icons are excluded from accessibility tree;
- **Touch targets** — interactive icons meet minimum touch-target architecture in
  production; compact layouts must not shrink targets below governed thresholds;
- **Color independence** — meaning must not rely on color alone; pair icons with
  text, labels, or patterns per
  [16 Color System Specification](16-color-system-specification.md);
- **High contrast** — icon shapes must remain distinguishable in High Contrast
  themes without losing role meaning;
- **Reduced vision** — icons must remain recognizable at enlarged scale and
  under magnification without depending on fine stroke detail;
- **Icons never as the sole meaning** — prohibited for medical values, alerts,
  destructive actions, and authentication states.

## Internationalization

Iconography architecture must remain language-independent and culturally durable.

Principles:

- **Avoid culture-specific metaphors** — gestures, animals, and symbols with
  localized meaning require governance review before use;
- **Avoid country-specific symbolism** — flags, regional medical symbols, and
  jurisdiction-specific marks are out of scope unless explicitly approved for a
  localized module;
- **Remain language-independent** — icons do not encode language; labels handle
  localization through the platform i18n architecture;
- **Support RTL layouts** — directional icons (navigation, forward/back,
  expansion) must have governed mirroring or neutral alternatives in RTL contexts.

Icon categories and roles do not change per locale; production artwork may adapt
for script or layout direction under governance.

## Theme Compatibility

Icon roles must function across all governed theme contexts defined in
[16 Color System Specification](16-color-system-specification.md):

- **Light** — default ambient surfaces;
- **Dark** — reduced glare for extended use;
- **High Contrast** — strengthened figure-ground for low vision;
- **AMOLED** — power-efficient dark surfaces without recognition loss;
- **Print** — reports and exports with stable semantic meaning in monochrome.

Theme changes remap color relationships; icon **categories** and **roles** remain
constant. Production may adjust stroke or fill treatment per theme only through
governed tokens — not ad-hoc component overrides.

## Design Token Integration

Iconography integrates with the token architecture in
[11 Design Tokens Specification](11-design-tokens-specification.md).

```text
Icon Role
    ↓
Semantic Icon Token
    ↓
Component Icon Token
    ↓
Implementation
```

Principles:

- Iconography System defines **what** roles and categories exist and **how** they
  relate;
- foundation tokens hold raw icon asset references assigned to roles in production;
- semantic tokens express Iconography System roles in product language;
- component tokens alias semantic tokens for specific UI parts;
- implementation code consumes component tokens only;
- no component, framework utility, or platform API may introduce parallel icon
  identities outside this chain.

This document does not define token names, JSON structure, SVG paths, sprite
formats, or platform export formats.

## Future Evolution

The Iconography System is a living specification. It evolves through governed
architectural review without breaking role semantics or accessibility contracts.

### Evolution principles

- role and category meaning is stable; artwork and library choices may change
  within a major version when migration guidance is provided;
- new categories and roles require architectural approval before production use;
- medical clarity and non-icon-only-meaning rules are non-negotiable across
  evolution cycles;
- evolution strengthens — not fragments — cross-platform iconography consistency.

### Backward compatibility

| Change type                        | Compatibility expectation                          |
| ---------------------------------- | -------------------------------------------------- |
| Clarifications to role definitions | Backward-compatible within the same major version  |
| New theme icon treatment           | Additive when roles unchanged                      |
| New icon category or role          | Additive; requires documentation and token mapping |
| Renamed or merged categories/roles | Major version; migration required                  |
| Removed category or role           | Major version; deprecation process required        |

### New categories

Additional categories may be introduced for new product domains (e.g., clinical
trials, caregiver collaboration). Each new category must include accessibility
review and internationalization assessment before approval.

### Platform evolution

Watch, TV, automotive, and voice-adjunct interfaces adopt existing category and
role architecture before introducing platform-specific delivery rules.

### Governance

Evolution follows [Governance](#governance). Breaking changes require explicit
architectural approval and DU review.

### Periodic review

Iconography System architecture undergoes periodic review at least once per major
product phase or annually, whichever comes first.

Periodic review evaluates:

- alignment with documents `00`–`17`;
- effectiveness of category architecture and medical clarity rules;
- theme coverage and accessibility outcomes;
- gaps revealed by DU Reviews, audits, or platform expansion;
- need for minor clarifications or major version increments.

### Versioning

| Version  | Meaning                                                             |
| -------- | ------------------------------------------------------------------- |
| **v1.0** | First Feature Complete Iconography System architecture release      |
| **v1.x** | Backward-compatible clarifications, theme additions, or corrections |
| **v2.0** | Breaking changes to categories, roles, or semantic contracts        |

## Future Expansion

The Iconography System must extend to new product domains and platform contexts
without redefining core category architecture.

### Wearables

Compact surfaces use governed Indicator, Status, and Medical categories with
recognition constraints for small viewports. Wearable expansion must not
introduce unreadable micro-icons outside accessibility review.

### Automotive

Driver-distraction constraints require larger recognition targets and reduced
icon density. Automotive surfaces inherit roles without independent glyph systems.

### Medical devices

Device pairing, sensor status, and hardware alerts extend Devices and Medical
categories. Device expansion must maintain distinction from generic connectivity
icons.

### AI interfaces

AI insight, assistant, and automation surfaces use governed AI category roles with
explicit non-clinical-authority boundaries.

### Marketplace

Partner and commerce modules consume semantic and component icon tokens only.
Marketplace expansion must not fragment cross-product icon consistency.

### Reports

Print and export surfaces inherit Print theme rules. Icons in reports must
remain meaningful in monochrome or be supplemented by text labels.

### Partner modules

Third-party surfaces consume governed tokens; partner-specific icon vocabularies
require approval per [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Future accessibility modes

Accessibility mode expansion extends theme and scaling behavior without changing
role meaning. New modes require DU accessibility review before approval.

Expansion into any domain above follows evolution and governance rules. Icon
production, SVG assets, and library selection belong to later approved work.

## Governance

### Ownership

Iconography System architecture is owned by design system and brand governance
authority defined in
[02 Project Governance Specification](../project/02-project-governance-specification.md)
and [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Approval

- category and role additions, removals, or redefinitions require explicit
  architectural approval;
- production icon set releases require approval through brand governance and design
  system governance;
- exceptions require documented approval per document `08`.

### Lifecycle

Iconography System architecture follows the governed document lifecycle in
[01 Project Development Specification](../project/01-project-development-specification.md):

Draft → Architecture Review → Repository Implementation → Validation → DU Review →
Certification → Feature Complete.

Current status: **Architecture Approved**.

### Review

- architectural changes require review against documents `00`–`17` and DU Standard
  design review criteria;
- icon set production is validated against this specification before approval;
- accessibility review is mandatory for any category or role change affecting
  medical or safety-critical surfaces.

### Change management

Changes to Iconography System architecture must:

- follow documents `01`–`03` governance and engineering change rules;
- remain compatible with documents `05`–`09` and `10`–`17`;
- not introduce SVG assets, icon libraries, stroke widths, pixel sizes, or
  implementation exports in this specification;
- receive explicit architectural approval before implementation.

### Versioning

Version semantics are defined in [Future Evolution](#future-evolution). Production
icon sets carry their own asset versioning governed by document `08`.

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
- [16 Color System Specification](16-color-system-specification.md)
- [17 Typography System Specification](17-typography-system-specification.md)

## Success Criteria

Iconography System architecture is successful when:

- purpose, objectives, and iconography philosophy are documented;
- iconography architecture covers system-wide consistency, semantic organization,
  cross-platform behavior, scalability, and recognition-first approach;
- icon categories (Navigation, Actions, Status, Medical, Devices, Communication,
  Marketplace, AI, Analytics, Settings, Notifications, Files, Media, Security,
  Profile) are defined without icon lists;
- icon roles (Navigation, Action, State, Indicator, Decorative, Functional) are
  architecturally distinct;
- recognition principles and information hierarchy are documented;
- accessibility requirements include WCAG, screen readers, touch targets, and
  prohibition of icon-only critical meaning;
- internationalization avoids culture-specific metaphors and supports RTL;
- theme compatibility covers Light, Dark, High Contrast, AMOLED, and Print;
- icon-to-token integration chain is explicit;
- future evolution and expansion frameworks are documented;
- governance, dependencies, and documentation navigation are complete;
- no SVG, icon drawings, sizes, stroke widths, library references, or
  implementation assets are produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through ad-hoc icon decisions.

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Icon production, SVG assets, and library selection belong to later approved
  work governed by this specification and document `11`.
- Iconography direction in
  [10 Visual Design System Specification](10-visual-design-system-specification.md)
  and [07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
  remains authoritative for their respective scopes; this document is the
  dedicated Iconography System architecture specification.
