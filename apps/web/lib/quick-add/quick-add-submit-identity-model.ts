import { createSemanticTimelineEventId } from '../timeline/semantic-creators/create-semantic-timeline-event-id';

export type QuickAddSubmitEventKind = 'glucose' | 'insulin';

export interface QuickAddSubmitIdentityState {
  pendingEventId: string | null;
}

export function createQuickAddSubmitIdentityState(): QuickAddSubmitIdentityState {
  return { pendingEventId: null };
}

export function beginQuickAddSubmitEventId(
  identity: QuickAddSubmitIdentityState,
  kind: QuickAddSubmitEventKind,
  time: string,
  createUuid: () => string = () => crypto.randomUUID(),
): string {
  if (identity.pendingEventId !== null) {
    return identity.pendingEventId;
  }

  identity.pendingEventId = createSemanticTimelineEventId(
    kind,
    time,
    createUuid(),
  );

  return identity.pendingEventId;
}

export function clearQuickAddSubmitIdentity(
  identity: QuickAddSubmitIdentityState,
): void {
  identity.pendingEventId = null;
}

export function canDismissQuickAddWhileSubmitPending(
  isSubmitPending: boolean,
): boolean {
  return !isSubmitPending;
}
