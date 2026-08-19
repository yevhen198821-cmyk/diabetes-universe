# P13 — Security, Privacy, and Production Hardening Architecture

## Status

**Architecture Design — Approved**

Date: 2026-08-19

## Purpose

P13 is the closing architecture gate for the medical-platform foundation established by P7 through P12. It converts the accumulated security, privacy, sync, conflict, persistence, and deletion invariants into one production-hardening model that must hold before medical runtime capabilities are enabled for real users.

P13 does not add product features. It defines the controls required to operate the approved medical architecture safely at production scale.

## Canonical dependencies

P13 inherits and must not weaken:

- `docs/architecture/backend/p7-backend-medical-data-architecture.md`
- `docs/architecture/api/p8-medical-api-contracts.md`
- `docs/architecture/backend/p9-cloud-medical-persistence-implementation-design.md`
- `docs/implementation/p9-medical-persistence-foundation.md`
- `docs/architecture/sync/p10-local-data-adoption-architecture.md`
- `docs/architecture/sync/p11-offline-sync-architecture.md`
- `docs/architecture/sync/p12-conflict-revision-tombstone-architecture.md`

The medical platform foundation is considered architecture-complete only when the controls below are implemented and verified through later implementation gates.

## 1. Security objectives

The production medical platform must preserve:

- confidentiality of medical data;
- integrity of medical history and sync state;
- availability without unsafe fallback behavior;
- subject-scoped authorization;
- least-privilege data access;
- durable auditability;
- anti-resurrection guarantees for deleted resources;
- deterministic conflict handling;
- PHI minimization in logs, metrics, traces, caches, and support tooling;
- recoverability from operational failure without weakening authorization or revision rules.

## 2. Trust boundaries

The system recognizes explicit trust boundaries:

```text
Browser / iOS / Android client
→ authenticated application transport
→ application/service layer
→ medical persistence repositories
→ PostgreSQL/Neon medical schema
```

Additional bounded trust zones include:

- authentication/identity infrastructure;
- migration/deployment credentials;
- maintenance workers;
- observability pipeline;
- backups and recovery tooling;
- external email/support/analytics systems;
- future integrations and devices.

No boundary may inherit medical-data privileges merely because it belongs to the same application or account.

## 3. Identity and authorization

Authoritative actor identity is always derived server-side from a validated authentication context.

Rules:

- client-supplied `accountId`, `subjectId`, ownership fields, or role labels never grant access;
- self-subject resolution remains server-owned;
- resource access is re-authorized on every request;
- individual-resource cross-subject probes remain non-enumerating;
- session or auth-provider identifiers do not become medical ownership keys;
- caregiver/HCP access requires a separately approved delegation model and is not activated by P13.

Authorization checks must execute before medical payload disclosure.

## 4. Authentication strength and sensitive actions

Normal authenticated access may use the approved account session model, but sensitive account/security operations require stronger controls when introduced.

Future high-risk operations such as medical export, permanent account purge, delegation changes, credential reset, or recovery override must define re-authentication and freshness requirements before implementation.

P13 does not itself introduce OAuth, MFA, or passkeys, but future identity upgrades must not bypass the medical authorization boundary.

## 5. Database least privilege

Production runtime uses the dedicated medical application credential defined by P9.

Required posture:

- no DDL from request-serving runtime;
- no blanket schema privileges;
- no runtime physical DELETE for normal medical resources;
- audit writes remain append-oriented;
- outbox writes remain narrowly scoped;
- maintenance operations use dedicated roles/functions;
- migration credentials are deploy/CI-only;
- compliance purge remains isolated from ordinary runtime.

Every new medical table/function introduced by later implementation waves requires explicit privilege review.

## 6. Production privilege verification

SQL definitions alone are insufficient evidence.

Before enabling medical runtime in production, deployment must verify effective PostgreSQL privileges from system catalogs or equivalent smoke tests.

Verification must prove at minimum:

- runtime role cannot perform DDL;
- runtime role cannot physically delete protected medical rows;
- maintenance roles cannot exceed documented scope;
- privileged functions are not executable by PUBLIC;
- ownership of `SECURITY DEFINER` functions is isolated;
- default privileges do not leak access to future objects.

A failed privilege verification blocks production enablement.

## 7. Secrets and key management

Medical secrets are server-only.

Relevant secret classes include:

- `MEDICAL_DATABASE_URL`;
- migrator/deployment database credential;
- revision-token HMAC secret;
- future sync-cursor signing secret;
- future encryption keys.

Rules:

- secrets are never committed;
- production rejects missing/weak secrets;
- secrets are not exposed to browser bundles;
- secrets are not logged;
- separate security purposes use separate keys where practical;
- key versioning supports rotation without invalidating all safe in-flight state unexpectedly;
- rotation procedures must be tested before production dependence.

## 8. Encryption in transit

All production medical transport requires TLS.

No supported client may connect directly to PostgreSQL/Neon.

Service-to-service medical traffic, if introduced later, must preserve authenticated encrypted transport appropriate to its deployment environment.

## 9. Encryption at rest

Database/storage encryption provided by the infrastructure platform is required as a baseline but is not treated as a substitute for authorization or least privilege.

Field-level encryption is not mandated globally by P13 because indiscriminate application encryption can break indexing, search, migrations, and recovery. It may be added for narrowly justified fields after threat-model and operational review.

Local Web/mobile medical storage must use platform-appropriate protected storage. Exact native keychain/keystore/database-encryption implementation remains platform-specific.

## 10. PHI minimization

Medical payloads are not copied into secondary systems by default.

PHI must not appear in:

- URLs;
- metric labels;
- tracing span names;
- log message templates;
- exception titles;
- analytics event properties;
- deployment metadata;
- support ticket metadata;
- crash-report breadcrumbs;
- cache keys visible outside the protected boundary.

When operational diagnosis needs medical context, use controlled, audited access rather than normal telemetry.

## 11. Logging policy

Safe logs may contain:

- correlation ID;
- safe actor/session pseudonymous internal reference where justified;
- route/operation category;
- safe result code;
- latency;
- bounded counts;
- protocol/version;
- service/component name.

Logs must exclude raw semantic medical payloads, auth credentials, secrets, free text, glucose values, insulin doses, medication details, nutrition details, and raw request/response bodies by default.

## 12. Observability and cardinality

Metrics must avoid PHI and uncontrolled high-cardinality identifiers.

Resource IDs, subject IDs, cursor values, mutation IDs, and adoption IDs are not general-purpose metric labels.

Operational dashboards should aggregate by safe dimensions such as status class, operation family, platform, version, latency bucket, and queue-depth bucket.

## 13. Caching

Authenticated medical responses default to private/no-store behavior.

No shared CDN or public cache may reuse personalized medical responses across users.

Any later caching optimization requires explicit proof that:

- authorization boundaries are preserved;
- cache keys cannot cross subjects;
- invalidation follows revision/deletion semantics;
- PHI does not leak to shared infrastructure.

## 14. Browser security

Cookie-authenticated medical mutations require CSRF/origin defenses consistent with the chosen web authentication model.

Web implementation must also maintain:

- secure cookie settings;
- appropriate SameSite strategy;
- XSS-resistant rendering;
- no medical payload in client-side error trackers by default;
- Content Security Policy appropriate to deployed features;
- no accidental bundling of server-only medical modules or secrets.

## 15. Input validation

All external medical input is runtime-validated at the server boundary.

Validation includes:

- allow-listed fields;
- semantic schema validation;
- size/depth limits;
- bounded strings and arrays;
- date/time format validation;
- numeric range validation;
- rejection of server-owned fields;
- protocol/schema version checks.

Generated TypeScript types do not replace runtime validation.

## 16. Abuse and resource exhaustion

Production medical endpoints require layered abuse controls.

At minimum:

- per-actor/session/account rate limits;
- stricter mutation limits;
- bounded batch sizes;
- bounded page sizes;
- request-size limits;
- depth/complexity limits;
- database statement/query bounds;
- retry/backoff guidance;
- protection from high-cardinality filter abuse.

Rate limiting is never treated as authorization.

## 17. Revision integrity

Opaque revision tokens remain bound to resource identity and authoritative revision.

Rules:

- raw database revision authority is not client-controlled;
- stale writes fail through CAS;
- malformed/tampered tokens fail safely;
- replay of an already committed idempotent mutation does not advance revision again;
- delete creates an authoritative tombstone revision according to P12;
- restore, if introduced, is a new explicit transition rather than hidden revision rollback.

## 18. Idempotency security

Idempotency keys and mutation identities contain no PHI.

Server scope includes actor/account, subject, protocol/API version, operation domain, and mutation key as appropriate.

The same key with a materially different canonical request fingerprint fails deterministically and does not mutate additional resources.

Retention must cover realistic retry windows without becoming indefinite PHI-adjacent storage.

## 19. Sync cursor security

Sync cursors are opaque, integrity-protected, subject-bound, and version-bound.

They contain no PHI or credentials.

A cursor cannot grant authorization, cannot cross subjects, and cannot be client-incremented.

Expired or unserviceable cursors produce explicit rehydration behavior rather than silent skipping.

## 20. Conflict privacy

Conflict evidence preserves enough authorized state for safe resolution but must not become an uncontrolled duplicate medical-history store.

Conflict responses and telemetry expose only the minimum authorized information required for the client to understand that a conflict exists.

No automatic AI or heuristic medical merge is permitted.

## 21. Tombstone privacy and anti-resurrection

Tombstones are security/integrity evidence, not ordinary user-visible medical payloads.

They retain the minimum data required to:

- identify the canonical resource;
- prove deleted lifecycle state;
- preserve revision lineage;
- synchronize deletion;
- prevent stale devices from resurrecting deleted data.

Payload minimization or retention cleanup must never break anti-resurrection guarantees within the supported offline/recovery horizon.

## 22. Data retention

Retention policy distinguishes:

- active medical records;
- tombstone/anti-resurrection evidence;
- idempotency records;
- sync change feed;
- audit evidence;
- operational logs;
- backups.

Each class receives an explicit retention period before production launch. Retention is not inferred from application convenience.

Shortening retention must be evaluated against offline-client, recovery, audit, and legal obligations.

## 23. User deletion versus physical purge

Normal DELETE of a medical event follows P12 lifecycle/tombstone semantics and is not equivalent to physical database purge.

Account-level or compliance-driven permanent purge is a separate privileged workflow.

Such purge must require:

- explicit authorization;
- dedicated service/role boundary;
- auditable request;
- retention/legal-policy checks;
- backup/recovery consideration;
- no request-runtime blanket delete capability.

P13 does not implement compliance purge.

## 24. Backup and recovery

Production readiness requires documented backup and restore capability.

Recovery design must preserve:

- subject ownership;
- canonical resource IDs;
- revisions;
- tombstone state;
- sync ordering evidence;
- audit integrity;
- idempotency expectations where still within supported windows.

Restoring database content without corresponding sync/tombstone semantics may create resurrection or convergence failures and is therefore unsafe.

## 25. RPO and RTO

RPO/RTO targets must be defined as launch operations policy before production medical-data enablement.

The values are product/operations decisions rather than arbitrary architecture constants.

Production enablement is blocked while backup exists only as an unverified provider assumption.

## 26. Disaster recovery validation

A restore procedure must be exercised in a non-production environment.

The validation must demonstrate:

- restored medical rows are queryable under correct authorization;
- revisions remain valid;
- tombstones remain effective;
- sync feed/checkpoint recovery has a defined strategy;
- audit records remain consistent;
- no credentials or access grants are accidentally broadened.

## 27. Audit integrity

Audit evidence is append-oriented and PHI-minimized.

It records operational facts such as actor reference, subject, operation category, resource reference, correlation ID, result category, and server time where approved.

The audit system must not become a shadow copy of full semantic medical history.

Runtime application roles cannot rewrite historical audit evidence as normal business logic.

## 28. Administrative access

There is no general-purpose "admin can read every medical record" capability by default.

Operational support requiring access to medical data must use a separately designed, least-privilege, audited break-glass/support model.

P13 does not implement support access.

## 29. Dependency security

Medical runtime dependencies are subject to normal supply-chain controls:

- lockfile-controlled versions;
- automated vulnerability scanning when available;
- reviewed upgrades;
- no secrets in package configuration;
- minimal dependency surface in server medical packages;
- no unreviewed code generation that can change runtime authorization semantics.

Critical dependency vulnerabilities affecting auth, transport, cryptography, database clients, or serialization block production release until assessed.

## 30. CI security gates

Medical implementation PRs must continue to pass:

```text
format
lint
typecheck
unit tests
integration tests
build
E2E
Markdown/link validation
```

Security-sensitive implementation waves additionally require focused regression tests for their invariants.

No failing security test may be converted into a skip merely to satisfy the merge gate without documented approval.

## 31. Architecture boundary tests

CI should enforce module boundaries where feasible:

- browser/UI code cannot import medical persistence internals;
- client bundles cannot reference server secrets;
- routes cannot execute SQL directly;
- auth tables cannot become direct ownership FKs;
- medical domain remains infrastructure-neutral;
- sync/adoption/conflict code enters persistence through approved services/repositories.

## 32. Production configuration validation

Production startup/deploy must fail closed for missing required medical configuration.

Configuration validation must distinguish:

- request-runtime variables;
- deployment/migrator variables;
- maintenance-worker variables;
- signing secrets;
- environment-specific feature gates.

Development/test defaults must never silently activate in production.

## 33. Feature gates and kill switches

High-risk medical capabilities are enabled progressively.

Separate feature gates should exist for major runtime waves such as:

- cloud medical persistence write path;
- local adoption;
- sync push;
- sync pull;
- conflict-resolution actions;
- delete/tombstone propagation.

Disabling a feature must fail safely and must not produce false acknowledgements or discard local user intent.

## 34. Production rollout

Recommended rollout sequence:

```text
internal/test accounts
→ controlled staging with production-equivalent roles
→ small production cohort
→ monitored expansion
→ general availability
```

Each expansion requires evidence that authorization, privilege, sync, error, and observability metrics remain within expected bounds.

## 35. Rollback posture

Rollback must not require destructive medical-data reversal.

Application rollback should preserve durable records and be compatible with already-applied forward migrations.

Database migrations should use expand/contract or another reviewed forward-compatible strategy where possible.

A rollback that would invalidate revisions, tombstones, or sync sequence meaning is not acceptable without a dedicated migration/recovery plan.

## 36. Incident response

Medical production requires an incident classification and response path for at least:

- suspected cross-account data exposure;
- credential compromise;
- unauthorized privilege expansion;
- corrupted revision/sync state;
- tombstone resurrection;
- backup/restore failure;
- PHI leakage to telemetry;
- dependency compromise.

Response procedures must preserve forensic/audit evidence while minimizing further exposure.

## 37. Privacy-by-default product behavior

The application should expose only the minimum medical data required for the user's current task.

Default product behavior avoids:

- unnecessary full-history loads;
- background sharing with unrelated product domains;
- hidden medical-data export to analytics;
- automatic AI access to complete history;
- implicit publication to Community/Marketplace/Recipes.

Every new consumer requires a clear purpose and approved read boundary.

## 38. AI boundary

AI has no privileged bypass around medical authorization, sync, revision, deletion, or privacy rules.

AI may analyze authorized data through approved application services, but it must not:

- diagnose;
- prescribe treatment;
- mutate authoritative medical records without explicit deterministic user action;
- resolve medical conflicts automatically;
- restore deleted records automatically;
- receive broad data merely because it is an AI subsystem.

## 39. Community, Recipes, Marketplace isolation

Community, Recipes, Marketplace, and other non-medical domains do not inherit medical-data access.

Sharing a user account is not a data-access grant.

Any future feature that intentionally publishes or shares medical information requires an explicit consent, minimization, and authorization architecture.

## 40. Mobile parity

Security invariants must remain consistent across Web, iOS, and Android even when implementation details differ.

Native clients may use different credential transport and local storage mechanisms, but they do not get weaker authorization, revision, idempotency, sync, or conflict rules.

## 41. Performance without security bypass

Scaling to millions of users must not be achieved by bypassing authorization or loading unbounded histories.

Approved scaling mechanisms include:

- bounded queries;
- indexed subject/resource access;
- keyset pagination;
- subject-sequenced sync feeds;
- projections/read models;
- connection pooling;
- partitioning when thresholds justify it;
- asynchronous integration processing after atomic durable evidence.

## 42. Production launch blockers

Medical runtime general availability is blocked until all applicable implementation evidence exists for:

- production database role creation and privilege smoke test;
- secrets configured and rotation procedure documented;
- backup/restore test completed;
- RPO/RTO approved;
- PHI-safe observability verified;
- rate/payload limits implemented;
- runtime validation present;
- feature gates/kill switches tested;
- sync/tombstone implementation gates completed for any enabled capability;
- production deployment rollback procedure documented;
- security-focused E2E/integration tests green.

## 43. Explicit non-scope

P13 does not implement:

- public medical API routes;
- local adoption runtime;
- offline sync runtime;
- tombstone/delete propagation runtime;
- conflict-resolution UI;
- caregiver/HCP delegation;
- compliance purge;
- device/CGM/pump integrations;
- media storage;
- Community/Recipes/Marketplace medical sharing;
- AI clinical decision-making;
- legal certification claims.

These require their own implementation/product/compliance gates.

## 44. Post-P13 execution model

P13 closes the medical foundation architecture phase.

Further work proceeds through implementation waves rather than additional architecture stages unless a genuinely new bounded problem requires a new ADR.

Recommended implementation order:

```text
I1 production medical deployment/privilege verification
I2 medical transport/API implementation over P8/P9
I3 P10 local adoption implementation
I4 P11 sync protocol/server ledger implementation
I5 Web persistent outbox/checkpoint/sync orchestration
I6 P12 conflict/tombstone implementation
I7 security/recovery/load validation
I8 controlled production rollout
```

Each implementation wave receives its own code/security/merge gate.

## 45. Architecture approval checklist

P13 is approved only because self-audit confirms:

- [x] P7-P12 authority and ownership invariants are preserved;
- [x] least-privilege database roles remain mandatory;
- [x] production effective privilege verification is required;
- [x] secrets and signing keys are server-only and strength-validated;
- [x] PHI is excluded from ordinary logs, metrics, traces, URLs, and caches;
- [x] browser and native clients cannot access the medical database directly;
- [x] authenticated medical access remains subject-scoped and non-enumerating;
- [x] runtime validation and bounded request/query semantics are mandatory;
- [x] idempotency/revision/sync-cursor integrity rules remain intact;
- [x] conflict evidence is minimized and no automatic medical merge is allowed;
- [x] tombstone retention cannot break anti-resurrection guarantees;
- [x] backup/restore must preserve revision, tombstone, and sync semantics;
- [x] production RPO/RTO and restore testing are launch blockers;
- [x] feature gates and kill switches fail safely;
- [x] rollback cannot rely on destructive medical-data reversal;
- [x] AI and non-medical product domains receive no privileged medical bypass;
- [x] Web/iOS/Android must preserve identical security invariants;
- [x] production rollout is staged and observable;
- [x] P13 does not silently implement deferred runtime capabilities;
- [x] architecture phase ends here unless a new bounded problem genuinely requires another ADR.

## Current decision

**P13 Security, Privacy, and Production Hardening Architecture is approved. P7 through P13 form the completed medical-platform architecture foundation. The project should now move from architecture design into controlled implementation waves, beginning with production medical deployment/privilege verification and the approved medical transport/application boundaries.**
