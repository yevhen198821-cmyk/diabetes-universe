export interface DashboardLastGlucoseMeasurement {
  readonly dateTime: string;
  readonly displayTime: string;
  readonly value: string;
}

interface DashboardLastGlucoseLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardLastGlucoseReadyProps {
  readonly glucose: DashboardLastGlucoseMeasurement;
  readonly referenceTime?: Date;
  readonly staleAfterMs?: number;
  readonly state: 'ready';
}

interface DashboardLastGlucoseEmptyProps {
  readonly message?: string;
  readonly state: 'empty';
}

interface DashboardLastGlucoseErrorProps {
  readonly message?: string;
  readonly state: 'error';
}

export type DashboardLastGlucoseProps =
  | DashboardLastGlucoseLoadingProps
  | DashboardLastGlucoseReadyProps
  | DashboardLastGlucoseEmptyProps
  | DashboardLastGlucoseErrorProps;

export interface DashboardLastGlucoseViewModel {
  readonly dateTime: string | null;
  readonly displayTime: string | null;
  readonly isLoading: boolean;
  readonly isStale: boolean;
  readonly message: string | null;
  readonly staleMessage: string | null;
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
  readonly value: string | null;
}

export interface DashboardLastGlucoseViewModelOptions {
  readonly referenceTime?: Date;
}

export const DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const dashboardLastGlucoseLabels = {
  defaultError: 'Не удалось загрузить последнее измерение.',
  defaultEmpty: 'Измерений пока нет.',
  eyebrow: 'Последнее измерение',
  loading: 'Загрузка последнего измерения глюкозы',
  stale: 'Измерение устарело.',
  title: 'Последняя глюкоза',
  unavailable: 'Последнее измерение недоступно.',
} as const;

export function createDashboardLastGlucoseMeasurement(
  measuredAt: Date,
  locale: string,
  timeZone: string,
  value: string,
): DashboardLastGlucoseMeasurement | null {
  const normalizedValue = value.trim();

  if (Number.isNaN(measuredAt.getTime()) || normalizedValue.length === 0) {
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

    const displayTime = new Intl.DateTimeFormat(normalizedLocale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: normalizedTimeZone,
    }).format(measuredAt);

    if (displayTime.trim().length === 0) {
      return null;
    }

    return {
      dateTime: measuredAt.toISOString(),
      displayTime: displayTime.trim(),
      value: normalizedValue,
    };
  } catch {
    return null;
  }
}

function isValidIsoDateTime(dateTime: string): boolean {
  return !Number.isNaN(Date.parse(dateTime));
}

function normalizeReadyMeasurement(
  glucose: DashboardLastGlucoseMeasurement,
): DashboardLastGlucoseMeasurement | null {
  const value = glucose.value.trim();
  const displayTime = glucose.displayTime.trim();
  const dateTime = glucose.dateTime.trim();

  if (
    value.length === 0 ||
    displayTime.length === 0 ||
    dateTime.length === 0 ||
    !isValidIsoDateTime(dateTime)
  ) {
    return null;
  }

  return {
    dateTime,
    displayTime,
    value,
  };
}

function createEmptyViewModel(message: string): DashboardLastGlucoseViewModel {
  return {
    dateTime: null,
    displayTime: null,
    isLoading: false,
    isStale: false,
    message,
    staleMessage: null,
    state: 'empty',
    value: null,
  };
}

function isMeasurementStale(
  dateTime: string,
  referenceTime: Date,
  staleAfterMs: number,
): boolean {
  const measuredAt = Date.parse(dateTime);

  if (Number.isNaN(measuredAt)) {
    return false;
  }

  return referenceTime.getTime() - measuredAt > staleAfterMs;
}

export function createDashboardLastGlucoseViewModel(
  props: DashboardLastGlucoseProps,
  options: DashboardLastGlucoseViewModelOptions = {},
): DashboardLastGlucoseViewModel {
  switch (props.state) {
    case 'loading':
      return {
        dateTime: null,
        displayTime: null,
        isLoading: true,
        isStale: false,
        message:
          props.loadingLabel?.trim() || dashboardLastGlucoseLabels.loading,
        staleMessage: null,
        state: props.state,
        value: null,
      };
    case 'ready': {
      const measurement = normalizeReadyMeasurement(props.glucose);

      if (!measurement) {
        return createEmptyViewModel(dashboardLastGlucoseLabels.unavailable);
      }

      const referenceTime =
        props.referenceTime ?? options.referenceTime ?? new Date();
      const staleAfterMs =
        props.staleAfterMs ?? DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS;
      const isStale = isMeasurementStale(
        measurement.dateTime,
        referenceTime,
        staleAfterMs,
      );

      return {
        dateTime: measurement.dateTime,
        displayTime: measurement.displayTime,
        isLoading: false,
        isStale,
        message: null,
        staleMessage: isStale ? dashboardLastGlucoseLabels.stale : null,
        state: props.state,
        value: measurement.value,
      };
    }
    case 'empty':
      return {
        dateTime: null,
        displayTime: null,
        isLoading: false,
        isStale: false,
        message:
          props.message?.trim() || dashboardLastGlucoseLabels.defaultEmpty,
        staleMessage: null,
        state: props.state,
        value: null,
      };
    case 'error':
      return {
        dateTime: null,
        displayTime: null,
        isLoading: false,
        isStale: false,
        message:
          props.message?.trim() || dashboardLastGlucoseLabels.defaultError,
        staleMessage: null,
        state: props.state,
        value: null,
      };
  }
}
