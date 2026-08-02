import type {
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NutritionQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createGlucoseTimelineEvent, sortTimelineEvents } from '../quick-add/create-glucose-timeline-event';
import { createInsulinTimelineEvent } from '../quick-add/create-insulin-timeline-event';
import { createMedicationTimelineEvent } from '../quick-add/create-medication-timeline-event';
import { createNutritionTimelineEvent } from '../quick-add/create-nutrition-timeline-event';
import { formatGlucoseValue } from '../quick-add/format-glucose';
import { formatInsulinDose } from '../quick-add/format-insulin';
import { formatNutritionCarbs } from '../quick-add/format-nutrition';

export interface DashboardDerivedAiInsight {
  readonly displayTime: string;
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly summary: string;
  readonly title: string;
}

export interface DashboardDerivedDaySummary {
  readonly dayDate: string;
  readonly displayDayLabel: string;
  readonly glucoseMeasurements: number;
  readonly medicationDoses: number;
  readonly remindersCompleted: number;
  readonly remindersTotal: number;
  readonly totalCarbohydrates: string;
  readonly totalInsulin: string;
}

export interface DashboardDerivedLastGlucose {
  readonly dateTime: string;
  readonly displayTime: string;
  readonly value: string;
}

export interface DashboardDerivedRecentEvent {
  readonly category: 'activity' | 'insulin' | 'medication' | 'nutrition';
  readonly context: string;
  readonly dateTime: string;
  readonly displayTime: string;
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export interface DashboardDemoState {
  readonly events: readonly TimelineEvent[];
}

export interface DashboardQuickAddIntegrationOptions {
  readonly aiInsight?: DashboardDerivedAiInsight | null;
  readonly locale?: string;
  readonly referenceTime?: Date;
  readonly remindersCompleted?: number;
  readonly remindersTotal?: number;
  readonly timeZone?: string;
}

export interface DashboardQuickAddIntegrationResult {
  readonly aiInsight: DashboardDerivedAiInsight | null;
  readonly daySummary: DashboardDerivedDaySummary | null;
  readonly lastGlucose: DashboardDerivedLastGlucose | null;
  readonly recentEvents: readonly DashboardDerivedRecentEvent[];
}

const DEFAULT_LOCALE = 'ru-RU';
const DEFAULT_TIME_ZONE = 'Europe/Moscow';

function createEventDateTime(time: string, referenceTime: Date): string | null {
  const [hours, minutes] = time.split(':').map((part) => Number(part));

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  const eventDate = new Date(referenceTime);
  eventDate.setHours(hours, minutes, 0, 0);

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  return eventDate.toISOString();
}

function parseInsulinUnits(value: string): number {
  const match = value.trim().match(/^([\d.,]+)/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1].replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCarbohydrateGrams(value: string): number {
  const match = value.trim().match(/^([\d.,]+)/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1].replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function createDashboardDayLabel(
  currentDate: Date,
  locale: string,
  timeZone: string,
): Pick<DashboardDerivedDaySummary, 'dayDate' | 'displayDayLabel'> | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  try {
    const normalizedLocale = locale.trim();
    const normalizedTimeZone = timeZone.trim();
    const supportedLocales = Intl.DateTimeFormat.supportedLocalesOf([
      normalizedLocale,
    ]);

    if (supportedLocales.length === 0 || normalizedTimeZone.length === 0) {
      return null;
    }

    const displayDayLabel = new Intl.DateTimeFormat(normalizedLocale, {
      day: 'numeric',
      month: 'long',
      timeZone: normalizedTimeZone,
      weekday: 'long',
    }).format(currentDate);
    const dateParts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      day: '2-digit',
      month: '2-digit',
      timeZone: normalizedTimeZone,
      year: 'numeric',
    }).formatToParts(currentDate);
    const day = dateParts.find((part) => part.type === 'day')?.value;
    const month = dateParts.find((part) => part.type === 'month')?.value;
    const year = dateParts.find((part) => part.type === 'year')?.value;

    if (!day || !month || !year) {
      return null;
    }

    const trimmedLabel = displayDayLabel.trim();

    if (trimmedLabel.length === 0) {
      return null;
    }

    return {
      dayDate: `${year.padStart(4, '0')}-${month}-${day}`,
      displayDayLabel: trimmedLabel,
    };
  } catch {
    return null;
  }
}

function mapTimelineEventToRecentEventSource(
  event: TimelineEvent,
  referenceTime: Date,
): DashboardDerivedRecentEvent | null {
  const dateTime = createEventDateTime(event.time, referenceTime);

  if (!dateTime) {
    return null;
  }

  switch (event.kind) {
    case 'insulin':
      return {
        category: 'insulin',
        context: event.context,
        dateTime,
        displayTime: event.time,
        id: event.id,
        title: event.title,
        unit: 'ЕД',
        value: parseInsulinUnits(event.value).toString(),
      };
    case 'meal':
    case 'nutrition':
      return {
        category: 'nutrition',
        context: event.context,
        dateTime,
        displayTime: event.time,
        id: event.id,
        title: event.title,
        unit: 'г углеводов',
        value: parseCarbohydrateGrams(event.value).toString(),
      };
    case 'medication':
      return {
        category: 'medication',
        context: event.context,
        dateTime,
        displayTime: event.time,
        id: event.id,
        title: event.title,
        unit: event.unit ?? '',
        value: event.value,
      };
    case 'activity':
      return {
        category: 'activity',
        context: event.context,
        dateTime,
        displayTime: event.time,
        id: event.id,
        title: event.title,
        unit: event.unit ?? 'минут',
        value: event.value,
      };
    default:
      return null;
  }
}

function deriveLastGlucose(
  events: readonly TimelineEvent[],
  referenceTime: Date,
): DashboardDerivedLastGlucose | null {
  const glucoseEvents = events.filter((event) => event.kind === 'glucose');

  if (glucoseEvents.length === 0) {
    return null;
  }

  const latestGlucose = [...glucoseEvents].sort((left, right) =>
    right.time.localeCompare(left.time),
  )[0];
  const dateTime = createEventDateTime(latestGlucose.time, referenceTime);

  if (!dateTime) {
    return null;
  }

  return {
    dateTime,
    displayTime: latestGlucose.time,
    value: latestGlucose.value,
  };
}

function deriveDaySummary(
  events: readonly TimelineEvent[],
  referenceTime: Date,
  locale: string,
  timeZone: string,
  remindersCompleted: number,
  remindersTotal: number,
): DashboardDerivedDaySummary | null {
  const dayLabel = createDashboardDayLabel(referenceTime, locale, timeZone);

  if (!dayLabel) {
    return null;
  }

  const glucoseMeasurements = events.filter(
    (event) => event.kind === 'glucose',
  ).length;
  const medicationDoses = events.filter(
    (event) => event.kind === 'medication',
  ).length;
  const totalInsulinUnits = events
    .filter((event) => event.kind === 'insulin')
    .reduce((total, event) => total + parseInsulinUnits(event.value), 0);
  const totalCarbohydrateGrams = events
    .filter((event) => event.kind === 'meal' || event.kind === 'nutrition')
    .reduce((total, event) => total + parseCarbohydrateGrams(event.value), 0);

  return {
    dayDate: dayLabel.dayDate,
    displayDayLabel: dayLabel.displayDayLabel,
    glucoseMeasurements,
    medicationDoses,
    remindersCompleted,
    remindersTotal,
    totalCarbohydrates: `${formatNutritionCarbs(totalCarbohydrateGrams)} г`,
    totalInsulin: `${formatInsulinDose(totalInsulinUnits)} ЕД`,
  };
}

export function deriveDashboardQuickAddBlocks(
  state: DashboardDemoState,
  options: DashboardQuickAddIntegrationOptions = {},
): DashboardQuickAddIntegrationResult {
  const referenceTime = options.referenceTime ?? new Date();
  const locale = options.locale ?? DEFAULT_LOCALE;
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;
  const remindersCompleted = options.remindersCompleted ?? 0;
  const remindersTotal = options.remindersTotal ?? 0;

  const recentEvents = state.events
    .map((event) => mapTimelineEventToRecentEventSource(event, referenceTime))
    .filter((event): event is DashboardDerivedRecentEvent => event !== null);

  return {
    aiInsight: options.aiInsight ?? null,
    daySummary: deriveDaySummary(
      state.events,
      referenceTime,
      locale,
      timeZone,
      remindersCompleted,
      remindersTotal,
    ),
    lastGlucose: deriveLastGlucose(state.events, referenceTime),
    recentEvents,
  };
}

export function applyGlucoseQuickAddEntry(
  state: DashboardDemoState,
  entry: GlucoseQuickAddEntry,
): DashboardDemoState {
  return {
    events: sortTimelineEvents([
      ...state.events,
      createGlucoseTimelineEvent(entry),
    ]),
  };
}

export function applyInsulinQuickAddEntry(
  state: DashboardDemoState,
  entry: InsulinQuickAddEntry,
): DashboardDemoState {
  return {
    events: sortTimelineEvents([
      ...state.events,
      createInsulinTimelineEvent(entry),
    ]),
  };
}

export function applyNutritionQuickAddEntry(
  state: DashboardDemoState,
  entry: NutritionQuickAddEntry,
): DashboardDemoState {
  return {
    events: sortTimelineEvents([
      ...state.events,
      createNutritionTimelineEvent(entry),
    ]),
  };
}

export function applyMedicationQuickAddEntry(
  state: DashboardDemoState,
  entry: MedicationQuickAddEntry,
): DashboardDemoState {
  return {
    events: sortTimelineEvents([
      ...state.events,
      createMedicationTimelineEvent(entry),
    ]),
  };
}

export function createLastGlucoseMeasurementFromEntry(
  entry: GlucoseQuickAddEntry,
  referenceTime: Date = new Date(),
): DashboardDerivedLastGlucose | null {
  const dateTime = createEventDateTime(entry.time, referenceTime);

  if (!dateTime) {
    return null;
  }

  return {
    dateTime,
    displayTime: entry.time,
    value: formatGlucoseValue(entry.valueMmol),
  };
}
