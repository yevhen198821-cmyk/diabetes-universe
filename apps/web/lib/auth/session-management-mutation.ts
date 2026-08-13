import type {
  SessionManagementCode,
  SessionManagementResult,
} from '@diabetes-universe/identity';
import {
  SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
  SESSION_FRESH_AUTH_REQUIRED_MESSAGE,
  SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  SESSION_MANAGEMENT_SUCCESS_MESSAGE,
} from '@diabetes-universe/identity/server';

import type { SessionMutationState } from './session-management-state';

export const ACCOUNT_SECURITY_SESSIONS_PATH = '/account/security/sessions';

export const ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK = `/auth?callback=${ACCOUNT_SECURITY_SESSIONS_PATH}`;

export type SessionMutationRecoveryAction =
  'redirect-auth' | 'redirect-auth-after-revoke-all';

export interface SessionMutationOutcome {
  readonly action: 'return-state' | SessionMutationRecoveryAction;
  readonly revalidatePath?: string;
  readonly state: SessionMutationState;
}

export function parseRevokeSessionId(formData: FormData): string | null {
  const sessionId = String(formData.get('sessionId') ?? '').trim();

  if (!sessionId) {
    return null;
  }

  return sessionId;
}

export function mapSessionManagementResultToMutationOutcome(
  result: SessionManagementResult,
  options: {
    readonly revalidateOnSuccess?: boolean;
    readonly revokeAllSuccessRedirect?: boolean;
  } = {},
): SessionMutationOutcome {
  if (result.ok && result.code === 'SUCCESS') {
    if (options.revokeAllSuccessRedirect) {
      return {
        action: 'redirect-auth-after-revoke-all',
        state: {
          status: 'success',
          code: result.code,
          message: result.message ?? SESSION_MANAGEMENT_SUCCESS_MESSAGE,
        },
      };
    }

    return {
      action: 'return-state',
      revalidatePath: options.revalidateOnSuccess
        ? ACCOUNT_SECURITY_SESSIONS_PATH
        : undefined,
      state: {
        status: 'success',
        code: result.code,
        message: result.message ?? SESSION_MANAGEMENT_SUCCESS_MESSAGE,
      },
    };
  }

  return {
    action: mapFailureCodeToRecoveryAction(result.code),
    state: mapFailureCodeToMutationState(result.code, result.message),
  };
}

function mapFailureCodeToRecoveryAction(
  code: SessionManagementCode,
): SessionMutationOutcome['action'] {
  switch (code) {
    case 'AUTHENTICATION_REQUIRED':
    case 'SESSION_STATE_INVALID':
      return 'redirect-auth';
    default:
      return 'return-state';
  }
}

function mapFailureCodeToMutationState(
  code: SessionManagementCode,
  message?: string,
): SessionMutationState {
  switch (code) {
    case 'FRESH_AUTH_REQUIRED':
      return {
        status: 'error',
        code,
        message: message ?? SESSION_FRESH_AUTH_REQUIRED_MESSAGE,
      };
    case 'CURRENT_SESSION_REQUIRES_SIGN_OUT':
      return {
        status: 'error',
        code,
        message: message ?? SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
      };
    case 'SESSION_REVOKE_FAILED':
    case 'SESSION_STATE_INVALID':
      return {
        status: 'error',
        code,
        message: message ?? SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
      };
    case 'AUTHENTICATION_REQUIRED':
      return {
        status: 'error',
        code,
        message: message ?? SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
      };
    default:
      return {
        status: 'error',
        code,
        message: message ?? SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
      };
  }
}

export function createInvalidSessionIdMutationState(): SessionMutationState {
  return {
    status: 'error',
    message: SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  };
}
