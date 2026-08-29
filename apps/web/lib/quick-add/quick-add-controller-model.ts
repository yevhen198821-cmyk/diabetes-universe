export type QuickAddCloseReason = 'cancel' | 'dismiss' | 'success';

export type QuickAddOpenRequestResult = 'ignored' | 'open';

export type QuickAddOpenTrigger = 'fab' | 'header' | 'next-action';

export type QuickAddOpenCategory =
  'activity' | 'glucose' | 'insulin' | 'medication' | 'note' | 'nutrition';

export interface QuickAddOpenState {
  readonly isOpen: boolean;
  readonly isOpeningLocked: boolean;
}

export interface QuickAddControllerState extends QuickAddOpenState {
  readonly lastOpenTrigger: QuickAddOpenTrigger | null;
  readonly openCategory: QuickAddOpenCategory | null;
}

export function createInitialQuickAddControllerState(): QuickAddControllerState {
  return {
    isOpen: false,
    isOpeningLocked: false,
    lastOpenTrigger: null,
    openCategory: null,
  };
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

export function createQuickAddOpenRequest(
  state: QuickAddControllerState,
  trigger: QuickAddOpenTrigger,
  category: QuickAddOpenCategory | null = null,
): QuickAddControllerState | null {
  const nextState = createQuickAddOpeningLock(state);

  if (!nextState) {
    return null;
  }

  return {
    ...nextState,
    lastOpenTrigger: trigger,
    openCategory: category,
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

export function closeQuickAddController(
  state: QuickAddControllerState,
): QuickAddControllerState {
  return {
    ...closeQuickAdd(),
    lastOpenTrigger: state.lastOpenTrigger,
    openCategory: null,
  };
}

export function shouldApplyQuickAddSave(reason: QuickAddCloseReason): boolean {
  return reason === 'success';
}

export function shouldKeepQuickAddOpenAfterSubmit(success: boolean): boolean {
  return !success;
}
