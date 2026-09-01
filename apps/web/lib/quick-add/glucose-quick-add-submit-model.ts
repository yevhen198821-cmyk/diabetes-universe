import {
  beginQuickAddSubmitEventId,
  canDismissQuickAddWhileSubmitPending,
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type GlucoseQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createGlucoseQuickAddSubmitIdentityState(): GlucoseQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export function beginGlucoseQuickAddSubmitEventId(
  identity: GlucoseQuickAddSubmitIdentityState,
  time: string,
  createUuid: () => string = () => crypto.randomUUID(),
): string {
  return beginQuickAddSubmitEventId(identity, 'glucose', time, createUuid);
}

export function clearGlucoseQuickAddSubmitIdentity(
  identity: GlucoseQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}

export function canDismissQuickAddWhileGlucoseSubmitPending(
  isGlucoseSubmitPending: boolean,
): boolean {
  return canDismissQuickAddWhileSubmitPending(isGlucoseSubmitPending);
}
