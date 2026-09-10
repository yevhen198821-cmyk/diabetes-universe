'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyTimelineOwnershipSessionResolution,
  type TimelineOwnershipSessionState,
} from './apply-timeline-session-ownership';
import { readTimelineSessionAccountResolution } from './read-timeline-local-session';
import {
  resolveAnonymousOwnerKey,
  type TimelineLocalOwnership,
} from './timeline-local-ownership';

function canUseBrowserStorage(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  } catch {
    return false;
  }
}

const INITIAL_OWNERSHIP_STATE: TimelineOwnershipSessionState = {
  lastAuthenticatedAccountId: null,
  ownership: { kind: 'pending' },
};

export function useTimelineLocalOwnership(): {
  readonly ownership: TimelineLocalOwnership;
  readonly retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const [ownership, setOwnership] = useState(INITIAL_OWNERSHIP_STATE.ownership);
  const requestIdRef = useRef(0);
  const stateRef = useRef<TimelineOwnershipSessionState>(
    INITIAL_OWNERSHIP_STATE,
  );

  useEffect(() => {
    if (!canUseBrowserStorage()) {
      return;
    }

    const applyResolution = async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const resolution = await readTimelineSessionAccountResolution();
      let anonymousOwnerKey: string;
      try {
        anonymousOwnerKey =
          resolution.status === 'anonymous'
            ? resolveAnonymousOwnerKey(window.localStorage)
            : 'unresolved';
      } catch {
        // Storage denial must not create an ephemeral identity or accept writes.
        if (requestId === requestIdRef.current) {
          stateRef.current = {
            lastAuthenticatedAccountId: null,
            ownership: { kind: 'blocked' },
          };
          setOwnership(stateRef.current.ownership);
        }
        return;
      }
      const next = applyTimelineOwnershipSessionResolution({
        anonymousOwnerKey,
        current: stateRef.current,
        latestRequestId: requestIdRef.current,
        requestId,
        resolution,
      });

      if (next === stateRef.current) {
        return;
      }

      stateRef.current = next;
      setOwnership(next.ownership);
    };

    const onResume = () => {
      void applyResolution();
    };

    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    queueMicrotask(() => {
      void applyResolution();
    });

    return () => {
      requestIdRef.current += 1;
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [attempt]);

  return { ownership, retry };
}
