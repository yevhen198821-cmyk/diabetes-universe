import type { TimelineSessionAccountResolution } from './read-timeline-local-session';
import {
  createAnonymousTimelineOwnership,
  createAuthenticatedTimelineOwnership,
  type TimelineLocalOwnership,
} from './timeline-local-ownership';

export interface TimelineOwnershipSessionState {
  readonly lastAuthenticatedAccountId: string | null;
  readonly ownership: TimelineLocalOwnership;
}

export function shouldOpenOwnedTimelineDatabase(
  ownership: TimelineLocalOwnership,
): boolean {
  return ownership.kind === 'anonymous' || ownership.kind === 'authenticated';
}

/**
 * Apply a positively resolved session to Timeline ownership.
 *
 * Indeterminate (network / 5xx / 429 / unexpected non-success) never infers
 * signed-out. An already authenticated account stays on that namespace.
 * First-load indeterminate stays pending/blocked and does not open anonymous
 * IndexedDB.
 */
export function applyTimelineOwnershipSessionResolution(input: {
  readonly anonymousOwnerKey: string;
  readonly current: TimelineOwnershipSessionState;
  readonly latestRequestId: number;
  readonly requestId: number;
  readonly resolution: TimelineSessionAccountResolution;
}): TimelineOwnershipSessionState {
  if (input.requestId !== input.latestRequestId) {
    return input.current;
  }

  const { current, resolution } = input;

  if (resolution.status === 'indeterminate') {
    return current;
  }

  if (resolution.status === 'blocked') {
    return {
      lastAuthenticatedAccountId: null,
      ownership: { kind: 'blocked' },
    };
  }

  if (resolution.status === 'authenticated') {
    if (
      current.ownership.kind === 'authenticated' &&
      current.ownership.accountId === resolution.accountId &&
      current.lastAuthenticatedAccountId === resolution.accountId
    ) {
      return current;
    }

    return {
      lastAuthenticatedAccountId: resolution.accountId,
      ownership: createAuthenticatedTimelineOwnership(resolution.accountId),
    };
  }

  if (
    current.ownership.kind === 'anonymous' &&
    current.lastAuthenticatedAccountId === null
  ) {
    return current;
  }

  return {
    lastAuthenticatedAccountId: null,
    ownership: createAnonymousTimelineOwnership(input.anonymousOwnerKey),
  };
}
