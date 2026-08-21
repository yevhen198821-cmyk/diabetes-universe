# P8 — Medical API Transport Implementation

## Status

**Implementation candidate**

Date: 2026-08-21

Architecture baseline: [P8 Medical API Contracts](../architecture/api/p8-medical-api-contracts.md)

Persistence baseline: [P9 Medical Persistence Foundation](p9-medical-persistence-foundation.md)

## Scope delivered

- versioned HTTP transport for self-subject medical event resources;
- server-only composition through `@diabetes-universe/medical-service`;
- authenticated session boundary via existing identity helpers;
- create/get/list/update/delete handlers for `/api/v1/medical/me/medical-events`;
- P8 error envelope, idempotency, revision precondition, and keyset cursor transport.

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

## Idempotency behavior

- create requires `Idempotency-Key` header;
- scope binds to authenticated account + resolved subject + API version + operation scope;
- same scoped key + same normalized request fingerprint replays the original result;
- same scoped key + different fingerprint returns `409 IDEMPOTENCY_CONFLICT`.

## Revision / ETag behavior

- public `revision` field exposes opaque revision tokens only;
- raw bigint revisions are not exposed;
- `PATCH` and `DELETE` require `If-Match`;
- missing/invalid precondition returns `428 PRECONDITION_REQUIRED`;
- stale revision returns `412 REVISION_CONFLICT`.

## Cursor / pagination behavior

- list uses keyset traversal ordered by `(eventObservedAt DESC, resourceId DESC)`;
- no `OFFSET` pagination;
- continuation cursor is opaque, MAC-protected, and scoped to subject/API version/limit;
- malformed/tampered/wrong-context cursors return `400 INVALID_CURSOR`.

## Error mapping

Transport maps service/domain failures to the P8 envelope:

| Condition                     | HTTP | Code                    |
| ----------------------------- | ---- | ----------------------- |
| Unauthenticated               | 401  | `AUTH_REQUIRED`         |
| Validation failure            | 422  | `VALIDATION_FAILED`     |
| Oversized body                | 413  | `REQUEST_TOO_LARGE`     |
| Invalid cursor                | 400  | `INVALID_CURSOR`        |
| Missing/invalid `If-Match`    | 428  | `PRECONDITION_REQUIRED` |
| Stale revision                | 412  | `REVISION_CONFLICT`     |
| Missing/inaccessible resource | 404  | `RESOURCE_NOT_FOUND`    |
| Idempotency mismatch          | 409  | `IDEMPOTENCY_CONFLICT`  |
| Unexpected failure            | 500  | `INTERNAL_ERROR`        |

## Security boundaries

- route handlers do not issue SQL directly;
- `apps/web` imports `@diabetes-universe/medical-service` only from `lib/medical/server/*`;
- browser/client components must not import medical-service or medical-persistence;
- responses use `Cache-Control: private, no-store`;
- transport logging must not include semantic medical payloads, secrets, or auth headers.

## Environment variables

| Variable                                         | Purpose                                        |
| ------------------------------------------------ | ---------------------------------------------- |
| `MEDICAL_DATABASE_URL`                           | PostgreSQL runtime URL for medical persistence |
| `MEDICAL_REVISION_TOKEN_SECRET`                  | HMAC secret for revision/ETag tokens           |
| `MEDICAL_LIST_CURSOR_SECRET`                     | HMAC secret for list pagination cursors        |
| `MEDICAL_IDEMPOTENCY_RETENTION_HOURS`            | Idempotency retention window                   |
| `MEDICAL_DATABASE_MODE=pglite` / `NODE_ENV=test` | Local/test PGlite bootstrap                    |

Production-capable modes fail closed when required secrets are absent.

## Test coverage

- medical-persistence list cursor token tests;
- medical-service PGlite contract tests for CRUD, idempotency, pagination, and non-enumeration;
- apps/web handler tests for auth, idempotency replay, precondition errors, cursor tampering, cache headers, and import boundary allowlist.

## Explicit non-scope

- P10 adoption/import runtime;
- P11 offline sync runtime;
- P12 conflict/tombstone feed runtime beyond P8 soft delete;
- outbox dispatcher/consumer;
- Timeline UI integration;
- distributed rate limiting implementation;
- production Neon deployment;
- OpenAPI artifact generation in this wave.

## Known deferred items

- distributed rate limiting guard (P8/P13 normative, but no approved shared enforcement primitive in current infrastructure);
- OpenAPI contract artifact and CI breaking-change validation;
- dedicated API E2E through Playwright authenticated HTTP scenarios;
- production launch infrastructure gate remains separate from this transport wave.
