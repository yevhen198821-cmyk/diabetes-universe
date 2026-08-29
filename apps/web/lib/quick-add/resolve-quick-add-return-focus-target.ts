import type { QuickAddCloseReason } from './quick-add-controller-model';

export interface QuickAddReturnFocusContext {
  readonly openedFromEmptyGlucoseCta: boolean;
  readonly opener: HTMLElement | null;
  readonly readyLastGlucoseFocusTarget: HTMLHeadingElement | null;
  readonly reason: QuickAddCloseReason;
}

function isConnectedFocusTarget(
  element: HTMLElement | null | undefined,
): element is HTMLElement {
  return Boolean(element?.isConnected);
}

export function resolveQuickAddReturnFocusTarget(
  context: QuickAddReturnFocusContext,
): HTMLElement | null {
  if (isConnectedFocusTarget(context.opener)) {
    return context.opener;
  }

  if (
    context.reason === 'success' &&
    context.openedFromEmptyGlucoseCta &&
    isConnectedFocusTarget(context.readyLastGlucoseFocusTarget)
  ) {
    return context.readyLastGlucoseFocusTarget;
  }

  return null;
}

export function scheduleQuickAddReturnFocus(
  resolveTarget: () => HTMLElement | null,
  maxAttempts = 6,
): void {
  const attemptFocus = (attempt: number) => {
    const target = resolveTarget();

    if (isConnectedFocusTarget(target)) {
      target.focus({ preventScroll: true });

      if (document.activeElement === target) {
        return;
      }
    }

    if (attempt < maxAttempts) {
      requestAnimationFrame(() => attemptFocus(attempt + 1));
    }
  };

  requestAnimationFrame(() => attemptFocus(0));
}

export function focusQuickAddReturnTarget(
  target: HTMLElement | null,
  scheduleRetry = false,
): boolean {
  if (!isConnectedFocusTarget(target)) {
    return false;
  }

  scheduleQuickAddReturnFocus(() => target, scheduleRetry ? 8 : 3);
  return true;
}
