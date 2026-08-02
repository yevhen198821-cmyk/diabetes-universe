import type { LastGlucose } from '@diabetes-universe/types';

interface DashboardLastGlucoseLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardLastGlucoseReadyProps {
  readonly glucose: LastGlucose;
  readonly state: 'ready';
}

interface DashboardLastGlucoseEmptyProps {
  readonly message: string;
  readonly state: 'empty';
}

interface DashboardLastGlucoseErrorProps {
  readonly message: string;
  readonly state: 'error';
}

export type DashboardLastGlucoseProps =
  | DashboardLastGlucoseLoadingProps
  | DashboardLastGlucoseReadyProps
  | DashboardLastGlucoseEmptyProps
  | DashboardLastGlucoseErrorProps;

export interface DashboardLastGlucoseViewModel {
  readonly isLoading: boolean;
  readonly message: string | null;
  readonly state: DashboardLastGlucoseProps['state'];
  readonly time: string | null;
  readonly value: string | null;
}

export const dashboardLastGlucoseLabels = {
  eyebrow: 'Последнее измерение',
  loading: 'Загрузка последнего измерения глюкозы',
  title: 'Последняя глюкоза',
} as const;

export function createDashboardLastGlucoseViewModel(
  props: DashboardLastGlucoseProps,
): DashboardLastGlucoseViewModel {
  switch (props.state) {
    case 'loading':
      return {
        isLoading: true,
        message:
          props.loadingLabel?.trim() || dashboardLastGlucoseLabels.loading,
        state: props.state,
        time: null,
        value: null,
      };
    case 'ready':
      return {
        isLoading: false,
        message: null,
        state: props.state,
        time: props.glucose.time.trim(),
        value: props.glucose.value.trim(),
      };
    case 'empty':
    case 'error':
      return {
        isLoading: false,
        message: props.message.trim(),
        state: props.state,
        time: null,
        value: null,
      };
  }
}
