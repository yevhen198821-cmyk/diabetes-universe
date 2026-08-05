# EB-001 — Next Action Engine Epic Backlog v1.0

_Subtitle: product backlog foundation for future Dashboard Next Action Engine
Feature Slices._

## Status

Backlog Foundation Revision — Ready for Re-Review

## Lifecycle

| Stage                       | Status            |
| --------------------------- | ----------------- |
| Backlog Foundation          | Complete          |
| Backlog Foundation Revision | **Current**       |
| Backlog Foundation Review   | Pending re-review |
| Backlog Foundation Approved | Pending           |
| Operational Status — Living | Pending approval  |

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
the Epic product architecture; EB-001 is the living backlog that evolves as
future Feature Slices are added, removed, split, merged, deferred, or
reprioritized.

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
Categories
  ↓
Feature Slice
```

The Epic is the Dashboard Next Action Engine. Categories group product intent.
Feature Slices are the independently reviewed and implemented units that may
eventually add rules, supporting policy, or product behavior.

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

| Field                      | Requirement                                  |
| -------------------------- | -------------------------------------------- |
| ID                         | Stable backlog identifier, usually `NA-xxx`. |
| Name                       | Short product name.                          |
| Category                   | One stable product category.                 |
| Goal                       | Product outcome, not implementation detail.  |
| Priority                   | High, Medium, or Low.                        |
| Status                     | One official backlog status.                 |
| Item-specific Dependencies | Explicit item-specific dependencies, if any. |
| Foundation Change Required | `Yes` or `No`.                               |
| Owner                      | Exactly one owner.                           |
| Notes                      | Planning notes only; no specifications.      |

The Governed Backlog Item contract is for backlog management only. It must not
contain rule logic, technical design, UI design, clinical thresholds, AI
algorithms, or acceptance criteria.

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

- adding Feature Slices;
- removing Feature Slices;
- splitting Feature Slices;
- merging Feature Slices;
- reprioritizing Feature Slices;
- changing status;
- changing owner;
- changing dependencies.

These operations must never require changing EA-001 unless the product model,
taxonomy, lifecycle, ownership model, or safety/explainability architecture
itself changes.

## 13. Initial Candidate Registry

Initial entries are names only. Every listed entry in this section is classified
as a Candidate Registry Entry with `Status: Proposed`.

These entries are not specifications, are not Approved Backlog Items, and do not
approve implementation.

### Medical

- NA-001 Glucose Staleness Rule
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

## 14. Future Expansion

New categories can be introduced when existing categories cannot represent a new
stable product intent. Category expansion requires governance review because
categories structure ownership, planning, and long-term backlog management.

Adding individual backlog items does not require new category approval when the
item fits an existing category. Adding a new category must not introduce
implementation, medical policy, AI logic, or roadmap ordering.

## 15. Success Criteria

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
- initial candidate entries are organized by category as names only;
- future backlog evolution does not require changing EA-001;
- EB-001 is ready for Backlog Foundation re-review.

## 16. Living Document Lifecycle

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

After Backlog Foundation Approved, adding candidate entries, qualifying items,
changing priority, deferring items, rejecting items, or reprioritizing items does
not require re-approving EB-001.

Structural changes to the backlog contracts, status model, governance rules,
dependency model, or category model require review before they become the new
operating model.
