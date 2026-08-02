# Dashboard Quick Add Integration

## Purpose

Connect the Dashboard entry points to the existing Quick Add framework without
duplicating panel logic, forms, or save behavior.

## Status

Approved

## Responsibility

- Expose one shared Quick Add instance for the Dashboard screen.
- Open Quick Add from the mobile/tablet FAB and the desktop Header action.
- Disable duplicate entry points while Quick Add is open.
- Prevent repeated open requests from rapid activations.
- Apply successful saves to Dashboard demo state and refresh affected blocks.
- Preserve cancel and dismiss behavior without mutating Dashboard data.
- Return keyboard focus to the control that opened Quick Add.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Quick Add Specification](../../specs/dashboard/quick-add.md)
- [Dashboard Quick Add UI](../../ui/dashboard/quick-add.md)
- [Quick Add approved behavior](../../ui-bible/003-quick-add.md)
- Shared `QuickAddHost` in `apps/web/components/quick-add/quick-add-host.tsx`
- Shared `QuickAddPanel` and forms from `@diabetes-universe/ui`

## Architectural Boundaries

- Dashboard does not create a second Quick Add panel or duplicate form logic.
- `QuickAddHost` owns panel composition; Dashboard owns open state and entry
  points.
- `DashboardRoot` composes `DashboardShell`, Header, FAB visibility, and
  `QuickAddHost`.
- Timeline continues to use the same `QuickAddHost` through `QuickAddRoot`.
- Header desktop action is the only desktop entry point; no desktop FAB is
  rendered.
- Save validation remains inside Quick Add forms; invalid submit does not close
  the panel.
- Dashboard block updates happen only after successful submit callbacks mutate
  shared demo state.

## Notes

- Mobile and tablet use `dashboard-fab` with safe-area offsets.
- Desktop Header disables its action while Quick Add is open.
- Focus returns to the Header button or FAB based on the last open trigger.
- Next Action uses `requestOpen('next-action', 'insulin')` to open the insulin
  form directly.
- Activity and note submit handlers call `createActivityTimelineEvent` and
  `createNoteTimelineEvent`, then `addEvent`.
