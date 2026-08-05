# 19. Illustration System Specification

## Purpose

Define the architectural foundation for the complete illustration system used
throughout the Diabetes Universe ecosystem.

This document is the authoritative Illustration System specification. It establishes
illustration philosophy, category architecture, illustration roles, communication
principles, information hierarchy, accessibility, internationalization, theme
compatibility, design token integration, evolution, and governance without
producing artwork, color palettes, style guides, or platform implementation exports.

This is not an illustration library. This is not an artwork guide. This is not a
style guide. This document defines illustration architecture only.

## Status

Architecture Approved

## Objectives

The Illustration System must:

- define illustrations as **role**, not artwork — every governed illustration role
  has a semantic purpose independent of any specific visual style, medium, or
  rendering technology;
- provide a single architectural framework for illustration across Web, iOS,
  Android, Desktop, watch, print, and future platforms;
- prioritize human-centered communication, medical responsibility, and emotional
  calm in all product surfaces including onboarding, education, empty states, and
  error recovery;
- treat empty-state, educational, and medical-support illustration as governed
  categories with distinct architectural requirements;
- remain compatible with
  [10 Visual Design System Specification](10-visual-design-system-specification.md),
  [11 Design Tokens Specification](11-design-tokens-specification.md),
  [12 UI Component Specification](12-ui-component-specification.md),
  [16 Color System Specification](16-color-system-specification.md),
  [17 Typography System Specification](17-typography-system-specification.md), and
  [18 Iconography System Specification](18-iconography-system-specification.md);
- enable future illustration production and style development without redefining
  architectural intent;
- align with quality expectations in
  [13 DU Standard Specification](../project/13-du-standard-specification.md).

## Illustration Philosophy

The Illustration System follows these approved principles:

- **Meaning before decoration** — illustrations communicate support and context;
  decorative illustration without informational or emotional role is discouraged
  in product UI.
- **Clarity before complexity** — visual narratives must remain simple enough to
  understand under cognitive load; ornate detail that obscures meaning is
  prohibited.
- **Human-centered communication** — illustrations serve people managing diabetes
  with dignity, empathy, and respect; patronizing or infantilizing treatment is
  prohibited.
- **Medical responsibility** — illustrations must not imply clinical outcomes,
  diagnoses, or treatment advice beyond governed product scope.
- **Emotional calm** — illustration tone must reduce anxiety; alarmist, fear-based,
  or clinical cliché imagery is prohibited as default patterns.
- **Accessibility first** — illustrations must never be required to understand
  safety-critical or medical-primary information.
- **Consistency** — the same category and role must carry the same architectural
  meaning across surfaces, platforms, and themes unless an approved exception is
  documented.
- **Long-term durability** — category and role architecture must survive style
  refreshes without breaking semantic contracts.

### Illustrations are role, not artwork

The Illustration System describes **roles** and **categories** only. Governed
roles include Informational, Educational, Emotional, Supportive, Decorative, and
Contextual illustrations. No role may be permanently bound to a specific visual
style, artist, or medium. Production illustration sets assign artwork to roles;
changing a style direction must not require redefining role architecture.

### Illustrations do not belong to components

Illustration ownership follows a strict chain:

```text
Illustration Role
    ↓
Semantic Illustration Token
    ↓
Component Illustration Token
    ↓
Implementation
```

Components consume component illustration tokens; they do not own illustration
identities. Restyling a module must not redefine global illustration architecture.

## Illustration Architecture

The Illustration System is organized around semantic purpose and support
functions serving users across the product lifecycle.

```text
Illustration Categories (semantic domains)
        ↓
Illustration Roles (functional purpose)
        ↓
Information Hierarchy Layer
        ↓
Theme & Accessibility Rules
```

### Semantic purpose

Every illustration belongs to a governed category that defines **why** it exists
in the product — not how it looks.

### Information support

Illustrations may clarify concepts, workflows, and system states when paired
with text. They must not replace labels, values, or medical data.

### Emotional support

Illustrations may reduce anxiety, celebrate progress, and humanize complex
moments without manipulating or alarming users.

### Onboarding support

Illustrations guide first-time understanding of product capabilities, permissions,
and setup flows. Onboarding illustration must remain optional to comprehension
when text is present.

### Educational support

Illustrations reinforce learning content in encyclopedia, help, and guided
experiences. Educational illustration must align with medically responsible
messaging.

### Empty-state support

Illustrations provide context when lists, dashboards, or modules have no data.
Empty-state illustration must pair with actionable text and never imply error
when none exists.

No implementation, artwork, or color specifications belong in this section.

## Illustration Categories

Architecture only. No artwork, scenes, or character definitions.

### Empty States

Illustrations for zero-data, first-use, and filtered-empty contexts. Must support
calm encouragement without implying failure.

### Onboarding

Illustrations for welcome flows, feature introduction, and permission education.
Must remain comprehensible without illustration when text is provided.

### Education

Illustrations for articles, tutorials, and health literacy content. Must not
substitute for medically reviewed copy.

### AI Assistance

Illustrations for AI insight, assistant, and automated guidance surfaces. Must not
impart false clinical authority or anthropomorphize AI beyond governed product
claims.

### Marketplace

Illustrations for commerce, catalog, and partner discovery within governed
product boundaries. Must not introduce independent visual brand systems.

### Success

Illustrations for completed actions, milestones, and positive confirmations.
Must remain proportionate — not gamified to the point of trivializing health
management.

### Error Recovery

Illustrations for recoverable errors, connectivity issues, and retry flows. Must
avoid blame-oriented or alarming imagery as defaults.

### Maintenance

Illustrations for planned downtime, updates, and system maintenance communication.
Must set expectations without creating unnecessary concern.

### Achievements

Illustrations for progress recognition, streaks, and behavioral encouragement
within governed wellness boundaries. Must not imply medical outcomes.

### Community

Illustrations for social, peer support, and community features where product scope
permits. Must respect privacy and avoid stereotypical representation.

## Illustration Roles

Architecture only. Roles describe function; they do not prescribe artwork.

### Informational

Clarifies a concept, state, or workflow. Must always pair with explanatory text.

### Educational

Supports structured learning content. Subordinate to medically reviewed copy and
typography hierarchy from
[17 Typography System Specification](17-typography-system-specification.md).

### Emotional

Provides tone, reassurance, or celebration. Must not manipulate or alarm; emotional
role is supportive, not primary.

### Supportive

Accompanies empty states, onboarding steps, and gentle guidance. Must include
actionable text for task completion.

### Decorative

Non-essential visual atmosphere with no informational duty. Decorative illustrations
are discouraged on medical-primary surfaces and must be excluded from critical
comprehension paths.

### Contextual

Situates the user within a module, feature, or seasonal context without carrying
medical meaning. Contextual illustration must not obscure Primary content.

## Communication Principles

Illustrations support content; they never replace it.

### Reduce anxiety

Illustration tone must calm users facing diabetes management complexity. Prohibited:
fear imagery, clinical shock visuals, and guilt-oriented metaphors as defaults.

### Explain concepts

Illustrations may visualize abstract workflows (sync, logging, reminders) when paired
with clear text. Prohibited: illustration-only explanations of medical concepts.

### Support understanding

Illustrations reinforce comprehension for diverse literacy levels and cognitive
states. They must not oversimplify safety-critical information.

### Avoid distraction

In dense medical interfaces (dashboard, timeline, logging), illustration density
must be minimized. Primary tasks take precedence over decorative narrative.

### Reinforce meaning

Illustrations align with adjacent typography, iconography, and color roles —
never contradict them. Contradictory visual narrative is reported as **Blocked**.

## Information Hierarchy

Illustrations must never become the primary carrier of medical information.

### Primary support

Illustrations accompanying the user's main task on a surface. Primary support
illustration must remain subordinate to text, data values, and labels.

### Secondary support

Illustrations reinforcing Primary content — adjacent explanations, module context,
related guidance. Must not compete with health-critical reading targets.

### Contextual support

Illustrations providing atmosphere or module identity without informational duty.
Must not appear on safety-critical alert surfaces.

### Decorative support

Non-essential visual accent. Prohibited as the only signal for errors, warnings,
or medical states.

Medical values, alerts, diagnoses, and treatment guidance must always be carried
by typography, data presentation, and redundant non-visual cues — not illustration
alone.

## Accessibility

Illustration accessibility is mandatory across all categories and roles.

Requirements:

- **WCAG compatibility** — illustration contrast against surfaces must not reduce
  readability of adjacent text; illustrations must not create seizure-inducing
  motion patterns in production;
- **Reduced vision** — illustrations must not be required to understand interface
  function; text alternatives and structure carry meaning;
- **Color independence** — meaning must not rely on illustration color alone;
  pair with text and iconography per
  [16 Color System Specification](16-color-system-specification.md) and
  [18 Iconography System Specification](18-iconography-system-specification.md);
- **Screen readers** — decorative illustrations are excluded from accessibility
  tree; informational illustrations have text equivalents in production;
- **Reduced cognitive load** — limit illustration complexity on medical-primary
  surfaces; prefer single focal narrative over busy scenes;
- **Illustrations never required for critical information** — prohibited for
  glucose values, alerts, authentication, and destructive action confirmation.

## Internationalization

Illustration architecture must support global audiences without cultural bias.

Principles:

- **Avoid culture-specific symbolism** — gestures, religious imagery, food
  metaphors, and locale-specific medical symbols require governance review before
  use;
- **Avoid stereotypes** — representation must not rely on race, gender, age, or
  body-type stereotypes as shorthand for health states;
- **Avoid region-specific assumptions** — healthcare systems, devices, and
  treatment contexts vary globally; illustrations must not imply a single
  national model unless explicitly localized;
- **Support global audiences** — categories and roles remain constant across
  locales; production artwork may adapt under governance without redefining
  architecture.

Illustrations do not encode language; localization handles copy through the
platform i18n architecture.

## Theme Compatibility

Illustration roles must function across all governed theme contexts defined in
[16 Color System Specification](16-color-system-specification.md):

- **Light** — default ambient surfaces;
- **Dark** — reduced glare for extended use;
- **High Contrast** — strengthened figure-ground for low vision;
- **AMOLED** — power-efficient dark surfaces without loss of illustration role
  meaning;
- **Print** — reports and exports with stable semantic meaning in monochrome.

Theme changes remap color and surface relationships; illustration **categories**
and **roles** remain constant. Production may adjust illustration treatment per
theme only through governed tokens — not ad-hoc component overrides.

## Design Token Integration

Illustration integrates with the token architecture in
[11 Design Tokens Specification](11-design-tokens-specification.md).

```text
Illustration Role
    ↓
Semantic Illustration Token
    ↓
Component Illustration Token
    ↓
Implementation
```

Principles:

- Illustration System defines **what** roles and categories exist and **how** they
  relate;
- foundation tokens hold raw illustration asset references assigned to roles in
  production;
- semantic tokens express Illustration System roles in product language;
- component tokens alias semantic tokens for specific UI parts;
- implementation code consumes component tokens only;
- no component, framework utility, or platform API may introduce parallel
  illustration identities outside this chain.

This document does not define token names, JSON structure, image formats, or
platform export formats.

## Future Evolution

The Illustration System is a living specification. It evolves through governed
architectural review without breaking role semantics or accessibility contracts.

### Evolution principles

- role and category meaning is stable; visual style and asset libraries may change
  within a major version when migration guidance is provided;
- new categories and roles require architectural approval before production use;
- medical responsibility and non-illustration-only-meaning rules are
  non-negotiable across evolution cycles;
- evolution strengthens — not fragments — cross-platform illustration consistency.

### Backward compatibility

| Change type                        | Compatibility expectation                          |
| ---------------------------------- | -------------------------------------------------- |
| Clarifications to role definitions | Backward-compatible within the same major version  |
| New theme illustration treatment   | Additive when roles unchanged                      |
| New illustration category or role  | Additive; requires documentation and token mapping |
| Renamed or merged categories/roles | Major version; migration required                  |
| Removed category or role           | Major version; deprecation process required        |

### New illustration categories

Additional categories may be introduced for new product domains (e.g., clinical
reports, caregiver tools). Each new category must include accessibility review
and internationalization assessment before approval.

### Platform evolution

Watch, TV, automotive, and voice-adjunct interfaces adopt existing category and
role architecture before introducing platform-specific delivery rules.

### Governance

Evolution follows [Governance](#governance). Breaking changes require explicit
architectural approval and DU review.

### Periodic review

Illustration System architecture undergoes periodic review at least once per major
product phase or annually, whichever comes first.

Periodic review evaluates:

- alignment with documents `00`–`18`;
- effectiveness of category architecture and medical responsibility rules;
- theme coverage and accessibility outcomes;
- gaps revealed by DU Reviews, audits, or platform expansion;
- need for minor clarifications or major version increments.

### Versioning

| Version  | Meaning                                                             |
| -------- | ------------------------------------------------------------------- |
| **v1.0** | First Feature Complete Illustration System architecture release     |
| **v1.x** | Backward-compatible clarifications, theme additions, or corrections |
| **v2.0** | Breaking changes to categories, roles, or semantic contracts        |

## Future Expansion

The Illustration System must extend to new product domains and platform contexts
without redefining core category architecture.

### Wearables

Compact surfaces use minimal Supportive and Informational illustration with
strict density limits. Wearable expansion must not introduce narrative scenes
that obscure critical data.

### Automotive

Driver-distraction constraints require static, simple illustration or omission on
primary driving surfaces. Automotive inherits roles without independent visual
systems.

### AI interfaces

AI assistant, insight, and automation surfaces use governed AI Assistance category
roles with explicit non-clinical-authority boundaries.

### Reports

Clinical and user-facing reports use Print-compatible illustration sparingly.
Reports must remain comprehensible in monochrome without illustration.

### Marketplace

Partner and commerce modules consume semantic and component illustration tokens
only. Marketplace expansion must not fragment cross-product visual consistency.

### Partner modules

Third-party surfaces consume governed tokens; partner-specific illustration
vocabularies require approval per
[08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Educational content

Expanded health literacy, courses, and encyclopedia modules extend Education
category architecture without creating parallel illustration systems.

### Future accessibility modes

Accessibility mode expansion extends theme and presentation behavior without
changing role meaning. New modes require DU accessibility review before approval.

Expansion into any domain above follows evolution and governance rules.
Illustration production, artwork, and style guides belong to later approved work.

## Governance

### Ownership

Illustration System architecture is owned by design system and brand governance
authority defined in
[02 Project Governance Specification](../project/02-project-governance-specification.md)
and [08 Brand Governance Specification](../brand/08-brand-governance-specification.md).

### Approval

- category and role additions, removals, or redefinitions require explicit
  architectural approval;
- production illustration set releases require approval through brand governance
  and design system governance;
- exceptions require documented approval per document `08`.

### Lifecycle

Illustration System architecture follows the governed document lifecycle in
[01 Project Development Specification](../project/01-project-development-specification.md):

Draft → Architecture Review → Repository Implementation → Validation → DU Review →
Certification → Feature Complete.

Current status: **Architecture Approved**.

### Review

- architectural changes require review against documents `00`–`18` and DU Standard
  design review criteria;
- illustration set production is validated against this specification before
  approval;
- accessibility and medical responsibility review is mandatory for any category
  or role change affecting health-critical surfaces.

### Change management

Changes to Illustration System architecture must:

- follow documents `01`–`03` governance and engineering change rules;
- remain compatible with documents `05`–`09` and `10`–`18`;
- not introduce artwork, colors, style guides, or implementation exports in this
  specification;
- receive explicit architectural approval before implementation.

### Versioning

Version semantics are defined in [Future Evolution](#future-evolution). Production
illustration sets carry their own asset versioning governed by document `08`.

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
- [18 Iconography System Specification](18-iconography-system-specification.md)

## Success Criteria

Illustration System architecture is successful when:

- purpose, objectives, and illustration philosophy are documented;
- illustration architecture covers semantic, information, emotional, onboarding,
  educational, and empty-state support without implementation;
- illustration categories (Empty States, Onboarding, Education, AI Assistance,
  Marketplace, Success, Error Recovery, Maintenance, Achievements, Community)
  are defined without artwork;
- illustration roles (Informational, Educational, Emotional, Supportive, Decorative,
  Contextual) are architecturally distinct;
- communication principles and information hierarchy are documented;
- accessibility requirements include WCAG, reduced vision, and prohibition of
  illustration-only critical information;
- internationalization avoids culture-specific symbolism and stereotypes;
- theme compatibility covers Light, Dark, High Contrast, AMOLED, and Print;
- illustration-to-token integration chain is explicit;
- future evolution and expansion frameworks are documented;
- governance, dependencies, and documentation navigation are complete;
- no illustrations, artwork, colors, style guides, or implementation assets are
  produced in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through ad-hoc illustration decisions.

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Illustration production, artwork, and style development belong to later approved
  work governed by this specification and document `11`.
- Illustration direction in
  [07 Brand Identity Specification](../brand/07-brand-identity-specification.md)
  and [10 Visual Design System Specification](10-visual-design-system-specification.md)
  remains authoritative for their respective scopes; this document is the
  dedicated Illustration System architecture specification.
