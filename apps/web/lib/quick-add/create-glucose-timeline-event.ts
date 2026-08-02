import type {
  GlucoseQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';
import { formatGlucoseValue } from './format-glucose';

export function createGlucoseTimelineEvent(
  entry: GlucoseQuickAddEntry,
): TimelineEvent {
  const value = formatGlucoseValue(entry.valueMmol);
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    context: entry.context,
    dateTime,
    id: `glucose-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'glucose',
    source: 'manual',
    title: 'Глюкоза',
    value,
  };
}
