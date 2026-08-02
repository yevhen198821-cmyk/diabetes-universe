const ACTIVITY_DURATION_PATTERN = /^\d+$/;

export const ACTIVITY_DURATION_MAX_MINUTES = 1440;

export function parseActivityDurationInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || !ACTIVITY_DURATION_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);

  if (
    !Number.isInteger(value) ||
    value <= 0 ||
    value > ACTIVITY_DURATION_MAX_MINUTES
  ) {
    return null;
  }

  return value;
}

export function formatActivityDuration(minutes: number): string {
  return minutes.toLocaleString('ru-RU');
}

export function validateActivityQuickAddEntry(entry: {
  readonly activityType: string;
  readonly durationMinutes: number;
  readonly note?: string;
  readonly time: string;
}): string | null {
  if (entry.activityType.trim().length === 0) {
    return 'Выберите вид активности';
  }

  if (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes <= 0) {
    return 'Введите продолжительность больше 0';
  }

  if (entry.durationMinutes > ACTIVITY_DURATION_MAX_MINUTES) {
    return 'Продолжительность не может быть больше 1440 минут';
  }

  if (entry.time.trim().length === 0) {
    return 'Укажите время';
  }

  if ((entry.note?.trim().length ?? 0) > 200) {
    return 'Заметка должна быть не длиннее 200 символов';
  }

  return null;
}
