import type { SessionManagementCode } from '@diabetes-universe/identity';

export interface SessionMutationState {
  readonly status: 'idle' | 'success' | 'error';
  readonly code?: SessionManagementCode;
  readonly message?: string;
}

export const initialSessionMutationState: SessionMutationState = {
  status: 'idle',
};
