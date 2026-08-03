# 02. Project Governance Specification

## Purpose

Define governance rules for the Diabetes Universe project: architectural decisions,
official specifications, changes, versions, exceptions, and compliance of
implementation with approved architecture.

This document establishes how project authority, documentation priority, and
specification lifecycle are governed. It does not replace repository
implementation workflow defined in
[01 Project Development Specification](01-project-development-specification.md).

## Status

Architecture Approved

## Governance Objectives

- preserve a single authoritative project constitution and specification hierarchy;
- ensure architectural and specification changes follow an explicit, traceable
  lifecycle;
- prevent unapproved architecture drift during implementation;
- require explicit decisions and recorded exceptions instead of silent deviation;
- keep governance practical and proportionate to project scale.

## Governance Principles

### Constitution First

Project Constitution is the highest governing document. No specification,
standard, or implementation may contradict it.

### Source of Truth

Each governed topic has one authoritative document. Other documents link to it
instead of restating requirements.

### Specification First

Approved specifications precede repository implementation. Implementation must
not redefine approved architecture, structure, terminology, or responsibility.

### Explicit Decisions

Significant architectural choices require an explicit recorded decision. Silent
or implicit decisions are not valid governance outcomes.

### Traceability

Requirements, approvals, versions, exceptions, and implementation outcomes must
remain traceable through official documents and decision records.

### Pragmatic Governance

Governance rules exist to protect approved architecture and delivery quality.
Rules without concrete practical benefit are not introduced.

## Decision Authority

Decision authority follows the division established by
[01 Project Development Specification](01-project-development-specification.md).
This section does not create an alternative responsibility model.

| Authority   | Responsibility                                                                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ChatGPT** | Requirements definition; architecture draft; architecture audit; revision; architecture approval; final architecture review; Feature Complete determination                                                                                                                |
| **Cursor**  | Repository implementation within approved architecture; documentation update for the approved scope; validation; commit; push; pull request preparation; CI and preview verification; merge and branch cleanup when explicitly authorized by the active governance process |

ChatGPT owns upstream governance and architecture approval boundaries. Cursor owns
execution of approved repository work and must stop when contradictions with
approved architecture are discovered.

Cursor must not change approved document architecture, requirements, terminology,
or accepted decisions. ChatGPT must not perform repository implementation in place
of the approved implementation workflow.

## Documentation Hierarchy

When documents conflict, the higher-level document governs until a new approved
version supersedes it.

| Priority | Document                                                                            | Notes                                                                      |
| -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1        | **00 Project Constitution**                                                         | Highest authority; not yet published in this repository                    |
| 2        | **02 Project Governance Specification**                                             | This document                                                              |
| 3        | [01 Project Development Specification](01-project-development-specification.md)     | Feature Complete                                                           |
| 4        | **03 Engineering Standards Specification**                                          | Future document in the approved sequence; format not defined here          |
| 5        | [Development Standard](development-standard.md)                                     | Linked standard under document 01                                          |
| 6        | [Documentation Standard](documentation-standard.md)                                 | Linked standard under document 01                                          |
| 7        | [Project Rules](project-rules.md)                                                   | Mandatory project constraints                                              |
| 8        | Architecture Decision Records in `docs/adr/`                                        | Recorded architectural decisions                                           |
| 9        | Architecture, specifications, UX/UI, design system, data, and engineering documents | Domain-specific authoritative documents within their scope                 |
| 10       | Guides such as Product Bible and Developer Bible                                    | Supporting guidance until superseded by Feature Complete project documents |

Lower-priority documents must not override higher-priority documents.

## Change Management

An approved document may change only through the full lifecycle below.

### Upstream governance

1. **Requirements**
2. **Architecture Draft**
3. **Architecture Audit**
4. **Revision**
5. **Architecture Approval**

### Repository implementation

6. **Create Feature Branch**
7. **Repository Implementation**
8. **Documentation Update**
9. **Validation**
10. **Commit**
11. **Push**
12. **Pull Request**
13. **Continuous Integration**
14. **Preview**
15. **Final Review**
16. **Merge**
17. **Branch Cleanup**
18. **Main Validation**

Repository implementation steps 6 through 18 are executed according to
[01 Project Development Specification](01-project-development-specification.md).
This document does not restate Git workflow, CI/CD, or validation command
details.

### Completion

19. **Feature Complete**

A document becomes Feature Complete only after the full lifecycle, including Final
Architecture Review, is satisfied.

If an architectural problem is discovered during implementation, work must stop,
status must return to **Blocked**, and the issue must be reported. Do not repair
approved architecture independently.

## Versioning Policy

### Statuses

| Status                    | Meaning                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Draft**                 | Content is being prepared and is not authoritative                                                      |
| **Review**                | Content is under review and is not yet architecture-approved                                            |
| **Architecture Approved** | Structure, requirements, terminology, and decisions are approved; repository implementation may proceed |
| **Feature Complete**      | Approved content is implemented, validated, merged, and navigation is updated                           |
| **Superseded**            | Replaced by a newer approved version                                                                    |
| **Archived**              | Retained for history only; not active governance                                                        |

### Version numbers

| Version  | Meaning                                           |
| -------- | ------------------------------------------------- |
| **v0.x** | Development versions before first formal approval |
| **v1.0** | First approved version                            |
| **v1.x** | Backward-compatible clarifications                |
| **v2.0** | Architectural or otherwise incompatible changes   |

Status and version must be visible in the governed document and reflected in
project navigation when the document becomes Feature Complete.

## Architecture Decision Log

Significant architectural decisions must be registered in the official
Architecture Decision Log.

Registration is mandatory when a decision affects:

- system boundaries or layer ownership;
- platform contracts or infrastructure placement;
- cross-cutting policies with long-term maintenance impact;
- approved specification structure or governance boundaries.

This document does not define ADR record format. ADR format will be established in
**03 Engineering Standards Specification**.

Existing ADRs in `docs/adr/` remain authoritative decision records until
superseded.

## Exception Management

Any approved exception must include:

- **reason** — why the exception is required;
- **scope** — what work, modules, or documents it covers;
- **risk assessment** — impact of allowing the exception;
- **owner** — accountable approver or maintainer;
- **expiry** — time limit for the exception;
- **remediation plan** — how the exception will be removed or replaced.

Permanent unmanaged exceptions are prohibited.

Exceptions must be recorded through an approved project record such as an ADR,
specification note, or changelog entry with explicit approval. Silent exceptions
are not allowed.

See [Project Rules](project-rules.md) for mandatory exception constraints.

## Compliance

Implementation must comply with all governing documents that have **Feature
Complete** status.

Non-compliance blocks task completion unless an officially approved exception
exists.

Compliance checks include:

- no contradiction with Project Constitution when it becomes authoritative in the
  repository;
- adherence to this governance specification;
- adherence to Feature Complete project standards and applicable ADRs;
- no normative dependency on documents that are not Feature Complete.

## Specification Lifecycle

### One Active Document Rule

Only one active authoritative version of a numbered project specification may
govern implementation at a time.

### One Active Revision Rule

Only one active revision of a governed document may be in repository
implementation at a time.

### Immutable Milestone Rule

After Architecture Approval, only technical changes that do not alter
architecture, document structure, requirements, terminology, or accepted
decisions are permitted without a new approval cycle.

### Source of Truth Rule

Each governed topic must have one authoritative source. Summaries and navigation
entries link to that source instead of copying normative content.

### Dependency Rule

A document may not normatively depend on an incomplete specification. Upstream
dependencies must reach Feature Complete before downstream documents can become
Feature Complete.

Document `01` is Feature Complete. Document `02` may depend on document `01`.
Document `03` and later documents must follow the approved sequence.

## Governance Success Criteria

Governance is successful when:

- documentation hierarchy is explicit and applied during conflict resolution;
- approved changes follow the full lifecycle without skipped approval steps;
- significant architectural decisions are registered;
- exceptions are explicit, time-bound, owned, and remediated;
- implementation complies with Feature Complete governing documents;
- repository work stops and reports **Blocked** when architectural contradiction
  is found;
- Cursor executes only approved repository work;
- ChatGPT retains architecture approval and Feature Complete authority.

## Dependencies

- [01 Project Development Specification](01-project-development-specification.md)
- [Documentation Standard](documentation-standard.md)
- [Project Rules](project-rules.md)
- [ADR Index](../adr/index.md)

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Git workflow, CI/CD, quality gates, and repository validation commands remain
  defined only in
  [01 Project Development Specification](01-project-development-specification.md)
  and [Development Standard](development-standard.md).
- Engineering standards and ADR format are reserved for
  **03 Engineering Standards Specification**.
