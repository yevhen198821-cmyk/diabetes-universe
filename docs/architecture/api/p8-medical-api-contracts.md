# P8 — Medical API Contracts Architecture

## Status

**Architecture Design — Approved**

Date: 2026-08-14 (architecture/security re-audit passed)

## Purpose

Define the stable application/API contract between Diabetes Universe clients and the future medical backend, building directly on the approved P7 backend medical-data architecture.

P8 defines request/response semantics, authorization context, versioning, pagination, revisions, idempotency, errors, rate limits, audit correlation, and transport boundaries for Web, Android, and iOS.

P8 is architecture only. It does **not** implement production routes, database schema/migrations, cloud sync, IndexedDB adoption, mobile persistence, OAuth, MFA, caregiver/HCP access, or UI redesign.

## Baseline

P8 inherits these approved invariants:

- authenticated account identity is derived server-side from the validated session;
- medical resources are owned by a Medical Subject, not by Better Auth/provider identity;
- client-supplied `accountId`, `ownerId`, or `subjectId` never grants authorization;
- `SemanticTimelineEvent` remains infrastructure-neutral;
- server medical persistence is behind an application service and private repository boundary;
- canonical resource IDs, lifecycle timestamps, and revision state are server-authoritative;
- local IndexedDB history remains unattached until a separate adoption flow is approved;
- no direct client/database access.

## API style decision

### Option A — GraphQL for the first medical API

Not selected for the first production slice.

Pros:

- flexible field selection;
- strong schema tooling.

Cons:

- more authorization/query-complexity surface than required now;
- greater risk of unbounded/nested queries;
- unnecessary operational complexity before product needs justify it.

### Option B — Versioned resource-oriented HTTP API

**Selected.**

Reasons:

- simple and inspectable contracts;
- predictable authorization boundary;
- straightforward mobile/Web support;
- explicit caching and rate-limit semantics;
- easier bounded-query enforcement;
- compatible with later SDK generation/OpenAPI if adopted.

Conceptual base path:

```text
/api/v1/medical/...
```

Exact framework routing is implementation detail.

## Authentication contract

The API never accepts an `accountId` as authentication proof.

For browser/server flows, authentication is derived from the validated server session/cookie through the existing identity boundary.

For future native clients, the same application authorization semantics must apply even if the transport credential differs.

Every request resolves an internal server context conceptually like:

```text
AuthenticatedActorContext
- accountId
- sessionId/internal auth context
- authentication strength/freshness when relevant
- correlationId
```

Session tokens/cookies are never copied into medical resources or logs.

## Subject authorization contract

Initial self-only consumer model should minimize client choice.

Preferred first-slice route semantics:

```text
/me/medical-events
```

or equivalent application contract where the server resolves the current authorized self-subject.

This is preferred over making every self-only client request send an arbitrary `subjectId`.

If later APIs accept a subject selector for caregiver/clinician scenarios, the selector remains non-authoritative and is re-authorized server-side on every request.

## Authorization non-enumeration policy

Authorization and resource existence are separate concerns, but the public API must not leak protected resource existence.

Normative v1 behavior:

- unauthenticated requests return `401 AUTH_REQUIRED`;
- authenticated requests that attempt to access a resource outside the caller's resolved subject scope must return the same public response as an unavailable resource: `404 RESOURCE_NOT_FOUND`;
- this non-enumeration rule applies consistently to GET, PATCH, and DELETE resource operations;
- internal authorization telemetry/audit may distinguish denied-vs-absent outcomes, but public status/body must not;
- collection-level operations that are denied by policy may use `403 SUBJECT_ACCESS_DENIED` when no individual protected resource existence is disclosed.

Clients must never infer ownership or existence from differences between 403/404 for individual medical resources.

## Resource representation

Conceptual public representation:

```json
{
  "resourceId": "opaque-server-id",
  "revision": "opaque-revision",
  "createdAt": "server-timestamp",
  "updatedAt": "server-timestamp",
  "deletedAt": null,
  "event": { "...": "SemanticTimelineEvent" }
}
```

Public contracts must not expose database primary-key implementation details when avoidable, Better Auth user/session IDs as ownership fields, DB role/schema names, raw audit rows, internal stack traces, secrets, or PHI-bearing diagnostic metadata.

## Endpoint capability model

The first medical-event contract supports:

```text
GET    collection      list medical events
GET    resource        read one medical event
POST   collection      create medical event
PATCH  resource        update medical event
DELETE resource        request resource deletion lifecycle
```

Exact paths remain implementation ADR detail, but behavior below is normative.

## List contract

Collection reads are bounded and cursor-paginated.

Conceptual request:

```text
GET .../medical-events?limit=50&cursor=...
```

Rules:

- default limit is bounded;
- maximum limit is server-enforced;
- no endpoint returns complete lifetime history by default;
- filters are allow-listed and indexed before production adoption;
- deleted resources are omitted by default unless a later sync contract explicitly exposes them.

### Cursor integrity and ordering

The v1 cursor is an opaque server-issued continuation token.

Normative requirements:

- clients must treat cursor bytes as opaque and must not construct/modify them;
- cursor content must be integrity-protected using a server-controlled signature/MAC or equivalent authenticated encoding;
- invalid, expired, malformed, or tampered cursors return `400 INVALID_CURSOR` without revealing internal cursor structure;
- cursors contain no plaintext PHI, secrets, auth credentials, or user-readable medical free text;
- every cursor is scoped to the resolved subject, API version, effective filter set, and deterministic sort definition; reusing it under a materially different query is rejected;
- ordering uses an immutable/stable keyset tuple rather than offset pagination; implementation must choose a deterministic tuple that includes a unique server tie-breaker such as `(eventObservedAt, resourceId)` or `(createdAt, resourceId)` according to the approved query contract;
- records inserted after page 1 must not cause already-returned rows to shift backward and be duplicated solely because offsets moved;
- continuation semantics are **stable keyset traversal**, not a full transaction snapshot: concurrent inserts/updates may appear on later refreshes, but a single forward traversal must not silently duplicate or skip records that were already part of the traversed ordering because of offset movement;
- if a future use case requires immutable snapshot pagination, it must define a separate snapshot/version contract rather than pretending normal cursors provide snapshot isolation;
- cursor lifetime is bounded and defined in implementation documentation.

Conceptual response:

```json
{
  "items": [],
  "page": {
    "nextCursor": "opaque-or-null",
    "hasMore": false
  }
}
```

## Read-one contract

A resource lookup is always authorized within the resolved subject scope. Knowledge of `resourceId` is never sufficient authorization.

Cross-subject/cross-account probing follows the non-enumeration policy above.

## Create contract

Create requests contain semantic medical input, not server lifecycle fields.

Client must not set canonical `resourceId`, authoritative `createdAt`/`updatedAt`, server revision, or ownership/audit actor fields.

Retryable creates use:

```text
Idempotency-Key: <opaque client-generated mutation key>
```

### Idempotency semantics

The idempotency contract is normative for v1 create operations.

- key scope is bound server-side to authenticated actor + resolved subject + API version + operation/resource domain;
- reuse of the same textual key by another account/subject can never collide with or replay the first actor's result;
- key itself contains no PHI and must have bounded length/character rules;
- the server stores a canonical request fingerprint derived after transport validation/normalization together with the authoritative outcome;
- same scoped key + same semantic request replays/reconciles to the original operation and must not create a second resource;
- same scoped key + materially different semantic request returns `409 IDEMPOTENCY_CONFLICT`;
- when the original operation completed successfully, replay returns the same semantic result, same canonical `resourceId`, same authoritative revision and same success status class; implementation may regenerate non-semantic headers such as correlation IDs;
- when the original request reached a deterministic client error that is explicitly stored by the implementation contract, replay behavior must be documented and tested; transient infrastructure failures must not be cached as permanent success;
- ambiguous client timeout is reconciled using the same key rather than by generating a new mutation key;
- the production implementation must define a minimum retention window long enough to cover mobile/background retry behavior and document it as part of the supported client contract;
- after the retention window expires, the server may treat reuse as a new request, therefore clients must not depend on indefinite replay; released SDKs must generate globally high-entropy mutation keys so accidental late reuse is negligible.

## Update contract

Updates use one normative optimistic-concurrency mechanism in v1:

```text
If-Match: "<opaque-revision>"
```

No request-body `expectedRevision` alternative is part of v1.

Rules:

- every mutable resource representation includes the current opaque `revision` and responses may expose the equivalent `ETag` value;
- PATCH requires `If-Match`; missing precondition returns `428 PRECONDITION_REQUIRED`;
- the server compares `If-Match` to the current authoritative revision;
- stale/mismatched revision returns **HTTP 412** with stable code `REVISION_CONFLICT`;
- stale revision never silently overwrites newer data;
- PATCH fields are explicitly allow-listed; arbitrary server-field patching is forbidden;
- successful update returns the new authoritative revision/ETag;
- revision tokens are opaque to clients and are not parsed/incremented client-side.

## Delete contract

DELETE means application-level medical resource deletion, not account deletion and not immediate backup erasure.

DELETE resource operations use the same v1 `If-Match` precondition semantics:

- missing `If-Match` → `428 PRECONDITION_REQUIRED`;
- stale revision → `412 REVISION_CONFLICT`;
- unauthorized/out-of-scope resource → `404 RESOURCE_NOT_FOUND` under non-enumeration policy.

The API does not expose internal tombstone/sync details before the later sync architecture is approved.

## Time semantics

Medical/source event time and server lifecycle time are separate.

- event-observed time remains part of `SemanticTimelineEvent`;
- `createdAt`, `updatedAt`, `deletedAt` are server lifecycle timestamps;
- client clock is not trusted for audit/lifecycle ordering;
- API serialization uses ISO 8601 with explicit timezone/UTC semantics.

## Error contract

All API errors use a stable machine-readable envelope.

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Safe user-presentable summary",
    "correlationId": "opaque-id",
    "details": null
  }
}
```

Initial error families:

- `AUTH_REQUIRED`
- `AUTH_INSUFFICIENT`
- `SUBJECT_ACCESS_DENIED`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_FAILED`
- `INVALID_CURSOR`
- `PRECONDITION_REQUIRED`
- `REVISION_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `RATE_LIMITED`
- `REQUEST_TOO_LARGE`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_ERROR`

Rules:

- no stack traces/database errors in client responses;
- validation errors identify safe field-level problems without echoing unnecessary PHI;
- authorization errors do not expose cross-subject resource existence;
- client behavior keys off stable `code`, not localized message text;
- localization happens in the presentation layer.

## HTTP semantics

Normative v1 mapping:

- 200 — successful read/update;
- 201 — successful create/replayed successful create;
- 204 — successful delete when no body is returned;
- 400 — malformed request or invalid cursor;
- 401 — authentication required/invalid;
- 403 — authenticated collection/action policy denied where no individual resource enumeration risk exists;
- 404 — resource unavailable/not exposed, including out-of-subject resource access;
- 409 — idempotency/domain conflict;
- 412 — revision conflict (`REVISION_CONFLICT`);
- 413 — request too large;
- 422 — semantic validation failure;
- 428 — required `If-Match` missing for update/delete;
- 429 — rate limited;
- 503 — temporarily unavailable.

## Validation contract

All external payloads are runtime-validated at the API boundary even when generated/TypeScript types exist.

Rules:

- reject dangerous/unknown server-owned fields rather than silently accepting them;
- enforce payload size/depth limits;
- validate numeric ranges/date formats using semantic-domain contracts;
- transport DTOs are mapped through application contracts before persistence;
- generated client types never replace runtime validation.

## Versioning and compatibility

Public medical API begins at `v1`.

Breaking changes require a new version or explicitly compatible migration strategy. Additive response fields may evolve within a version when supported clients ignore unknown fields safely.

Because Android/iOS upgrades can lag:

- backend cannot assume simultaneous client upgrades;
- required request fields are introduced carefully;
- minimum supported API/client versions are explicit;
- a defined deprecation window exists before removing contracts used by released clients;
- emergency server changes preserve safe behavior for older supported clients.

## Correlation and observability

Every request receives a server correlation ID. Correlation IDs may be returned to clients and included in safe logs.

Logs/metrics do not include full medical payloads by default. PHI, auth credentials, medical free text, and secrets must never appear in URLs, metric labels, tracing span names, or exception titles.

## Rate limiting and abuse protection

Medical APIs require layered limits:

- per authenticated actor/session/account limits;
- stricter mutation limits where appropriate;
- payload-size/depth limits;
- bounded pagination;
- protection against high-cardinality filter abuse;
- stable 429 envelope and retry guidance.

Rate limiting is never an authorization mechanism.

## Caching

Authenticated medical responses are private/sensitive.

Default posture:

- no shared/public CDN caching of personalized medical payloads;
- explicit `private, no-store` semantics until a reviewed caching strategy exists;
- one user's response must never be reusable under another user's cache key;
- metadata-only caching requires separate review.

## Mutation atomicity

If an API operation requires authoritative medical mutation plus mandatory idempotency/audit/outbox state, the application contract considers success only when that required atomic boundary succeeds.

The API must not claim durable success while mandatory transaction-side evidence failed.

## Retry semantics

Clients may retry safe reads. Mutation retries use the idempotency/precondition rules above.

For ambiguous timeout outcomes, clients reconcile via the same idempotency key or authoritative resource read rather than blindly repeating non-idempotent writes.

## Bulk operations

Unbounded bulk create/update/delete is not part of the first API slice.

Local-data adoption/import receives separate architecture because it requires batching, resumability, idempotency, verification, and partial-failure semantics.

## File/media boundary

Medical attachments/images/files are not part of the initial Timeline API contract unless separately approved. Large binary/base64 media must not be embedded in normal event JSON.

Future media requires signed upload/download architecture, malware/content controls, lifecycle, retention, and authorization.

## AI boundary

AI receives no privileged API bypass. Future AI features call application services under the same authenticated subject authorization constraints as deterministic features.

AI-generated text is not persisted as a medical record by default.

## OpenAPI / generated clients

Once implementation begins, maintain a machine-readable OpenAPI (or equivalent) contract in version control and CI-validate it for breaking changes.

Generated SDK/types improve consistency across Web/Android/iOS but do not replace runtime server validation or authorization.

## Contract testing

Implementation must include contract tests for at least:

1. unauthenticated request rejected;
2. authenticated self-subject access succeeds;
3. cross-subject GET returns non-enumerating 404;
4. cross-subject PATCH/DELETE return the same non-enumerating 404 behavior;
5. client cannot set server-owned lifecycle/ownership fields;
6. pagination limit is bounded;
7. cursor is opaque and tamper detection rejects modified cursor;
8. cursor cannot be replayed under a materially different subject/filter/query;
9. keyset traversal does not duplicate/skip previously traversed rows solely because concurrent inserts move offsets;
10. create idempotency replay returns the original resource/result;
11. same idempotency key under a different account cannot collide;
12. idempotency-key payload mismatch returns 409;
13. documented retention-expiry behavior is exercised;
14. PATCH without `If-Match` returns 428;
15. stale PATCH revision returns 412 `REVISION_CONFLICT`;
16. current revision PATCH succeeds and advances revision;
17. DELETE uses the same 428/412 precondition contract;
18. error envelope contains stable code/correlation ID and no stack trace;
19. oversized payload rejected;
20. rate-limit response is stable;
21. medical response is not publicly cacheable;
22. PHI/secrets are absent from URL/logging fixtures;
23. older supported client contract remains compatible with additive changes.

## Explicit non-scope

P8 does not implement concrete Next.js route handlers, production medical DB schema/migrations, cloud persistence repository, local IndexedDB adoption/import, offline outbox/sync, conflict-resolution UX, caregiver/HCP delegation, OAuth/MFA, media uploads, CGM/device ingestion, Community/Recipes/Marketplace APIs, or AI clinical decision-making.

Community, Recipes, Marketplace and future product domains receive their own bounded-context APIs and never inherit medical-data access merely because they share the same account.

## Recommended sequence after P8

```text
P8 API Contracts Architecture
→ P9 Cloud Medical Persistence Implementation Design
→ P10 Local Data Adoption Architecture
→ P11 Offline Sync Architecture
→ P12 Conflict / Revision / Tombstone Architecture
→ P13 Security & Privacy Hardening
```

## Architecture approval gate

P8 may move to Approved only when review confirms:

- no account/provider ownership leakage into medical contracts;
- self-subject authorization is server-resolved;
- individual-resource authorization uses consistent non-enumerating behavior;
- collection reads are bounded with integrity-protected keyset cursors;
- pagination semantics under concurrent writes are explicit;
- server-owned IDs/revisions/timestamps cannot be client-authored;
- create idempotency scope/replay/retention semantics are explicit;
- v1 uses one normative `If-Match` revision contract with 428/412 mappings;
- error taxonomy is stable and non-leaky;
- API versioning supports slow mobile upgrades;
- medical responses are private by default;
- PHI-safe logging/correlation rules are explicit;
- rate/payload limits exist;
- implementation contract tests cover the normative behaviors;
- adoption/sync/media/community/recipes/marketplace remain outside P8.

## Current decision

**P8 architecture/security audit passed. P8 is approved for merge. Production medical API implementation must not begin before the separate P9 Cloud Medical Persistence Implementation Design stage.**
