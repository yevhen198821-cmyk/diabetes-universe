import { createSemanticTimelineEventId } from '../timeline/semantic-creators/create-semantic-timeline-event-id';

export type QuickAddSubmitEventKind = 'glucose' | 'insulin';

export interface QuickAddSubmitIdentityState {
  pendingEventId: string | null;
  pendingRetryPayloadKey: string | null;
}

export function createQuickAddSubmitIdentityState(): QuickAddSubmitIdentityState {
  return { pendingEventId: null, pendingRetryPayloadKey: null };
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

/**
 * Resolves the event ID for a retry-aware Quick Add submit.
 *
 * Same logical payload after a failed persistence attempt reuses the pending
 * ID. Any change to the persisted semantic payload clears the stale identity
 * and allocates a fresh ID from the current time.
 */
export function reconcileQuickAddSubmitEventId(
  identity: QuickAddSubmitIdentityState,
  kind: QuickAddSubmitEventKind,
  time: string,
  payloadKey: string,
  createUuid: () => string = () => crypto.randomUUID(),
): string {
  if (
    identity.pendingEventId !== null &&
    identity.pendingRetryPayloadKey !== null &&
    identity.pendingRetryPayloadKey !== payloadKey
  ) {
    clearQuickAddSubmitIdentity(identity);
  }

  if (identity.pendingEventId === null) {
    identity.pendingEventId = createSemanticTimelineEventId(
      kind,
      time,
      createUuid(),
    );
    identity.pendingRetryPayloadKey = payloadKey;
  }

  return identity.pendingEventId;
}

export function clearQuickAddSubmitIdentity(
  identity: QuickAddSubmitIdentityState,
): void {
  identity.pendingEventId = null;
  identity.pendingRetryPayloadKey = null;
}

export function canDismissQuickAddWhileSubmitPending(
  isSubmitPending: boolean,
): boolean {
  return !isSubmitPending;
}
