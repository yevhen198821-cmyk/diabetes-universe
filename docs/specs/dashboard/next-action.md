# Dashboard Next Action Specification

## Status

Approved

## Overview

The Dashboard Next Action block presents one owner-supplied next step as the
primary Dashboard task. It remains in its approved full-width position across
loading, ready, empty, and error states and does not block other Dashboard
content.

## Functional Requirements

### Typed Inputs

| Input            | Type                                 | Required                 | Purpose                                                      |
| ---------------- | ------------------------------------ | ------------------------ | ------------------------------------------------------------ |
| `state`          | `loading \| ready \| empty \| error` | Yes                      | Selects the block presentation state                         |
| `action`         | `NextStep`                           | Yes in `ready`           | Supplies title, description, and action label                |
| `onAction`       | `() => void`                         | Yes in `ready`           | Handles the ready-state button activation                    |
| `actionDisabled` | `boolean`                            | No                       | Disables the ready action while its owner blocks interaction |
| `loadingLabel`   | `string`                             | No                       | Overrides the default loading announcement                   |
| `content`        | `DashboardNextActionMessage`         | Yes in `empty` / `error` | Supplies title and optional description                      |

`DashboardNextActionMessage` contains:

| Field         | Type     | Rule                             |
| ------------- | -------- | -------------------------------- |
| `title`       | `string` | Trimmed non-empty title          |
| `description` | `string` | Optional trimmed supporting copy |

### States

| State     | Required behavior                                                       |
| --------- | ----------------------------------------------------------------------- |
| `loading` | Preserve card geometry and announce loading without plausible task text |
| `ready`   | Show `NextStep` content and invoke `onAction` from the visible button   |
| `empty`   | Show title and optional description without an action button            |
| `error`   | Show title and optional description with error semantics and no action  |

### Callback Rules

- The ready action calls `onAction` exactly once per activation while enabled.
- Empty and error states do not expose `onAction`.
- The block does not decide what the action does.
- In the current Dashboard demo, the ready action opens Quick Add with the
  insulin form preselected through the shared `openCategory` API.

## User Flow

1. The Dashboard renders Next Action as the first content card.
2. In ready state, the user reads the recommended next step and optional action
   label.
3. The user activates the action button when enabled.
4. When the demo next step is insulin, one click opens the insulin Quick Add
   form directly without showing the category grid.
5. If no action is available, the user reads the empty-state message.
6. If the action cannot be loaded, the user reads the error-state message in
   the same card area.

## Business Rules

- The block is the only dominant Dashboard content card.
- Ready content comes from the shared `NextStep` contract.
- The block does not open Quick Add unless the owner wires `onAction` to do so.
- The Dashboard owner wires the insulin demo CTA to `requestOpen('next-action',
'insulin')`.
- The owner may disable the ready action while Quick Add is open.
- Empty and error states preserve the approved grid position.

## Validation Rules

- Loading uses the approved default label when `loadingLabel` is absent.
- Empty and error titles are trimmed before display.
- Optional empty and error descriptions are trimmed; blank descriptions are
  omitted.
- `actionDisabled` defaults to `false` in ready state.

## Edge Cases

- A ready action may remain visible but disabled while another blocking flow is
  open.
- Empty state may omit a description.
- Error state uses assertive announcement semantics.
- Invalid or missing ready inputs are handled by the owner before render; the
  block itself does not fabricate a next step.

## Dependencies

- [Dashboard Next Action Architecture](../../architecture/dashboard/next-action.md)
- [Dashboard Next Action UI](../../ui/dashboard/next-action.md)
- [Dashboard Layout UI](../../ui/dashboard/layout.md)

## Acceptance Criteria

1. Next Action is the first content card after the Header.
2. Ready state shows `NextStep` title, description, and action label.
3. The ready action can be disabled by the owner.
4. Loading, empty, and error states preserve card placement and geometry.
5. Empty and error states do not expose an action button.
6. The block does not fetch or rank actions on its own.
7. The insulin demo CTA opens the insulin Quick Add form in one click without
   showing the category grid.
