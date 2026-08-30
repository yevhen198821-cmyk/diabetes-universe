import { createSemanticTimelineEventId } from '../timeline/semantic-creators/create-semantic-timeline-event-id';

export interface GlucoseQuickAddSubmitIdentityState {
  pendingEventId: string | null;
}

export function createGlucoseQuickAddSubmitIdentityState(): GlucoseQuickAddSubmitIdentityState {
  return { pendingEventId: null };
}

export function beginGlucoseQuickAddSubmitEventId(
  identity: GlucoseQuickAddSubmitIdentityState,
  time: string,
  createUuid: () => string = () => crypto.randomUUID(),
): string {
  if (identity.pendingEventId !== null) {
    return identity.pendingEventId;
  }

  identity.pendingEventId = createSemanticTimelineEventId(
    'glucose',
    time,
    createUuid(),
  );

  return identity.pendingEventId;
}

export function clearGlucoseQuickAddSubmitIdentity(
  identity: GlucoseQuickAddSubmitIdentityState,
): void {
  identity.pendingEventId = null;
}

export function canDismissQuickAddWhileGlucoseSubmitPending(
  isGlucoseSubmitPending: boolean,
): boolean {
  return !isGlucoseSubmitPending;
}
