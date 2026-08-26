# Wave 2C — Diabetes Settings Runtime API

Runtime decisions for Wave 2D UI and Wave 2E integrations.

## Unconfigured representation

`GET /api/v1/medical/me/diabetes-settings` and `GET /api/v1/medical/me/glucose-target-profile`
return **HTTP 200** without creating rows.

| Field                      | Unconfigured settings                              | Unconfigured target profile |
| -------------------------- | -------------------------------------------------- | --------------------------- |
| `configured`               | `false`                                            | `false`                     |
| `settingsId` / `profileId` | `null`                                             | `null`                      |
| `glucoseDisplayUnit`       | `null`                                             | n/a                         |
| `diabetesType`             | `{ category: "unknown", source: "self_reported" }` | n/a                         |
| `defaultRange`             | n/a                                                | `null`                      |
| `createdAt` / `updatedAt`  | `null`                                             | `null`                      |
| `revision`                 | Bootstrap opaque token                             | Bootstrap opaque token      |

Bootstrap tokens are bound to synthetic resource ids:

- `bootstrap:diabetes-settings:{subjectId}`
- `bootstrap:glucose-target-profile:{subjectId}`

## Revision / conflict contract

- Mutations require `If-Match` with the opaque `revision` token from the latest GET.
- First create uses the bootstrap token from an unconfigured GET.
- Stale tokens return **HTTP 412** with `REVISION_CONFLICT` (P8 medical API convention).
- Missing `If-Match` returns **HTTP 428** `PRECONDITION_REQUIRED`.
- Concurrent initial creates are serialized with advisory locks; the loser receives **412**.

## Target provenance restrictions

Self-service writes always persist `source = user_defined`.

Clients must not send `clinician_defined`, `imported`, or `system_reference`; those values are rejected at validation when present in the request body.

## Clear-target semantics

`DELETE /api/v1/medical/me/glucose-target-profile` clears the personalized default range by nulling persisted columns (no row delete). Requires `If-Match`. Clearing is audited as `glucose_target_profile.default_range.cleared`.

## Canonical mmol/L API semantics

Target write APIs accept and return `lowMmolPerL` / `highMmolPerL` only. Display-unit conversion belongs in UI/formatting layers.

## Audit policy (Wave 2C)

| Change                     | Audit                                                      |
| -------------------------- | ---------------------------------------------------------- |
| Target create/update/clear | Required (`medical_audit_events`)                          |
| Diabetes type              | Required (`diabetes_settings.updated`)                     |
| Display unit               | Required (`diabetes_settings.updated`) per Wave 2A §17–§18 |
| Settings/target read       | No audit                                                   |

Target mutations and audit inserts share one database transaction.

## Database privileges

Production requires migration `0006_medical_diabetes_settings_privileges.sql` after `0005_medical_diabetes_settings.sql`.

`medical_app` receives `SELECT, INSERT, UPDATE` on `diabetes_settings` and `glucose_target_profiles` (no `DELETE`).
