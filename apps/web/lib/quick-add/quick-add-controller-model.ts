export type QuickAddCloseReason = 'cancel' | 'dismiss' | 'success';

export type QuickAddOpenRequestResult = 'ignored' | 'open';

export type QuickAddOpenTrigger = 'fab' | 'header';

export interface QuickAddOpenState {
  readonly isOpen: boolean;
  readonly isOpeningLocked: boolean;
}

export function requestQuickAddOpen(
  state: QuickAddOpenState,
): QuickAddOpenRequestResult {
  if (state.isOpen || state.isOpeningLocked) {
    return 'ignored';
  }

  return 'open';
}

export function createQuickAddOpeningLock(
  state: QuickAddOpenState,
): QuickAddOpenState | null {
  if (requestQuickAddOpen(state) === 'ignored') {
    return null;
  }

  return {
    isOpen: true,
    isOpeningLocked: true,
  };
}

export function releaseQuickAddOpeningLock(
  state: QuickAddOpenState,
): QuickAddOpenState {
  return {
    ...state,
    isOpeningLocked: false,
  };
}

export function closeQuickAdd(): QuickAddOpenState {
  return {
    isOpen: false,
    isOpeningLocked: false,
  };
}

export function shouldApplyQuickAddSave(reason: QuickAddCloseReason): boolean {
  return reason === 'success';
}

export function shouldKeepQuickAddOpenAfterSubmit(success: boolean): boolean {
  return !success;
}

export function resolveQuickAddReturnFocusTarget(
  trigger: QuickAddOpenTrigger | null,
): QuickAddOpenTrigger | null {
  return trigger;
}
