export function formatGlucoseValue(mmol: number): string {
  const formatted = mmol.toLocaleString('ru-RU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  return `${formatted} ммоль/л`;
}

export function parseGlucoseInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');

  if (!normalized) {
    return null;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0.1 || value > 40) {
    return null;
  }

  return value;
}

export function getCurrentTimeString(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}
