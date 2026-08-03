# Documentation Standard

## Status

Approved — part of [01 Project Development Specification](01-project-development-specification.md)

## Scope

This standard defines how Diabetes Universe documentation is structured, written,
reviewed, and maintained in the repository.

It applies to all files under `docs/` unless a document explicitly states a
different approved status.

## Structure

Official documentation is organized by concern:

| Section               | Path                                                             | Purpose                                           |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Project               | `docs/project/`                                                  | Direction, standards, rules, terminology          |
| Architecture          | `docs/architecture/`                                             | System responsibilities, boundaries, dependencies |
| Specifications        | `docs/specs/`                                                    | Functional behavior and acceptance criteria       |
| UX / UI               | `docs/ux/`, `docs/ui/`                                           | Experience and interface documentation            |
| Design System         | `docs/design-system/`                                            | Reusable visual and interaction standards         |
| Data / API / Database | `docs/data/`, `docs/api/`, `docs/database/`                      | Information and integration concerns              |
| Engineering           | `docs/development/`, `docs/testing/`                             | Engineering practices and quality guidance        |
| ADR                   | `docs/adr/`                                                      | Architecture decisions                            |
| Guides                | `docs/product-bible/`, `docs/developer-bible/`, `docs/ui-bible/` | Existing approved guides                          |

Use the narrowest applicable section. Link related documents instead of
duplicating content.

Primary navigation lives in [Documentation Index](../INDEX.md).

## Writing Guidelines

Approved project and architecture documents use a consistent section model:

- **Purpose** — why the document exists;
- **Status** — draft, approved, deprecated, or Feature Complete state;
- **Responsibility / Scope** — what the document owns and what it excludes;
- **Dependencies** — links to authoritative upstream documents;
- **Notes** — constraints, out-of-scope items, and follow-up references.

Additional sections are allowed when they are part of the approved document
architecture for that document.

Writing rules:

- prefer precise, testable statements over implementation guesses;
- keep one authoritative source per concept;
- use relative links between documents in `docs/`;
- record completion and merge metadata in [Changelog](../CHANGELOG.md);
- do not place source code, generated artifacts, or transient task notes in
  `docs/`.

## Review

Documentation review confirms:

- placement in the correct section;
- valid links and navigation updates;
- no contradiction with approved architecture or ADRs;
- no duplication of content that already has an authoritative home.

If structure improvements are needed, report them in the implementation
summary. Do not change approved document architecture independently.

## Maintenance

When a document reaches Feature Complete:

1. update [Documentation Index](../INDEX.md);
2. add a changelog entry with date, completed scope, and explicit out-of-scope
   items;
3. update related README files and cross-links;
4. verify links and formatting before merge.

Deprecated documents must keep a visible status and point to the replacement
authoritative document.

## Notes

- [01 Project Development Specification](01-project-development-specification.md)
  defines the repository implementation workflow for approved documents.
- [Glossary](glossary.md) is the canonical place for shared terminology that
  needs a short definition with a link to the authoritative document.
