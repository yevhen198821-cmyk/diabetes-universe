import type {
  DaySummary,
  LastGlucose,
  NextStep,
  TimelineEvent,
} from '@diabetes-universe/types';

export const lastGlucose: LastGlucose = {
  value: '6,4 ммоль/л',
  time: '08:00',
};

export const daySummary: DaySummary = {
  timeInRange: '92%',
};

export const nextStep: NextStep = {
  title: 'Следующее действие',
  description: 'Добавить инсулин',
  actionLabel: 'Добавить',
};

export const timelineEvents: readonly TimelineEvent[] = [
  {
    id: 'glucose-0800',
    time: '08:00',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
    context: 'Перед завтраком',
  },
  {
    id: 'insulin-0805',
    time: '08:05',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
    context: 'Перед завтраком',
  },
  {
    id: 'meal-0820',
    time: '08:20',
    kind: 'meal',
    title: 'Завтрак',
    value: '42 г углеводов',
    context: 'После инсулина',
  },
  {
    id: 'glucose-1015',
    time: '10:15',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
    context: 'После завтрака',
  },
];
