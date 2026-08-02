import type {
  InsulinQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';
import { formatInsulinDose } from './format-insulin';

export function createInsulinTimelineEvent(
  entry: InsulinQuickAddEntry,
): TimelineEvent {
  const dose = formatInsulinDose(entry.doseUnits);
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    context: entry.context ?? '',
    dateTime,
    id: `insulin-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'insulin',
    source: 'manual',
    title: entry.preparation,
    value: `${dose} ЕД`,
  };
}
