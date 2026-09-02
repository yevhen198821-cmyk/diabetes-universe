# Wave 4F — Insulin Vertical Closure & Local Contract Hardening

## Status

| Field        | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Wave         | 4F                                                                           |
| Status       | **Implemented on branch / pending merge**                                    |
| Date         | 2026-09-02                                                                   |
| Architecture | [Wave 4A](../architecture/insulin/wave-4a-insulin-recording-architecture.md) |
| Depends on   | [Wave 4E](wave-4e-insulin-api-adoption-openapi.md) (merged)                  |
| Base SHA     | `6adc95de4625285497a45b13406200bb4966a38b`                                   |

Wave 4F closes the existing insulin recording vertical end-to-end without
adding new insulin features. It hardens manual dose parity, edit unchanged-vs-
edited semantics, local IndexedDB supplemental validation, localization submit
coverage, and OpenAPI canonical-max parity.

## Scope

Implemented:

- shared manual insulin dose input policy in
  `apps/web/lib/medical/insulin/insulin-manual-dose-input.ts` used by Quick Add
  and Timeline Edit;
- explicit `doseEdited` edit state: unchanged doses preserve stored canonical
  values (`125`, `12.125`, `500`) without manual re-entry;
- validator injection at the web timeline composition root — generic
  `timeline-web` accepts `TimelineSemanticEventValidator` without importing
  medical-domain;
- supplemental insulin persistence rules on `addEvent`, `updateEvent`,
  `replaceEvents`, `getById`, and query reads with existing quarantine on
  failure;
- German and Ukrainian full Quick Add semantic submit E2E;
- vertical Quick Add → IndexedDB → Dashboard → Timeline → Detail → Edit →
  reload → Dashboard E2E;
- historical canonical dose non-dose edit E2E and integration coverage;
- OpenAPI insulin `maximum` bound tied to
  `INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM`.

Not implemented (unchanged by this slice):

- cloud sync, outbox, multi-device conflict resolution;
- insulin calculators, IOB, pump, therapy plans;
- new dashboard insulin module;
- dependency upgrades or storage schema migration.

## Manual dose policy

```text
Canonical domain/storage validity:
  finite, > 0, <= 500, arbitrary precision, no rounding

Manual user-entry validity (Quick Add + edited dose):
  > 0, <= 100, max 2 fraction digits, dot/comma, no rounding
```

Unchanged stored doses are never re-parsed through the manual policy.

## Persistence architecture

```text
apps/web composition root
        |
        | createWebTimelineSemanticEventValidator()
        v
IndexedDbTimelineRepository (timeline-web)
        |
        +-- generic envelope validation
        +-- supplemental semanticEventValidator on writes and reads
        +-- invalid persisted insulin → existing quarantine path
```

`@diabetes-universe/timeline-web` does not depend on
`@diabetes-universe/medical-domain`.

## Tests

Targeted unit/integration coverage includes manual input parity, unchanged
canonical stored doses, persistence write rejection and read quarantine, edit
model regressions, and OpenAPI canonical-max parity. E2E adds DE/UK full submit,
vertical closure, and historical canonical edit scenarios.

## Wave 4E closure reference

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Approved HEAD | `9459df4be7846bdff3da6b3bfa9a97a22838cda1` |
| Merge commit  | `6adc95de4625285497a45b13406200bb4966a38b` |
| Post-merge CI | `33564693833` SUCCESS                      |
