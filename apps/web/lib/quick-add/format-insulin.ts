export function formatInsulinDose(units: number): string {
  return units.toLocaleString('ru-RU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

export function parseInsulinDoseInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');

  if (!normalized) {
    return null;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    return null;
  }

  return value;
}
