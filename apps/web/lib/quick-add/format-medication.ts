const MEDICATION_DOSE_PATTERN = /^\d+(?:[.,]\d+)?$/;
const MAX_MEDICATION_DOSE = 100000;

export function parseMedicationDoseInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || !MEDICATION_DOSE_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed.replace(',', '.'));

  if (!Number.isFinite(value) || value <= 0 || value > MAX_MEDICATION_DOSE) {
    return null;
  }

  return value;
}

export function formatMedicationDose(dose: number): string {
  return dose.toLocaleString('ru-RU', {
    maximumFractionDigits: 20,
    minimumFractionDigits: 0,
  });
}
