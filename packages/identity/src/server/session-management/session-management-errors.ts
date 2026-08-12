import { GENERIC_AUTH_ERROR_MESSAGE } from '../../contracts/auth-contracts';
import type {
  AccountSessionSummary,
  SessionManagementCode,
  SessionManagementResult,
} from '../../contracts/session-management-contracts';

export const SESSION_FRESH_AUTH_REQUIRED_MESSAGE =
  'Подтвердите вход и повторите действие';

export const SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE =
  'Не удалось выполнить действие. Попробуйте позже.';

export const SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE =
  'Для выхода с этого устройства используйте выход из текущей сессии.';

export const SESSION_MANAGEMENT_SUCCESS_MESSAGE = 'Действие выполнено.';

export class SessionManagementError extends Error {
  readonly code: SessionManagementCode;

  constructor(code: SessionManagementCode, message: string) {
    super(message);
    this.name = 'SessionManagementError';
    this.code = code;
  }
}

export function mapSessionManagementMessage(
  code: SessionManagementCode,
): string {
  switch (code) {
    case 'SUCCESS':
      return SESSION_MANAGEMENT_SUCCESS_MESSAGE;
    case 'AUTHENTICATION_REQUIRED':
      return GENERIC_AUTH_ERROR_MESSAGE;
    case 'FRESH_AUTH_REQUIRED':
      return SESSION_FRESH_AUTH_REQUIRED_MESSAGE;
    case 'CURRENT_SESSION_REQUIRES_SIGN_OUT':
      return SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE;
    case 'SESSION_REVOKE_FAILED':
    case 'SESSION_STATE_INVALID':
      return SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE;
    default:
      return SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE;
  }
}

export function createSessionManagementResult(input: {
  readonly ok: boolean;
  readonly code: SessionManagementCode;
  readonly message?: string;
  readonly sessions?: readonly AccountSessionSummary[];
}): SessionManagementResult {
  return {
    ok: input.ok,
    code: input.code,
    message: input.message ?? mapSessionManagementMessage(input.code),
    ...(input.sessions ? { sessions: input.sessions } : {}),
  };
}

export function createSessionManagementError(
  code: SessionManagementCode,
  message?: string,
): SessionManagementError {
  return new SessionManagementError(
    code,
    message ?? mapSessionManagementMessage(code),
  );
}
