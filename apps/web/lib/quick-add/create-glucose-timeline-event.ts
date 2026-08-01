import type {
  GlucoseQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { formatGlucoseValue } from './format-glucose';

export function createGlucoseTimelineEvent(
  entry: GlucoseQuickAddEntry,
): TimelineEvent {
  const value = formatGlucoseValue(entry.valueMmol);

  return {
    context: entry.context,
    id: `glucose-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'glucose',
    time: entry.time,
    title: 'Глюкоза',
    value,
  };
}

export function sortTimelineEvents(
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  return [...events].sort((left, right) => left.time.localeCompare(right.time));
}
