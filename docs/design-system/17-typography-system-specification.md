# 17. Typography System Specification

## Purpose

Define the architectural foundation for the complete typography system used
throughout the Diabetes Universe ecosystem.

This document is the authoritative Typography System specification. It establishes
typography philosophy, role hierarchy, numeric typography architecture,
information hierarchy, reading experience principles, internationalization,
accessibility, theme compatibility, design token integration, evolution, and
governance without selecting font families, defining type scales, or producing
platform implementation exports.

This is not a font selection document. This is not a UI implementation guide.
This document defines only typography architecture.

## Status

Architecture Approved

## Objectives

The Typography System must:

- define typography as **role**, not value — every governed typographic role has
  a semantic purpose independent of any specific font family or scale;
- provide a single architectural framework for typography across Web, iOS,
  Android, Desktop, watch, print, and future platforms;
- prioritize medical clarity, readability, and accessibility in all product
  surfaces including dashboards, timelines, reports, and long-form content;
- treat numeric and measurement typography as a first-class category distinct
  from general body and heading roles;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md),
  [11 Design Tokens Specification](11-design-tokens-specification.md),
  [12 UI Component Specification](12-ui-component-specification.md), and
  [16 Color System Specification](16-color-system-specification.md);
- enable future font selection, type scale production, and implementation
  without redefining architectural intent;
- align with quality expectations in
  [13 DU Standard Specification](../project/13-du-standard-specification.md).

## Typography Philosophy

The Typography System follows these approved principles:

- **Information before decoration** — typography communicates structure and
  meaning; decorative type treatment without informational role is prohibited
  in product UI.
- **Readability before aesthetics** — legibility, scanning efficiency, and
  comprehension take priority over stylistic novelty.
- **Consistency before variation** — the same role must carry the same meaning
  across surfaces, platforms, and themes unless a governed variant explicitly
  defines an alternate mapping.
- **Accessibility first** — contrast relationships, scaling behavior, and
  cognitive clarity take priority over compact or expressive layouts.
- **Medical clarity** — typography must support accurate interpretation of health
  data; ambiguity in numeric, unit, and temporal presentation is prohibited at
  the architecture level.
- **Long-term durability** — role architecture must survive font family changes
  and scale refinements without breaking semantic contracts.
- **Typography independent of font family** — roles describe information
  function; font family selection is a downstream production decision governed
  separately.

### Typography is role, not value

The Typography System describes **roles** only. Governed role families include
Display, Heading, Title, Body, Label, Caption, Overline, Supporting Text, and
Numeric categories. No role may be permanently bound to a specific font family,
weight name, or scale step. Production type systems assign values to roles;
changing a font stack must not require redefining role architecture.

### Typography does not belong to components

Typography ownership follows a strict chain:

```text
Typography Role
    ↓
Semantic Typography Token
    ↓
Component Typography Token
    ↓
Component
```

Components consume component typography tokens; they do not own typographic
identities. Restyling a card must not redefine global typography architecture.

## Typography Architecture

The Typography System is organized as a governed hierarchy of role families.
Each family serves distinct architectural purposes while sharing theme,
internationalization, and accessibility rules.

```text
Display & Heading Roles
        ↓
Title & Body Roles
        ↓
Label, Caption & Overline Roles
        ↓
Supporting Text Roles
        ↓
Numeric Typography Roles
        ↓
Information Hierarchy Layer
```

| Layer                     | Architectural role                                            |
| ------------------------- | ------------------------------------------------------------- |
| **Display & Heading**     | Highest-level structure, screen identity, section framing     |
| **Title & Body**          | Primary reading content, module titles, narrative text        |
| **Label & Meta**          | Form labels, captions, overlines, metadata, secondary labels  |
| **Supporting Text**       | Hints, helper copy, disclaimers, non-primary explanations     |
| **Numeric Typography**    | Medical values, units, time, statistics, trends, measurements |
| **Information Hierarchy** | Cross-cutting priority levels applied to all role families    |

Typography architecture is orthogonal to color architecture. Color roles from
[16 Color System Specification](16-color-system-specification.md) may emphasize
hierarchy; typography roles define structural reading order. Neither replaces
the other.

## Typography Roles

Architecture only. No font sizes, font families, weights, or implementation
values.

### Display

Highest-level typographic role for rare, high-impact presentation contexts such
as onboarding hero statements, empty-state emphasis, or marketing surfaces
within product boundaries. Display must not replace Heading for routine screen
structure.

### Heading

Structural section headers that organize content within a screen or module.
Heading roles establish navigational landmarks for assistive technology and
visual scanning.

### Title

Module, card, and list item titles that identify a bounded content unit without
claiming full section hierarchy. Title is subordinate to Heading in information
priority.

### Body

Primary reading text for descriptions, explanations, narrative content, and
general product copy. Body is the default typographic role for long-form and
paragraph content.

### Label

Identifiers for inputs, controls, data fields, and compact UI chrome. Labels
must remain distinguishable from Body and Caption without relying on font
weight alone.

### Caption

Secondary explanatory text, timestamps, footnotes, and metadata attached to a
primary element. Caption is subordinate to Body and must not carry safety-critical
meaning without redundant signaling.

### Overline

Short, uppercase or emphasized category markers that precede a title or section.
Overline provides contextual grouping; it must not replace Label or Heading.

### Supporting Text

Helper, hint, instructional, and disclaimer copy that supports a primary action
or field without competing for attention. Supporting Text is explicitly
non-primary in hierarchy.

## Numeric Typography

Numbers are a first-class typography category. Medical data requires independent
architectural roles distinct from general Body and Title roles.

Numeric typography must support tabular alignment philosophy, unit separation,
and unambiguous reading of health-critical values without prescribing
implementation formats.

### Glucose values

Architectural role for blood glucose readings and related primary metabolic
values. Must support immediate recognition, comparison across entries, and
distinction from surrounding narrative text.

### Insulin units

Architectural role for insulin dose values and unit presentation. Must preserve
clear separation between numeric value and unit identifier.

### Carbohydrates

Architectural role for carbohydrate counts and nutritional numeric fields related
to meal and nutrition logging.

### Time

Architectural role for clock time, duration, date-time combinations, and temporal
metadata. Must support locale-independent structural clarity before localization
formatting is applied.

### Percentages

Architectural role for ratio, progress, and statistical percentage presentation
including targets and ranges.

### Statistics

Architectural role for aggregated metrics, averages, counts, and summary
numerics on dashboards and reports.

### Trends

Architectural role for directional change indicators paired with numeric delta
presentation. Trend typography must not rely on color or weight alone; structure
and labels carry meaning.

### Measurements

Architectural role for general clinical and lifestyle measurements including
weight, height, laboratory values, and device readings not covered by specialized
glucose or insulin roles.

Numeric roles may share implementation patterns in production but must remain
architecturally distinct where medical interpretation differs.

## Information Hierarchy

Information hierarchy is a cross-cutting layer applied to all typography roles.
It defines reading priority, not visual styling.

### Primary

The single most important information unit on a surface or within a module.
Primary hierarchy is reserved for the user's immediate decision or health-critical
reading target.

### Secondary

Information that supports understanding of Primary content without competing for
first attention. Secondary hierarchy includes contextual values, related metrics,
and adjacent metadata.

### Tertiary

Supplementary details available during deliberate reading. Tertiary hierarchy
includes extended descriptions, historical context, and non-essential metadata.

### Supporting

Non-critical hints, legal copy, footnotes, and instructional text that must remain
available without interrupting Primary tasks.

### Critical

Safety-relevant, alert, or action-mandatory information that requires immediate
perception. Critical hierarchy must never be communicated through typography
weight or size alone; redundant visual and non-visual signals are required per
accessibility architecture.

### Background information

Ambient context such as section intros, low-priority timestamps, and decorative
separators that must not be mistaken for actionable or medical-primary content.

Hierarchy levels map to typography roles through tokens in production; this
document defines priority semantics only.

## Reading Experience

Typography architecture must optimize for how users actually read Diabetes
Universe surfaces.

### Scanning

Users scan dashboards and timelines before reading in depth. Role architecture
must support rapid visual anchoring through consistent Heading, Title, and
Numeric role placement without depending on decorative styling.

### Readability

Body and Supporting Text roles must support comfortable sustained reading across
light and dark themes. Line length, spacing, and density decisions belong to
implementation; architecture requires that readability constraints are explicit
in token and component governance.

### Information density

Medical products balance comprehensive data with cognitive manageability.
Typography roles must allow dense data presentation without collapsing hierarchy.
Density changes adjust scale in production; role meaning remains stable.

### Cognitive load

Reduce unnecessary typographic variation. Each additional role or hierarchy
level must justify its cognitive cost. Prohibited: gratuitous Display or Heading
levels that fragment scanning patterns.

### Long-form reading

Articles, help content, encyclopedia entries, and educational material require
stable Body hierarchy with clear Heading structure. Long-form architecture must
remain compatible with internationalization and dynamic scaling.

### Dashboard reading

Dashboard surfaces prioritize Numeric, Title, and Label roles with fast
comparison across modules. Dashboard typography architecture must support
glanceable health status without alarmist defaults.

### Medical data reading

Glucose, insulin, carbohydrate, and related numeric roles must be architecturally
distinct from narrative Body text. Users must never infer medical meaning from
typographic decoration alone.

## Internationalization

Typography architecture must remain language-independent.

Supported script and layout categories:

- **Latin** — default product scripts including English and European languages;
- **Cyrillic** — including Ukrainian, Russian, and related locales;
- **Greek** — medical and regional locale support;
- **Arabic** — RTL layout compatibility at architecture level;
- **Hebrew** — RTL layout compatibility at architecture level;
- **CJK** — Chinese, Japanese, and Korean scripts with variable character
  complexity;
- **RTL** — right-to-left reading direction for applicable locales;
- **Long words** — German, Finnish, and other locales with compound or extended
  words that affect line breaking and density.

Principles:

- typography roles do not assume a specific script width or line-breaking model;
- role hierarchy must survive translation length expansion without structural
  redesign;
- numeric roles remain structurally consistent across locales; formatting rules
  belong to localization and formatting platforms;
- font family selection for script coverage is production work governed by
  [07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
  and this specification.

## Accessibility

Typography accessibility is mandatory across all roles and hierarchy levels.

Requirements:

- **WCAG** — contrast relationships between text and background must meet
  governed contrast requirements; typography architecture must not prescribe
  pairings that force sub-threshold contrast in production;
- **Dynamic Type** — roles must map to scalable production values on platforms
  that support user-controlled text sizing;
- **System font scaling** — architecture must not assume fixed pixel rendering;
  roles express relative priority, not absolute immutability;
- **Reduced cognitive load** — limit simultaneous hierarchy signals; prefer
  structure and spacing over weight and decoration;
- **Large text** — Primary and Critical content must remain legible at enlarged
  scale without loss of hierarchy;
- **Low vision** — Numeric and Critical roles require enhanced legibility
  patterns in production without relying on thin strokes or low-contrast grays
  as defaults;
- **Dyslexia considerations** — architecture allows future production choices
  (spacing, family, tracking) without encoding them here; avoid role definitions
  that require dense glyph shapes or excessive weight contrast for meaning.

**Never rely on font weight alone to communicate meaning.** Weight may reinforce
hierarchy in production but must always pair with role, position, label, icon,
or color role redundancy per
[16 Color System Specification](16-color-system-specification.md).

## Theme Compatibility

Typography roles must function equally across all governed theme contexts defined
in [16 Color System Specification](16-color-system-specification.md):

- **Light** — default high-ambient reading;
- **Dark** — reduced glare for extended use;
- **High Contrast** — strengthened figure-ground relationships for low vision;
- **AMOLED** — power-efficient dark surfaces without hierarchy collapse;
- **Print** — report and export readability with stable role semantics.

Theme changes remap color and surface relationships; typography **roles** and
**hierarchy** remain constant. Production may adjust scale or weight per theme
only through governed tokens — not ad-hoc component overrides.

## Design Token Integration

Typography integrates with the token architecture in
[11 Design Tokens Specification](11-design-tokens-specification.md).

```text
Typography Role
    ↓
Semantic Typography Token
    ↓
Component Typography Token
    ↓
Implementation
```

Principles:

- Typography System defines **what** roles exist and **how** they relate;
- foundation tokens hold raw typographic values assigned to roles in production;
- semantic tokens express Typography System roles in product language;
- component tokens alias semantic tokens for specific UI parts;
- implementation code and stylesheets consume component tokens only;
- no component, framework utility, or platform API may introduce parallel
  typography identities outside this chain.

This document does not define token names, JSON structure, CSS properties,
Tailwind configuration, or platform export formats.

## Future Evolution

The Typography System is a living specification. It evolves through governed
architectural review without breaking role semantics or accessibility contracts.

### Evolution principles

- role meaning is stable; font family and scale values may change within a major
  version when migration guidance is provided;
- new roles require architectural approval before production use;
- medical clarity and non-weight-redundancy rules are non-negotiable across
  evolution cycles;
- evolution strengthens — not fragments — cross-platform typography consistency.

### Backward compatibility

| Change type                        | Compatibility expectation                          |
| ---------------------------------- | -------------------------------------------------- |
| Clarifications to role definitions | Backward-compatible within the same major version  |
| New theme typography mapping       | Additive when roles unchanged                      |
| New typography role                | Additive; requires documentation and token mapping |
| Renamed or merged roles            | Major version; migration required                  |
| Removed role                       | Major version; deprecation process required        |

### Typography role evolution

New product capabilities may require additional roles (e.g., AI insight summary,
sync status). Each new role must include hierarchy placement, accessibility
review, and internationalization assessment before approval.

### Future platform support

Watch, TV, automotive, and voice-adjunct interfaces adopt existing role
architecture before introducing platform-specific delivery rules. Platform
expansion must not create independent typography systems per product.

### Versioning

| Version  | Meaning                                                             |
| -------- | ------------------------------------------------------------------- |
| **v1.0** | First Feature Complete Typography System architecture release       |
| **v1.x** | Backward-compatible clarifications, theme additions, or corrections |
| **v2.0** | Breaking changes to roles, hierarchy, or semantic contracts         |

### Periodic review

Typography System architecture undergoes periodic review at least once per major
product phase or annually, whichever comes first.

Periodic review evaluates:

- alignment with documents `00`–`16`;
- effectiveness of role hierarchy and medical clarity rules;
- theme coverage and accessibility outcomes;
- gaps revealed by DU Reviews, audits, or platform expansion;
- need for minor clarifications or major version increments.

## Future Expansion

The Typography System must extend to new product domains and platform contexts
without redefining core role architecture.

### Wearable typography

Compact surfaces adopt Numeric, Label, and Title roles with governed density
rules. Wearable expansion must not introduce unreadable micro-roles outside
accessibility review.

### AI interfaces

AI-generated summaries, insight cards, and conversational UI use Body, Supporting
Text, and Title roles with explicit hierarchy. AI content must not bypass Label
or Critical hierarchy rules for safety-relevant information.

### Charts

Chart typography extends Label, Caption, and Numeric roles for axes, legends,
and data labels. Chart text must remain legible without relying on color alone.

### Reports

Clinical and user-facing reports use Heading, Body, Numeric, and Caption roles
with Print theme compatibility. Report typography must support export without
role fragmentation.

### Printable reports

Print expansion inherits Print theme rules. Numeric and measurement roles must
remain distinct in monochrome output.

### Marketplace

Marketplace modules use Title, Body, and Label roles without independent
typography systems. Partner content inherits governed hierarchy.

### Partner modules

Third-party and partner surfaces consume semantic and component typography tokens
only. Partner expansion must not fragment cross-product typography consistency.

### Future accessibility modes

Accessibility mode expansion extends theme and scaling behavior without changing
role meaning. New modes require DU accessibility review before approval.

Expansion into any domain above follows the evolution and governance rules in
[Future Evolution](#future-evolution) and [Governance](#governance). Font
selection, type scales, and component styling belong to later approved work.

## Governance

### Ownership

Typography System architecture is owned by design system and brand governance
authority defined in
[02 Project Governance Specification](../project/02-project-governance-specification.md)
and [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Review

- architectural changes require review against documents `00`–`16` and DU Standard
  design review criteria;
- font family and scale production are validated against this specification before
  approval;
- accessibility review is mandatory for any role or hierarchy change affecting
  medical or safety-critical surfaces.

### Approval

- role additions, removals, or redefinitions require explicit architectural
  approval;
- production type system releases require approval through brand governance and
  design system governance;
- exceptions require documented approval per document `08`.

### Lifecycle

Typography System architecture follows the governed document lifecycle in
[01 Project Development Specification](../project/01-project-development-specification.md):

Draft → Architecture Review → Repository Implementation → Validation → DU Review →
Certification → Feature Complete.

Current status: **Architecture Approved**.

### Change management

Changes to Typography System architecture must:

- follow documents `01`–`03` governance and engineering change rules;
- remain compatible with documents `05`–`09` and `10`–`16`;
- not introduce font families, type scales, CSS properties, Tailwind config, or
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
- [16 Color System Specification](16-color-system-specification.md)

## 18. Typography Metrics Philosophy

Typography metrics describe how roles occupy space and relate to one another
without prescribing numeric values. Metrics philosophy governs production type
systems and token assignments; this section defines architectural intent only.

### Line-height philosophy

Line height must support the reading mode of each role family.

- Body and Supporting Text roles require comfortable vertical rhythm for
  sustained reading and translation expansion;
- Heading and Title roles may use tighter rhythm for structural scanning but
  must not sacrifice legibility at enlarged scale;
- Numeric roles require line height that preserves digit separation and unit
  clarity without collapsing multi-line medical values;
- line height is a production assignment per role — not a universal constant
  across the system.

### Paragraph spacing philosophy

Paragraph spacing separates semantic blocks without relying on decorative rules.

- spacing between paragraphs must reinforce information hierarchy — Primary blocks
  must not visually merge with Supporting blocks;
- long-form content requires predictable paragraph cadence independent of font
  family;
- dashboard and card modules use governed spacing between typographic groups, not
  ad-hoc margin decisions per component;
- paragraph spacing must remain stable across themes and locales.

### Character spacing philosophy

Character spacing (tracking) is used sparingly and purposefully.

- default roles assume neutral tracking optimized for readability in each script
  category;
- Overline and compact Label roles may allow controlled tracking in production
  but must not reduce legibility for low-vision users;
- medical and numeric roles prohibit decorative tracking that alters digit
  recognition;
- CJK, Arabic, Hebrew, and long-word locales may require script-specific
  tracking adjustments in production without changing role architecture.

### Numeric alignment philosophy

Numeric typography requires alignment rules that support comparison and trust.

- glucose, insulin, statistics, and measurement values must align for vertical
  scanning in lists, tables, and dashboards;
- alignment philosophy distinguishes value columns from unit and label columns;
- mixed numeric and narrative content must not share alignment rules that obscure
  medical values;
- alignment behavior is defined at token level in production; architecture
  requires comparability without mandating implementation mechanics.

### Baseline consistency

Typographic elements on a shared horizontal surface must share a coherent
baseline grid philosophy.

- mixed roles on one line (e.g., Title with Caption, value with unit) must
  baseline-align unless a governed exception is documented;
- multi-column and responsive layouts must not break baseline relationships
  arbitrarily between breakpoints;
- baseline consistency supports optical calm and reduces cognitive load in dense
  medical interfaces.

### Optical alignment

Optical alignment corrects perceived imbalance that mathematical centering alone
cannot resolve.

- icon-plus-label, symbol-plus-wordmark, and badge-plus-text compositions follow
  optical alignment principles in production;
- circular or asymmetric glyphs must not pull adjacent text out of perceived
  alignment with numeric columns;
- optical adjustments are production refinements within token bounds — they do not
  create new typography roles.

### Tabular figures philosophy

Tabular (monospaced) figures are a first-class consideration for numeric roles.

- glucose, insulin, time, statistics, and measurement values should use tabular
  figure behavior in production where platform support allows;
- proportional figures remain acceptable for narrative Body roles only;
- tabular philosophy applies to dashboards, timelines, reports, and any surface
  where numeric comparison is primary;
- switching between proportional and tabular presentation must not change role
  meaning or hierarchy.

Metrics philosophy integrates with [Design Token Integration](#design-token-integration):
production assigns line height, spacing, tracking, and figure behavior to roles
through semantic and component tokens — not component-local overrides.

## Success Criteria

Typography System architecture is successful when:

- purpose, objectives, and typography philosophy are documented;
- role hierarchy (Display, Heading, Title, Body, Label, Caption, Overline,
  Supporting Text) is defined without font values;
- numeric typography roles (glucose, insulin, carbohydrates, time, percentages,
  statistics, trends, measurements) are architecturally distinct;
- information hierarchy levels (Primary, Secondary, Tertiary, Supporting,
  Critical, Background) are defined at architecture level only;
- reading experience principles cover scanning, density, dashboard, long-form,
  and medical data contexts;
- internationalization supports Latin, Cyrillic, Greek, Arabic, Hebrew, CJK, RTL,
  and long-word locales without role fragmentation;
- accessibility requirements include WCAG, dynamic scaling, and prohibition of
  weight-only meaning;
- theme compatibility covers Light, Dark, High Contrast, AMOLED, and Print;
- typography-to-token integration chain is explicit;
- typography metrics philosophy covers line height, paragraph spacing, character
  spacing, numeric alignment, baseline consistency, optical alignment, and
  tabular figures without numeric values;
- future evolution and expansion frameworks are documented;
- governance, dependencies, and documentation navigation are complete;
- no font families, type scales, px, rem, CSS, Tailwind configuration, token
  values, or implementation assets are produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through ad-hoc typographic decisions.

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Font family selection, type scale production, and token value catalogs belong
  to later approved work governed by this specification and document `11`.
- Typography direction in
  [10 Visual Design System Specification](10-visual-design-system-specification.md)
  remains authoritative for visual design system scope; this document is the
  dedicated Typography System architecture specification.
