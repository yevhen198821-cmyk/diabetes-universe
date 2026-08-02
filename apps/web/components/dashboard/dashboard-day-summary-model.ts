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

export const dashboardDaySummaryLabels = {
  defaultEmpty: 'Данные за сегодня пока недоступны.',
  defaultError: 'Не удалось загрузить сводку дня.',
  eyebrow: 'Текущий день',
  glucoseMeasurements: 'Измерения глюкозы',
  loading: 'Загрузка сводки дня',
  medicationDoses: 'Приёмы лекарств',
  reminders: 'Напоминания',
  title: 'Сводка дня',
  totalCarbohydrates: 'Суммарные углеводы',
  totalInsulin: 'Суммарный инсулин',
  unavailable: 'Сводка дня недоступна.',
} as const;

const DAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createDashboardDaySummaryDayLabel(
  currentDate: Date,
  locale: string,
  timeZone: string,
): Pick<DashboardDaySummaryData, 'dayDate' | 'displayDayLabel'> | null {
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

function formatCount(value: number): string {
  return String(value);
}

function formatReminders(completed: number, total: number): string {
  return `${completed} / ${total}`;
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
): Pick<DashboardDaySummaryViewModel, 'primaryMetrics' | 'secondaryMetrics'> {
  return {
    primaryMetrics: [
      {
        label: dashboardDaySummaryLabels.glucoseMeasurements,
        value: formatCount(summary.glucoseMeasurements),
      },
      {
        label: dashboardDaySummaryLabels.totalInsulin,
        value: summary.totalInsulin,
      },
      {
        label: dashboardDaySummaryLabels.totalCarbohydrates,
        value: summary.totalCarbohydrates,
      },
    ],
    secondaryMetrics: [
      {
        label: dashboardDaySummaryLabels.medicationDoses,
        value: formatCount(summary.medicationDoses),
      },
      {
        label: dashboardDaySummaryLabels.reminders,
        value: formatReminders(
          summary.remindersCompleted,
          summary.remindersTotal,
        ),
      },
    ],
  };
}

function createEmptyViewModel(message: string): DashboardDaySummaryViewModel {
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
): DashboardDaySummaryViewModel {
  switch (props.state) {
    case 'loading':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: true,
        message:
          props.loadingLabel?.trim() || dashboardDaySummaryLabels.loading,
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
    case 'ready': {
      const summary = normalizeReadySummary(props.summary);

      if (!summary) {
        return createEmptyViewModel(dashboardDaySummaryLabels.unavailable);
      }

      const metrics = createReadyMetrics(summary);

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
        message:
          props.message?.trim() || dashboardDaySummaryLabels.defaultEmpty,
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
    case 'error':
      return {
        dayDate: null,
        displayDayLabel: null,
        isLoading: false,
        message:
          props.message?.trim() || dashboardDaySummaryLabels.defaultError,
        primaryMetrics: [],
        secondaryMetrics: [],
        state: props.state,
      };
  }
}
