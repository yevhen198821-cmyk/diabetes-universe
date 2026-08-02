const ACTIVITY_DURATION_PATTERN = /^\d+$/;

export function parseActivityDurationInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || !ACTIVITY_DURATION_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isInteger(value) || value <= 0 || value > 600) {
    return null;
  }

  return value;
}

export function formatActivityDuration(minutes: number): string {
  return minutes.toLocaleString('ru-RU');
}
