# Project Rules

## Scope

Mandatory constraints for Diabetes Universe development work. These rules apply to
documentation, architecture, and code changes unless an approved exception is
recorded.

## Rules

1. **Architecture lock** — do not change approved document architecture or
   approved requirements without architecture review.
2. **No independent architecture decisions** — if contradictions are found, stop
   and report them instead of resolving them locally.
3. **Approved sequence** — implement documents in the approved development
   sequence. Do not start the next document before the current one is Feature
   Complete.
4. **Single source of truth** — link to authoritative documents instead of
   duplicating content.
5. **Explicit ownership** — place changes in the workspace or documentation
   section that owns the concern.
6. **Validated infrastructure only** — do not add backend, database,
   authentication, marketplace, AI, or other infrastructure without an approved
   requirement and ADR when architecture is affected.
7. **Medical safety** — product behavior must not imply diagnosis or treatment
   without required clinical, legal, and regulatory review.
8. **Quality before merge** — required formatting, lint, typecheck, and build
   checks must pass before merge.
9. **Clean completion** — after merge, synchronize `main`, keep the working tree
   clean, and remove temporary branches.

## Exceptions

Exceptions require explicit architecture or product review and must be recorded
in the appropriate ADR, specification, or changelog entry. Silent exceptions are
not allowed.

Required exception fields and prohibition of permanent unmanaged exceptions are
defined in
[02 Project Governance Specification](02-project-governance-specification.md).

## Review

Reviewers reject changes that:

- alter approved architecture without review;
- skip required documentation or navigation updates;
- introduce duplication or broken links;
- expand scope into the next document in the approved sequence.

See [01 Project Development Specification](01-project-development-specification.md)
for the full repository implementation and Feature Complete process.

Governance hierarchy, change lifecycle, and exception requirements are defined
in [02 Project Governance Specification](02-project-governance-specification.md).
