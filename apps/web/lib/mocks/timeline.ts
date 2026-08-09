import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export const DEMO_TIMELINE_REFERENCE_DATE = '2026-08-02T10:00:00.000Z';

const DEMO_EVENT_LIFECYCLE_AT = '2026-08-09T08:30:00.000Z';

function createDemoSemanticEnvelope(
  id: string,
  occurredAt: string,
): Pick<
  SemanticTimelineEvent,
  'createdAt' | 'id' | 'occurredAt' | 'schemaVersion' | 'source' | 'updatedAt'
> {
  return {
    createdAt: DEMO_EVENT_LIFECYCLE_AT,
    id,
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: DEMO_EVENT_LIFECYCLE_AT,
  };
}

const historyNoteEvents: readonly SemanticTimelineEvent[] = Array.from(
  { length: 24 },
  (_, index): SemanticTimelineEvent => {
    const day = 29 - index;
    const date =
      day > 0
        ? `2026-07-${day.toString().padStart(2, '0')}`
        : `2026-06-${(30 + day).toString().padStart(2, '0')}`;
    const number = (index + 1).toString().padStart(2, '0');
    const occurredAt = `${date}T09:00:00.000Z`;

    return {
      ...createDemoSemanticEnvelope(`history-note-${number}`, occurredAt),
      body: `История наблюдения ${number}`,
      kind: 'note',
      title: `История дня ${number}`,
    };
  },
);

export const timelineEvents: readonly SemanticTimelineEvent[] = [
  {
    ...createDemoSemanticEnvelope('glucose-0800', '2026-08-02T05:00:00.000Z'),
    concentrationMmolPerL: 6.4,
    context: 'before_meal',
    kind: 'glucose',
  },
  {
    ...createDemoSemanticEnvelope('insulin-0805', '2026-08-02T05:05:00.000Z'),
    context: 'Перед завтраком',
    doseUnits: 4,
    kind: 'insulin',
    preparation: 'NovoRapid',
  },
  {
    ...createDemoSemanticEnvelope('nutrition-0820', '2026-08-02T05:20:00.000Z'),
    carbohydratesGrams: 42,
    kind: 'nutrition',
    mealType: 'breakfast',
    mode: 'manual',
  },
  {
    ...createDemoSemanticEnvelope('glucose-1015', '2026-08-02T07:15:00.000Z'),
    concentrationMmolPerL: 7.3,
    context: 'after_meal',
    kind: 'glucose',
  },
  {
    ...createDemoSemanticEnvelope(
      'medication-1130',
      '2026-08-02T08:30:00.000Z',
    ),
    context: 'После еды',
    dose: 400,
    doseUnit: 'mass.mg',
    kind: 'medication',
    medicationName: 'Метформин',
  },
  {
    ...createDemoSemanticEnvelope('activity-1500', '2026-08-01T12:00:00.000Z'),
    activityType: 'Прогулка',
    durationSeconds: 1800,
    kind: 'activity',
  },
  {
    ...createDemoSemanticEnvelope('note-1200', '2026-07-30T09:00:00.000Z'),
    body: 'Чувствую усталость после обеда',
    kind: 'note',
    title: 'Самочувствие',
  },
  ...historyNoteEvents,
];
