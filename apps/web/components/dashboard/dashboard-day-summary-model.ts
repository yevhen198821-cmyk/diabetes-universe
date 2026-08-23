import type { DashboardDaySummaryLabels } from './dashboard-day-summary-labels';

export interface DashboardDaySummaryData {
  readonly dayDate: string;
  readonly displayDayLabel: string;
  readonly glucoseMeasurements: number;
  readonly latestTodayGlucoseDisplay: string | null;
  readonly latestTodayGlucoseDisplayTime: string | null;
  readonly medicationDoses: number;
  readonly totalActivitySeconds: number;
  readonly totalCarbohydrateGrams: number;
  readonly totalInsulinUnits: number;
}

export interface DashboardDaySummaryFormattedMetrics {
  readonly glucose: string;
  readonly totalActivity: string;
  readonly totalCarbohydrates: string;
  readonly totalInsulin: string;
}

interface DashboardDaySummaryLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardDaySummaryReadyProps {
  readonly state: 'ready';
  readonly summary: DashboardDaySummaryData;
}

interface DashboardDaySummaryEmptyProps {
  readonly message?: string;
  readonly state: 'empty';
}

interface DashboardDaySummaryErrorProps {
  readonly message?: string;
  readonly state: 'error';
}

export type DashboardDaySummaryProps =
  | DashboardDaySummaryLoadingProps
  | DashboardDaySummaryReadyProps
  | DashboardDaySummaryEmptyProps
  | DashboardDaySummaryErrorProps;

export interface DashboardDaySummaryMetric {
  readonly label: string;
  readonly secondaryText: string | null;
  readonly value: string;
}

export interface DashboardDaySummaryViewModel {
  readonly dayDate: string | null;
  readonly displayDayLabel: string | null;
  readonly isLoading: boolean;
  readonly message: string | null;
  readonly metrics: readonly DashboardDaySummaryMetric[];
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
}

const DAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDayDate(dayDate: string): boolean {
  if (!DAY_DATE_PATTERN.test(dayDate)) {
    return false;
  }

  const [year, month, day] = dayDate.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function normalizeReadySummary(
  summary: DashboardDaySummaryData,
): DashboardDaySummaryData | null {
  const dayDate = summary.dayDate.trim();
  const displayDayLabel = summary.displayDayLabel.trim();
  const latestTodayGlucoseDisplay =
    summary.latestTodayGlucoseDisplay?.trim() || null;
  const latestTodayGlucoseDisplayTime =
    summary.latestTodayGlucoseDisplayTime?.trim() || null;

  if (
    !isValidDayDate(dayDate) ||
    displayDayLabel.length === 0 ||
    !isNonNegativeInteger(summary.glucoseMeasurements) ||
    !isNonNegativeInteger(summary.medicationDoses) ||
    !isNonNegativeNumber(summary.totalCarbohydrateGrams) ||
    !isNonNegativeNumber(summary.totalInsulinUnits) ||
    !isNonNegativeInteger(summary.totalActivitySeconds)
  ) {
    return null;
  }

  return {
    dayDate,
    displayDayLabel,
    glucoseMeasurements: summary.glucoseMeasurements,
    latestTodayGlucoseDisplay,
    latestTodayGlucoseDisplayTime,
    medicationDoses: summary.medicationDoses,
    totalActivitySeconds: summary.totalActivitySeconds,
    totalCarbohydrateGrams: summary.totalCarbohydrateGrams,
    totalInsulinUnits: summary.totalInsulinUnits,
  };
}

function createReadyMetrics(
  labels: DashboardDaySummaryLabels,
  summary: DashboardDaySummaryData,
  formattedMetrics: DashboardDaySummaryFormattedMetrics,
): DashboardDaySummaryMetric[] {
  return [
    {
      label: labels.glucose,
      secondaryText: summary.latestTodayGlucoseDisplayTime,
      value: formattedMetrics.glucose,
    },
    {
      label: labels.totalInsulin,
      secondaryText: labels.totalForDay,
      value: formattedMetrics.totalInsulin,
    },
    {
      label: labels.totalCarbohydrates,
      secondaryText: labels.totalForDay,
      value: formattedMetrics.totalCarbohydrates,
    },
    {
      label: labels.activity,
      secondaryText: labels.totalForDay,
      value: formattedMetrics.totalActivity,
    },
  ];
}

function createEmptyViewModel(
  labels: DashboardDaySummaryLabels,
  message: string,
): DashboardDaySummaryViewModel {
  return {
    dayDate: null,
    displayDayLabel: null,
    isLoading: false,
    message,
    metrics: [],
    state: 'empty',
  };
}

export function createDashboardDaySummaryViewModel(
  props: DashboardDaySummaryProps,
  labels: DashboardDaySummaryLabels,
  formattedMetrics?: DashboardDaySummaryFormattedMetrics,
): DashboardDaySummaryViewModel {
  switch (props.state) {
    case 'loading':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: true,
        message: props.loadingLabel?.trim() || labels.loading,
        metrics: [],
        state: props.state,
      };
    case 'ready': {
      const summary = normalizeReadySummary(props.summary);

      if (!summary || !formattedMetrics) {
        return createEmptyViewModel(labels, labels.unavailable);
      }

      return {
        dayDate: summary.dayDate,
        displayDayLabel: summary.displayDayLabel,
        isLoading: false,
        message: null,
        metrics: createReadyMetrics(labels, summary, formattedMetrics),
        state: props.state,
      };
    }
    case 'empty':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: false,
        message: props.message?.trim() || labels.defaultEmpty,
        metrics: [],
        state: props.state,
      };
    case 'error':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: false,
        message: props.message?.trim() || labels.defaultError,
        metrics: [],
        state: props.state,
      };
  }
}
