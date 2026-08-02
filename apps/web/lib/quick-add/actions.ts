import type { QuickAddAction } from '@diabetes-universe/types';
import type { QuickAddActionItem } from '@diabetes-universe/ui';
import { CookingPot, Droplets, Pill, Syringe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

const quickAddActionDefinitions = [
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
] as const satisfies readonly QuickAddAction[];

const quickAddIcons: Record<
  (typeof quickAddActionDefinitions)[number]['category'],
  LucideIcon
> = {
  glucose: Droplets,
  insulin: Syringe,
  medication: Pill,
  nutrition: CookingPot,
};

export const quickAddActions: readonly QuickAddActionItem[] =
  quickAddActionDefinitions.map((action) => ({
    ...action,
    icon: createElement(quickAddIcons[action.category], {
      'aria-hidden': true,
      size: 22,
    }),
  }));
