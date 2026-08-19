# P11 — Offline Sync Architecture Approval Closure

## Status

**Architecture Design — Approved**

Date: 2026-08-19

## Purpose

This closure record completes the architecture/security audit for `p11-offline-sync-architecture.md` after PR #96 was merged while the source document still carried draft lifecycle wording.

This document changes lifecycle state only. It does not alter P11 architecture semantics and does not approve runtime sync implementation.

## Audit result

P11 architecture/security review passed for the approved scope.

The audit confirmed:

- local medical save requires one durable local transaction containing the semantic mutation and durable outbox intent;
- server authority remains unchanged for actor, subject, canonical resource identity, revision, lifecycle, authorization, audit, retention, and conflict acceptance;
- offline creates keep local identity only as local/source identity and receive a server-generated canonical resource ID;
- client mutation identities are durable across retry/restart and are scoped server-side;
- push batches and pull pages are bounded;
- accepted server mutations atomically create required audit, integration-outbox, sync-change, and idempotency evidence;
- pull ordering uses a monotonic subject-scoped sync sequence rather than timestamps or UUID ordering;
- client sync cursors are opaque, integrity-protected, subject/version scoped, non-authoritative, and PHI-free;
- pull checkpoints advance only after durable local application;
- pulled changes do not generate duplicate outbound mutations;
- stale revisions produce explicit conflicts and never silently overwrite medical history;
- conflict resolution and tombstone/delete convergence remain deferred to P12;
- mutation replay after ambiguous timeout cannot create duplicate accepted resources;
- expired change-feed cursors require explicit bounded rehydration rather than silent skipping;
- rehydration preserves pending local intent and unresolved conflicts;
- multi-device convergence is server-mediated only;
- local stores/outboxes are account/profile isolated;
- clients receive no medical database credentials or direct database access;
- PHI-safe transport, logging, tracing, and metrics boundaries are explicit;
- P9 integration-outbox identity is not exposed as the public client sync cursor contract;
- large histories use bounded incremental synchronization rather than full-history scans per cycle;
- protocol/version compatibility accounts for lagging mobile clients;
- production sync requires a feature gate/kill switch with fail-safe acknowledgement semantics.

## Security findings

No architecture-level blocker was found in the reviewed P11 design.

The following remain mandatory implementation gates rather than reasons to change the architecture:

1. signed sync-cursor implementation and key-management review;
2. subject-sequenced sync-ledger transaction/concurrency testing;
3. mutation idempotency and ambiguous-timeout tests;
4. account-switch/local-store isolation tests;
5. PHI-safe observability regression tests;
6. bounded rehydration/load testing for large histories;
7. production feature-gate and kill-switch validation;
8. P12 approval before delete/tombstone propagation or conflict-resolution behavior is enabled.

## Lifecycle correction

PR #96 was merged with `p11-offline-sync-architecture.md` still stating `Architecture Design — Draft` and with its approval checklist unchecked. That was a lifecycle/process defect, not an architecture semantic change.

This closure record is the authoritative lifecycle correction: **P11 Offline Sync Architecture is Approved.**

The original P11 document remains the normative architecture specification. This closure record only records the completed gate and must not be interpreted as permission to implement P12 semantics early.

## Current decision

**P11 architecture/security audit passed. P11 Offline Sync Architecture is approved as the baseline for subsequent implementation design. Production sync implementation is not yet approved. P12 Conflict / Revision / Tombstone Architecture remains the next required architecture stage before production delete propagation or conflict-resolution behavior.**
