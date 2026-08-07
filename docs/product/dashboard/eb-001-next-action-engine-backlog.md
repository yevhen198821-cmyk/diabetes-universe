# EB-001 — Next Action Engine Epic Backlog v1.0

_Subtitle: product backlog foundation for future Dashboard Next Action Engine
Feature Slices._

## Status

Backlog Foundation Complete — Operational Status: Living

## Lifecycle

| Stage                       | Status      |
| --------------------------- | ----------- |
| Backlog Foundation          | Complete    |
| Backlog Foundation Revision | Complete    |
| Backlog Foundation Review   | Complete    |
| Backlog Foundation Approved | Complete    |
| Operational Status — Living | **Current** |

## Dependencies

EB-001 depends on, but does not redefine:

- Foundation v1.0 project standards;
- [Product Architecture Specification](../../project/04-product-architecture-specification.md);
- Product Evolution guidance in the [Project Roadmap](../../project/roadmap.md);
- [Dashboard Overview](../../architecture/dashboard/overview.md);
- [Dashboard Next Action](../../architecture/dashboard/next-action.md);
- [SD-001 — Next Action Engine Foundation](../../architecture/dashboard/sd-001-next-action-engine-foundation.md);
- [EA-001 — Next Action Engine Epic Architecture](../../architecture/dashboard/ea-001-next-action-engine-epic-architecture.md).

## 1. Purpose

The Next Action Engine Epic Backlog exists to organize future Dashboard Next
Action Feature Slices in one product-management source.

EB-001 is the single planning source for the Next Action Engine Epic. It records
candidate slice names, governed backlog items, planning status, ownership,
dependencies, and Foundation impact decisions. It does not define architecture,
implementation, rule behavior, UI behavior, medical policy, or delivery order.

Implementation priorities may change without modifying EA-001. EA-001 remains
the Epic product architecture; EB-001 is the living backlog whose candidate
entries and governed backlog items evolve under the approved backlog management
model.

## 2. Relationship to Architecture

EB-001 distinguishes planning from architecture:

| Artifact   | Responsibility                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Foundation | Project-wide standards, governance, quality, and baseline constraints.                                             |
| SD-001     | Completed technical engine foundation and deterministic evaluation boundary.                                       |
| EA-001     | Approved Epic product architecture for rule taxonomy, lifecycle, ownership, safety, and explainability.            |
| EB-001     | Product backlog and planning source for candidate entries and governed future Next Action Feature Slices.          |
| NA-xxx     | Individual future Feature Slices that specify and implement one backlog item or a governed group of related items. |

EB-001 does not define architecture. Architecture changes belong in EA-001 or a
separately approved architecture artifact. Technical engine changes belong in a
separately governed implementation slice.

## 3. Epic Structure

The planning hierarchy is:

```text
Epic
  ↓
Category
  ↓
Candidate Registry Entry
  ↓
Backlog Qualification
  ↓
Governed Backlog Item
  ↓
Feature Slice
  ↓
Project Development Lifecycle
  ↓
Feature Complete
```

The Epic is the Dashboard Next Action Engine. Categories group product intent.
Candidate Registry Entries record possible future initiatives. Backlog
Qualification determines whether a candidate can become a Governed Backlog Item.
A Governed Backlog Item becomes an active Feature Slice only when development is
formally initiated. Feature Slices then follow the Project Development Lifecycle
until Feature Complete or another governed outcome.

## 4. Categories

Stable product categories:

| Category | Planning meaning                                                                  |
| -------- | --------------------------------------------------------------------------------- |
| Medical  | Health-context candidates requiring medical governance before implementation.     |
| Reminder | User-plan, schedule, or follow-up candidates.                                     |
| Workflow | App workflow, logging continuity, or completion candidates.                       |
| Device   | Connected device, sensor, import, or sync-source candidates.                      |
| AI       | AI explanation, confidence, recommendation, or insight candidates.                |
| UX       | Preference, suppression, snooze, and interaction-quality candidates.              |
| Platform | Diagnostics, performance, telemetry, account, permission, and runtime candidates. |

Categories are stable. Individual rules are not. Backlog items may be added,
removed, split, merged, deferred, or rejected without changing the category
model.

## 5. Planning Record Contracts

EB-001 separates possible future initiatives from governed backlog items.

### Candidate Registry Entry

A Candidate Registry Entry records a possible future initiative. It is not
approved for planning or development and cannot enter the Project Development
Lifecycle.

Minimum required fields:

| Field    | Requirement                                    |
| -------- | ---------------------------------------------- |
| ID       | Stable candidate identifier, usually `NA-xxx`. |
| Name     | Short product name.                            |
| Category | One stable product category.                   |
| Status   | `Proposed`.                                    |

A Candidate Registry Entry does not require Goal, Priority, Owner, Item-specific
Dependencies, Foundation Change Required, or Notes yet.

### Governed Backlog Item

Before `Proposed → Approved`, a planning record must become a Governed Backlog
Item.

Required fields:

| Field                      | Requirement                                                  |
| -------------------------- | ------------------------------------------------------------ |
| ID                         | Stable backlog identifier, usually `NA-xxx`.                 |
| Name                       | Short product name.                                          |
| Category                   | One stable product category.                                 |
| Goal                       | Product outcome, not implementation detail.                  |
| Priority                   | High, Medium, or Low.                                        |
| Status                     | One official backlog status.                                 |
| Item-specific Dependencies | Explicit item-specific dependencies, if any.                 |
| Dependency Type            | Dependency classification for each item-specific dependency. |
| Foundation Change Required | `Yes` or `No`.                                               |
| Owner                      | Exactly one owner.                                           |
| Notes                      | Planning notes only; no specifications.                      |

The Governed Backlog Item contract is for backlog management only. It must not
contain rule logic, technical design, UI design, clinical thresholds, AI
algorithms, or acceptance criteria.

Dependency Type allowed values:

| Dependency Type | Definition                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blocking        | The dependent Feature Slice cannot enter Repository Implementation until the dependency reaches Feature Slice Complete.                                                                               |
| Architectural   | The dependent Feature Slice may not pass Architecture Approval until the required dependency architecture is approved. Repository Implementation remains governed by any additional dependency types. |
| Optional        | The dependency enhances functionality but is not required.                                                                                                                                            |
| Runtime         | The dependency exists only during runtime integration.                                                                                                                                                |

If a Governed Backlog Item has multiple item-specific dependencies, each
dependency must have its own Dependency Type.

Initial usage example:

| Backlog Item | Dependency | Dependency Type |
| ------------ | ---------- | --------------- |
| NA-001       | GP-001     | Blocking        |

This example records backlog dependency classification only. It does not approve
NA-001 or GP-001 implementation.

## 6. Status Model

Official workflow:

```text
Candidate Registry Entry
  ↓
Backlog Qualification
  ↓
Approved Backlog Item
  ↓
Planned
  ↓
In Progress
  ↓
Review
  ↓
Feature Complete
```

`Backlog Qualification` verifies:

- fit with EA-001;
- no duplication;
- clear user/product goal;
- one accountable owner;
- explicit item-specific dependencies;
- Foundation-change answer;
- safety/domain review where applicable.

No Feature Slice work starts before `Approved`.

Status transition rules:

- `Proposed` belongs to Candidate Registry Entries only.
- `Approved` means a Candidate Registry Entry passed Backlog Qualification and
  became a Governed Backlog Item.
- `Deferred` is a holding state available before `In Progress`.
- `Rejected` is a terminal planning decision.
- `Feature Complete` is a terminal successful state.
- Deferred items may return only through Product Owner review.
- Rejected items are not silently reopened; a new governance decision is
  required.

`Module Feature Complete` is not a backlog item status.

## 7. Priority Model

Backlog priority is a planning label only. It is not a roadmap order, delivery
commitment, severity score, engine priority, or medical urgency.

| Priority | Meaning                                                                      |
| -------- | ---------------------------------------------------------------------------- |
| High     | Important candidate for product planning attention.                          |
| Medium   | Useful candidate with dependent policy, data, or product questions.          |
| Low      | Valid candidate that can wait until stronger evidence or dependencies exist. |

No numeric scoring. No roadmap ordering.

## 8. Ownership

Every backlog item belongs to exactly one owner.

Possible owners:

- Medical
- UX
- Platform
- AI
- Product

Cross-domain review may be required, but ownership is never shared.

## 9. Backlog Governance

Backlog governance is product-management responsibility. It does not define
workflow automation, implementation process, architecture policy, or rule
behavior.

| Decision                    | Accountable role                                                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create candidate entries    | Product owner or a delegated category owner may create Candidate Registry Entries with `Proposed` status.                                                                                             |
| Approve Proposed → Approved | Product owner approves after Backlog Qualification verifies owner, category, goal, item-specific dependencies, Foundation-change answer, duplicate status, and required domain review.                |
| Change priority             | Product owner changes priority for Governed Backlog Items with input from the item owner and relevant domain reviewers.                                                                               |
| Mark Deferred               | Product owner marks `Deferred` before `In Progress` when dependencies, evidence, or product timing are not ready.                                                                                     |
| Mark Rejected               | Product owner marks `Rejected` when the item does not fit the Epic, duplicates another item, conflicts with governance, or lacks product justification. Reopening requires a new governance decision. |
| Archive completed items     | Product owner or backlog curator archives completed items after Feature Complete evidence is linked.                                                                                                  |
| Handle duplicates           | Product owner selects one canonical candidate or item, links duplicate context into it, and marks duplicate entries `Rejected` or merged in backlog notes.                                            |

Backlog governance decisions must preserve the backlog item contract and must
not change EA-001 unless the Epic product model itself needs revision.

## 10. Dependencies

Every item inherits these dependencies:

- Foundation v1.0;
- SD-001;
- EA-001.

Inherited dependencies do not need repetition in each backlog item.

Item-specific dependencies may include:

- another Feature Slice;
- approved source-domain model;
- policy;
- integration;
- required platform capability.

Item-specific dependencies must be explicit on Governed Backlog Items. Hidden
item-specific dependencies are not allowed because they make planning,
governance, validation, and sequencing ambiguous.

## 11. Foundation Changes

Every backlog item must answer:

```text
Requires Foundation Change?
```

Allowed values:

- Yes
- No

If the value is `Yes`, development pauses and Project Governance starts. The
Foundation change must be approved before the backlog item can continue.

## 12. Evolution Rules

The backlog may evolve without changing EA-001.

Allowed backlog operations:

- adding Candidate Registry Entries;
- removing Candidate Registry Entries;
- qualifying candidates;
- splitting Governed Backlog Items;
- merging Governed Backlog Items;
- reprioritizing items;
- changing item status;
- changing item owner;
- changing item dependencies;
- changing item category.

These operations must never require changing EA-001 unless the product model,
taxonomy, lifecycle, ownership model, or safety/explainability architecture
itself changes.

## 13. Approved Cross-Domain Platform Dependencies

The Next Action Engine Epic may depend on governed platform policies that are not
Next Action rules and do not belong to the NA-xxx candidate registry.

| ID     | Name                          | Category | Status                | Relationship to Next Action                                                                                                    | Foundation Change Required | Owner    | Notes                                                                                              |
| ------ | ----------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| GP-001 | Glucose Data Staleness Policy | Platform | Approved Backlog Item | Blocking policy dependency for any future glucose-staleness consumer, including a future qualified NA-001 implementation path. | No                         | Platform | See [GP-001 — Glucose Data Staleness Policy](../platform/gp-001-glucose-data-staleness-policy.md). |

GP-001 does not select a Next Action, participate in SD-001 resolution, define
Dashboard behavior, or implement a rule. Consumers must not rederive glucose
staleness independently after GP-001 is approved.

## 14. Approved Backlog Items

Approved Backlog Items have passed Backlog Qualification and use the Governed
Backlog Item contract. They are not active Feature Slices until development is
formally initiated.

| ID     | Name                        | Category | Goal                                                          | Priority | Status                | Item-specific Dependencies                      | Foundation Change Required | Owner   | Notes                                                         |
| ------ | --------------------------- | -------- | ------------------------------------------------------------- | -------- | --------------------- | ----------------------------------------------- | -------------------------- | ------- | ------------------------------------------------------------- |
| NA-001 | Glucose Data Staleness Rule | Medical  | Clarify glucose data quality for future Next Action planning. | Medium   | Approved Backlog Item | Approved Glucose Data Staleness Policy (future) | No                         | Medical | Qualified in [NA-001](na-001-glucose-data-staleness-rule.md). |

## 15. Initial Candidate Registry

Initial entries are compact planning records. Candidate Registry Entries that
become Approved Backlog Items remain here as historical records with
`Status: Qualified`.

Proposed entries are not specifications, are not Approved Backlog Items, and do
not approve implementation.

### Medical

| Candidate | Status    | Linked Backlog Item                             |
| --------- | --------- | ----------------------------------------------- |
| NA-001    | Qualified | [NA-001](na-001-glucose-data-staleness-rule.md) |

Proposed:

- NA-002 Repeated High Glucose Rule
- NA-003 Repeated Low Glucose Rule

### Reminder

- NA-010 Active Reminder Rule
- NA-011 Missed Reminder Rule
- NA-012 Upcoming Reminder Rule

### Device

- NA-020 Device Offline Rule
- NA-021 Sensor Expiration Rule
- NA-022 Synchronization Required Rule

### Workflow

- NA-030 Continue Previous Activity
- NA-031 Missing Context Rule
- NA-032 Daily Completion Rule

### AI

- NA-040 AI Explanation
- NA-041 Confidence Indicator
- NA-042 Insight Recommendation

### UX

- NA-050 User Preference Rules
- NA-051 Recommendation Suppression
- NA-052 Recommendation Snooze

### Platform

- NA-060 Rule Diagnostics
- NA-061 Rule Performance
- NA-062 Rule Telemetry

## 16. Future Expansion

New categories can be introduced when existing categories cannot represent a new
stable product intent. Category expansion requires governance review because
categories structure ownership, planning, and long-term backlog management.

Adding individual backlog items does not require new category approval when the
item fits an existing category. Adding a new category must not introduce
implementation, medical policy, AI logic, or roadmap ordering.

## 17. Success Criteria

EB-001 is complete when:

- the Epic has one official planning source;
- categories are stable and product-level;
- candidate entries use the Candidate Registry Entry contract;
- Approved and later items use the Governed Backlog Item contract;
- item statuses are unambiguous;
- priority is planning-only and not roadmap ordering;
- ownership is singular;
- backlog governance roles are explicit;
- dependencies and Foundation impact are explicit;
- approved backlog items use the Governed Backlog Item contract;
- initial candidate entries are organized by category as names only;
- future backlog evolution does not require changing EA-001;
- EB-001 is approved as the living Epic Backlog management model.

## 17. Living Document Lifecycle

EB-001 has two kinds of lifecycle:

1. the lifecycle of this backlog management model;
2. the operating lifecycle of the backlog contents.

Backlog management model:

| Stage                       | Meaning                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Backlog Foundation          | The baseline backlog structure, categories, contracts, statuses, dependencies, and governance are drafted. |
| Backlog Foundation Review   | The backlog model is reviewed for consistency and completeness.                                            |
| Backlog Foundation Approved | The backlog management model is approved.                                                                  |
| Operational Status — Living | Backlog contents continue changing under the approved model.                                               |

Backlog Foundation Approved means the backlog management model is approved. It
does not approve every Candidate Registry Entry or Governed Backlog Item.

After Backlog Foundation Approved, adding candidate entries, qualifying
candidates, changing priority, deferring items, rejecting items, or
reprioritizing items does not require re-approving EB-001.

Structural changes to the backlog contracts, status model, governance rules,
dependency model, or category model require review before they become the new
operating model.

## Architecture Refinement

**Refinement:** Dependency Type  
**Status:** Merged into Living Backlog Model

PR #63 merged the Dependency Type architecture refinement into the EB-001 Living
Backlog Model. The Governed Backlog Item Contract now includes Dependency Type
classification for item-specific dependencies.

| Refinement area                                        | Result                                  |
| ------------------------------------------------------ | --------------------------------------- |
| Dependency Type contract                               | Merged into Living Backlog Model        |
| Blocking, Architectural, Optional, Runtime definitions | Active in Living Backlog Model          |
| NA-001 → GP-001 initial usage example (Blocking)       | Recorded as backlog classification only |

This refinement does not change EA-001 architecture, SD-001, GP-001, NA-001, or
implementation.
