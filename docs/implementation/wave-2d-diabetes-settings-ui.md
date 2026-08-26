# Wave 2D — Diabetes Settings UI

Implementation documentation for Profile → **Управление диабетом**.

## Route

- Protected account route: `/account/diabetes`
- Auth callback allow-list: `/account/diabetes`
- Deep link: unauthenticated users redirect to `/auth?callback=/account/diabetes`

## Screen structure

1. **Glucose units** — segmented control (`mmol/L` | `mg/dL`), explicit unconfigured state
2. **Diabetes type** — self-reported taxonomy selector (+ optional other descriptor)
3. **Target range** — summary row, edit dialog, optional remove with confirmation
4. **Disclaimer** — short medical-settings boundary copy

Focused saves per section (unit, type, target). No screen-level mega-form.

## API interactions

Client boundary: `apps/web/lib/medical/client/diabetes-settings-client.ts`

| Action         | Method | Path                                        | Precondition         |
| -------------- | ------ | ------------------------------------------- | -------------------- |
| Load settings  | GET    | `/api/v1/medical/me/diabetes-settings`      | session cookie       |
| Save unit/type | PATCH  | `/api/v1/medical/me/diabetes-settings`      | `If-Match: revision` |
| Load target    | GET    | `/api/v1/medical/me/glucose-target-profile` | session cookie       |
| Save target    | PUT    | `/api/v1/medical/me/glucose-target-profile` | `If-Match: revision` |
| Remove target  | DELETE | `/api/v1/medical/me/glucose-target-profile` | `If-Match: revision` |

Server remains canonical. No localStorage persistence for medical settings.

## Unit conversion in target editor

- Display/edit uses selected `glucoseDisplayUnit` (defaults to mmol/L in editor when unit unset)
- Submission converts display values → canonical mmol/L via `@diabetes-universe/medical-domain` conversion primitives
- Client validation in `diabetes-settings-target-validation.ts` mirrors domain bounds

## Conflict recovery

- `412 REVISION_CONFLICT` → user message + reload latest settings/target from server
- `428 PRECONDITION_REQUIRED` → reload latest server state
- Revision tokens are never shown in UI

## Unconfigured unit behavior

When `glucoseDisplayUnit = null`:

- UI shows **Не выбраны** / **Not selected**
- Neither segmented button is pressed
- No locale-based auto-PATCH

## Wave 2E boundary (explicitly out of scope)

Wave 2D does **not** integrate display units into:

- Timeline glucose rendering
- Home glucose rendering
- Quick Add
- Reports / charts

Those read-surface integrations begin in Wave 2E.1+.

## Files

| Area          | Path                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| Page          | `apps/web/app/account/diabetes/page.tsx`                                |
| Panel         | `apps/web/components/profile/profile-diabetes-management-panel.tsx`     |
| Target dialog | `apps/web/components/profile/profile-diabetes-target-editor-dialog.tsx` |
| Labels        | `apps/web/components/profile/profile-diabetes-management-labels.ts`     |
| Menu link     | `apps/web/components/profile/profile-menu-diabetes-link-row.tsx`        |
| Client API    | `apps/web/lib/medical/client/diabetes-settings-client.ts`               |

## Tests

- Component/source assertions: `apps/web/components/profile/profile-diabetes-management.test.mjs`
- Client validation/display: `apps/web/lib/medical/client/*.test.mjs`
- E2E: `apps/web/e2e/profile-diabetes-management.spec.ts`
