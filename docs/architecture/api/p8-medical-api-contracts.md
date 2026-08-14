# P8 — Medical API Contracts Architecture

## Status

**Architecture Design — Draft**

Date: 2026-08-14

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

## Resource representation

Conceptual public representation:

```json
{
  "resourceId": "opaque-server-id",
  "revision": "opaque-or-monotonic-version",
  "createdAt": "server-timestamp",
  "updatedAt": "server-timestamp",
  "deletedAt": null,
  "event": { "...": "SemanticTimelineEvent" }
}
```

Public contracts must not expose:

- database primary-key implementation details when avoidable;
- Better Auth user/session IDs as ownership fields;
- DB role/schema names;
- raw audit rows;
- internal stack traces;
- secrets or PHI-bearing diagnostic metadata.

## Endpoint capability model

The first medical-event contract should support these capabilities:

```text
GET    collection      list medical events
GET    resource        read one medical event
POST   collection      create medical event
PATCH  resource        update medical event
DELETE resource        request resource deletion lifecycle
```

Exact paths remain implementation ADR detail, but behavior below is normative.

## List contract

Collection reads must be bounded and cursor-paginated.

Conceptual request:

```text
GET .../medical-events?limit=50&cursor=...
```

Rules:

- default limit is bounded;
- maximum limit is server-enforced;
- no endpoint returns complete lifetime history by default;
- cursor is opaque to the client;
- cursor must not encode secrets/PHI in readable URL form;
- ordering is deterministic;
- the contract defines whether deleted resources are omitted by default;
- filters must be allow-listed and indexed before production adoption.

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

A resource lookup is always authorized within the resolved subject scope.

Knowledge of `resourceId` is never sufficient authorization.

Cross-subject and cross-account resource probing must fail closed without leaking whether a protected resource exists where that distinction would create an information leak.

## Create contract

Create requests contain semantic medical input, not server lifecycle fields.

Client must not set canonical:

- `resourceId`;
- authoritative `createdAt`/`updatedAt`;
- server revision;
- ownership/audit actor fields.

Create operations that can be retried use an idempotency contract.

Recommended transport:

```text
Idempotency-Key: <opaque client-generated mutation key>
```

Rules:

- key scope is bound to authenticated actor + operation/resource domain;
- same key + same semantic request returns/reconciles to the original result;
- same key + materially different request is rejected;
- retention window is explicitly defined in implementation;
- key itself contains no PHI.

## Update contract

Updates use optimistic concurrency.

Preferred contract:

```text
If-Match: <revision/etag>
```

or an equivalent explicit expected-revision field.

Rules:

- server compares expected revision with current authoritative revision;
- stale revision does not silently overwrite newer data;
- conflict returns a dedicated conflict/precondition error;
- PATCH semantics are explicitly allow-listed; arbitrary server-field patching is forbidden;
- successful update returns the new authoritative revision.

## Delete contract

DELETE means application-level medical resource deletion, not account deletion and not immediate backup erasure.

The API must not expose internal tombstone/sync details before the later sync architecture is approved.

Deletion still participates in expected-revision/concurrency rules where necessary.

## Time semantics

Medical/source event time and server lifecycle time are separate.

- event-observed time remains part of `SemanticTimelineEvent`;
- `createdAt`, `updatedAt`, `deletedAt` are server lifecycle timestamps;
- client clock is not trusted for audit/lifecycle ordering;
- API serialization uses ISO 8601 with explicit timezone/UTC semantics.

## Error contract

All API errors use a stable machine-readable envelope.

Conceptually:

```json
{
  "error": {
    "code": "MEDICAL_REVISION_CONFLICT",
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
- localization of user-facing error presentation happens in the client/application presentation layer.

## HTTP semantics

Expected status mapping conceptually:

- 200 — successful read/update;
- 201 — successful create;
- 204 — successful delete when no body is returned;
- 400 — malformed request;
- 401 — authentication required/invalid;
- 403 — authenticated but operation not authorized;
- 404 — resource unavailable/not exposed;
- 409 — idempotency/domain conflict when appropriate;
- 412 — revision/precondition conflict when using HTTP preconditions;
- 413 — request too large;
- 422 — semantic validation failure where adopted consistently;
- 429 — rate limited;
- 503 — temporarily unavailable.

The implementation must choose one consistent revision-conflict mapping and test it contractually.

## Validation contract

All external payloads are runtime-validated at the API boundary even when TypeScript types exist.

Rules:

- reject unknown dangerous server-owned fields rather than ignoring them silently where ambiguity creates risk;
- enforce payload size/depth limits;
- validate numeric ranges and date formats according to semantic-domain contracts;
- do not let transport DTOs directly become persistence writes without application mapping;
- never trust generated client types as runtime validation.

## Versioning

Public medical API begins at `v1`.

Breaking changes require a new version or an explicitly compatible migration strategy.

Non-breaking additions may evolve within a version when clients are required to ignore unknown response fields safely.

Server must support a defined deprecation window before removing a public contract used by released mobile clients.

This is critical because native apps cannot be upgraded instantly.

## Compatibility policy

Web may deploy rapidly; Android/iOS may lag by weeks or months.

Therefore:

- backend cannot assume all clients update simultaneously;
- response additions are additive by default;
- required request fields are introduced carefully;
- mobile minimum-supported API/client versions are explicit;
- emergency server changes must preserve safe behavior for older supported clients.

## Correlation and observability

Every request receives a server correlation ID.

Correlation IDs may be returned to clients and included in safe logs.

Logs/metrics must not include full medical payloads by default.

Never place PHI, auth credentials, or medical free text into URLs, metric labels, tracing span names, or exception titles.

## Rate limiting and abuse protection

Medical APIs require layered server-side limits.

At minimum:

- per authenticated actor/session/account limits;
- stricter mutation limits than normal reads where appropriate;
- payload-size limits;
- bounded pagination;
- protection against high-cardinality filter abuse;
- explicit retry guidance for 429 responses.

Rate limiting must not be the only authorization control.

## Caching

Authenticated medical responses are private/sensitive.

Default posture:

- no shared/public CDN caching of personalized medical payloads;
- explicit private/no-store semantics until a reviewed caching strategy exists;
- never allow one user's response to be served to another through an incorrect cache key;
- metadata-only caching must be separately reviewed.

## Mutation atomicity

If an API operation requires authoritative medical mutation plus required idempotency/audit/outbox state, the application contract considers the operation successful only when the required atomic boundary succeeds.

A response must not claim durable success while mandatory transaction-side evidence failed.

## Retry semantics

Clients may retry safe reads.

Mutation retries require idempotency/preconditions as applicable.

For ambiguous timeout outcomes, clients reconcile via idempotency key/resource read rather than blindly repeating non-idempotent writes.

## Bulk operations

Unbounded bulk create/update/delete is not part of the first API slice.

Local-data adoption/import gets a separate architecture because it requires batching, resumability, idempotency, verification, and partial-failure semantics.

## File/media boundary

Medical attachments/images/files are not part of the initial Timeline API contract unless separately approved.

Do not embed large binary/base64 media directly into normal event JSON contracts.

Future media storage requires signed upload/download architecture, malware/content controls, lifecycle, retention, and authorization.

## AI boundary

AI does not receive privileged API bypasses.

Any future AI feature calls application services under the same authenticated subject authorization constraints as deterministic features.

AI-generated text is not persisted as a medical record by default.

## OpenAPI / generated clients

P8 recommends maintaining a machine-readable API contract (OpenAPI or equivalent) once implementation begins.

Generated SDK/types may improve consistency across Web/Android/iOS, but generated code does not replace runtime server validation or authorization.

The canonical contract must be version-controlled and CI-validated for breaking changes.

## Contract testing

Implementation must include contract-level tests for at least:

1. unauthenticated request rejected;
2. authenticated self-subject access succeeds;
3. cross-subject access fails closed;
4. client cannot set server-owned lifecycle/ownership fields;
5. pagination limit is bounded;
6. opaque cursor behavior;
7. create idempotency replay;
8. idempotency-key payload mismatch rejection;
9. stale revision update rejected;
10. current revision update succeeds and advances revision;
11. delete follows authorization/revision rules;
12. error envelope contains stable code/correlation ID and no stack trace;
13. oversized payload rejected;
14. rate-limit response is stable;
15. medical response is not publicly cacheable;
16. PHI/secrets are absent from URL/logging fixtures;
17. older supported client contract remains compatible with additive changes.

## Explicit non-scope

P8 does not implement:

- concrete Next.js route handlers;
- production medical DB schema/migrations;
- cloud persistence repository;
- local IndexedDB adoption/import;
- offline outbox/sync;
- conflict-resolution UX;
- caregiver/HCP subject delegation;
- OAuth/MFA;
- media uploads;
- CGM/device ingestion;
- community/recipes/marketplace APIs;
- AI clinical decision-making.

Community, Recipes, Marketplace and other future product domains must receive their own APIs/bounded contexts and must never inherit medical-data access merely because they share the same account.

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

P8 may move from Draft to Approved only when review confirms:

- no account/provider ownership leakage into medical contracts;
- self-subject authorization is server-resolved;
- all collection reads are bounded/cursor-paginated;
- server-owned IDs/revisions/timestamps cannot be client-authored;
- create idempotency is explicit;
- update concurrency/preconditions are explicit;
- error taxonomy is stable and non-leaky;
- API versioning accounts for slow mobile upgrades;
- medical responses are private by default;
- PHI-safe logging/correlation rules are explicit;
- rate/payload limits exist;
- implementation contract tests are enumerated;
- adoption/sync/media/community/recipes/marketplace remain outside P8.

## Current decision

**Recommended:** proceed with P8 architecture/security audit. Do not implement production medical API routes yet.
