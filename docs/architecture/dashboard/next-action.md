# Dashboard Next Action

## Purpose

Present the user's single highest-priority Dashboard task as the first and only
dominant content card after the Header.

## Status

Approved — localized via I18N-02B1 (Ready for Review)

## Responsibility

- Display the shared `NextStep` contract as the primary Dashboard call to action.
- Preserve the approved full-width grid position immediately after the Header.
- Communicate loading, empty, and error states locally inside the block.
- Expose a ready-state action button without owning Quick Add or Timeline
  behavior.
- Allow the owner to disable the ready action while another blocking flow is
  open.

## Dependencies

- [Dashboard Layout Architecture](layout.md)
- [Dashboard Next Action Specification](../../specs/dashboard/next-action.md)
- [Dashboard Next Action UI](../../ui/dashboard/next-action.md)
- Shared `Button` from `@diabetes-universe/ui`

## Architectural Boundaries

- The block belongs to the web application because it composes Dashboard layout,
  approved copy, and owner-supplied action callbacks.
- Ready content is supplied through the shared `NextStep` contract and an
  `onAction` callback. Demo presentation is resolved from structural
  `NextStepSource` via localization; mocks contain no human-readable copy.
- The block does not fetch data, call APIs, rank actions, or decide the next
  step.
- The block does not open Quick Add by itself; the owner decides what the action
  does.
- The Dashboard shell owns screen-level placement and renders Next Action as the
  first content card in the approved order.

## Notes

- The ready action may be disabled by the owner while Quick Add is open.
- Empty and error states do not expose an action button.
- The Dashboard demo wires the insulin CTA to Quick Add through
  `requestOpen('next-action', 'insulin')`, opening the insulin form directly.
- I18N-02B1 audit: see
  [Dashboard Next Action Localization Migration](../localization/dashboard-next-action-migration.md).
