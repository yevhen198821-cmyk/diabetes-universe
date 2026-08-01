import type {
  InsulinQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { formatInsulinDose } from './format-insulin';

export function createInsulinTimelineEvent(
  entry: InsulinQuickAddEntry,
): TimelineEvent {
  const dose = formatInsulinDose(entry.doseUnits);

  return {
    context: entry.context ?? '',
    id: `insulin-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'insulin',
    time: entry.time,
    title: entry.preparation,
    value: `${dose} ЕД`,
  };
}
