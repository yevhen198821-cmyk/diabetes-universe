# Dashboard Quick Add UI

## Purpose

Define the Dashboard entry points, responsive behavior, and accessibility rules
for the shared Quick Add integration.

## Status

Approved

## Scope

The Dashboard Quick Add block contains only:

- mobile/tablet FAB entry point;
- desktop Header action entry point integration;
- shared `QuickAddHost` mounting from `DashboardRoot`.

The panel, category grid, and forms remain owned by the existing Quick Add
framework.

## Anatomy

Element hierarchy:

1. `DashboardRoot` client container.
2. `DashboardShell` content blocks.
3. `DashboardHeader` desktop action at `lg` and wider.
4. `QuickAddHost` shared panel instance.
5. Mobile/tablet FAB from `QuickAddHost` below `1024 px`.

## Variants

- **Mobile FAB:** fixed bottom-right, `48 × 48 px`, teal circular button.
- **Tablet FAB:** same control with `24 px` offsets above/right safe areas.
- **Desktop Header action:** shared primary `Button` with visible label.

## States

### Closed

- FAB visible below `1024 px`.
- Header action visible at `1024 px` and wider.
- Both entry points enabled.

### Open

- FAB hidden.
- Header action disabled.
- Shared Quick Add panel visible.
- Background scroll locked by `QuickAddPanel`.

### Successful save

- Panel closes.
- FAB or Header action becomes available again.
- Focus returns to the opening control.

### Dismissed without save

- Panel closes.
- Dashboard block data remains unchanged.

## Behavior

- FAB and Header open the same controlled Quick Add instance.
- Desktop does not render a second FAB.
- Repeated rapid clicks do not create multiple open panels.
- Form validation errors keep the current form open.
- Cancel inside a selected form returns to the category grid only.

## Accessibility

- FAB uses `aria-label="Добавить событие"`.
- Header action exposes the same visible label.
- Disabled Header action uses native disabled semantics while open.
- `QuickAddPanel` retains focus trap, `Escape` close, and scroll locking.
- Focus returns to the Header button or FAB after panel close.
- Safe-area insets are respected through `dashboard-fab` positioning.

## Responsive Behavior

| Range             | Entry point                         | FAB visibility |
| ----------------- | ----------------------------------- | -------------- |
| 320–1023 px       | Fixed FAB                           | Visible        |
| 1024 px and wider | Header **Добавить событие** button  | Hidden         |

Additional rules:

- `dashboard-fab` uses `lg:hidden`.
- Header desktop action uses `hidden lg:inline-flex`.
- Dashboard shell bottom padding preserves FAB clearance on mobile and tablet.

## Spacing and Sizing

| Element                     | Rule                                                |
| --------------------------- | --------------------------------------------------- |
| FAB size                    | 48 × 48 px (`size-12`)                              |
| Mobile FAB offset           | 16 px plus safe-area insets                         |
| Tablet FAB offset           | 24 px plus safe-area insets                         |
| Header action minimum size  | 44 × 44 px                                          |
| Desktop action padding      | Shared `Button` spacing                             |

## Dependencies

- [Dashboard Quick Add Integration Architecture](../../architecture/dashboard/quick-add-integration.md)
- [Dashboard Quick Add Specification](../../specs/dashboard/quick-add.md)
- [Dashboard Layout UI Specification](layout.md)
- [Buttons](../../design-system/buttons.md)
- [Quick Add approved behavior](../../ui-bible/003-quick-add.md)

## Notes

- `DashboardRoot` is the integration composition point for the Dashboard screen.
- Timeline keeps its own `QuickAddRoot` wrapper around the same `QuickAddHost`.
