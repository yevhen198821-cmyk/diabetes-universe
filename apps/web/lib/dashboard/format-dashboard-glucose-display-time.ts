import type { PlatformFormatter } from '@diabetes-universe/formatting';
import { GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS } from '@diabetes-universe/medical-domain';

import {
  getTimelineDayGroupKey,
  parseTimelineDateTime,
} from '../timeline/timeline-date-time';

const INVALID_DISPLAY_TIME = '--:--';
const ONE_MINUTE_MS = 60_000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

export interface DashboardGlucoseDisplayTimeLabels {
  readonly justNow: string;
  readonly today: string;
  readonly yesterday: string;
}

export interface FormatDashboardGlucoseDisplayTimeInput {
  readonly formatter: PlatformFormatter;
  readonly labels: DashboardGlucoseDisplayTimeLabels;
  readonly measuredAt: string;
  readonly referenceTime: Date;
  readonly timeZone?: string;
}

function resolveTrimmedLabel(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Formats Dashboard glucose measurement time for consumer-friendly display.
 *
 * Presentation-only: does not evaluate medical freshness or eligibility.
 */
export function formatDashboardGlucoseDisplayTime(
  input: FormatDashboardGlucoseDisplayTimeInput,
): string {
  const measuredAtMs = parseTimelineDateTime(input.measuredAt);
  const referenceMs = input.referenceTime.getTime();

  if (Number.isNaN(measuredAtMs) || Number.isNaN(referenceMs)) {
    return INVALID_DISPLAY_TIME;
  }

  const justNow = resolveTrimmedLabel(input.labels.justNow);
  const today = resolveTrimmedLabel(input.labels.today);
  const yesterday = resolveTrimmedLabel(input.labels.yesterday);

  if (!justNow || !today || !yesterday) {
    return INVALID_DISPLAY_TIME;
  }

  const futureOffsetMs = measuredAtMs - referenceMs;

  if (futureOffsetMs > GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS) {
    return INVALID_DISPLAY_TIME;
  }

  if (futureOffsetMs >= 0) {
    return justNow;
  }

  const ageMs = referenceMs - measuredAtMs;

  if (ageMs < ONE_MINUTE_MS) {
    return justNow;
  }

  if (ageMs < ONE_HOUR_MS) {
    const relativeMinutes = input.formatter
      .formatRelativeTime(input.measuredAt, input.referenceTime, {
        unit: 'minute',
      })
      .trim();

    return relativeMinutes.length > 0 ? relativeMinutes : INVALID_DISPLAY_TIME;
  }

  const time = input.formatter
    .formatTime(input.measuredAt, { timeStyle: 'short' })
    .trim();

  if (time.length === 0 || time === INVALID_DISPLAY_TIME) {
    return INVALID_DISPLAY_TIME;
  }

  const dayGroup = getTimelineDayGroupKey(
    input.measuredAt,
    input.referenceTime,
    input.timeZone,
  );

  if (dayGroup === 'today') {
    return `${today}, ${time}`;
  }

  if (dayGroup === 'yesterday') {
    return `${yesterday}, ${time}`;
  }

  const datePart = input.formatter
    .formatDate(input.measuredAt, { dateStyle: 'medium' })
    .trim();

  if (datePart.length === 0) {
    return INVALID_DISPLAY_TIME;
  }

  return `${datePart}, ${time}`;
}
