# ADR-0014 — Local-First Medical Event Persistence Architecture

## Status

Approved

## Context

Diabetes Universe currently renders a demo Timeline backed by in-memory React
state. The Timeline store initializes from demo fixtures, user-created events are
held only in the running application session, and reload persistence does not
exist.

Current state:

- Timeline is an in-memory demo implementation.
- Reload persistence is not implemented.
- Backend persistence is not implemented.
- Authentication and authorization are not implemented.
- Sync is not implemented.
- Device integrations are not implemented.
- `localStorage` is not used for medical event persistence and must not become
  the permanent medical-data architecture.

The target product must support Web, iOS, and Android; allow offline/local-first
operation; support later backend synchronization; and scale to millions of users
with journals that may contain 10k to 100k+ events per user.

This ADR defines target persistence architecture. It does not implement
Repository Foundation, durable local storage, sync, backend APIs, authentication,
device integrations, Analytics, Reports, AI analysis, caregiver access, or HCP
access.

## Decision

Diabetes Universe will use a **local-first medical event persistence
architecture with eventual backend synchronization**.

The selected direction is:

```text
Product / Application
  ↓
Timeline Repository Contract
  ↓
Platform-specific local adapter
  ↓
Persistent outbox and sync engine
  ↓
Backend synchronization
```

The following decisions are part of this ADR:

- Option C — local-first plus eventual backend sync — is the target
  architecture.
- Permanent `localStorage` persistence for medical Timeline events is rejected.
- Backend-first persistence without a local-first layer is rejected.
- Browser-only persistence architecture is rejected.
- UI must not know whether storage is IndexedDB-class, SQLite/native-class, or
  backend-backed.
- Web local persistence must use an IndexedDB-class adapter or equivalent
  durable browser database abstraction.
- Mobile local persistence must use a SQLite/native-class adapter or equivalent
  durable native database abstraction.
- No specific third-party storage, sync, backend, authentication, or encryption
  vendor is selected by this ADR.

## Canonical Timeline Ownership

Timeline is the owner of the canonical medical event history.

Dashboard, Analytics, Reports, AI, Next Action, caregiver views, HCP views, and
other product surfaces are consumers, projections, or read models over Timeline
history. They must not create independent medical-history copies with separate
source-of-truth semantics.

Allowed consumers may maintain derived projections, caches, or summaries only
when those artifacts are explicitly subordinate to canonical Timeline event
records and can be rebuilt or reconciled from Timeline history.

## Canonical Semantic Event Direction

Persisted Timeline events must store semantic medical data rather than
locale-specific presentation strings.

The current demo shape stores fields such as `title`, `value`, and `unit` as
display-oriented strings. That shape is not the target persistence model.

Target direction:

- event kind is canonical;
- category-specific payloads are typed;
- numeric medical values are stored as structured values plus canonical units;
- free text remains explicit user-authored content;
- locale-specific titles, formatted values, labels, and unit display strings are
  derived by presentation mappers;
- every persisted event carries a schema version;
- schema migrations are explicit.

This ADR does not approve final TypeScript interfaces. Final API and type design
belongs to a later Repository/Foundation implementation design.

Category-specific payloads must be able to represent at least:

- glucose measurement semantics;
- insulin dose semantics;
- nutrition/carbohydrate semantics;
- medication dose semantics;
- activity duration/type semantics;
- note text semantics.

## Identity and Lifecycle

Canonical Timeline events require stable identity and lifecycle metadata.

Target event records must support:

- stable client-generated public event ID;
- owner/user identity (`ownerId` or equivalent);
- occurrence time (`occurredAt`) as the semantic medical event time;
- lifecycle timestamps for creation and update;
- revision or version metadata;
- source and provenance metadata;
- schema version;
- deletion/tombstone semantics;
- sync metadata.

Client-generated public event IDs allow offline creation and later idempotent
sync. The backend may keep internal database identifiers, but the public event ID
must remain stable across local storage, sync retries, and devices.

Deletion must be represented as a tombstone for sync purposes. Immediate hard
delete is not the default target behavior for synced medical events because
deleted records can otherwise reappear from another device or retry queue.

## Repository Boundary

Application code must access Timeline history through a Timeline Repository
Contract. UI components must not directly call IndexedDB, SQLite, native storage,
or backend APIs.

Target layering:

```text
Product / Application
  ↓
Timeline Repository Contract
  ↓
Platform-specific local adapter
    - Web: IndexedDB-class adapter
    - Mobile: SQLite/native-class adapter
```

The repository contract must support the product needs represented by:

- lookup by identity;
- bounded queries;
- creation;
- update;
- deletion/tombstone mutation.

This ADR does not approve exact method names, TypeScript signatures, endpoint
names, or storage library APIs. Those details require a separate implementation
design.

Repository operations must be revision-aware, pagination-aware, and compatible
with future sync metadata.

## Local-First Write Invariant

After durable persistence exists, a user record must not be considered
successfully saved merely because it entered React state.

The target write invariant is:

```text
User action
  → validated semantic mutation
  → durable local transaction
  → immediate local UI state
  → persistent outbox
  → sync attempt
  → server acknowledgement
```

Local UI may reflect pending records immediately after the durable local
transaction succeeds. If durable local write fails, the UI must report failure
instead of treating the entry as saved.

The persistent outbox must survive application restart.

## Sync Principles

This ADR does not implement a sync protocol. It establishes required sync
properties.

Future sync must support:

- idempotency;
- stable event identity;
- client mutation identity;
- base revision / revision checks;
- retry after transient failure;
- conflict detection;
- no silent overwrite of conflicting medical records;
- tombstone propagation;
- sync cursors;
- multi-device compatibility.

Sync retries must be safe. Re-sending the same mutation must not duplicate
medical events.

Conflicting medical records must not use silent last-write-wins. Conflict
resolution policy requires explicit architecture and product approval before
implementation. Safe automatic merges may be approved later only for clearly
non-conflicting changes.

## Server Authority

Local-first does not mean client-trusted security.

The server is authoritative for:

- authentication;
- authorization;
- ownership;
- accepted revisions;
- audit records;
- access delegation;
- retention and deletion policy;
- backup and recovery.

The client may be authoritative only for local pending user intent before server
acknowledgement. The client must not be trusted for authorization, ownership
validation, audit authority, or server-side security decisions.

## Security and Privacy Invariants

Timeline events are sensitive health data.

Target persistence must satisfy these invariants:

- health data is treated as sensitive data;
- data in transit uses TLS;
- data at rest uses protected storage appropriate to the platform;
- PHI must not be placed in URLs;
- PHI must not be emitted to telemetry or logs;
- ownership is explicit;
- server-side authorization is required for synced data;
- auditability is required for create/update/delete/sync decisions;
- backup and recovery requirements must be explicit;
- deletion and retention policy must be explicit.

This ADR does not choose an authentication vendor, encryption vendor, backend
vendor, database vendor, or key-management vendor.

## Dashboard and Read-Model Boundary

Dashboard must not load the full Timeline history in the target architecture.

Dashboard is a consumer of bounded Timeline projections, such as:

- latest glucose;
- current-day summary;
- recent events;
- bounded Next Action context.

This ADR does not approve concrete endpoint names or repository method names.
The architectural requirement is that Dashboard consumes bounded projections or
queries rather than scanning all historical events in memory.

Analytics, Reports, AI, and future caregiver/HCP views follow the same
source-of-truth rule: they consume canonical Timeline records or approved
projections; they do not own independent medical-history copies.

## Scale Requirements

The architecture must support:

- small journals;
- 10k events per user;
- 100k+ events per user;
- millions of users.

The path to scale is:

- indexed local storage;
- cursor pagination;
- bounded queries;
- local read projections;
- backend-side projections and sync feeds;
- server-side partitioning/scaling strategies selected in later backend
  architecture.

The UI/domain ownership model must not require replacement when scaling from
small journals to large synced journals.

## Future Compatibility

The architecture must remain compatible with future:

- CGM integrations;
- insulin pump integrations;
- wearable integrations;
- imports;
- Analytics;
- Reports;
- AI analysis;
- caregiver access;
- HCP access.

None of these capabilities are implemented by this ADR.

Future device and import integrations must enter the system through approved
source/provenance contracts and repository mutations. Device-originated data must
not bypass canonical Timeline ownership, sync, authorization, or audit rules.

## Rejected Alternatives

### Permanent localStorage

Rejected because `localStorage` is synchronous, string-only, weakly indexed,
limited, difficult to migrate safely, and not suitable as the permanent
architecture for sensitive medical event history.

### Browser-only persistence architecture

Rejected because Diabetes Universe must support Web, iOS, and Android. Web-only
storage decisions must remain implementation details behind a shared repository
boundary.

### Backend-only / network-dependent write path

Rejected because the target product requires offline/local-first operation.
Backend-only writes make offline use fragile and make mobile user experience
network-dependent.

### UI directly using IndexedDB, SQLite, or backend APIs

Rejected because UI must remain independent of storage implementation. Direct UI
storage access would couple product surfaces to platform adapters and make mobile
and sync evolution more expensive.

### Silent last-write-wins for conflicting medical events

Rejected because medical event conflicts can change health history. Conflicting
medical records require explicit conflict detection and an approved resolution
policy.

## Migration Direction

This ADR approves direction only. It does not start P2 Repository Foundation.

Migration sequence:

```text
Current in-memory Timeline
  → Repository abstraction
  → Semantic event model
  → Durable local adapter
  → Sync-ready outbox
  → Backend synchronization
  → Mobile adapters
```

Existing UI contracts should be preserved where possible. Quick Add, Timeline,
and Dashboard should migrate through application/repository boundaries rather
than through direct storage calls.

## Consequences

Positive consequences:

- aligns persistence with offline/local-first product requirements;
- supports Web, iOS, and Android;
- avoids `localStorage` medical-data architecture debt;
- preserves server authority for security-sensitive decisions;
- provides a scalable path for backend sync, mobile apps, reports, analytics,
  AI, and device sources.

Costs and tradeoffs:

- more complex than browser-only or backend-only persistence;
- requires careful schema, migration, sync, conflict, security, and audit design;
- durable local persistence must be implemented before user saves can be treated
  as persistent;
- later implementation waves must define exact APIs and storage adapters.

## Architecture Decisions Still Required

Separate decisions or implementation designs are required for:

- final Timeline event TypeScript API;
- repository method signatures;
- Web local storage library choice;
- mobile storage library choice;
- encryption/key-management approach;
- authentication provider;
- backend vendor and database architecture;
- sync protocol;
- conflict-resolution UX and policy;
- deletion/retention policy;
- backup/recovery policy;
- device/import source contracts.

## Date

2026-08-09

## Author

Cursor — Architecture Draft
