import type { QuickAddAction } from '@diabetes-universe/types';
import type { QuickAddActionItem } from '@diabetes-universe/ui';
import {
  Activity,
  CookingPot,
  Droplets,
  Pill,
  StickyNote,
  Syringe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

const quickAddActionDefinitions: readonly QuickAddAction[] = [
  {
    id: 'glucose',
    category: 'glucose',
    label: 'Глюкоза',
    description: 'Записать уровень сахара',
  },
  {
    id: 'insulin',
    category: 'insulin',
    label: 'Инсулин',
    description: 'Записать дозу инсулина',
  },
  {
    id: 'nutrition',
    category: 'nutrition',
    label: 'Питание',
    description: 'Записать приём пищи',
  },
  {
    id: 'medication',
    category: 'medication',
    label: 'Лекарство',
    description: 'Записать приём препарата',
  },
  {
    id: 'activity',
    category: 'activity',
    label: 'Активность',
    description: 'Записать движение или тренировку',
  },
  {
    id: 'note',
    category: 'note',
    label: 'Заметка',
    description: 'Добавить самочувствие или контекст',
  },
];

const quickAddIcons: Record<QuickAddAction['category'], LucideIcon> = {
  glucose: Droplets,
  insulin: Syringe,
  nutrition: CookingPot,
  activity: Activity,
  medication: Pill,
  note: StickyNote,
};

export const quickAddActions: readonly QuickAddActionItem[] =
  quickAddActionDefinitions.map((action) => ({
    ...action,
    icon: createElement(quickAddIcons[action.category], {
      'aria-hidden': true,
      size: 22,
    }),
  }));
