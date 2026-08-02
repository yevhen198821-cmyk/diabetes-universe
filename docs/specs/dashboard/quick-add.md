# Dashboard Quick Add Specification

## Status

Approved

## Overview

Dashboard Quick Add integration connects the approved Dashboard entry points to
the existing Quick Add framework. One shared Quick Add instance serves the
screen, and successful saves refresh affected Dashboard blocks through shared
demo state.

## Functional Requirements

### Entry Points

| Viewport          | Entry point                        | Rule                            |
| ----------------- | ---------------------------------- | ------------------------------- |
| 320–1023 px       | FAB **Добавить событие**           | Visible, opens shared Quick Add |
| 1024 px and wider | Header button **Добавить событие** | Visible, opens shared Quick Add |
| 1024 px and wider | Desktop FAB                        | Must not be rendered            |

### Shared Quick Add Contract

Dashboard uses the existing `QuickAddHost` with:

| Input / callback                | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `open`                          | Controlled open state                    |
| `onOpenChange`                  | Updates controlled open state            |
| `onRequestOpen`                 | Guarded open request from FAB or Header  |
| `showFloatingActionButton`      | Renders mobile/tablet FAB only when true |
| `floatingActionButtonClassName` | Applies Dashboard safe-area positioning  |
| `returnFocusRef`                | Restores focus after close               |
| `onGlucoseSubmit`               | Successful glucose save callback         |
| `onInsulinSubmit`               | Successful insulin save callback         |
| `onNutritionSubmit`             | Successful nutrition save callback       |
| `onMedicationSubmit`            | Successful medication save callback      |

### Open-State Rules

| Rule | Behavior                                          |
| ---- | ------------------------------------------------- |
| 1    | First open request sets `open = true`             |
| 2    | Repeated requests while open are ignored          |
| 3    | Repeated requests during opening lock are ignored |
| 4    | Header desktop action is disabled while open      |
| 5    | FAB is hidden while open                          |

### Save and Close Rules

| Scenario                   | Quick Add state | Dashboard data          |
| -------------------------- | --------------- | ----------------------- |
| Successful submit          | Closes          | Updates affected blocks |
| Cancel within form         | Stays open      | Unchanged               |
| Dismiss/backdrop/`Escape`  | Closes          | Unchanged               |
| Validation error on submit | Stays open      | Unchanged               |

Affected blocks after successful save:

- Glucose: Last Glucose, Day Summary glucose count
- Insulin: Day Summary insulin total, Recent Events insulin preview
- Nutrition: Day Summary carbohydrate total, Recent Events nutrition preview
- Medication: Day Summary medication count, Recent Events medication preview

### Controller Model

`quick-add-controller-model.ts` defines:

- `requestQuickAddOpen`
- `createQuickAddOpeningLock`
- `releaseQuickAddOpeningLock`
- `closeQuickAdd`
- `shouldApplyQuickAddSave`
- `shouldKeepQuickAddOpenAfterSubmit`

### Dashboard State Integration

`dashboard-quick-add-integration-model.ts` defines:

- demo event state updates from Quick Add entries;
- derivation of Last Glucose, Day Summary, and Recent Events block inputs;
- no API or persistence layer.

## User Flow

1. The user activates **Добавить событие** from the FAB or Header.
2. The shared Quick Add panel opens once.
3. The user selects a category and completes or cancels the form.
4. On successful save, Quick Add closes and Dashboard blocks refresh.
5. On dismiss or cancel, Quick Add closes or returns to category selection
   without changing Dashboard data.
6. Focus returns to the originating control.

## Business Rules

- Approved action label: **Добавить событие**.
- Dashboard reuses the existing Quick Add panel and forms.
- No second Quick Add instance is created.
- No desktop FAB is introduced.
- Invalid form submit must not close Quick Add.
- Header and FAB must not both be required to discover Quick Add on desktop.

## Validation Rules

- Ignore open requests when `open === true`.
- Ignore open requests when opening lock is active.
- Reject blank focus-return targets gracefully.
- Successful submit handlers must mutate demo state before close.

## Edge Cases

- Rapid double activation of FAB or Header opens Quick Add only once.
- Header action remains disabled for the whole open lifecycle.
- Focus returns to Header on desktop and FAB on mobile/tablet.
- Cancel from a selected form returns to category grid without data changes.
- Timeline and Dashboard each own separate `QuickAddHost` instances on their
  screens.

## Dependencies

- [Dashboard Quick Add Integration Architecture](../../architecture/dashboard/quick-add-integration.md)
- [Dashboard Quick Add UI](../../ui/dashboard/quick-add.md)
- [Dashboard Layout UI Specification](../../ui/dashboard/layout.md)
- [Quick Add approved behavior](../../ui-bible/003-quick-add.md)

## Acceptance Criteria

1. Mobile and tablet show one FAB labeled **Добавить событие**.
2. Desktop shows the Header action and no FAB.
3. Both entry points open the same Dashboard Quick Add instance.
4. Repeated rapid open requests are ignored.
5. Successful save closes Quick Add and refreshes affected Dashboard blocks.
6. Dismiss and cancel do not mutate Dashboard data.
7. Validation errors keep Quick Add open.
8. Focus returns to the opening control after close.
9. Safe-area offsets are preserved for the Dashboard FAB.
10. No duplicate Quick Add framework is introduced.
