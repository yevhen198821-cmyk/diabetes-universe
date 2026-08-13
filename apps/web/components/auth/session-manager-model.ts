import type { AccountSessionSummary } from '@diabetes-universe/identity';

export interface SessionCardViewModel {
  readonly session: AccountSessionSummary;
  readonly createdAtLabel: string;
  readonly expiresAtLabel: string;
  readonly isCurrentSession: boolean;
}

export interface SessionManagerViewModel {
  readonly currentSession: AccountSessionSummary | null;
  readonly otherSessions: readonly AccountSessionSummary[];
  readonly showRevokeOthersAction: boolean;
}

export function createSessionManagerViewModel(
  sessions: readonly AccountSessionSummary[],
): SessionManagerViewModel {
  const currentSession =
    sessions.find((session) => session.isCurrentSession) ?? null;
  const otherSessions = sessions.filter((session) => !session.isCurrentSession);

  return {
    currentSession,
    otherSessions,
    showRevokeOthersAction: otherSessions.length > 0,
  };
}

export function createSessionCardViewModel(input: {
  readonly formatDate: (isoTimestamp: string) => string;
  readonly session: AccountSessionSummary;
}): SessionCardViewModel {
  return {
    session: input.session,
    createdAtLabel: input.formatDate(input.session.createdAt),
    expiresAtLabel: input.formatDate(input.session.expiresAt),
    isCurrentSession: input.session.isCurrentSession,
  };
}

export function shouldShowFreshAuthAlert(code: string | undefined): boolean {
  return code === 'FRESH_AUTH_REQUIRED';
}
