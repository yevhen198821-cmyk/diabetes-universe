export interface AuthenticatedPrincipal {
  readonly accountId: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly displayName: string | null;
}

export interface SessionSummary {
  readonly sessionId: string;
  readonly accountId: string;
  readonly expiresAt: string;
}

export type AuthRequestStatus = 'sent' | 'failed';

export interface AuthRequestResult {
  readonly status: AuthRequestStatus;
  readonly message: string;
}

export const GENERIC_MAGIC_LINK_REQUEST_MESSAGE =
  'Если адрес указан верно, мы отправим ссылку для входа.';

export const GENERIC_AUTH_ERROR_MESSAGE =
  'Не удалось выполнить вход. Попробуйте ещё раз позже.';
