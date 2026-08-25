import type {
  AuthenticatedPrincipal,
  SessionSummary,
} from '../contracts/auth-contracts';
import { resolveUserAvatarUrlFromImageField } from './avatar/resolve-user-avatar-url';

function toIsoTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

interface BetterAuthSessionUser {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly image?: string | null;
  readonly name: string;
  readonly accountId?: string | null;
}

interface BetterAuthSessionRecord {
  readonly id: string;
  readonly expiresAt: Date | string;
  readonly userId: string;
  readonly user: BetterAuthSessionUser;
}

export function mapAuthenticatedPrincipal(
  session: BetterAuthSessionRecord,
): AuthenticatedPrincipal {
  const accountId = session.user.accountId?.trim() || session.user.id;

  return {
    accountId,
    avatarUrl: resolveUserAvatarUrlFromImageField(session.user.image),
    displayName: session.user.name?.trim() || null,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
  };
}

export function mapSessionSummary(
  session: BetterAuthSessionRecord,
  accountId: string,
): SessionSummary {
  return {
    accountId,
    expiresAt: toIsoTimestamp(session.expiresAt),
    sessionId: session.id,
  };
}
