# P8 — Medical API Transport Implementation

## Status

**Implementation candidate**

Date: 2026-08-21

Architecture baseline: [P8 Medical API Contracts](../architecture/api/p8-medical-api-contracts.md)

Persistence baseline: [P9 Medical Persistence Foundation](p9-medical-persistence-foundation.md)

OpenAPI artifact: [medical-v1.yaml](../api/openapi/medical-v1.yaml)

## Scope delivered

- versioned HTTP transport for self-subject medical event resources;
- server-only composition through `@diabetes-universe/medical-service`;
- authenticated session boundary via existing identity helpers;
- create/get/list/update/delete handlers for `/api/v1/medical/me/medical-events`;
- P8 error envelope, idempotency, revision precondition, keyset cursor transport;
- transport-safe validation bounds and bounded request-body enforcement;
- pluggable rate-limit contract with deterministic test implementation;
- version-controlled OpenAPI artifact with CI validation.

## Endpoints

| Method   | Path                                            | Behavior                                          |
| -------- | ----------------------------------------------- | ------------------------------------------------- |
| `GET`    | `/api/v1/medical/me/medical-events`             | List active resources with keyset pagination      |
| `POST`   | `/api/v1/medical/me/medical-events`             | Create resource with scoped idempotency           |
| `GET`    | `/api/v1/medical/me/medical-events/:resourceId` | Read one resource                                 |
| `PATCH`  | `/api/v1/medical/me/medical-events/:resourceId` | Update with `If-Match` revision precondition      |
| `DELETE` | `/api/v1/medical/me/medical-events/:resourceId` | Soft delete with `If-Match` revision precondition |

## Auth boundary

- every route resolves authentication from the existing Better Auth session;
- unauthenticated requests return `401 AUTH_REQUIRED`;
- client-supplied account/subject identifiers are never authoritative;
- the server resolves/provisions the current account's active self subject through `medical-service`.

## Subject resolution

- account identity comes from `getAuthenticatedPrincipal()`;
- active self subject is resolved or provisioned through `MedicalSubjectService`;
- all repository access is scoped to the resolved `subjectId`.

## Correlation ID policy

- every request receives a server-generated `correlationId` (UUID);
- client `x-correlation-id` is ignored and must never become authoritative;
- optional bounded `x-request-id` may be accepted as separate metadata only (ASCII printable, max 128 chars);
- oversized or malformed client request IDs are dropped silently;
- correlation IDs and logs must not include PHI, secrets, or semantic medical payloads.

## Idempotency behavior

- create requires `Idempotency-Key` header;
- scope binds to authenticated account + resolved subject + API version + operation scope;
- same scoped key + same normalized request fingerprint replays the original result;
- same scoped key + different fingerprint returns `409 IDEMPOTENCY_CONFLICT`;
- retention window is controlled by `MEDICAL_IDEMPOTENCY_RETENTION_HOURS`;
- expired idempotency rows may be purged by maintenance (`medical.purge_expired_idempotency_records`), after which the same key may create a new resource (covered by persistence purge tests).

## Revision / ETag behavior

- public `revision` field exposes opaque revision tokens only;
- raw bigint revisions are not exposed;
- `PATCH` and `DELETE` require `If-Match`;
- missing `If-Match` returns `428 PRECONDITION_REQUIRED`;
- malformed/invalid revision token returns `400 VALIDATION_FAILED`;
- stale but well-formed revision returns `412 REVISION_CONFLICT`.

## Cursor / pagination behavior

- list uses keyset traversal ordered by `(eventObservedAt DESC, resourceId DESC)`;
- no `OFFSET` pagination;
- continuation cursor is opaque, MAC-protected, and scoped to subject/API version/limit;
- malformed/tampered/wrong-context cursors return `400 INVALID_CURSOR`;
- maximum list `limit` is 100.

## Request size enforcement

- maximum request body size is 65536 bytes (`MEDICAL_MAX_REQUEST_BYTES`);
- enforcement uses byte counts, not JavaScript string length;
- oversize `Content-Length` values are rejected before body read;
- streamed bodies accumulate through a bounded reader and abort once the byte cap is exceeded;
- misleading/absent `Content-Length` values cannot bypass the cap;
- oversize payloads return `413 REQUEST_TOO_LARGE` without echoing body content.

## Validation bounds (transport safety)

Defined in `apps/web/lib/medical/server/medical-api-validation-bounds.ts`:

| Bound                        | Value                    |
| ---------------------------- | ------------------------ |
| Max object nesting depth     | 8                        |
| Max string length            | 4096                     |
| Max generic array length     | 100                      |
| Max nutrition products array | 20                       |
| Glucose mmol/L               | 0.1 – 100 (positive)     |
| Insulin dose units           | 0 – 500 (non-negative)   |
| Carbohydrates grams          | 0 – 2000 (non-negative)  |
| Medication dose              | 0 – 10000 (non-negative) |
| Activity duration seconds    | 1 – 86400 (positive)     |
| Max list limit               | 100                      |

These are transport safety bounds, not clinical treatment rules.

## Rate limiting architecture

Pluggable limiter: `apps/web/lib/medical/server/medical-api-rate-limit.ts`

| Mode                          | Behavior                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| `disabled` (default)          | Allows all traffic; used for current implementation candidate |
| `test` (`NODE_ENV=test` only) | Deterministic in-memory limiter for contract tests            |
| `distributed`                 | Fail-closed until `MEDICAL_RATE_LIMIT_BACKEND` is configured  |

- exceeded limits return `429 RATE_LIMITED` with stable envelope and `Retry-After`;
- no unsafe per-instance in-memory limiter is used in production mode;
- **public production medical traffic must not be enabled until a shared/distributed limiter backend is configured and verified**.

## Error mapping

Transport maps service/domain failures to the P8 envelope:

| Condition                        | HTTP | Code                    |
| -------------------------------- | ---- | ----------------------- |
| Unauthenticated                  | 401  | `AUTH_REQUIRED`         |
| Semantic validation failure      | 422  | `VALIDATION_FAILED`     |
| Malformed If-Match token         | 400  | `VALIDATION_FAILED`     |
| Oversized body                   | 413  | `REQUEST_TOO_LARGE`     |
| Invalid cursor                   | 400  | `INVALID_CURSOR`        |
| Missing `If-Match`               | 428  | `PRECONDITION_REQUIRED` |
| Stale revision                   | 412  | `REVISION_CONFLICT`     |
| Missing/inaccessible resource    | 404  | `RESOURCE_NOT_FOUND`    |
| Idempotency mismatch             | 409  | `IDEMPOTENCY_CONFLICT`  |
| Rate limited                     | 429  | `RATE_LIMITED`          |
| Transient infrastructure failure | 503  | `SERVICE_UNAVAILABLE`   |
| Unexpected failure               | 500  | `INTERNAL_ERROR`        |

Low-level database/service exceptions are not exposed verbatim to clients.

## OpenAPI artifact

- path: `docs/api/openapi/medical-v1.yaml`;
- CI validation: `pnpm validate:openapi` (`scripts/validate-openapi.mjs` using `@apidevtools/swagger-parser`);
- documents all five endpoints, auth requirement, idempotency/revision headers, pagination, schemas, and applicable error responses.

## Security boundaries

- route handlers do not issue SQL directly;
- `apps/web` imports `@diabetes-universe/medical-service` only from `lib/medical/server/*`;
- React `use client` components must not import medical-service or medical-persistence paths;
- responses use `Cache-Control: private, no-store`;
- transport logging must not include semantic medical payloads, secrets, or auth headers.

## Environment variables

| Variable                                         | Purpose                                             |
| ------------------------------------------------ | --------------------------------------------------- |
| `MEDICAL_DATABASE_URL`                           | PostgreSQL runtime URL for medical persistence      |
| `MEDICAL_REVISION_TOKEN_SECRET`                  | HMAC secret for revision/ETag tokens                |
| `MEDICAL_LIST_CURSOR_SECRET`                     | HMAC secret for list pagination cursors             |
| `MEDICAL_IDEMPOTENCY_RETENTION_HOURS`            | Idempotency retention window                        |
| `MEDICAL_RATE_LIMIT_MODE`                        | `disabled` (default), `test`, or `distributed`      |
| `MEDICAL_RATE_LIMIT_BACKEND`                     | Required identifier for distributed limiter backend |
| `MEDICAL_DATABASE_MODE=pglite` / `NODE_ENV=test` | Local/test PGlite bootstrap                         |

Production-capable modes fail closed when required secrets are absent.

## Test coverage

- medical-persistence list cursor token tests;
- medical-persistence idempotency purge/retention tests;
- medical-service PGlite contract tests for CRUD, idempotency, pagination, and non-enumeration;
- apps/web handler contract matrix (auth, cross-account 404, If-Match 428/400/412, body size, rate limit 429, correlation ID, cache headers, import boundary);
- bounded request-body reader tests (ASCII/multibyte/absent or misleading Content-Length);
- validation bounds/depth tests;
- OpenAPI syntactic validation in CI.

## Explicit non-scope

- P10 adoption/import runtime;
- P11 offline sync runtime;
- P12 conflict/tombstone feed runtime beyond P8 soft delete;
- outbox dispatcher/consumer;
- Timeline UI integration;
- distributed rate limiting backend implementation;
- production Neon deployment.

## Known remaining production blockers

- shared/distributed rate limiter backend not configured (`MEDICAL_RATE_LIMIT_BACKEND`);
- production medical database deployment and launch gate remain separate;
- dedicated authenticated Playwright HTTP E2E for medical routes;
- architecture/security/code re-audit required before lifecycle promotion beyond implementation candidate.

## Lifecycle

This transport layer remains **implementation candidate** until re-audit passes. Do not mark complete or production-ready while distributed rate limiting and launch gates remain open.
