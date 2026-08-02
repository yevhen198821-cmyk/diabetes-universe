import type { NextStep } from '@diabetes-universe/types';

export interface DashboardNextActionMessage {
  readonly description?: string;
  readonly title: string;
}

interface DashboardNextActionLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardNextActionReadyProps {
  readonly action: NextStep;
  readonly actionDisabled?: boolean;
  readonly onAction: () => void;
  readonly state: 'ready';
}

interface DashboardNextActionEmptyProps {
  readonly content: DashboardNextActionMessage;
  readonly state: 'empty';
}

interface DashboardNextActionErrorProps {
  readonly content: DashboardNextActionMessage;
  readonly state: 'error';
}

export type DashboardNextActionProps =
  | DashboardNextActionLoadingProps
  | DashboardNextActionReadyProps
  | DashboardNextActionEmptyProps
  | DashboardNextActionErrorProps;

export interface DashboardNextActionViewModel {
  readonly actionDisabled: boolean;
  readonly actionLabel: string | null;
  readonly description: string | null;
  readonly isLoading: boolean;
  readonly onAction?: () => void;
  readonly state: DashboardNextActionProps['state'];
  readonly statusLabel: string | null;
  readonly title: string | null;
}

export const dashboardNextActionLabels = {
  loading: 'Загрузка следующего действия',
} as const;

export function createDashboardNextActionViewModel(
  props: DashboardNextActionProps,
): DashboardNextActionViewModel {
  switch (props.state) {
    case 'loading':
      return {
        actionDisabled: true,
        actionLabel: null,
        description: null,
        isLoading: true,
        state: props.state,
        statusLabel:
          props.loadingLabel?.trim() || dashboardNextActionLabels.loading,
        title: null,
      };
    case 'ready':
      return {
        actionDisabled: props.actionDisabled ?? false,
        actionLabel: props.action.actionLabel,
        description: props.action.description,
        isLoading: false,
        onAction: props.onAction,
        state: props.state,
        statusLabel: null,
        title: props.action.title,
      };
    case 'empty':
    case 'error':
      return {
        actionDisabled: true,
        actionLabel: null,
        description: props.content.description?.trim() || null,
        isLoading: false,
        state: props.state,
        statusLabel: props.content.title.trim(),
        title: props.content.title.trim(),
      };
  }
}
