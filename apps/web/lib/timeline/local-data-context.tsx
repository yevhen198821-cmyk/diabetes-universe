'use client';

import { createContext, useContext } from 'react';
import type { TimelineLocalOwnership } from './timeline-local-ownership';

export const TimelineLocalDataContext = createContext<TimelineLocalOwnership>({
  kind: 'pending',
});
export function useTimelineLocalData() {
  return useContext(TimelineLocalDataContext);
}
