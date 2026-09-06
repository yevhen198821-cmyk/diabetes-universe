'use client';

import { useEffect, useRef, useState } from 'react';

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
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

const INITIAL_OWNERSHIP_STATE: TimelineOwnershipSessionState = {
  lastAuthenticatedAccountId: null,
  ownership: { kind: 'pending' },
};

export function useTimelineLocalOwnership(): TimelineLocalOwnership {
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
      const next = applyTimelineOwnershipSessionResolution({
        anonymousOwnerKey: resolveAnonymousOwnerKey(window.localStorage),
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
  }, []);

  return ownership;
}
