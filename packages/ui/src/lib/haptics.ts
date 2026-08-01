/**
 * Platform-agnostic haptics facade for shared UI interactions.
 *
 * On Android and iOS, this module will later delegate to platform adapters
 * without requiring changes in calling code.
 */

type VibrationPattern = number | number[];

function vibrate(pattern: VibrationPattern): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration is optional; unsupported or blocked contexts should no-op.
  }
}

export const haptics = {
  selection(): void {
    vibrate(10);
  },
  success(): void {
    vibrate([15, 40, 15]);
  },
  warning(): void {
    vibrate([20, 50, 20]);
  },
  error(): void {
    vibrate([30, 40, 30]);
  },
};
