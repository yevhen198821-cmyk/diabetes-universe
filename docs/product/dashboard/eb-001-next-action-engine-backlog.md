# EB-001 — Next Action Engine Epic Backlog v1.0

_Subtitle: product backlog foundation for future Dashboard Next Action Engine
Feature Slices._

## Status

Backlog Foundation

## Lifecycle

| Stage              | Status      |
| ------------------ | ----------- |
| Backlog Foundation | **Current** |
| Backlog Review     | Pending     |
| Backlog Approved   | Pending     |

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
candidate slice names, categories, planning status, ownership, dependencies, and
Foundation impact decisions. It does not define architecture, implementation,
rule behavior, UI behavior, medical policy, or delivery order.

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
| EB-001     | Product backlog and planning source for future Next Action Feature Slices.                                         |
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

## 5. Backlog Item Contract

Every backlog item must contain:

| Field                      | Requirement                                  |
| -------------------------- | -------------------------------------------- |
| ID                         | Stable backlog identifier, usually `NA-xxx`. |
| Name                       | Short product name.                          |
| Category                   | One stable product category.                 |
| Goal                       | Product outcome, not implementation detail.  |
| Priority                   | High, Medium, or Low.                        |
| Status                     | One official backlog status.                 |
| Dependencies               | Explicit dependencies, if any.               |
| Foundation Change Required | `Yes` or `No`.                               |
| Owner                      | Exactly one owner.                           |
| Notes                      | Planning notes only; no specifications.      |

The contract is for backlog management only. It must not contain rule logic,
technical design, UI design, clinical thresholds, AI algorithms, or acceptance
criteria.

## 6. Status Model

Official workflow:

```text
Proposed
  ↓
Approved
  ↓
Planned
  ↓
In Progress
  ↓
Review
  ↓
Feature Complete
```

Optional terminal or holding statuses:

- Deferred
- Rejected

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

## 9. Dependencies

A Feature Slice may depend on:

- Foundation;
- SD-001;
- EA-001;
- another Feature Slice.

Dependencies must be explicit on every backlog item. Hidden dependencies are not
allowed because they make planning, governance, validation, and sequencing
ambiguous.

## 10. Foundation Changes

Every backlog item must answer:

```text
Requires Foundation Change?
```

Allowed values:

- Yes
- No

If the value is `Yes`, development pauses and Project Governance starts. The
Foundation change must be approved before the backlog item can continue.

## 11. Evolution Rules

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

## 12. Initial Backlog

Initial backlog entries are names only. They are not specifications and do not
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

## 13. Future Expansion

New categories can be introduced when existing categories cannot represent a new
stable product intent. Category expansion requires governance review because
categories structure ownership, planning, and long-term backlog management.

Adding individual backlog items does not require new category approval when the
item fits an existing category. Adding a new category must not introduce
implementation, medical policy, AI logic, or roadmap ordering.

## 14. Success Criteria

EB-001 is complete when:

- the Epic has one official planning source;
- categories are stable and product-level;
- every future backlog item can use the backlog item contract;
- item statuses are unambiguous;
- priority is planning-only and not roadmap ordering;
- ownership is singular;
- dependencies and Foundation impact are explicit;
- initial backlog entries are organized by category as names only;
- future backlog evolution does not require changing EA-001;
- EB-001 is ready for Backlog Foundation review.
