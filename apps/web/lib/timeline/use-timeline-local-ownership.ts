'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { readTimelineSessionAccountResolution } from './read-timeline-local-session';
import {
  createAnonymousTimelineOwnership,
  createAuthenticatedTimelineOwnership,
  resolveAnonymousOwnerKey,
  type TimelineLocalOwnership,
} from './timeline-local-ownership';

function canUseBrowserStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export function useTimelineLocalOwnership(): TimelineLocalOwnership {
  const [ownership, setOwnership] = useState<TimelineLocalOwnership>({
    kind: 'pending',
  });
  const requestIdRef = useRef(0);
  const lastAuthenticatedAccountIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!canUseBrowserStorage()) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const resolution = await readTimelineSessionAccountResolution();

    if (requestIdRef.current !== requestId) {
      return;
    }

    if (resolution.status === 'indeterminate') {
      if (lastAuthenticatedAccountIdRef.current) {
        return;
      }

      setOwnership(
        createAnonymousTimelineOwnership(
          resolveAnonymousOwnerKey(window.localStorage),
        ),
      );
      return;
    }

    if (resolution.status === 'blocked') {
      lastAuthenticatedAccountIdRef.current = null;
      setOwnership({ kind: 'blocked' });
      return;
    }

    if (resolution.status === 'authenticated') {
      lastAuthenticatedAccountIdRef.current = resolution.accountId;
      setOwnership(createAuthenticatedTimelineOwnership(resolution.accountId));
      return;
    }

    lastAuthenticatedAccountIdRef.current = null;
    setOwnership(
      createAnonymousTimelineOwnership(
        resolveAnonymousOwnerKey(window.localStorage),
      ),
    );
  }, []);

  useEffect(() => {
    void refresh();

    const onResume = () => {
      void refresh();
    };

    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);

    return () => {
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [refresh]);

  return ownership;
}
