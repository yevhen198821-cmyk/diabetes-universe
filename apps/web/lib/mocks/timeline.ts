import type {
  DaySummary,
  LastGlucose,
  NextStep,
  TimelineEvent,
} from '@diabetes-universe/types';

export const DEMO_TIMELINE_REFERENCE_DATE = '2026-08-02T10:00:00.000Z';

export const lastGlucose: LastGlucose = {
  time: '08:00',
  value: '6,4 ммоль/л',
};

export const daySummary: DaySummary = {
  timeInRange: '92%',
};

export const nextStep: NextStep = {
  actionLabel: 'Добавить',
  description: 'Добавить инсулин',
  title: 'Следующее действие',
};

const historyNoteEvents: readonly TimelineEvent[] = Array.from(
  { length: 24 },
  (_, index): TimelineEvent => {
    const day = 29 - index;
    const date =
      day > 0
        ? `2026-07-${day.toString().padStart(2, '0')}`
        : `2026-06-${(30 + day).toString().padStart(2, '0')}`;
    const number = (index + 1).toString().padStart(2, '0');

    return {
      dateTime: `${date}T09:00:00.000Z`,
      id: `history-note-${number}`,
      kind: 'note',
      source: 'demo',
      title: `История дня ${number}`,
      value: `История наблюдения ${number}`,
    };
  },
);

export const timelineEvents: readonly TimelineEvent[] = [
  {
    context: 'Перед завтраком',
    dateTime: '2026-08-02T05:00:00.000Z',
    id: 'glucose-0800',
    kind: 'glucose',
    source: 'demo',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
  },
  {
    context: 'Перед завтраком',
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-0805',
    kind: 'insulin',
    source: 'demo',
    title: 'NovoRapid',
    value: '4 ЕД',
  },
  {
    context: 'После инсулина',
    dateTime: '2026-08-02T05:20:00.000Z',
    id: 'nutrition-0820',
    kind: 'nutrition',
    source: 'demo',
    title: 'Завтрак',
    value: '42 г углеводов',
  },
  {
    context: 'После завтрака',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-1015',
    kind: 'glucose',
    source: 'demo',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
  },
  {
    context: 'После еды',
    dateTime: '2026-08-02T08:30:00.000Z',
    id: 'medication-1130',
    kind: 'medication',
    source: 'demo',
    title: 'Метформин',
    unit: 'мг',
    value: '400',
  },
  {
    context: 'После обеда',
    dateTime: '2026-08-01T12:00:00.000Z',
    id: 'activity-1500',
    kind: 'activity',
    source: 'demo',
    title: 'Прогулка',
    unit: 'минут',
    value: '30',
  },
  {
    dateTime: '2026-07-30T09:00:00.000Z',
    id: 'note-1200',
    kind: 'note',
    source: 'demo',
    title: 'Самочувствие',
    value: 'Чувствую усталость после обеда',
  },
  ...historyNoteEvents,
];
