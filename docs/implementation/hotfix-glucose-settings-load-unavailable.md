# Hotfix — Glucose Quick Add Settings Availability

Restore Glucose Quick Add availability when the medical settings authority
cannot serve a persisted profile, without inventing medical defaults.

## Root cause

Glucose Quick Add reads `DiabetesSettings.glucoseDisplayUnit` through
`DiabetesSettingsProvider` → `GET /api/v1/medical/me/diabetes-settings`.

On Vercel/`NODE_ENV=production`, the medical API production readiness gate
returns `503 SERVICE_UNAVAILABLE` **before authentication** when

- `MEDICAL_RATE_LIMIT_MODE=distributed` and
- `MEDICAL_RATE_LIMIT_BACKEND` plus a registered adapter

are not configured. That 503 is mapped to a client `server` error, so Quick Add
shows “Could not load glucose settings” and disables entry.

CI stays green because:

- Playwright E2E uses `next start` with rate-limit env vars set;
- the shared E2E fixture mocks a configured settings response.

A first-run or unauthenticated user is not a settings-load failure. The approved
contract already treats `401 AUTH_REQUIRED` as unconfigured.

## Fix

1. `beginClassifiedMedicalApiRequest` keeps the production gate.
   Authenticated traffic still receives 503 when the runtime is not ready.
   Unauthenticated traffic receives `401 AUTH_REQUIRED` so first-run is not
   misclassified as a load failure.
2. Provider load interpretation is explicit:
   unauthorized → ready/unconfigured;
   server/network/malformed → error + real Retry.
3. Wave 2E unit gate is wired:
   authenticated unconfigured users persist a unit through the existing PATCH;
   unauthenticated demo users choose a **session-only** unit.
   Locale does not infer units. No mmol/L or mg/dL default is invented.
4. Overlapping refresh completions are ignored via request identity.
5. Settings JSON is validated before use.

## Non-scope

- No Nutrition Wave 6D work
- No glucose analytics, dosing, or treatment advice
- No Food Catalog / Recipes
- No OpenAPI or Medical API schema changes
- No bulk migration
- No new settings persistence store

## Files

| Area      | Path                                                              |
| --------- | ----------------------------------------------------------------- |
| Gate      | `apps/web/lib/medical/server/medical-api-request-entry.ts`        |
| Provider  | `apps/web/lib/medical/react/diabetes-settings-provider.tsx`       |
| Parser    | `apps/web/lib/medical/client/parse-diabetes-settings-resource.ts` |
| Quick Add | `apps/web/components/quick-add/glucose-quick-add-form.tsx`        |
| E2E       | `apps/web/e2e/glucose-quick-add-settings-availability.spec.ts`    |
