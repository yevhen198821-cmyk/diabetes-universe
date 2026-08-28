import type { GlucoseFreshnessState } from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  createDashboardLegacyFreshnessPolicy,
  DASHBOARD_LEGACY_FRESHNESS_POLICY,
} from '../../lib/medical/glucose/dashboard-legacy-freshness-policy';
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
  readonly freshMessage: string | null;
  readonly isLoading: boolean;
  readonly isStale: boolean;
  readonly message: string | null;
  readonly rangeLabel: string | null;
  readonly sourceLabel: string | null;
  readonly staleMessage: string | null;
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
  readonly value: string | null;
}

export interface DashboardLastGlucoseViewModelOptions {
  readonly freshnessState?: GlucoseFreshnessState;
  readonly rangeLabel?: string | null;
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
    freshMessage: null,
    isLoading: false,
    isStale: false,
    message,
    rangeLabel: null,
    sourceLabel: null,
    staleMessage: null,
    state: 'empty',
    value: null,
  };
}

function resolveStaleStateFromFreshness(
  freshnessState: GlucoseFreshnessState | undefined,
): { readonly isStale: boolean; readonly showFresh: boolean } {
  if (freshnessState === 'old') {
    return { isStale: true, showFresh: false };
  }

  if (freshnessState === 'current' || freshnessState === 'recent') {
    return { isStale: false, showFresh: true };
  }

  return { isStale: false, showFresh: false };
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
        freshMessage: null,
        isLoading: true,
        isStale: false,
        message: props.loadingLabel?.trim() || labels.loading,
        rangeLabel: null,
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

      const staleState = resolveStaleStateFromFreshness(options.freshnessState);

      return {
        dateTime: measurement.event.occurredAt,
        displayTime: measurement.displayTime,
        freshMessage: staleState.showFresh ? labels.fresh : null,
        isLoading: false,
        isStale: staleState.isStale,
        message: null,
        rangeLabel: options.rangeLabel?.trim() || null,
        sourceLabel: options.sourceLabel?.trim() || null,
        staleMessage: staleState.isStale ? labels.stale : null,
        state: props.state,
        value: formattedValue,
      };
    }
    case 'empty':
      return {
        dateTime: null,
        displayTime: null,
        freshMessage: null,
        isLoading: false,
        isStale: false,
        message: props.message?.trim() || labels.defaultEmpty,
        rangeLabel: null,
        sourceLabel: null,
        staleMessage: null,
        state: props.state,
        value: null,
      };
    case 'error':
      return {
        dateTime: null,
        displayTime: null,
        freshMessage: null,
        isLoading: false,
        isStale: false,
        message: props.message?.trim() || labels.defaultError,
        rangeLabel: null,
        sourceLabel: null,
        staleMessage: null,
        state: props.state,
        value: null,
      };
  }
}

export function resolveDashboardLastGlucoseFreshnessPolicy(
  staleAfterMs: number = DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS,
) {
  return staleAfterMs === DEFAULT_LAST_GLUCOSE_STALE_AFTER_MS
    ? DASHBOARD_LEGACY_FRESHNESS_POLICY
    : createDashboardLegacyFreshnessPolicy(staleAfterMs);
}
