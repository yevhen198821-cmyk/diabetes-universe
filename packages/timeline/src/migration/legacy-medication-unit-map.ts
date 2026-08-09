import type { CanonicalUnitId } from '@diabetes-universe/types';

const medicationUnitMap: Readonly<Record<string, CanonicalUnitId>> = {
  г: 'mass.g',
  мг: 'mass.mg',
  мл: 'volume.ml',
};

function normalizeLegacyUnit(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function mapLegacyMedicationUnit(
  unit: string | undefined,
): CanonicalUnitId | null {
  if (!unit) {
    return null;
  }

  const normalized = normalizeLegacyUnit(unit);

  if (normalized.length === 0) {
    return null;
  }

  return medicationUnitMap[normalized] ?? null;
}
