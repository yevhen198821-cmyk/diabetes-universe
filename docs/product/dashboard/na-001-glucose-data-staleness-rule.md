# NA-001 — Glucose Data Staleness Rule

_Subtitle: approved architecture contract for a future Dashboard Next Action rule._

## Status

Repository Implementation

## Lifecycle

| Stage                     | Status      |
| ------------------------- | ----------- |
| Backlog Qualification     | Complete    |
| Architecture Draft        | Superseded  |
| Architecture Revision     | Complete    |
| Architecture Audit        | Complete    |
| Architecture Approved     | Complete    |
| Repository Implementation | **Current** |
| Engineering Review        | Pending     |
| Final Review              | Pending     |
| Feature Slice Complete    | Pending     |

Repository Implementation is in progress because
[GP-001 — Glucose Data Staleness Policy](../platform/gp-001-glucose-data-staleness-policy.md)
has reached Feature Slice Complete. The implementation is limited to the NA-001
contextual rule consuming the governed GP-001 Policy Result.

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

## Policy Boundary

NA-001 does not calculate, infer, or validate glucose staleness from raw
timestamps, intervals, or thresholds. The Glucose Data Staleness Policy is the
single source of truth for staleness meaning.

Governed data flow:

```text
Approved glucose source contract
  → Glucose Data Staleness Policy
  → governed policy evaluation result
  → NA-001
  → SD-001
```

NA-001 consumes only the governed policy evaluation result and permitted
supporting context. It must not re-derive staleness, embed policy values, or
substitute for policy evaluation.

## Source Boundary

NA-001 requires an approved glucose source contract before evaluation. Source
data provenance and availability must remain explicit through that contract.

NA-001 does not own source normalization, ingestion, storage, or policy
evaluation. It consumes governed outputs from the approved source and policy
layers only.

## Implementation Gate

| Gate                      | Requirement                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture approval     | May proceed before the Glucose Data Staleness Policy exists.                                                                                     |
| Repository Implementation | In progress after GP-001 reached Feature Slice Complete; implementation consumes the governed Policy contract without inventing policy behavior. |
| Policy approval           | Satisfied by GP-001 Feature Slice Complete.                                                                                                      |
| NA-001 implementation     | Limited to the contextual rule implementation; Engineering Review, Final Review, and Feature Slice Complete remain pending.                      |

## Stale Data vs Missing Data

NA-001 addresses stale glucose context only when an existing glucose record is
present. Absence of a glucose record is not a staleness condition in NA-001.

| Condition                         | NA-001 behavior                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------- |
| No glucose record                 | Not a staleness condition. NA-001 suppresses and returns no contextual candidate. |
| Glucose record present            | Eligible for policy evaluation through the approved source contract.              |
| Policy result: attention required | May activate per the Activation Contract.                                         |
| Policy result: no attention       | NA-001 suppresses and returns no contextual candidate.                            |
| Policy result: unavailable        | NA-001 suppresses and returns no contextual candidate.                            |

NA-001 must never treat missing data as stale data or imply that the user should
refresh context solely because no record exists.

Missing-data product behavior requires a separately qualified Feature Slice or
separately approved policy scope. NA-001 does not cover that case.

## Policy Result Contract

The Glucose Data Staleness Policy must expose a governed evaluation result to
NA-001. This section defines the architecture-level minimum semantic contract.
It does not define intervals, thresholds, algorithms, or implementation.

| Semantic outcome            | Meaning for NA-001                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| Attention required          | Existing glucose context requires user attention before supporting a contextual recommendation. |
| No attention required       | Existing glucose context does not require attention under the approved policy.                  |
| Unavailable / indeterminate | Policy cannot produce a governed result for the supplied record.                                |

Every policy result must also carry:

- policy version or identity for audit and provenance;
- explanation or provenance sufficient for NA-001 explainability obligations
  without exposing policy internals to the user.

NA-001 must treat policy results outside this contract as unavailable and
suppress itself.

## 1. Purpose

Users may rely on Dashboard context without realizing that available glucose
information is not current enough for a contextual recommendation.

NA-001 exists to allow the Next Action Engine to communicate that existing
glucose context needs attention before it can support a useful contextual
recommendation.

Expected user value:

- clearer understanding of why existing glucose context cannot support a
  contextual recommendation;
- a safe, understandable next step for refreshing glucose context;
- no implication that the existing data is medically safe or unsafe.

## 2. Scope

### In Scope

- architectural contract for a future contextual rule;
- policy boundary and governed data flow;
- implementation gate relative to the Glucose Data Staleness Policy;
- distinction between stale data and missing data;
- policy result contract at architecture level;
- permitted and prohibited inputs;
- activation and self-suppression responsibilities;
- decision output to the SD-001 engine boundary;
- explainability and safety obligations;
- failure behavior;
- architecture-level testing requirements;
- Standard Rule Contract compliance verification;
- future extension boundaries.

### Out of Scope

- medical intervals;
- medical thresholds;
- an algorithm for determining staleness;
- timestamp-based staleness calculation inside NA-001;
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

- approved glucose source contract (future);
- [GP-001 — Glucose Data Staleness Policy](../platform/gp-001-glucose-data-staleness-policy.md)
  (Feature Slice Complete).

The future policy is the sole authority for data-staleness meaning. NA-001 must
not invent or embed policy values. Architecture approval does not approve that
future policy.

No Foundation change is required. Any future discovery that requires a
Foundation change pauses development and starts Project Governance.

## 4. Input Contract

### Permitted data

NA-001 may use only:

- confirmation that an existing glucose record is present through an approved
  source contract;
- the governed policy evaluation result from the Glucose Data Staleness Policy;
- policy version or identity and explanation provenance supplied with the policy
  result;
- supported action availability supplied through the SD-001 context boundary.

NA-001 must not read raw timestamps, recency intervals, or threshold inputs for
staleness evaluation. Those belong to the policy layer.

### Prohibited data

NA-001 must not use:

- glucose values or value ranges;
- trends or inferred glucose direction;
- raw timestamps or recency metadata for staleness calculation;
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

- the approved glucose source contract is available;
- an existing glucose record is present;
- the Glucose Data Staleness Policy produces a governed result of
  **attention required** for that record;
- the intended action is supported and available;
- no rule-level precondition requires self-suppression.

Absence of a glucose record does not satisfy activation. NA-001 must not
activate for missing data.

Activation is eligibility only. NA-001 does not decide whether it becomes the
visible recommendation. Final deterministic selection remains owned by the
SD-001 resolver.

This contract defines no interval, threshold, timing value, calculation, or
algorithm.

## 6. Suppression Contract

NA-001 must suppress itself when:

- no glucose record is present;
- required input is absent, malformed, unsupported, or outside the permitted
  input contract;
- the Glucose Data Staleness Policy is unavailable, unapproved, or does not
  produce an applicable result;
- the policy result is **no attention required**, **unavailable**, or
  **indeterminate**;
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
- an explanation identity for why existing glucose context requires attention;
- a supported action intent for refreshing glucose context;
- no localized copy.

The SD-001 engine constructs and resolves the final contextual decision. NA-001
does not return UI components, routes, localized strings, treatment instructions,
diagnoses, predictions, or implementation-specific data.

If NA-001 is not eligible, it returns no contextual candidate. SD-001 retains
ownership of compatibility/default and neutral fallback behavior.

## 8. Explainability

The recommendation must allow the user to understand:

1. why it appeared: existing glucose context requires attention under an
   approved data-staleness policy;
2. what information was used: presence of an existing glucose record and the
   governed policy evaluation result;
3. what action is expected: refresh glucose context through a supported product
   action.

The explanation must be understandable by non-technical users and must not
expose:

- raw rule identifiers;
- raw localization keys;
- policy internals, intervals, or thresholds;
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
- activates without its approved policy dependency;
- treats missing glucose data as stale data.

The recommendation remains informational. Medical meaning and data-staleness
policy require separate approval outside this architecture.

## 10. Failure Behaviour

Failure behavior must be deterministic, non-throwing during normal evaluation,
and free of medical claims.

| Condition                                                  | Required behavior                                         |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| No glucose record is present                               | Suppress NA-001 and return no contextual candidate.       |
| Required data is absent                                    | Suppress NA-001 and return no contextual candidate.       |
| Required data violates the input contract                  | Suppress NA-001 and return no contextual candidate.       |
| Glucose Data Staleness Policy is unavailable or unapproved | Suppress NA-001 and return no contextual candidate.       |
| Policy result is unavailable or indeterminate              | Suppress NA-001 and return no contextual candidate.       |
| Policy result is no attention required                     | Suppress NA-001 and return no contextual candidate.       |
| Intended action is unavailable or unsupported              | Suppress NA-001 and return no broken action.              |
| Explanation cannot be resolved safely                      | Suppress NA-001; raw identifiers must not reach the user. |

After suppression, SD-001 continues its governed evaluation pipeline, including
compatibility/default and neutral fallback behavior where applicable.

## 11. Test Requirements

Future validation must verify:

- deterministic output for identical normalized inputs and policy result;
- input immutability;
- candidate production only when an existing glucose record and an
  **attention required** policy result are present;
- no candidate when no glucose record is present;
- no candidate when the approved policy does not produce an applicable result;
- no staleness activation or messaging for missing data;
- self-suppression for missing, malformed, prohibited, or unsupported inputs;
- self-suppression when policy or action availability is missing;
- correct participation in SD-001 conflict resolution without redefining it;
- explanation completeness: reason, evaluated information, and expected action;
- no raw identifiers or localized copy in rule output;
- enforcement of prohibited data sources, including raw timestamp-based
  staleness calculation inside NA-001;
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

## 13. Standard Rule Contract Compliance

NA-001 is verified against the
[EA-001 Standard Rule Contract](../../architecture/dashboard/ea-001-next-action-engine-epic-architecture.md#7-standard-rule-contract).
This section records compliance only. It does not restate EA-001.

| EA-001 contract area      | NA-001 section          | Verified |
| ------------------------- | ----------------------- | -------- |
| 7.1 Rule Metadata         | Rule Identity           | Yes      |
| 7.2 Purpose               | §1 Purpose              | Yes      |
| 7.3 Input Contract        | §4 Input Contract       | Yes      |
| 7.4 Activation Contract   | §5 Activation Contract  | Yes      |
| 7.5 Suppression Contract  | §6 Suppression Contract | Yes      |
| 7.6 Decision Contract     | §7 Decision Contract    | Yes      |
| 7.7 Explainability        | §8 Explainability       | Yes      |
| 7.8 Safety Contract       | §9 Safety               | Yes      |
| 7.9 Dependency Contract   | §3 Dependencies         | Yes      |
| 7.10 Testing Expectations | §11 Test Requirements   | Yes      |

Additional architecture obligations beyond the generic contract:

- Policy Boundary (this document);
- Source Boundary (this document);
- Implementation Gate (this document);
- Stale Data vs Missing Data (this document);
- Policy Result Contract (this document).

## Architecture Approval

**Decision:** Architecture Approved — Repository Implementation

NA-001 is approved as the official implementation contract for a future contextual
rule once its Policy dependency is satisfied. The architecture preserves a
strict boundary: staleness meaning belongs exclusively to the Glucose Data
Staleness Policy; NA-001 maps governed policy results to a safe contextual
candidate for SD-001 without embedding medical policy, source normalization, or
resolver behavior.

Repository Implementation is in progress because GP-001 is Feature Slice
Complete. Implementation consumes the governed GP-001 contract and must not
calculate, infer, or validate staleness independently.

| Approval criterion        | Result   |
| ------------------------- | -------- |
| Policy Boundary           | Verified |
| Source Boundary           | Verified |
| Missing Data Boundary     | Verified |
| Policy Result Contract    | Verified |
| Rule Contract (EA-001 §7) | Verified |
| SD-001 Boundary           | Verified |
| Safety                    | Verified |
| Implementation Gate       | Verified |
| Foundation Impact         | None     |
