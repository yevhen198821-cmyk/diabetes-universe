# 08. Brand Governance Specification

## Purpose

Define governance rules for the Diabetes Universe brand: ownership, decision
authority, change management, versioning, review and approval processes, asset
management, usage compliance, exceptions, deprecation, documentation, and audit
requirements.

This document is the authoritative brand governance specification. It governs
how brand architecture, logo architecture, and brand identity may change without
altering the content of documents `05`–`07`.

## Status

Architecture Approved

## Governance Objectives

- preserve a single authoritative brand architecture hierarchy;
- ensure brand changes follow an explicit, traceable lifecycle;
- prevent unapproved brand drift across products, materials, and documentation;
- require documented exceptions instead of silent deviation;
- keep brand governance practical and aligned with project governance;
- maintain consistency between brand assets and approved specifications.

## Brand Ownership

**ChatGPT** is the owner of brand architecture integrity for Diabetes Universe.

Brand ownership includes:

- accountability for strategic brand architecture decisions in documents `05`–`07`;
- approval of brand architecture, logo architecture, and identity changes;
- final architecture review before brand documents receive **Feature Complete**
  status;
- protection of immutable brand decisions defined in
  [05 Brand Architecture Specification](05-brand-architecture-specification.md).

**Cursor** implements approved brand documentation and repository changes within
the approved scope. Cursor must not alter approved brand architecture,
terminology, or decisions independently.

Project-wide governance roles remain defined in
[02 Project Governance Specification](../project/02-project-governance-specification.md).
This document governs brand-specific authority only.

## Decision Authority

The following changes require mandatory architectural approval before repository
implementation:

- amendments to [05 Brand Architecture Specification](05-brand-architecture-specification.md);
- amendments to [06 Logo Architecture Specification](06-logo-architecture-specification.md);
- amendments to [07 Brand Identity Specification](07-brand-identity-specification.md);
- introduction of new brand concept directions beyond the three approved in
  document `06`;
- creation of independent sub-brands;
- changes to immutable brand decisions;
- production or replacement of master brand assets (symbol, wordmark, combined
  mark);
- exceptions to prohibited brand or identity directions;
- deprecation of active brand assets in public use.

Implementation details, repository updates, and documentation integration within
an already approved scope are executed by Cursor under the active governance
process defined in document `01`.

## Brand Change Management

Any change to Brand Architecture, Logo Architecture, or Brand Identity must
follow the full approved lifecycle:

### Upstream governance

1. Requirements
2. Architecture Draft
3. Architecture Audit
4. Revision
5. Architecture Approval

### Repository implementation

6. Create Feature Branch
7. Repository Implementation
8. Documentation Update
9. Validation
10. Commit
11. Push
12. Pull Request
13. Continuous Integration
14. Preview
15. Final Architecture Review
16. Merge
17. Main Validation
18. Branch Cleanup
19. Feature Complete

Silent brand changes are prohibited. Partial lifecycle completion does not make
a brand change effective.

See [01 Project Development Specification](../project/01-project-development-specification.md)
for repository workflow details.

## Brand Versioning

Brand specifications use semantic versioning:

| Version  | Meaning                                                                | Approval required |
| -------- | ---------------------------------------------------------------------- | ----------------- |
| **v1.0** | First Feature Complete release of a brand document                     | Full lifecycle    |
| **v1.x** | Backward-compatible clarifications, corrections, or minor extensions   | Full lifecycle    |
| **v2.0** | Breaking changes to structure, terminology, decisions, or requirements | Full lifecycle    |

Only one active authoritative version of each numbered brand specification may
govern implementation at a time.

Version changes must be recorded in `docs/CHANGELOG.md` and reflected in
navigation documents.

## Review Process

Mandatory architectural audit is required before Architecture Approval of any
brand change.

Review must verify:

- no contradiction with documents `00`–`07` and Feature Complete project
  governance;
- no unapproved change to immutable brand decisions;
- traceability of requirements, decisions, and affected assets;
- accessibility, internationalization, and usage-compliance impact;
- absence of prohibited brand, logo, or identity directions;
- documentation and navigation updates for the approved scope.

Review outcomes are **Approved**, **Revision Required**, or **Blocked**.

## Approval Process

Brand changes become effective only after:

- Architecture Approval of the revised specification;
- complete repository implementation within approved scope;
- passing required validation and CI;
- Final Architecture Review;
- merge to `main`;
- main validation with a clean working tree;
- assignment of **Feature Complete** status.

Until Feature Complete is recorded, the prior approved version remains
authoritative.

## Brand Asset Management

Brand assets must be managed according to the approved hierarchy in
[07 Brand Identity Specification](07-brand-identity-specification.md):

| Asset type           | Governance rule                                                                 |
| -------------------- | ------------------------------------------------------------------------------- |
| **Logo symbol**      | Governed by document `06`; no production outside approved concept workflow      |
| **Wordmark**         | Must follow immutable name and identity rules in documents `05` and `07`        |
| **Combined mark**    | Requires approved symbol and wordmark relationship before publication           |
| **Icons**            | Must follow iconography principles in document `07` and logo architecture rules |
| **Illustrations**    | Must follow illustration principles; no one-off styles                          |
| **Photography**      | Must follow photography direction; no staged medical aesthetics                 |
| **Motion materials** | Must follow motion principles in documents `05` and `07`                        |
| **Templates**        | Must use approved assets only; no unapproved variants                           |

Master assets require explicit architectural approval before they become
authoritative. Derivative assets must not alter the master symbol architecture.

This document does not create a Brand Book or final asset files.

## Usage Compliance

All brand materials must comply with:

- [05 Brand Architecture Specification](05-brand-architecture-specification.md);
- [06 Logo Architecture Specification](06-logo-architecture-specification.md);
- [07 Brand Identity Specification](07-brand-identity-specification.md);
- future Feature Complete Brand Book and derivative specifications when approved.

Non-compliant materials must not be published, merged, or distributed. Compliance
checks apply to product UI, marketing, documentation, templates, motion, and
partner-facing materials within project scope.

## Exception Management

Any exception to brand governance rules must:

- be explicitly requested and documented;
- state the problem, scope, owner, and expiry condition;
- receive architectural approval before use;
- remain time-bounded;
- include a remediation or removal plan.

Permanent exceptions are prohibited unless approved through a full specification
revision lifecycle. Silent exceptions are not valid.

Exception requirements align with
[02 Project Governance Specification](../project/02-project-governance-specification.md).

## Deprecation Policy

Deprecated brand elements must:

- be explicitly declared in the governing specification or changelog;
- include a transition period when public or product use exists;
- name replacement assets or rules where applicable;
- be removed from authoritative navigation and templates after the transition;
- not remain in active use after Feature Complete replacement is recorded.

Retired assets must not reappear without a new approved revision lifecycle.

## Documentation Requirements

Every approved brand change must update:

- the authoritative brand specification under change;
- `docs/INDEX.md` when navigation status changes;
- `docs/CHANGELOG.md` with version, scope, and lifecycle outcome;
- linked README files when navigation requires it;
- `docs/project/glossary.md` when normative terminology changes;
- cross-links in affected documents without duplicating normative content.

A brand change is incomplete while documentation and navigation remain
inconsistent with the approved scope.

## Audit Requirements

Periodic brand audits must confirm:

- active materials align with Feature Complete brand specifications;
- no unapproved brand drift in products, documentation, or templates;
- exceptions are documented, owned, and within expiry;
- deprecated assets are not used in authoritative surfaces;
- brand hierarchy and dependencies remain consistent across documents `05`–`07`.

Audit findings that reveal architectural contradiction must be reported as
**Blocked** and remediated through the approved change lifecycle.

## Dependencies

- [00 Project Constitution](../project/00-project-constitution.md)
- [01 Project Development Specification](../project/01-project-development-specification.md)
- [02 Project Governance Specification](../project/02-project-governance-specification.md)
- [03 Engineering Standards Specification](../project/03-engineering-standards-specification.md)
- [04 Product Architecture Specification](../project/04-product-architecture-specification.md)
- [05 Brand Architecture Specification](05-brand-architecture-specification.md)
- [06 Logo Architecture Specification](06-logo-architecture-specification.md)
- [07 Brand Identity Specification](07-brand-identity-specification.md)

## Success Criteria

Brand governance is successful when:

- brand ownership and decision authority are explicit;
- change management, versioning, review, and approval processes are enforceable;
- asset management, usage compliance, exceptions, and deprecation rules are
  documented;
- documentation and audit requirements prevent uncontrolled brand drift;
- navigation reflects the brand governance entry;
- documents `05`–`07` remain unchanged except through this governance process;
- no Brand Book or document `09` work is started in this stage;
- contradictions with approved architecture are reported as **Blocked** instead
  of being resolved through independent brand governance changes.

## Notes

- This document is at **Architecture Approved** status and awaits Final
  Architecture Review before **Feature Complete** may be recorded.
- Project-wide governance lifecycle remains authoritative in document `02`.
- Brand architecture content remains authoritative in documents `05`–`07`.
