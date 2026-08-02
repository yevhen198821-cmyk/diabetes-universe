import type { DashboardDaySummaryLabels } from './dashboard-day-summary-labels';

export interface DashboardDaySummaryData {
  readonly dayDate: string;
  readonly displayDayLabel: string;
  readonly glucoseMeasurements: number;
  readonly medicationDoses: number;
  readonly remindersCompleted: number;
  readonly remindersTotal: number;
  readonly totalCarbohydrates: string;
  readonly totalInsulin: string;
}

export interface DashboardDaySummaryFormattedMetrics {
  readonly glucoseMeasurements: string;
  readonly medicationDoses: string;
  readonly reminders: string;
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
  readonly value: string;
}

export interface DashboardDaySummaryViewModel {
  readonly dayDate: string | null;
  readonly displayDayLabel: string | null;
  readonly isLoading: boolean;
  readonly message: string | null;
  readonly primaryMetrics: readonly DashboardDaySummaryMetric[];
  readonly secondaryMetrics: readonly DashboardDaySummaryMetric[];
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

function normalizeReadySummary(
  summary: DashboardDaySummaryData,
): DashboardDaySummaryData | null {
  const dayDate = summary.dayDate.trim();
  const displayDayLabel = summary.displayDayLabel.trim();
  const totalInsulin = summary.totalInsulin.trim();
  const totalCarbohydrates = summary.totalCarbohydrates.trim();

  if (
    !isValidDayDate(dayDate) ||
    displayDayLabel.length === 0 ||
    totalInsulin.length === 0 ||
    totalCarbohydrates.length === 0 ||
    !isNonNegativeInteger(summary.glucoseMeasurements) ||
    !isNonNegativeInteger(summary.medicationDoses) ||
    !isNonNegativeInteger(summary.remindersCompleted) ||
    !isNonNegativeInteger(summary.remindersTotal) ||
    summary.remindersCompleted > summary.remindersTotal
  ) {
    return null;
  }

  return {
    dayDate,
    displayDayLabel,
    glucoseMeasurements: summary.glucoseMeasurements,
    medicationDoses: summary.medicationDoses,
    remindersCompleted: summary.remindersCompleted,
    remindersTotal: summary.remindersTotal,
    totalCarbohydrates,
    totalInsulin,
  };
}

function createReadyMetrics(
  summary: DashboardDaySummaryData,
  labels: DashboardDaySummaryLabels,
  formattedMetrics: DashboardDaySummaryFormattedMetrics,
): Pick<DashboardDaySummaryViewModel, 'primaryMetrics' | 'secondaryMetrics'> {
  return {
    primaryMetrics: [
      {
        label: labels.glucoseMeasurements,
        value: formattedMetrics.glucoseMeasurements,
      },
      {
        label: labels.totalInsulin,
        value: summary.totalInsulin,
      },
      {
        label: labels.totalCarbohydrates,
        value: summary.totalCarbohydrates,
      },
    ],
    secondaryMetrics: [
      {
        label: labels.medicationDoses,
        value: formattedMetrics.medicationDoses,
      },
      {
        label: labels.reminders,
        value: formattedMetrics.reminders,
      },
    ],
  };
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
    primaryMetrics: [],
    secondaryMetrics: [],
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
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
    case 'ready': {
      const summary = normalizeReadySummary(props.summary);

      if (!summary || !formattedMetrics) {
        return createEmptyViewModel(labels, labels.unavailable);
      }

      const metrics = createReadyMetrics(summary, labels, formattedMetrics);

      return {
        dayDate: summary.dayDate,
        displayDayLabel: summary.displayDayLabel,
        isLoading: false,
        message: null,
        ...metrics,
        state: props.state,
      };
    }
    case 'empty':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: false,
        message: props.message?.trim() || labels.defaultEmpty,
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
    case 'error':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: false,
        message: props.message?.trim() || labels.defaultError,
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
  }
}
