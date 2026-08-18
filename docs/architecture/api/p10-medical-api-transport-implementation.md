# P10 — Medical API Transport Implementation Architecture

## Status

**Architecture Design — Draft**

Date: 2026-08-19

## Purpose

P10 defines the transport-layer implementation architecture that exposes the approved P8 medical API contract over the P9 medical persistence and service foundation. It does not change P7/P8/P9 semantics and does not introduce offline sync or IndexedDB adoption.

## Canonical dependencies

P10 is subordinate to:

- `docs/architecture/backend/p7-backend-medical-data-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`

If this document conflicts with an approved invariant in those documents, the earlier approved invariant wins until an explicit architecture change is approved.

## Decision summary

P10 will implement a thin Next.js transport layer under `/api/v1/medical/*` that performs only HTTP concerns: authentication resolution, request parsing, contract validation, transport-to-service mapping, conditional request handling, cursor encoding/verification, response serialization, cache/security headers, and error mapping. Business rules, persistence, subject authorization, idempotency orchestration, revision CAS, audit, and outbox atomicity remain owned by `medical-service` / `medical-persistence`.

The transport layer must never access SQL, Drizzle schema, repository implementations, or raw medical DB credentials directly.

## 1. Scope

P10 v1 includes transport endpoints for the currently approved self-subject medical-event surface:

- provision/resolve the authenticated account's canonical self subject through the service boundary;
- create a medical event;
- get one medical event;
- list medical events with stable keyset traversal;
- update a medical event with `If-Match`;
- soft-delete a medical event with `If-Match`.

The API is account-authenticated but resource authorization is always subject-scoped server-side. The client never supplies authoritative account ownership.

## 2. Explicit non-scope

P10 does not implement:

- IndexedDB adoption or cloud migration;
- offline synchronization;
- tombstones/conflict merge protocol;
- CGM bulk ingestion;
- caregiver or clinician sharing flows;
- Community, Recipes, Marketplace;
- OAuth/MFA redesign;
- outbox dispatcher;
- AI diagnosis, treatment decisions, insulin dosing, or autonomous medical actions;
- compliance hard-purge workflow.

## 3. Route composition boundary

Recommended route family:

```text
/api/v1/medical/subjects/self
/api/v1/medical/events
/api/v1/medical/events/:resourceId
```

Route handlers must import only approved application/service contracts and transport utilities. They must not import `@diabetes-universe/medical-persistence`.

The composition root may construct server-only service dependencies in a dedicated server module. That module remains outside client bundles and outside generic UI code.

## 4. Authentication and principal resolution

Every protected medical endpoint resolves the authenticated principal through the existing canonical identity boundary. The route must not trust `accountId`, `userId`, `subjectId`, ownership fields, roles, or actor identity from JSON, query parameters, or headers supplied by the client.

Transport flow:

1. Resolve authenticated principal server-side.
2. Reject unauthenticated request using the canonical auth error behavior.
3. Resolve/provision the principal's canonical self subject through `MedicalSubjectService`.
4. Call the medical application service with the server-derived account and subject scope.

No route may query Better Auth tables directly.

## 5. Self-subject endpoint

`GET /api/v1/medical/subjects/self` resolves the canonical self subject for the authenticated account. Provisioning is retry-safe and concurrency-safe in the P9 service/persistence transaction.

The response exposes only public subject identity and lifecycle fields required by the client. Internal account-subject relationship identifiers and database implementation details are not transport contracts unless P8 explicitly requires them.

## 6. Create event

`POST /api/v1/medical/events`

Required transport behavior:

- authenticated principal required;
- canonical self subject resolved server-side;
- validate semantic payload and envelope input against approved P8 schema;
- reject client-supplied canonical `resourceId`, revision, actor identity, audit fields, server timestamps, lifecycle state, and ownership fields;
- require/validate the approved idempotency key header;
- compute/forward canonical operation scope through the service boundary;
- service transaction owns resource + audit + outbox + idempotency atomicity;
- serialize the server-created resource and strong ETag.

The route never creates audit/outbox/idempotency records itself.

## 7. Read event

`GET /api/v1/medical/events/:resourceId`

Authorization and non-enumeration are server-side. A resource outside the resolved subject scope returns the same canonical not-found response as a nonexistent resource. No distinction may reveal another user's medical resource existence.

Successful responses include the strong ETag derived from the revision token service.

Soft-deleted resources are excluded from the normal endpoint unless a later approved contract explicitly introduces deleted-resource retrieval.

## 8. List events

`GET /api/v1/medical/events`

The transport accepts only bounded page sizes. Defaults and maximums are constants owned by the API contract layer.

Pagination follows P8/P9 keyset semantics and must not use OFFSET for unbounded history.

Canonical ordering:

```text
(event_observed_at DESC, resource_id DESC)
```

The cursor is opaque to clients and must contain sufficient signed/versioned state to preserve the P9 traversal boundary, including:

- cursor version;
- `traversalStartedAt`;
- last ordering tuple;
- subject binding or equivalent anti-cross-scope binding;
- API/query-shape binding where required to prevent replay under incompatible filters.

Cursor tampering or structural invalidity maps to the approved `INVALID_CURSOR` contract. A cursor valid for one subject cannot be replayed for another subject.

## 9. Update event

`PATCH /api/v1/medical/events/:resourceId`

The endpoint requires the P8 revision precondition via `If-Match`.

Transport responsibilities:

- require `If-Match`; missing precondition -> canonical 428 mapping;
- parse strong ETag syntax only;
- verify/decode the opaque token server-side and bind it to `resourceId`;
- malformed/tampered token maps to contract-invalid precondition behavior;
- pass authoritative expected revision to the service CAS mutation;
- zero-row stale CAS maps to 412;
- validate mutable semantic fields only;
- prohibit mutation of server-owned identity/ownership/audit fields;
- return the updated representation with a new ETag.

The route must not perform a read-check-write sequence as concurrency control. Database CAS remains authoritative.

## 10. Delete event

`DELETE /api/v1/medical/events/:resourceId`

Delete is application-level soft deletion only. It uses the same `If-Match` precondition and race-safe CAS semantics as update. The route must not issue physical DELETE statements or expose any purge capability.

The exact success representation/status follows P8 and must remain consistent across retries and clients.

## 11. Request validation

Validation has two layers:

1. Transport schema validation: shape, types, required fields, allowed enum values, string/date bounds, header syntax.
2. Domain/application validation: semantic rules owned by domain/service code.

Transport validation libraries may be used only server-side or in neutral contract packages where safe. Validation must not duplicate business invariants in route handlers.

Unknown fields in write DTOs should be rejected by default for medical mutations to prevent accidental acceptance of future server-owned fields.

## 12. Error contract

All endpoints use one canonical medical API error envelope defined by P8. Internal exception names, SQL errors, stack traces, table names, constraint names, secrets, connection data, and PHI must never be serialized.

Required mapping categories include:

- unauthenticated;
- authorization/non-enumerating resource not found;
- validation error;
- invalid cursor;
- missing revision precondition;
- malformed/tampered revision token;
- stale revision;
- idempotency conflict;
- rate/size limit where introduced;
- internal error.

Unexpected errors are logged only through PHI-safe structured logging and return a generic correlation identifier.

## 13. Idempotency header contract

The create route accepts the P8 idempotency key header. Transport validation enforces length/character constraints and does not log the key together with medical payloads.

The service owns fingerprinting and replay/conflict semantics. The route may not implement an in-memory idempotency cache.

Replayed responses must preserve the approved original outcome semantics and must not create a second resource, audit event, or outbox event.

## 14. ETag and revision tokens

HTTP responses use strong ETags:

```text
ETag: "<opaque-token>"
If-Match: "<opaque-token>"
```

Raw BIGINT revision values are never client authority. Transport code treats revision tokens as opaque except through the server-only revision token service.

No token or token secret is written to logs. ETag parsing is strict; weak validators are rejected for medical mutations.

## 15. Cursor service

P10 introduces a server-only cursor codec/service if one does not already exist.

Requirements:

- authenticated encryption or signed integrity protection sufficient to prevent tampering;
- versioned payload;
- subject binding;
- query-shape/filter binding where needed;
- bounded payload size;
- strict timestamp and tuple parsing;
- secret separate from database credentials;
- rotation-ready key versioning;
- no raw SQL fragments or client-controlled order expressions inside the cursor.

Recommended implementation: HMAC-SHA256 over canonical serialized cursor payload with a dedicated secret such as `MEDICAL_CURSOR_TOKEN_SECRET`, following the same key-isolation principles as revision tokens.

## 16. Filtering and query bounds

P10 implements only filters already approved by P8. No arbitrary field/operator DSL is allowed.

Every list query must have:

- maximum page size;
- deterministic order;
- subject scope;
- traversal boundary;
- indexed predicates consistent with P9;
- no unbounded full-history read.

## 17. Response serialization

Persistence rows are never returned directly. A transport mapper converts application/domain resources to the P8 response DTO.

Server-only/internal fields are excluded by construction. `bigint` values are never serialized directly to JSON. Revision authority is represented through ETag and only any P8-approved response metadata.

Dates are serialized using the canonical API timestamp format and timezone rules.

## 18. HTTP caching

Medical API responses containing user medical data are private and must not be cached by shared intermediaries.

Recommended baseline headers:

```text
Cache-Control: private, no-store
Pragma: no-cache
```

Do not use public CDN caching for authenticated medical payloads.

## 19. Security headers and content behavior

Routes return JSON with canonical content type. Medical mutation endpoints require expected content type and reject oversized payloads before expensive processing where feasible.

CORS remains same-origin by default unless a later mobile/API client architecture explicitly approves additional origins. Do not open permissive wildcard CORS for authenticated medical endpoints.

CSRF protections must match the chosen authentication transport. Cookie-authenticated state-changing routes must not assume SameSite alone is the entire defense; use the platform's approved origin/CSRF policy.

## 20. Logging and observability

Medical transport logs are metadata-minimal and PHI-safe.

Allowed examples:

- route template;
- HTTP status class;
- latency;
- opaque request/correlation id;
- coarse error category;
- deployment/service version.

Do not log:

- semantic event payloads;
- glucose/insulin/medication values;
- request bodies;
- authorization cookies/tokens;
- revision/cursor secrets;
- database URLs;
- raw idempotency request payload fingerprints if they can aid correlation beyond operational need.

## 21. Rate and abuse controls

P10 architecture requires a bounded-abuse strategy before production enablement. The first implementation may use platform-compatible per-principal and per-IP limits, but rate limiting must fail safely and must not become an authorization mechanism.

Create/update/delete limits should be stricter than reads. Limits must account for legitimate bursty client retries and idempotent replay.

Exact numeric limits are an implementation configuration decision and must be tested before production enablement.

## 22. Payload limits

Medical event payload size has a hard maximum. The limit must be low enough to prevent memory/DB abuse while supporting approved semantic events. Oversized payloads are rejected before persistence.

No arbitrary file/blob upload is introduced through medical event JSON.

## 23. Service composition

A server-only composition module constructs:

- medical DB adapter/repositories;
- revision token service;
- cursor service;
- `MedicalSubjectService`;
- `MedicalEventService`;
- transport-facing application facade if useful.

Dependency construction is cached only where safe for server runtime/connection pooling. Client modules cannot import it.

## 24. Connection/runtime behavior

The transport uses the P9 medical database runtime configuration and connection pooling strategy. Each request must avoid creating unbounded new database connections.

The API route layer does not receive migrator, maintenance-owner, cleanup, or compliance-purge credentials.

## 25. Authorization boundary

For v1 self-only flows, authorization is defined as the server-derived authenticated account's active self relationship to the resolved subject.

Repositories receive already authorized subject scope but still include subject identifiers in resource queries to enforce data partitioning at query level.

Future caregiver/HCP authorization must enter through a new approved policy layer; do not generalize v1 self authorization into permissive relationship checks now.

## 26. Non-enumeration

GET/PATCH/DELETE for a resource not owned by the resolved subject returns the same public result as a nonexistent resource according to P8. Transport metrics may distinguish internal categories only if they do not expose them to clients or PHI-unsafe logs.

## 27. Transaction ownership

Transport handlers never own database transactions directly. Application services own mutation transaction boundaries. This prevents routes from accidentally committing resource changes without audit/outbox/idempotency atomicity.

## 28. Failure behavior

The API must fail closed on missing production medical configuration, revision-token secret, cursor-token secret, or required service wiring.

No endpoint silently falls back to IndexedDB/local-only data when cloud persistence fails.

## 29. Versioning

All P10 endpoints remain under `/api/v1`. Breaking transport or schema changes require an explicit versioning decision. Cursor and token codecs are independently versioned so internal rotation/evolution does not force a public API version bump when semantics remain compatible.

## 30. Test architecture

Required unit/contract coverage:

- request DTO validation;
- server-owned field rejection;
- auth principal required;
- client cannot choose account/subject ownership;
- error-envelope mapping;
- ETag strong syntax and `If-Match` parsing;
- missing precondition -> 428;
- stale valid precondition -> 412;
- malformed/tampered token rejection;
- cursor round-trip/tamper/subject-replay/query-shape replay rejection;
- bounded page size;
- no OFFSET path;
- response mapper excludes internal fields;
- idempotent replay mapping;
- idempotency conflict mapping;
- soft-delete behavior;
- non-enumeration for GET/PATCH/DELETE;
- cache-control headers;
- no persistence imports from route handlers;
- no medical secrets in client bundles.

Required integration/E2E coverage before approval:

- authenticated self-subject resolution;
- create -> get -> list;
- update with current ETag;
- update with stale ETag;
- delete with current ETag;
- deleted resource absent from normal GET/list;
- duplicate create with same idempotency key/payload returns one canonical resource;
- same idempotency key/different payload conflicts;
- list traversal remains duplicate-free under concurrent insert/update scenarios defined by P9;
- another account cannot enumerate or mutate a resource;
- unauthenticated route behavior is stable.

## 31. Import boundaries

Add/extend static regression tests so `apps/web/app/api/v1/medical/**` cannot import:

- `@diabetes-universe/medical-persistence`;
- Drizzle schema modules;
- raw DB clients;
- `MEDICAL_DATABASE_URL` directly.

Routes may import only the approved server composition/application boundary and neutral API contract utilities.

## 32. Production enablement gate

P10 code may merge before public production enablement only if the routes are not exposed/activated unintentionally. Production activation requires all of:

- P9 live Neon role/privilege smoke check passed;
- foundation and privilege migrations applied;
- production medical runtime credential confirmed to be `medical_app`-equivalent least privilege;
- revision and cursor secrets provisioned securely;
- auth/CSRF/origin policy validated;
- rate/payload limits configured;
- E2E security matrix passed;
- logging reviewed for PHI safety;
- rollback/disable switch documented;
- Vercel/production deployment validation passed.

## 33. Rollback and disable strategy

The transport must support rapid disablement without deleting medical data. Recommended control is a server-side production feature gate/config flag that returns a controlled unavailable response before service mutation. The gate must default safely in environments where medical runtime configuration is incomplete.

Disabling routes must not alter P9 data or migrations.

## 34. Architecture decisions

### A. Route handlers vs direct repository access

**Decision:** thin handlers -> application/service boundary.

Pros: preserves authorization and transaction invariants, testable mapping, prevents SQL leakage. Cons: adds explicit composition code. The isolation benefit is mandatory for medical data.

### B. Raw revision numbers vs opaque ETags

**Decision:** opaque strong ETags backed by the P9 revision token service.

Raw revisions would expose implementation detail and weaken tamper resistance. P8/P9 already approve opaque resource-bound tokens.

### C. OFFSET vs keyset cursors

**Decision:** signed keyset cursor with traversal boundary.

OFFSET is rejected for unbounded medical history because concurrent writes cause unstable traversal and performance degradation.

### D. Route-owned transactions vs service-owned transactions

**Decision:** service-owned transactions only.

This protects atomic resource/audit/outbox/idempotency semantics.

### E. Full medical response in idempotency table vs minimal result reference

**Decision:** retain the P9 minimal-result design and reconstruct the response through authorized service reads where safe.

This minimizes duplicated PHI.

## 35. Approval checklist

P10 may move from Draft to Approved only when reviewers confirm:

- [ ] Route scope matches approved P8 contracts.
- [ ] No P7/P8/P9 invariant is weakened.
- [ ] Authentication is resolved server-side.
- [ ] Client cannot choose canonical account or subject ownership.
- [ ] Route handlers cannot access persistence directly.
- [ ] Create idempotency remains service-transaction atomic.
- [ ] `If-Match` uses strong opaque resource-bound tokens.
- [ ] Update/delete use database CAS, not read-check-write.
- [ ] GET/PATCH/DELETE preserve non-enumeration.
- [ ] Cursor design is signed, versioned, subject-bound, and traversal-safe.
- [ ] List queries are bounded and OFFSET-free.
- [ ] Soft delete remains the normal delete path.
- [ ] API errors leak no SQL/internal/PHI detail.
- [ ] Authenticated medical responses are `private, no-store`.
- [ ] CSRF/origin policy is explicit for state-changing cookie-auth routes.
- [ ] Payload and abuse bounds are explicit before production activation.
- [ ] Logs are PHI-safe.
- [ ] Revision/cursor/database secrets are server-only and independently managed.
- [ ] Production activation requires the P9 live Neon privilege smoke gate.
- [ ] Integration/E2E matrix covers ownership, concurrency, idempotency, pagination, and delete behavior.
- [ ] No sync/adoption/CGM/caregiver/HCP/product-surface scope has leaked into P10.

## Current decision

P10 transport architecture is drafted for architecture/security audit. No P10 public route implementation is approved until this document completes the approval gate.