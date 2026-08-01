import type { QuickAddOptionGroup } from '@diabetes-universe/ui';

export const insulinPreparationOptionGroups: readonly QuickAddOptionGroup[] = [
  {
    label: 'Быстрый инсулин',
    options: ['NovoRapid', 'Fiasp', 'Humalog', 'Apidra'],
  },
  {
    label: 'Базальный инсулин',
    options: ['Lantus', 'Tresiba'],
  },
  {
    options: ['Другое'],
  },
];

export const insulinPreparationOptions: readonly string[] =
  insulinPreparationOptionGroups.flatMap((group) => group.options);
