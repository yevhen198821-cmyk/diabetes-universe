# Settings Overview

## Status

Wave 2B data foundation implemented. Architecture source of truth remains
[Wave 2A — Diabetes Settings Architecture](../profile/wave-2a-diabetes-settings-architecture.md).

## Responsibility

Subject-scoped diabetes configuration (`DiabetesSettings`, `GlucoseTargetProfile`)
stored on `MedicalSubject`, separate from account identity and medical events.

## Dependencies

- Wave 2A architecture (approved)
- `@diabetes-universe/medical-domain` shared contracts
- `@diabetes-universe/medical-persistence` Drizzle schema and migration `0005`

## Notes

Wave 2B provides types, validation, conversion, persistence schema, OpenAPI
components, and tests only. Runtime API routes and UI belong to Wave 2C+.
