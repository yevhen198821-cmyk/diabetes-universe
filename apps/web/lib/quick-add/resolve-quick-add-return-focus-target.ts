export interface QuickAddReturnFocusContext {
  readonly fallback: HTMLElement | null;
  readonly opener: HTMLElement | null;
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

  if (isConnectedFocusTarget(context.fallback)) {
    return context.fallback;
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
