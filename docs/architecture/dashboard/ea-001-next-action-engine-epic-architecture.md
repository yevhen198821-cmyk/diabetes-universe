# EA-001 — Next Action Engine Epic Architecture

_Subtitle: product architecture for the Dashboard Next Action Engine Epic._

## Status

Architecture Approved — Feature Slice Complete

## Lifecycle

| Stage                  | Status   |
| ---------------------- | -------- |
| Architecture Draft     | Complete |
| Architecture Audit     | Complete |
| Architecture Approved  | Complete |
| Epic Governance        | Complete |
| Feature Slice Complete | Complete |

## Dependencies

- [Project Constitution](../../project/00-project-constitution.md)
- [Project Development Specification](../../project/01-project-development-specification.md)
- [Project Governance Specification](../../project/02-project-governance-specification.md)
- [Engineering Standards Specification](../../project/03-engineering-standards-specification.md)
- [Product Architecture Specification](../../project/04-product-architecture-specification.md)
- [Architecture Documentation Guide](../README.md)
- [Dashboard Overview](overview.md)
- [Dashboard Next Action](next-action.md)
- [Dashboard Quick Add Integration](quick-add-integration.md)
- [Timeline Overview](../timeline/overview.md)
- [Reminders Overview](../reminders/overview.md)
- [AI Overview](../ai/overview.md)
- [SD-001 — Next Action Engine Foundation](sd-001-next-action-engine-foundation.md)
- [Design System](../../design-system/README.md)

## 1. Purpose

The Next Action Engine Epic exists to make Dashboard guidance useful,
understandable, and safe as Diabetes Universe grows beyond a single static
Dashboard action.

The Epic solves the product problem of competing user needs: clinical context,
logging workflows, reminders, platform state, connected devices, educational
content, and future AI support may all have reasons to ask for attention. The
Dashboard must not expose that complexity directly to the user. Future
contextual rules must either contribute one clear candidate when useful or
suppress themselves when no contextual recommendation should interrupt the user.
That self-suppression does not change SD-001 compatibility/default or neutral
fallback behavior.

Inside Dashboard, Next Action is the primary recommendation surface. It appears
near the top of the home screen and should answer a simple question: "What is the
one most useful thing I can do now?"

Relationship with Timeline:

- Timeline is the historical source of user-created and imported events.
- Next Action may use Timeline-derived facts when a future approved rule declares
  them as inputs.
- Next Action does not replace Timeline review, editing, audit, or event history.

Relationship with Quick Add:

- Quick Add is the primary execution surface for user-created records.
- Next Action may point to a Quick Add category when the recommended next step is
  to record something.
- Next Action does not own Quick Add forms, validation, persistence, or category
  availability.

EA-001 sits above SD-001. SD-001 defines the engine foundation, registry,
resolver, deterministic evaluation, contracts, mapper, and integration
boundaries. EA-001 defines the long-term product model that future rule slices
must follow without duplicating or changing SD-001.

## 2. Product Principles

### One recommendation at a time

The Dashboard presents at most one visible Next Action recommendation. The user
should never need to triage a list of competing Dashboard recommendations.

### Medical safety first

Recommendations must avoid diagnosis, dosing advice, treatment instruction, and
unapproved clinical thresholds unless a future rule slice has explicit medical
governance. Safety constraints override engagement, convenience, and growth
goals.

### No unnecessary interruptions

Future contextual rules should suppress themselves when a recommendation would
add noise, duplicate a recently completed action, or require unsupported context.
Absence of a contextual recommendation is an acceptable product outcome and must
not be interpreted as a change to SD-001 default or fallback behavior.

### Low cognitive load

Recommendations must be short, concrete, and easy to act on. The Dashboard
should not require users to interpret engine mechanics or multiple possible
paths.

### Recommendations must always be understandable

Users should understand why a recommendation appeared and what action is
expected. If the reason cannot be explained clearly, the rule should not be
enabled.

### No hidden reasoning

The product must not hide material rule logic behind vague wording. Future AI
rules may add generated explanation, but they must still expose governed reasons,
inputs, and limitations.

### Deterministic behavior

The same eligible facts, rule configuration, and user state must produce the
same visible recommendation. Determinism is required for trust, audit, testing,
and support.

## 3. User Experience Goals

Users should perceive Next Action as a calm, reliable assistant rather than an
alarm system or marketing surface.

Next Action should help when:

- the user can complete a simple, supported action immediately;
- the reason for the recommendation is clear;
- the recommendation reduces uncertainty or saves navigation;
- the action aligns with current Dashboard context.

Future contextual rules should stay silent when:

- evidence is incomplete, ambiguous, stale, or unsupported by an approved rule;
- the only available message would be generic noise;
- the user recently dismissed, completed, or suppressed the same recommendation;
- showing the action could imply medical safety, urgency, or advice that has not
  been governed.

Trust comes from consistent behavior, clear explanations, safe wording, and
visible connection to user-understandable facts. Predictability comes from
deterministic selection and stable category ownership. Consistency comes from
using the same presentation contract, localization behavior, and action patterns
across rule families.

## 4. Scope and Responsibilities

### Epic responsibilities

The Next Action Engine Epic owns:

- the product model for Dashboard recommendations;
- rule taxonomy and ownership expectations;
- rule lifecycle and approval gates;
- recommendation safety classes;
- explainability requirements;
- product-level conflict principles;
- cross-surface interaction boundaries for Dashboard, Timeline, Quick Add,
  Notifications, AI, and Platform;
- high-level testing expectations for future rules.

### Out-of-scope responsibilities

The Epic does not own:

- implementation mechanics already defined by SD-001;
- individual rule definitions such as NA-001 or NA-002;
- medical algorithms, glucose thresholds, dosing calculations, or treatment
  protocols;
- Quick Add form behavior or validation;
- Timeline storage, search, editing, or deletion;
- notification delivery infrastructure;
- AI model behavior or generated clinical reasoning;
- platform adapters, browser APIs, routing, or UI redesign.

### Interaction boundaries

| Surface / domain | Epic relationship                                                             |
| ---------------- | ----------------------------------------------------------------------------- |
| Dashboard        | Hosts the visible recommendation surface and owner callbacks.                 |
| Timeline         | Provides historical events only through approved rule inputs.                 |
| Quick Add        | Executes record-creation actions when a rule points to a supported category.  |
| Notifications    | May coordinate future interruption or reminder rules; not defined in EA-001.  |
| AI               | May provide future explanatory or ranking support after governed AI slices.   |
| Medical records  | May provide future structured inputs after explicit governance and consent.   |
| Platform         | Provides runtime capabilities only through approved adapters; not rule logic. |

### Source-domain governance

Future Device, Reminder, Medical records, AI, Notification, and similar
source-domain inputs require separately approved source-domain architecture
before any NA-xxx rule may consume them. Where applicable, rule contracts must
also define consent, availability, data quality, and failure behavior. EA-001
defines the product model for consuming future inputs; it does not approve those
domains as rule inputs by itself.

## 5. Rule Taxonomy

Future rules belong to a taxonomy category. Categories describe product intent,
not implementation.

| Category    | Product meaning                                                             |
| ----------- | --------------------------------------------------------------------------- |
| Medical     | Health-context recommendation governed by medical safety review.            |
| Reminder    | Time, schedule, or user-plan follow-up.                                     |
| Workflow    | App workflow completion, logging continuation, or task resumption.          |
| Platform    | Account, permission, sync, offline, or runtime capability state.            |
| Device      | Connected meter, pump, CGM, wearable, or import-source state.               |
| Educational | Learning prompt, glossary support, or non-urgent guidance.                  |
| AI          | Recommendation or explanation involving AI output or AI-assisted reasoning. |
| UX          | Usability prompt, onboarding, preference, or personalization support.       |
| System      | Service health, data integrity, or safety fallback communication.           |

EA-001 defines categories only. It does not define actual rules.

## 6. Rule Lifecycle

Every future rule follows a governed lifecycle:

```text
Draft
  ↓
Architecture
  ↓
Implementation
  ↓
Validation
  ↓
Enabled
  ↓
Deprecated
  ↓
Retired
```

| Stage          | Meaning                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Draft          | Product problem, owner, inputs, and safety class are proposed.                           |
| Architecture   | Rule contract, taxonomy, conflict behavior, explanation, and tests are approved.         |
| Implementation | Rule is added using the SD-001 engine boundary without changing the Epic model.          |
| Validation     | Determinism, safety, accessibility, localization, and interaction behavior are verified. |
| Enabled        | Rule is allowed to participate in production selection.                                  |
| Deprecated     | Rule remains supported but is no longer preferred for new behavior.                      |
| Retired        | Rule is removed or disabled with migration and documentation complete.                   |

## 7. Rule Contract

Every future rule must define the following product contract before
implementation:

| Field             | Requirement                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| Rule ID           | Stable, unique, human-readable identifier.                                             |
| Purpose           | User problem the rule solves and why Dashboard is the right surface.                   |
| Owner             | Single accountable owner: Medical, UX, Platform, AI, or Product.                       |
| Taxonomy category | One category from the Epic taxonomy.                                                   |
| Inputs            | Approved facts the rule may inspect.                                                   |
| Trigger           | Conditions that make evaluation relevant.                                              |
| Preconditions     | Required data quality, permissions, settings, and availability.                        |
| Priority          | Semantic priority and rationale.                                                       |
| Suppression       | When the rule must stay silent or back off.                                            |
| Explanation       | User-understandable reason for appearance.                                             |
| Action            | Expected user action and target surface, if any.                                       |
| Failure behavior  | Safe behavior when inputs, actions, localization, or platform support are unavailable. |
| Test matrix       | Determinism, safety, conflict, localization, accessibility, and regression cases.      |

The contract is product-level. It does not prescribe technical type shapes, file
layout, component behavior, or registry mechanics.

## 8. Conflict Resolution

Conflict resolution at the Epic level establishes product precedence. SD-001
defines the technical deterministic resolver; EA-001 defines how future rules
should choose priorities and suppression behavior.

Product rules:

- only one recommendation is visible at a time;
- a safety-governed medical recommendation may override workflow, educational,
  UX, or platform convenience recommendations when both are eligible;
- equal-category recommendations use the SD-001 engine priority model;
- rules should suppress themselves when another visible recommendation would be
  safer, clearer, or more actionable;
- recently completed, dismissed, or irrelevant recommendations should not
  immediately reappear unless explicitly governed;
- fallback and default decisions remain separate from contextual rules.

Conflict behavior must be documented in each rule contract before the rule is
enabled.

## 9. Explainability

Every recommendation must explain:

1. why it appeared;
2. what information was used;
3. what user action is expected.

Explanations must be localized, plain language, and safe. They must not expose
raw rule IDs, raw localization keys, implementation details, or unsupported
clinical claims.

AI explainability belongs to future AI rule slices. EA-001 only requires that AI
rules provide governed, testable explanations before they can be enabled.

## 10. Safety Classification

Each rule must declare a safety classification.

| Class         | Meaning                                                         | Governance expectation                                   |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Informational | Non-urgent information or neutral fallback.                     | Product and UX review.                                   |
| Reminder      | User-plan or workflow follow-up without clinical urgency.       | Product, UX, and suppression review.                     |
| Warning       | Attention needed; may involve health, device, or platform risk. | Domain owner review and explicit safety wording.         |
| Critical      | Highest urgency recommendation.                                 | Medical or platform safety governance before enablement. |

Safety classification does not define medical thresholds. No threshold, dose,
diagnosis, or treatment recommendation is introduced by EA-001.

## 11. Ownership Model

Every future rule has exactly one accountable owner.

| Owner    | Responsibility                                                            |
| -------- | ------------------------------------------------------------------------- |
| Medical  | Clinical safety, medical wording, and health-domain governance.           |
| UX       | Comprehension, interruption cost, accessibility, and interaction quality. |
| Platform | Permissions, sync, runtime, account, and capability states.               |
| AI       | AI-specific inputs, limitations, explainability, and model-risk controls. |
| Product  | User value, taxonomy fit, prioritization rationale, and rollout policy.   |

Mixed ownership is avoided. A rule may require reviewers from multiple domains,
but one owner remains accountable for lifecycle, suppression, and retirement.

## 12. Extensibility

New rules are added by creating a governed rule contract and implementing it
inside the SD-001 engine boundary. The Epic model scales by requiring stable
taxonomy, ownership, explanation, safety, and test expectations for every rule.

Categories may evolve when a new product family cannot be represented by the
existing taxonomy. Category changes require Epic architecture updates but should
not require changes to SD-001 engine mechanics.

Backward compatibility is preserved by:

- keeping stable rule IDs;
- maintaining localized explanation semantics;
- preserving user-facing action behavior unless a rule contract changes;
- documenting deprecation and retirement behavior;
- preventing default and fallback behavior from becoming contextual rules.

SD-001 remains unchanged as rules are added. Future slices plug into the
established engine architecture rather than redesigning the Epic.

## 13. Testing Requirements

Future rule slices must include tests appropriate to their safety class and
surface impact.

Architecture-level expectations:

- determinism for fixed inputs and time;
- safety classification and suppression behavior;
- explainability copy and input disclosure;
- conflict scenarios with equal and higher-priority recommendations;
- localization resolution with no raw keys visible;
- accessibility of the visible recommendation and action;
- action-target availability and fallback behavior;
- regression coverage for current insulin Quick Add parity when relevant.

Tests should prove behavior, not inflate counts. Higher safety classifications
require broader validation and stronger review evidence.

## 14. Future Evolution

The Epic evolves by adding governed rule families, expanding inputs, and refining
explanation patterns while preserving the SD-001 engine boundary. Evolution may
include richer suppression models, user preferences, device state, notification
coordination, medical-record inputs, and AI-assisted explanations.

Future changes should be additive whenever possible. When the product model
needs a new category, owner type, safety class, or explanation pattern, EA-001
must be revised before dependent rule slices rely on it.

## 15. Roadmap Directions

High-level future directions include:

- Medical rules;
- Device rules;
- Reminder rules;
- AI rules;
- Preference rules;
- Workflow rules;
- Platform state rules;
- Educational rules.

This section is intentionally not prioritized and contains no roadmap dates.
Each direction requires separately approved architecture and implementation
slices.

## 16. Success Criteria

EA-001 is successful when:

- the Epic has a documented product model independent of engine implementation;
- future rules can be proposed using a consistent taxonomy, lifecycle, and
  contract;
- product conflict and safety expectations are clear before implementation;
- SD-001 remains the technical engine boundary and does not need redesign for
  new rule families;
- Dashboard continues to show one understandable recommendation at a time;
- no future rule can bypass ownership, safety classification, explainability, or
  test expectations;
- the architecture is approved as the official product model for future NA-xxx
  Feature Slices.
