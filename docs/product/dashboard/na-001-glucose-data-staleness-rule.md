# NA-001 — Glucose Data Staleness Rule

_Subtitle: architecture draft for a future Dashboard Next Action rule._

## Status

Architecture Draft

## Lifecycle

| Stage                 | Status      |
| --------------------- | ----------- |
| Backlog Qualification | Complete    |
| Architecture Draft    | **Current** |
| Architecture Audit    | Pending     |
| Architecture Approved | Pending     |
| Implementation        | Pending     |
| Validation            | Pending     |
| Feature Complete      | Pending     |

## Rule Identity

| Field                 | Value                       |
| --------------------- | --------------------------- |
| Rule ID               | NA-001                      |
| Rule Name             | Glucose Data Staleness Rule |
| Category              | Medical                     |
| Owner                 | Medical                     |
| Safety Classification | Informational               |
| Semantic Priority     | Informational               |
| Foundation Change     | No                          |

Safety classification and semantic priority describe the recommendation
contract. They do not define backlog priority, medical urgency, or medical
policy.

## 1. Purpose

Users may rely on Dashboard context without realizing that available glucose
information is not current enough for a contextual recommendation.

NA-001 exists to allow the Next Action Engine to communicate that glucose
context needs attention before it can support a useful contextual
recommendation.

Expected user value:

- clearer understanding of why available glucose context cannot support a
  contextual recommendation;
- a safe, understandable next step for refreshing glucose context;
- no implication that the existing data is medically safe or unsafe.

## 2. Scope

### In Scope

- architectural contract for a future contextual rule;
- permitted and prohibited inputs;
- activation and self-suppression responsibilities;
- decision output to the SD-001 engine boundary;
- explainability and safety obligations;
- failure behavior;
- architecture-level testing requirements;
- future extension boundaries.

### Out of Scope

- medical intervals;
- medical thresholds;
- an algorithm for determining staleness;
- treatment or dosing recommendations;
- diagnosis;
- evaluation of treatment effectiveness;
- medical reassurance;
- reminders;
- device behavior;
- AI behavior;
- prediction;
- personalization;
- UI or interaction design;
- localization content;
- implementation, code, pseudocode, or technical file structure;
- changes to Foundation, SD-001, EA-001, or EB-001.

## 3. Dependencies

### Inherited

- Foundation v1.0;
- [SD-001 — Next Action Engine Foundation](../../architecture/dashboard/sd-001-next-action-engine-foundation.md);
- [EA-001 — Next Action Engine Epic Architecture](../../architecture/dashboard/ea-001-next-action-engine-epic-architecture.md);
- [EB-001 — Next Action Engine Epic Backlog](eb-001-next-action-engine-backlog.md).

### Rule-specific

- approved Glucose Data Staleness Policy (future).

The future policy is the sole authority for data-staleness meaning. NA-001 must
not invent or embed policy values. Architecture approval does not approve that
future policy.

No Foundation change is required. Any future discovery that requires a
Foundation change pauses development and starts Project Governance.

## 4. Input Contract

### Permitted data

NA-001 may use only:

- normalized presence or absence of the latest available glucose record;
- record recency metadata required by the approved Glucose Data Staleness
  Policy;
- data-quality and availability state exposed through an approved source
  contract;
- the approved policy result applicable to the normalized record;
- supported action availability supplied through the SD-001 context boundary.

### Prohibited data

NA-001 must not use:

- glucose values or value ranges;
- trends or inferred glucose direction;
- treatment, medication, insulin, nutrition, or activity data;
- diagnosis or medical-record conclusions;
- reminder state;
- device state not provided by a separately approved source-domain contract;
- AI-generated or predictive data;
- personal preference data not provided by a separately approved extension;
- any unapproved source, inferred fact, or hidden input.

The rule must not mutate input data. Input provenance and availability must
remain explicit.

## 5. Activation Contract

NA-001 may become a contextual candidate only when:

- the required source contract is available;
- a glucose record and its permitted recency metadata satisfy the input
  contract;
- the approved Glucose Data Staleness Policy produces a governed result that
  requires user attention;
- the intended action is supported and available;
- no rule-level precondition requires self-suppression.

Activation is eligibility only. NA-001 does not decide whether it becomes the
visible recommendation. Final deterministic selection remains owned by the
SD-001 resolver.

This contract defines no interval, threshold, timing value, calculation, or
algorithm.

## 6. Suppression Contract

NA-001 must suppress itself when:

- required input is absent, malformed, unsupported, or outside the permitted
  input contract;
- the Glucose Data Staleness Policy is unavailable, unapproved, or does not
  produce an applicable result;
- the intended action is unavailable or unsupported;
- the recommendation cannot provide a clear, safe explanation;
- required source-domain governance is missing;
- the rule cannot satisfy its Safety Contract.

At the product-policy level, NA-001 must yield when another eligible
recommendation has a stronger governed safety or product claim under EA-001.

NA-001 supplies its candidate to the
[SD-001 resolver](../../architecture/dashboard/sd-001-next-action-engine-foundation.md).
It does not redefine engine priority ordering, tie-breaking, default behavior,
fallback behavior, or deterministic resolver mechanics.

## 7. Decision Contract

When eligible, NA-001 returns a governed contextual-rule payload to SD-001 that
contains:

- semantic recommendation identity;
- informational safety classification;
- an explanation identity for why glucose context requires attention;
- a supported action intent for refreshing glucose context;
- no localized copy.

The SD-001 engine constructs and resolves the final contextual decision. NA-001
does not return UI components, routes, localized strings, treatment instructions,
diagnoses, predictions, or implementation-specific data.

If NA-001 is not eligible, it returns no contextual candidate. SD-001 retains
ownership of compatibility/default and neutral fallback behavior.

## 8. Explainability

The recommendation must allow the user to understand:

1. why it appeared: available glucose context requires attention under an
   approved data-staleness policy;
2. what information was used: permitted record recency, availability, and
   policy-result information;
3. what action is expected: refresh glucose context through a supported product
   action.

The explanation must be understandable by non-technical users and must not
expose:

- raw rule identifiers;
- raw localization keys;
- policy internals;
- technical source details;
- unsupported medical reasoning;
- hidden or prohibited inputs.

## 9. Safety

NA-001 never:

- diagnoses a condition;
- recommends medication, insulin, dosing, or treatment;
- evaluates treatment effectiveness;
- states that glucose data or the user's condition is safe;
- states that glucose data or the user's condition is dangerous;
- interprets glucose values;
- predicts future glucose behavior;
- infers urgency from unapproved data;
- substitutes for medical advice;
- activates without its approved policy dependency.

The recommendation remains informational. Medical meaning and data-staleness
policy require separate approval outside this architecture.

## 10. Failure Behaviour

Failure behavior must be deterministic, non-throwing during normal evaluation,
and free of medical claims.

| Condition                                                  | Required behavior                                         |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| Required data is absent                                    | Suppress NA-001 and return no contextual candidate.       |
| Required data violates the input contract                  | Suppress NA-001 and return no contextual candidate.       |
| Glucose Data Staleness Policy is unavailable or unapproved | Suppress NA-001 and return no contextual candidate.       |
| Intended action is unavailable or unsupported              | Suppress NA-001 and return no broken action.              |
| Explanation cannot be resolved safely                      | Suppress NA-001; raw identifiers must not reach the user. |

After suppression, SD-001 continues its governed evaluation pipeline, including
compatibility/default and neutral fallback behavior where applicable.

## 11. Test Requirements

Future validation must verify:

- deterministic output for identical normalized inputs and policy result;
- input immutability;
- candidate production only when all Activation Contract obligations are met;
- no candidate when the approved policy does not produce an applicable result;
- self-suppression for missing, malformed, prohibited, or unsupported inputs;
- self-suppression when policy or action availability is missing;
- correct participation in SD-001 conflict resolution without redefining it;
- explanation completeness: reason, evaluated information, and expected action;
- no raw identifiers or localized copy in rule output;
- enforcement of prohibited data sources;
- enforcement of every Safety Contract prohibition;
- preservation of SD-001 compatibility/default and neutral fallback behavior;
- no medical claim during normal or failure behavior;
- accessibility and localization validation at the presentation boundary without
  placing either concern inside the rule.

These are architecture-level verification obligations, not implementation test
cases.

## 12. Future Evolution

Separately approved Feature Slices may extend the product context around NA-001
through:

- device integrations;
- reminder integration;
- AI-assisted explainability;
- personalization.

Each extension requires its own governance, dependencies, safety review, and
architecture. Future extensions must not silently broaden NA-001 inputs, embed
new policy, redefine SD-001 resolver behavior, or weaken this rule's Safety
Contract.
