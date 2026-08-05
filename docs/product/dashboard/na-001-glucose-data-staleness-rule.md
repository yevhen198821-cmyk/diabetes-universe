# NA-001 — Glucose Data Staleness Rule

_Subtitle: backlog qualification for a future Dashboard Next Action rule._

## Status

Approved Backlog Item

## 1. Feature Overview

| Field            | Value                       |
| ---------------- | --------------------------- |
| Feature ID       | NA-001                      |
| Name             | Glucose Data Staleness Rule |
| Category         | Medical                     |
| Owner            | Medical                     |
| Current Status   | Approved Backlog Item       |
| Backlog Priority | Medium                      |

Planning note: priority is a backlog planning label only. It is not roadmap
ordering, medical urgency, or implementation priority.

## 2. User Problem

Users may rely on Dashboard context without noticing that glucose information is
not current enough to support a helpful Next Action prompt.

This is valuable because Dashboard guidance should be understandable, cautious,
and grounded in clearly governed data quality. A future rule may help users
notice when the Dashboard cannot confidently use glucose context, without
providing treatment advice or clinical interpretation.

No solution is defined in this qualification.

## 3. Product Goal

NA-001 should eventually provide user value by helping the Dashboard communicate
when glucose context needs attention before it can support a useful next action.

The goal is awareness and data-quality clarity, not diagnosis, prediction,
treatment, dosing, or medical reassurance.

## 4. Scope

### In Scope

- qualify NA-001 as a Medical backlog item;
- identify required policy dependency;
- define product value and user problem;
- record risks for future architecture review;
- prepare the item for an Architecture Draft stage.

### Out of Scope

- glucose thresholds;
- staleness criteria;
- medical advice;
- diagnosis;
- treatment or dosing guidance;
- reminders;
- AI behavior;
- device behavior;
- predictions;
- UI design;
- implementation;
- rule logic;
- architecture.

## 5. Dependencies

### Inherited

- Foundation v1.0;
- SD-001 — Next Action Engine Foundation;
- EA-001 — Next Action Engine Epic Architecture;
- EB-001 — Next Action Engine Epic Backlog.

### Item-specific

- approved Glucose Data Staleness Policy (future).

No additional item-specific dependencies are identified at qualification.

## 6. Foundation Change

Requires Foundation Change? **No**

Justification: NA-001 can be governed as a future Next Action backlog item using
the existing Foundation, SD-001 engine boundary, EA-001 product architecture, and
EB-001 backlog model.

## 7. Risks

### Product risks

- unclear value if the future policy does not define a user-understandable
  reason for the prompt;
- possible overlap with future device, reminder, or workflow items if boundaries
  are not defined during architecture.

### UX risks

- prompt could feel noisy if it appears when the user cannot act;
- wording could be misunderstood as reassurance or alarm.

### Safety risks

- prompt could imply medical urgency without approved policy;
- prompt could be mistaken for treatment guidance if explanation and action are
  not governed.

### Implementation risks

- future inputs may be incomplete or unavailable;
- future rule behavior may depend on source-domain policy that does not yet
  exist.

## 8. Acceptance for Architecture Draft

Architecture Draft may begin only when:

- Glucose Data Staleness Policy is approved or explicitly in scope for the
  Architecture Draft;
- product owner confirms NA-001 remains unique and non-duplicative;
- Medical owner confirms accountable ownership;
- item-specific dependencies are still explicit;
- Foundation Change Required remains answered;
- scope continues to exclude thresholds, treatment, dosing, diagnosis,
  reminders, AI, devices, predictions, UI design, implementation, and rule logic.

## 9. Qualification Decision

| Question                  | Evaluation |
| ------------------------- | ---------- |
| Unique feature?           | Yes        |
| Belongs to this Epic?     | Yes        |
| Sufficient product value? | Yes        |
| No duplication?           | Yes        |
| Foundation compatible?    | Yes        |

Decision: **Approved**

NA-001 is qualified as an Approved Backlog Item. It is ready to proceed to a
future Architecture Draft stage after its item-specific policy dependency is
available or explicitly included in that architecture work.
