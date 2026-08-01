import type { DaySummary, TimelineEvent } from '@diabetes-universe/types';

export const daySummary: DaySummary = {
  glucose: '6,4 ммоль/л',
  events: 6,
  carbohydrates: '84 г',
  insulin: '8 ЕД',
  activity: '25 минут',
};

export const timelineEvents: readonly TimelineEvent[] = [
  {
    id: 'glucose-1015',
    time: '10:15',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
    details: 'Через 1 ч 55 мин после завтрака',
    expandedDetails: [
      'Источник: демонстрационный глюкометр',
      'Метка: после еды',
      'Запись добавлена вручную',
    ],
    linked: true,
  },
  {
    id: 'activity-0930',
    time: '09:30',
    kind: 'activity',
    title: 'Прогулка',
    value: '25 минут',
    details: 'Умеренный темп',
    expandedDetails: [
      'Продолжительность: 25 минут',
      'Интенсивность: умеренная',
      'Расстояние: демонстрационные 1,8 км',
    ],
    linked: false,
  },
  {
    id: 'meal-0820',
    time: '08:20',
    kind: 'meal',
    title: 'Завтрак',
    value: '42 г углеводов',
    details: '3,5 ХЕ',
    expandedDetails: [
      'Овсяная каша — демонстрационная порция',
      'Ягоды и натуральный йогурт',
      'Расчёт углеводов является демонстрационным',
    ],
    linked: true,
  },
  {
    id: 'insulin-0805',
    time: '08:05',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
    details: 'Болюсный инсулин',
    expandedDetails: [
      'Способ ввода: демонстрационная шприц-ручка',
      'Место введения: живот',
      'Доза указана только для демонстрации интерфейса',
    ],
    linked: true,
  },
  {
    id: 'glucose-0800',
    time: '08:00',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
    details: 'Перед завтраком',
    expandedDetails: [
      'Источник: демонстрационный глюкометр',
      'Метка: натощак',
      'Запись добавлена вручную',
    ],
    linked: true,
  },
  {
    id: 'note-0755',
    time: '07:55',
    kind: 'note',
    title: 'Заметка',
    value: 'Хорошо спал',
    details: 'Самочувствие нормальное',
    expandedDetails: [
      'Сон: 7 ч 40 мин',
      'Настроение: спокойное',
      'Текст является демонстрационным',
    ],
    linked: false,
  },
];
