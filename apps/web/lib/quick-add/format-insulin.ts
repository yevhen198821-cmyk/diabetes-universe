export function formatInsulinDose(units: number): string {
  return units.toLocaleString('ru-RU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

const INSULIN_DOSE_PATTERN = /^\d+(?:[.,]\d+)?$/;

export function parseInsulinDoseInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || !INSULIN_DOSE_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(',', '.');
  const value = Number(normalized);

  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    return null;
  }

  return value;
}
