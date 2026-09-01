# Wave 4E — Insulin Medical API / Adoption / OpenAPI

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4E                                                                           |
| Status       | **Implemented on branch / pending merge**                                    |
| Date         | 2026-09-01                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Depends on   | [Wave 4D](wave-4d-insulin-quick-add-save-integrity.md) (merged)              |
| Base SHA     | `8c776882c7d7af51655fd0e80b81d513fb148730`                                   |

Medical API v1 and the adoption boundary now accept, persist, and return
semantic insulin fields `preparationId` and `administrationContext` without
breaking historical insulin transport. This slice does **not** implement cloud
sync, outbox replay, or multi-device conflict resolution.

## Scope

Implemented:

- fail-closed semantic event allow-list includes `preparationId` and
  `administrationContext`;
- insulin kind validation reuses `isInsulinPreparationId` and
  `isInsulinAdministrationContext` from `@diabetes-universe/medical-domain`;
- POST / GET / LIST / PATCH preserve semantic insulin fields verbatim;
- adoption accepts semantic insulin rows and legacy insulin rows;
- OpenAPI `InsulinPreparationId` and `InsulinAdministrationContext` schemas
  with enum parity against the medical-domain registry and types union.

Not implemented (unchanged by this slice):

- cloud sync engine, outbox consumer, P11/P12 conflict resolution;
- insulin calculators, IOB, carb ratio, correction factor, pump, therapy plans;
- Wave 4F;
- production medical-cloud runtime activation;
- Wave 4D local save-integrity architecture.

## Old insulin API shape

Runtime `validateSemanticEvent` allowed only:

- `preparation` (required non-empty string)
- `doseUnits` (finite number, existing 0–500 transport bound)
- legacy `context` (optional string)

`preparationId` and `administrationContext` were unknown fields and failed
closed on create, update, and adoption.

## New accepted semantic fields

When present:

- `preparationId` must be a canonical `InsulinPreparationId` from the
  medical-domain registry. Unknown IDs, `insulin.prep.unmapped`, and display
  labels are rejected.
- `administrationContext` must be one of `before_meal`, `after_meal`,
  `correction`, `basal`, `other`, `unspecified`. Localized or free-text tokens
  are rejected.

`preparation` remains a required non-empty bounded snapshot. It is never
matched against the current catalogue label. `insulin.prep.other` still
requires a non-empty snapshot; the API does not substitute localized “Other”.

## Legacy compatibility

Historical shape remains valid:

```json
{
  "kind": "insulin",
  "preparation": "NovoRapid",
  "doseUnits": 4,
  "context": "Перед едой"
}
```

The API does not fabricate `preparationId` for unmatched history. When both
`administrationContext` and `context` are present, neither is rewritten.
Reader/presentation precedence stays `administrationContext` → governed legacy
mapping → fallback. `schemaVersion` remains `1`.

## Persistence / read path

```text
HTTP request
  → parseJsonBody / validateCreateRequestBody or validateUpdateRequestBody
  → MedicalEventService createWithIdempotency / updateWithRevision / get / list
  → Indexed JSON persistence of the canonical semantic event
  → toPublicMedicalEventResource() returns resource.semanticEvent verbatim
```

Adoption uses the same `validateSemanticEvent` after stripping server-owned
lifecycle fields, then `eventRepository.insert`.

## OpenAPI

Additive schemas on `docs/api/openapi/medical-v1.yaml`:

- `InsulinPreparationId` — enum exactly matching `INSULIN_PREPARATION_IDS`
- `InsulinAdministrationContext` — enum exactly matching
  `INSULIN_ADMINISTRATION_CONTEXTS`
- optional `preparationId` / `administrationContext` on
  `SemanticTimelineEvent`

`insulin.prep.unmapped` is absent. Existing required envelope fields are
unchanged.

## Safety

This slice does not calculate, recommend, default, or derive insulin. Dose
precision is not rounded at API/storage. `preparationCategory` is not a
persisted or transport field.
