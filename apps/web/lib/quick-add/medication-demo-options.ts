import type { MedicationReference } from '@diabetes-universe/types';

export const medicationDemoOptions: readonly MedicationReference[] = [
  {
    id: 'metformin',
    name: 'Метформин',
  },
  {
    id: 'jardiance',
    name: 'Jardiance',
  },
  {
    id: 'forxiga',
    name: 'Forxiga',
  },
  {
    id: 'ozempic',
    name: 'Ozempic',
  },
  {
    id: 'mounjaro',
    name: 'Mounjaro',
  },
  {
    id: 'other',
    name: 'Другое',
  },
];

export const medicationDemoOptionNames: readonly string[] =
  medicationDemoOptions.map((medication) => medication.name);

export function findMedicationDemoOptionByName(
  medicationName: string,
): MedicationReference | undefined {
  return medicationDemoOptions.find(
    (medication) => medication.name === medicationName,
  );
}
