export interface AuthenticatedPrincipal {
  readonly accountId: string;
  readonly avatarUrl: string | null;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly displayName: string | null;
}

export interface SessionSummary {
  readonly sessionId: string;
  readonly accountId: string;
  readonly expiresAt: string;
}

export interface PasskeySummary {
  readonly passkeyId: string;
  readonly name: string;
  readonly createdAt: string | null;
}

export type AuthRequestStatus = 'sent' | 'failed';

export interface AuthRequestResult {
  readonly status: AuthRequestStatus;
  readonly message: string;
}

export interface PasskeyClientResult {
  readonly ok: boolean;
  readonly message?: string;
}

export const GENERIC_MAGIC_LINK_REQUEST_MESSAGE =
  'Если адрес указан верно, мы отправим ссылку для входа.';

export const GENERIC_AUTH_ERROR_MESSAGE =
  'Не удалось выполнить вход. Попробуйте ещё раз позже.';

export const GENERIC_PASSKEY_ERROR_MESSAGE =
  'Не удалось выполнить действие с Passkey. Попробуйте ещё раз.';

export const AUTH_UNAVAILABLE_MESSAGE =
  'Вход временно недоступен. Попробуйте позже.';
