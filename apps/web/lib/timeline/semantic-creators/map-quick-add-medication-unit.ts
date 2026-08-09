import type { CanonicalUnitId } from '@diabetes-universe/types';

const quickAddMedicationUnitMap: Readonly<Record<string, CanonicalUnitId>> = {
  г: 'mass.g',
  мг: 'mass.mg',
  мл: 'volume.ml',
};

function normalizeQuickAddUnit(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function mapQuickAddMedicationUnit(
  unit: string,
): CanonicalUnitId | null {
  const normalized = normalizeQuickAddUnit(unit);

  if (normalized.length === 0) {
    return null;
  }

  return quickAddMedicationUnitMap[normalized] ?? null;
}
