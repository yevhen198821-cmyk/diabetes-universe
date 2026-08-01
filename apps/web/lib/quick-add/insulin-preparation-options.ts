import type { QuickAddOptionGroup } from '@diabetes-universe/ui';

export const insulinPreparationOptions: readonly string[] = [
  'NovoRapid',
  'Fiasp',
  'Humalog',
  'Apidra',
  'Lantus',
  'Tresiba',
  'Другое',
];

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
