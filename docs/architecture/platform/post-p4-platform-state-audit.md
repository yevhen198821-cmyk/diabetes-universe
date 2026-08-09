# Post-P4 Platform State Audit

## Status

Complete — 2026-08-09

## Purpose

Establish the factual platform state after P4 Durable Local Persistence and determine the next architecture wave without prematurely introducing backend, sync, or authentication implementation.

## Repository Baseline

Audit baseline:

- `main`: `45d11558d139f2e3530e31774be2b19cf31431af`
- P3 Semantic Timeline Event Model: Feature Complete
- P4 Durable Local Persistence: Feature Complete for the approved Web scope
- Web Timeline persistence: IndexedDB behind `TimelineRepository`
- Playwright E2E: mandatory CI gate with retained failure diagnostics
- open pull requests at audit start: none

## Current Platform Guarantees

The platform now has the following stable foundations:

- `SemanticTimelineEvent` is the canonical Timeline event model;
- presentation/localization is separated from domain data;
- Web persistence is durable and platform-specific behind a repository boundary;
- medical events survive reload/restart in the same browser profile;
- first-run bootstrap is deterministic and does not reseed intentionally emptied durable history;
- corrupt persisted rows are durably quarantined;
- routine Timeline/product reads are bounded;
- the default Web runtime fails closed when durable storage is unavailable;
- IndexedDB is not exposed to React/product components;
- local storage schema versioning is distinct from semantic event schema versioning.

## Explicitly Missing Foundations

The following are not implemented and must not be inferred from P4:

- account identity;
- authentication;
- authorization;
- server-side ownership;
- account/session lifecycle;
- recovery flows;
- consent/privacy-account controls;
- backend data persistence;
- cloud backup;
- API contracts;
- outbox/sync;
- conflict resolution;
- server revisions/tombstones;
- cross-device continuity;
- caregiver/HCP delegation;
- production audit authority.

## Key Architectural Tension

ADR-0014 defines the long-term local-first direction and requires future server authority for authentication, authorization, ownership, revisions, audit, retention, and recovery. It also identifies `ownerId` or equivalent as part of the target synced-event lifecycle.

P4 correctly did **not** retrofit those future sync/account fields into `SemanticTimelineEvent` or IndexedDB merely to appear "sync ready". This preserved the semantic Timeline model and prevented accidental coupling between local persistence and an undefined account/sync protocol.

The next wave therefore needs to define identity and ownership semantics before Backend/API/Sync can safely assign medical data to accounts.

## Options Considered

### Option A — Backend architecture next

Rejected as the immediate next wave.

A backend created before identity/ownership semantics would have to invent account keys, tenancy boundaries, authorization rules, session assumptions, deletion semantics, and ownership migration behavior inside database/API implementation.

This would create architecture debt at the most security-sensitive boundary.

### Option B — Authentication implementation next

Rejected as the immediate next wave.

Adding a login provider first would answer "how a user signs in" before answering:

- what a Diabetes Universe account is;
- how authentication identity maps to product identity;
- who owns locally created medical data;
- how anonymous/local data becomes account-owned data;
- what account deletion means;
- how sessions/recovery/devices are modeled;
- how future caregiver/HCP access differs from ownership.

Authentication is a mechanism. Identity and ownership are the architecture.

### Option C — Sync/outbox next

Rejected.

Sync requires stable account/ownership semantics, authorization boundaries, server authority, revision policy, deletion/tombstone semantics, idempotency, and conflict policy. Those foundations are not yet approved.

### Option D — Identity, Account & Data Ownership Architecture next

Selected.

This defines the security and tenancy model needed by later authentication, backend, API, sync, recovery, privacy, and delegated-access waves while keeping current local Timeline persistence intact.

## Decision

The next architecture wave is:

**P5 — Identity, Account & Data Ownership Architecture**

P5 is an architecture/design wave first. It does not add a login screen, authentication SDK, backend database, cloud API, sync engine, or `ownerId` field to Timeline events by default.

## Why P5 Precedes Backend/Auth Implementation

P5 must answer the invariants that all later infrastructure will depend on:

1. Product account identity versus external authentication identity.
2. Stable internal account/user identifiers.
3. Medical-data ownership semantics.
4. Anonymous/local-first data before account creation.
5. Claim/adoption rules for local data when an account is created or authenticated.
6. Session and device-session model.
7. Account recovery and credential-provider independence.
8. Authorization baseline and least privilege.
9. Account deletion/export/retention boundaries.
10. Future caregiver/HCP delegation without transferring ownership.
11. Audit/security boundaries.
12. Cross-platform identity compatibility for Web, iOS, and Android.

## Invariants Entering P5

P5 must preserve:

- `SemanticTimelineEvent` as the canonical Timeline medical-event model;
- one authoritative Timeline source of truth;
- current P4 repository semantics;
- IndexedDB isolation behind the Web adapter;
- local-first operation;
- no silent data loss;
- no UI-owned persistence;
- no PHI in URLs/telemetry;
- localization/presentation separation;
- future mobile adapter independence.

## Critical Guardrail

Do **not** add `ownerId`, auth-provider IDs, email addresses, session IDs, server revisions, tombstones, or sync metadata directly to current Timeline records merely because they are likely to exist eventually.

Their correct storage location and lifecycle must be derived from the approved P5 identity/ownership model and later sync/backend ADRs.

In particular, external provider identifiers must never become canonical product identity keys.

## Recommended Platform Sequence After P5

Subject to P5 approval, the recommended sequence is:

```text
P5 Identity, Account & Data Ownership Architecture
→ Authentication / Session Implementation Design
→ Backend Data Architecture
→ API Contracts
→ Cloud Persistence
→ Offline Outbox / Sync Architecture
→ Conflict + Tombstone/Revisions Architecture
→ Security/Privacy Hardening
→ Mobile identity/persistence integration
```

The exact numbering of later waves should be assigned only after each preceding design gate is complete.

## Audit Result

```text
CURRENT STATE
P3 Feature Complete
P4 Durable Local Persistence Feature Complete

LAST COMPLETED WAVE
P4

ACTIVE WAVE
P5 Architecture Design

NEXT APPROVED IMPLEMENTATION WAVE
None yet — implementation is blocked on P5 architecture approval
```

## Governing References

- ADR-0014 — Local-First Medical Event Persistence Architecture
- ADR-0015 — Web IndexedDB Timeline Persistence Implementation
- P4 — Durable Local Persistence Architecture Design
- P4 — Durable Local Persistence Feature Complete Record
