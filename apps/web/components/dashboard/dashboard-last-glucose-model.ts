import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import type { DashboardLastGlucoseLabels } from './dashboard-last-glucose-labels';

export interface DashboardLastGlucoseMeasurement {
  readonly displayTime: string;
  readonly event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>;
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
  readonly sourceLabel: string | null;
  readonly staleMessage: string | null;
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
  readonly value: string | null;
}

export interface DashboardLastGlucoseViewModelOptions {
  readonly referenceTime?: Date;
  readonly sourceLabel?: string | null;
}

export const DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function isValidIsoDateTime(dateTime: string): boolean {
  return !Number.isNaN(Date.parse(dateTime));
}

function normalizeReadyMeasurement(
  glucose: DashboardLastGlucoseMeasurement,
): DashboardLastGlucoseMeasurement | null {
  const displayTime = glucose.displayTime.trim();
  const occurredAt = glucose.event.occurredAt.trim();

  if (
    displayTime.length === 0 ||
    occurredAt.length === 0 ||
    !isValidIsoDateTime(occurredAt) ||
    !Number.isFinite(glucose.event.concentrationMmolPerL)
  ) {
    return null;
  }

  return {
    displayTime,
    event: glucose.event,
  };
}

function createEmptyViewModel(message: string): DashboardLastGlucoseViewModel {
  return {
    dateTime: null,
    displayTime: null,
    isLoading: false,
    isStale: false,
    message,
    sourceLabel: null,
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
  labels: DashboardLastGlucoseLabels,
  options: DashboardLastGlucoseViewModelOptions & {
    readonly formattedValue?: string;
  } = {},
): DashboardLastGlucoseViewModel {
  switch (props.state) {
    case 'loading':
      return {
        dateTime: null,
        displayTime: null,
        isLoading: true,
        isStale: false,
        message: props.loadingLabel?.trim() || labels.loading,
        sourceLabel: null,
        staleMessage: null,
        state: props.state,
        value: null,
      };
    case 'ready': {
      const measurement = normalizeReadyMeasurement(props.glucose);
      const formattedValue = options.formattedValue?.trim() ?? '';

      if (!measurement || formattedValue.length === 0) {
        return createEmptyViewModel(labels.unavailable);
      }

      const referenceTime =
        props.referenceTime ?? options.referenceTime ?? new Date();
      const staleAfterMs =
        props.staleAfterMs ?? DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS;
      const isStale = isMeasurementStale(
        measurement.event.occurredAt,
        referenceTime,
        staleAfterMs,
      );

      return {
        dateTime: measurement.event.occurredAt,
        displayTime: measurement.displayTime,
        isLoading: false,
        isStale,
        message: null,
        sourceLabel: options.sourceLabel?.trim() || null,
        staleMessage: isStale ? labels.stale : null,
        state: props.state,
        value: formattedValue,
      };
    }
    case 'empty':
      return {
        dateTime: null,
        displayTime: null,
        isLoading: false,
        isStale: false,
        message: props.message?.trim() || labels.defaultEmpty,
        sourceLabel: null,
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
        message: props.message?.trim() || labels.defaultError,
        sourceLabel: null,
        staleMessage: null,
        state: props.state,
        value: null,
      };
  }
}
