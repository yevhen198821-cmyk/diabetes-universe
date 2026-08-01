import type { MedicationReference } from '@diabetes-universe/types';
import type { QuickAddOptionItem } from '@diabetes-universe/ui';

export interface MedicationDemoOption {
  readonly medication: MedicationReference;
  readonly form?: string;
  readonly suggestedUnit?: string;
}

export const medicationDemoOptions: readonly MedicationDemoOption[] = [
  {
    form: 'таблетки',
    medication: {
      id: 'metformin',
      name: 'Метформин',
    },
    suggestedUnit: 'мг',
  },
  {
    form: 'таблетки',
    medication: {
      id: 'jardiance',
      name: 'Jardiance',
    },
    suggestedUnit: 'мг',
  },
  {
    form: 'таблетки',
    medication: {
      id: 'forxiga',
      name: 'Forxiga',
    },
    suggestedUnit: 'мг',
  },
  {
    form: 'инъекция',
    medication: {
      id: 'ozempic',
      name: 'Ozempic',
    },
    suggestedUnit: 'мл',
  },
  {
    form: 'инъекция',
    medication: {
      id: 'mounjaro',
      name: 'Mounjaro',
    },
    suggestedUnit: 'мл',
  },
  {
    medication: {
      id: 'other',
      name: 'Другое',
    },
  },
];

export const medicationDemoSheetOptions: readonly QuickAddOptionItem[] =
  medicationDemoOptions.map((option) => ({
    description: option.form,
    label: option.medication.name,
    value: option.medication.name,
  }));

export function findMedicationDemoOptionByName(
  medicationName: string,
): MedicationDemoOption | undefined {
  return medicationDemoOptions.find(
    (option) => option.medication.name === medicationName,
  );
}
