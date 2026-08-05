# 00. Project Constitution

## Purpose

Define the highest-level purpose, principles, authority, and non-negotiable constraints of the Diabetes Universe project.

This document governs every product, brand, design, engineering, documentation, and implementation decision in the ecosystem. No lower-level specification, standard, ADR, or implementation may contradict it.

## Status

Feature Complete

## Vision

Create the most useful, reliable, and trusted international digital ecosystem for people with diabetes.

Diabetes Universe must become a daily digital companion that can serve millions of people across countries, languages, age groups, platforms, and diabetes types without changing its fundamental architecture.

## Mission

Make life with diabetes simpler, safer, and calmer through accurate, reliable, accessible, and respectful digital tools.

## Project Scope

Diabetes Universe is a long-term ecosystem rather than a single application.

The architecture must support:

- web applications;
- iOS and Android applications;
- desktop experiences;
- Dashboard and Timeline;
- analytics and reporting;
- AI-assisted services;
- education;
- marketplace capabilities;
- medical-service integrations;
- notifications and reminders;
- localization;
- public APIs and developer services;
- administrative tools;
- corporate and marketing websites;
- future products that remain consistent with this constitution.

No decision may bind the ecosystem to one country, language, age group, diabetes type, device, or product surface.

## Core Principles

### User Value First

Every decision must create clear user value or protect the safety, reliability, usability, or long-term quality of the product.

### Safety First

Medical-data confidentiality, user safety, access control, auditability, recovery, and reliable operation take priority over convenience or aesthetics.

### Simplicity Over Complexity

When two solutions satisfy the same requirement, the simpler solution is preferred.

Interfaces must be understandable without instruction. Frequent actions should require no more than three interactions when technically and clinically appropriate.

### Architecture Before Implementation

Implementation must follow approved architecture and specifications.

Temporary shortcuts that create uncontrolled technical debt are prohibited.

### Scalability by Default

Solutions must support long-term growth, international localization, multiple platforms, and millions of users without redesigning the fundamental architecture.

### One Source of Truth

Each governed topic has one authoritative source. Other documents link to it instead of duplicating normative requirements.

### Documentation Is Part of the Product

A significant task is not complete while its authoritative documentation, navigation, and change history are inconsistent with the implementation.

### AI Assists but Does Not Replace Clinical Authority

AI may analyze data, identify patterns, explain results, prepare reports, and assist users.

AI must not diagnose, prescribe treatment, modify medical records autonomously, or make clinical decisions instead of a qualified professional.

### Pragmatic Governance

Process exists only to protect and improve the product.

A new document, rule, template, or workflow step is introduced only when it materially reduces ambiguity, architectural risk, technical debt, maintenance cost, or the probability of incorrect decisions.

Process must not become a product of its own.

## Decision-Making Framework

Decisions follow this sequence when applicable:

1. define the problem and requirements;
2. design the architecture;
3. prepare the authoritative specification;
4. complete architecture review and approval;
5. implement without changing approved architecture;
6. validate engineering and documentation quality;
7. complete final review, merge, cleanup, and main validation;
8. assign Feature Complete only after the full lifecycle is complete.

The detailed lifecycle is defined in [01 Project Development Specification](01-project-development-specification.md) and governed by [02 Project Governance Specification](02-project-governance-specification.md).

## Roles and Authority

### ChatGPT — Architecture Lead

ChatGPT is responsible for:

- product strategy and architecture;
- brand architecture;
- UX and information architecture;
- design-system architecture;
- technical specifications;
- architecture review;
- quality criteria;
- architecture approval and Feature Complete decisions.

ChatGPT must not silently replace an approved decision with a new one. Architectural changes require the approved revision lifecycle.

### Cursor — Implementation Agent

Cursor is responsible for:

- implementation of approved decisions;
- repository files and structure;
- source code and SVG construction;
- documentation integration;
- validation and testing;
- Git operations;
- CI and preview verification;
- pull-request preparation;
- merge and cleanup after explicit authorization.

Cursor must stop and report a contradiction instead of changing approved architecture independently.

## Priority Hierarchy

When requirements conflict, apply the following order:

1. Safety
2. Reliability
3. Privacy and security
4. Architectural integrity
5. Simplicity
6. User experience
7. Performance
8. Scalability
9. Aesthetics

A lower-priority objective must not compromise a higher-priority one.

## Architecture Principles

- one function has one clear purpose;
- one screen has one primary task;
- one button performs one action;
- each data concern has one authoritative source;
- duplication is prohibited without explicit justification;
- explicit dependencies are preferred over hidden dependencies;
- modular composition is preferred over unnecessary coupling;
- shared contracts remain platform-agnostic;
- security, localization, accessibility, observability, backup, and recovery are architectural concerns rather than later additions;
- approved architecture must remain viable for at least five years of planned ecosystem growth.

## Quality Principles

Every approved solution must:

- correspond to an explicit requirement;
- be understandable and maintainable;
- preserve user safety and medical-data confidentiality;
- comply with applicable accessibility requirements;
- support localization and multiple platforms where relevant;
- pass required validation;
- include synchronized authoritative documentation;
- avoid uncontrolled technical debt;
- remain consistent with Feature Complete governing documents.

## Governance Principles

- this constitution has the highest authority;
- approved specifications are authoritative within their scope;
- significant decisions are explicit and traceable;
- exceptions are documented, owned, time-bounded, and remediated;
- no downstream document may become Feature Complete while normatively depending on an incomplete upstream document;
- only one active revision of a governed document is permitted;
- changes to approved architecture require a new revision lifecycle.

Detailed governance rules are defined in [02 Project Governance Specification](02-project-governance-specification.md).

## Amendment Policy

Changing this constitution requires the complete governed document lifecycle.

Every proposed amendment must include:

1. the problem being solved;
2. the reason the current constitution is insufficient;
3. impact on product, brand, UX, engineering, security, documentation, and existing decisions;
4. affected specifications and ADRs;
5. migration requirements;
6. a new document version and changelog entry.

No amendment takes effect before Architecture Approval, repository implementation, validation, merge, main validation, and Feature Complete.

When this constitution conflicts with a lower-level document, this constitution governs until an approved amendment or replacement is Feature Complete.

## Dependencies

- [01 Project Development Specification](01-project-development-specification.md)
- [02 Project Governance Specification](02-project-governance-specification.md)
- [03 Engineering Standards Specification](03-engineering-standards-specification.md)
- [Project Rules](project-rules.md)

## Notes

- This document is at **Feature Complete** status.
- Architecture Approved through the governed revision lifecycle; Final Architecture
  Review completed as part of Foundation Freeze lifecycle synchronization.
- The approved project name is **Diabetes Universe**. Alternative names and rebranding are outside the current architecture.
