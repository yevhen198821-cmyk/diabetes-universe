export type AccountSessionClientKind =
  'browser' | 'mobile' | 'desktop' | 'unknown';

export interface AccountSessionSummary {
  readonly sessionId: string;
  readonly isCurrentSession: boolean;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly clientLabel: string;
  readonly clientKind: AccountSessionClientKind;
}

export type SessionManagementCode =
  | 'SUCCESS'
  | 'AUTHENTICATION_REQUIRED'
  | 'FRESH_AUTH_REQUIRED'
  | 'CURRENT_SESSION_REQUIRES_SIGN_OUT'
  | 'SESSION_REVOKE_FAILED'
  | 'SESSION_STATE_INVALID';

export interface SessionManagementResult {
  readonly ok: boolean;
  readonly code: SessionManagementCode;
  readonly message: string;
  readonly sessions?: readonly AccountSessionSummary[];
}
