import {
  GENERIC_AUTH_ERROR_MESSAGE,
  GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
  type AuthRequestResult,
  type AuthenticatedPrincipal,
  type PasskeySummary,
} from '../contracts/auth-contracts';
import type {
  AvatarMutationResult,
  UserAvatarContent,
} from '../contracts/avatar-contracts';
import type {
  AccountSessionSummary,
  SessionManagementResult,
} from '../contracts/session-management-contracts';
import {
  resolveSafeAuthCallbackPath,
  type AuthEnvironment,
  AuthConfigurationError,
} from '../config/auth-environment';
import { isCapturingEmailDeliveryAllowed } from '../config/auth-runtime-guards';
import type { AuthEmailDelivery } from './email/auth-email-delivery';
import { createCapturingAuthEmailDelivery } from './email/capturing-auth-email-delivery';
import { createResendAuthEmailDelivery } from './email/resend-auth-email-delivery';
import {
  createBetterAuth,
  type BetterAuthInstance,
} from './create-better-auth';
import {
  createAuthDatabase,
  type AuthDatabase,
} from './database/create-auth-database';
import { mapAuthenticatedPrincipal } from './map-auth-session';
import { USER_AVATAR_MAX_UPLOAD_BYTES } from './avatar/avatar-constants';
import { processAvatarImage } from './avatar/process-avatar-image';
import { buildUserAvatarReferenceUrl } from './avatar/resolve-user-avatar-url';
import { createUserAvatarRepository } from './avatar/user-avatar-repository';
import { mapAccountSessionSummaries } from './session-management/map-account-session-summary';
import {
  createSessionManagementError,
  createSessionManagementResult,
  SessionManagementError,
} from './session-management/session-management-errors';
import { isSessionFreshForSessionManagement } from './session-management/session-management-freshness';
import { createOwnedSessionsRepository } from './session-management/owned-sessions-repository';
import { resolveOwnedSessionToken } from './session-management/resolve-owned-session-token';

type RequestHeaders = Headers | Record<string, string>;

export interface IdentityService {
  readonly auth: BetterAuthInstance;
  deleteUserAvatar(headers: RequestHeaders): Promise<AvatarMutationResult>;
  getCurrentPrincipal(
    headers: RequestHeaders,
  ): Promise<AuthenticatedPrincipal | null>;
  getUserAvatarForCurrentUser(
    headers: RequestHeaders,
  ): Promise<UserAvatarContent | null>;
  requestMagicLink(input: {
    readonly email: string;
    readonly callbackPath?: string;
    readonly headers: RequestHeaders;
  }): Promise<AuthRequestResult>;
  listPasskeys(headers: RequestHeaders): Promise<readonly PasskeySummary[]>;
  deletePasskey(input: {
    readonly passkeyId: string;
    readonly headers: RequestHeaders;
  }): Promise<void>;
  signOutCurrentSession(headers: RequestHeaders): Promise<void>;
  listAccountSessions(
    headers: RequestHeaders,
  ): Promise<readonly AccountSessionSummary[]>;
  revokeAccountSession(input: {
    readonly sessionId: string;
    readonly headers: RequestHeaders;
  }): Promise<SessionManagementResult>;
  revokeOtherAccountSessions(
    headers: RequestHeaders,
  ): Promise<SessionManagementResult>;
  revokeAllAccountSessions(
    headers: RequestHeaders,
  ): Promise<SessionManagementResult>;
  uploadUserAvatar(input: {
    readonly fileBytes: Buffer;
    readonly headers: RequestHeaders;
  }): Promise<AvatarMutationResult>;
}

export interface CreateIdentityServiceOptions {
  readonly environment: AuthEnvironment;
  readonly emailDelivery?: AuthEmailDelivery;
}

type IdentityServiceGlobal = typeof globalThis & {
  __duIdentityServicePromise?: Promise<IdentityService> | null;
};

interface AuthenticatedBetterAuthSession {
  readonly session: {
    readonly id: string;
    readonly createdAt: Date;
  };
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly emailVerified: boolean;
    readonly image?: string | null;
    readonly name: string;
    readonly accountId?: string | null;
  };
}

function readIdentityServiceGlobal(): IdentityServiceGlobal {
  return globalThis as IdentityServiceGlobal;
}

function createEmailDelivery(
  environment: AuthEnvironment,
  env: NodeJS.ProcessEnv = process.env,
): AuthEmailDelivery {
  if (environment.resendApiKey && environment.emailFrom) {
    return createResendAuthEmailDelivery({
      apiKey: environment.resendApiKey,
      fromAddress: environment.emailFrom,
    });
  }

  if (isCapturingEmailDeliveryAllowed(environment, env)) {
    return createCapturingAuthEmailDelivery();
  }

  throw new AuthConfigurationError(
    'Auth email delivery is not configured for this runtime',
  );
}

async function createIdentityServiceInternal(
  options: CreateIdentityServiceOptions,
): Promise<IdentityService> {
  const database: AuthDatabase = await createAuthDatabase(options.environment);
  const ownedSessionsRepository = createOwnedSessionsRepository(database);
  const userAvatarRepository = createUserAvatarRepository(database);
  const emailDelivery =
    options.emailDelivery ??
    createEmailDelivery(options.environment, process.env);
  const auth = createBetterAuth({
    database,
    emailDelivery,
    environment: options.environment,
  });

  async function resolveAuthenticatedSession(
    headers: RequestHeaders,
  ): Promise<AuthenticatedBetterAuthSession | null> {
    const session = await auth.api.getSession({ headers });

    if (!session?.session || !session.user) {
      return null;
    }

    return {
      session: {
        id: session.session.id,
        createdAt: session.session.createdAt,
      },
      user: session.user,
    };
  }

  async function listSanitizedAccountSessions(
    headers: RequestHeaders,
  ): Promise<readonly AccountSessionSummary[]> {
    const current = await resolveAuthenticatedSession(headers);

    if (!current) {
      throw createSessionManagementError('AUTHENTICATION_REQUIRED');
    }

    const ownedRows = await ownedSessionsRepository.listActiveSessions(
      current.user.id,
    );
    const currentSessionPresent = ownedRows.some(
      (row) => row.id === current.session.id,
    );

    if (!currentSessionPresent) {
      throw createSessionManagementError('SESSION_STATE_INVALID');
    }

    return mapAccountSessionSummaries(ownedRows, current.session.id);
  }

  return {
    auth,
    async deleteUserAvatar(headers) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return {
          avatarUrl: null,
          code: 'AUTHENTICATION_REQUIRED',
          ok: false,
        };
      }

      await userAvatarRepository.deleteForUser(current.user.id);

      try {
        await auth.api.updateUser({
          body: { image: null },
          headers,
        });
      } catch {
        return {
          avatarUrl: null,
          code: 'AVATAR_PROCESSING_FAILED',
          ok: false,
        };
      }

      return {
        avatarUrl: null,
        code: 'SUCCESS',
        ok: true,
      };
    },
    async getUserAvatarForCurrentUser(headers) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return null;
      }

      return userAvatarRepository.getForUser(current.user.id);
    },
    async uploadUserAvatar({ fileBytes, headers }) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return {
          avatarUrl: null,
          code: 'AUTHENTICATION_REQUIRED',
          ok: false,
        };
      }

      if (fileBytes.byteLength === 0) {
        return {
          avatarUrl: null,
          code: 'AVATAR_INVALID_TYPE',
          ok: false,
        };
      }

      if (fileBytes.byteLength > USER_AVATAR_MAX_UPLOAD_BYTES) {
        return {
          avatarUrl: null,
          code: 'AVATAR_TOO_LARGE',
          ok: false,
        };
      }

      const processed = await processAvatarImage(fileBytes);

      if (!processed) {
        return {
          avatarUrl: null,
          code: 'AVATAR_INVALID_TYPE',
          ok: false,
        };
      }

      const updatedAt = new Date();

      try {
        await userAvatarRepository.upsertForUser({
          byteSize: processed.byteSize,
          content: processed.content,
          contentType: processed.contentType,
          updatedAt,
          userId: current.user.id,
        });
      } catch {
        return {
          avatarUrl: null,
          code: 'AVATAR_PROCESSING_FAILED',
          ok: false,
        };
      }

      const avatarUrl = buildUserAvatarReferenceUrl(updatedAt);

      try {
        await auth.api.updateUser({
          body: { image: avatarUrl },
          headers,
        });
      } catch {
        await userAvatarRepository.deleteForUser(current.user.id);

        return {
          avatarUrl: null,
          code: 'AVATAR_PROCESSING_FAILED',
          ok: false,
        };
      }

      return {
        avatarUrl,
        code: 'SUCCESS',
        ok: true,
      };
    },
    async getCurrentPrincipal(headers) {
      const session = await auth.api.getSession({ headers });

      if (!session?.session || !session.user) {
        return null;
      }

      return mapAuthenticatedPrincipal({
        expiresAt: session.session.expiresAt,
        id: session.session.id,
        user: session.user,
        userId: session.user.id,
      });
    },
    async requestMagicLink({ email, callbackPath, headers }) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return {
          message: GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
          status: 'sent',
        };
      }

      try {
        await auth.api.signInMagicLink({
          body: {
            callbackURL: resolveSafeAuthCallbackPath(callbackPath),
            email: normalizedEmail,
            errorCallbackURL: '/auth/error',
          },
          headers,
        });
      } catch {
        return {
          message: GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
          status: 'sent',
        };
      }

      return {
        message: GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
        status: 'sent',
      };
    },
    async listPasskeys(headers) {
      if (!options.environment.passkeyEnabled) {
        return [];
      }

      const passkeys = await auth.api.listPasskeys({ headers });

      return passkeys.map((credential) => ({
        passkeyId: credential.id,
        name: credential.name?.trim() || 'Passkey',
        createdAt: credential.createdAt
          ? new Date(credential.createdAt).toISOString()
          : null,
      }));
    },
    async deletePasskey({ passkeyId, headers }) {
      if (!options.environment.passkeyEnabled) {
        throw new AuthConfigurationError('Passkey authentication is disabled.');
      }

      await auth.api.deletePasskey({
        body: { id: passkeyId },
        headers,
      });
    },
    async signOutCurrentSession(headers) {
      await auth.api.signOut({ headers });
    },
    async listAccountSessions(headers) {
      return listSanitizedAccountSessions(headers);
    },
    async revokeAccountSession({ sessionId, headers }) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return createSessionManagementResult({
          ok: false,
          code: 'AUTHENTICATION_REQUIRED',
        });
      }

      if (!isSessionFreshForSessionManagement(current.session.createdAt)) {
        return createSessionManagementResult({
          ok: false,
          code: 'FRESH_AUTH_REQUIRED',
        });
      }

      if (sessionId === current.session.id) {
        return createSessionManagementResult({
          ok: false,
          code: 'CURRENT_SESSION_REQUIRES_SIGN_OUT',
        });
      }

      const token = await resolveOwnedSessionToken(ownedSessionsRepository, {
        userId: current.user.id,
        sessionId,
      });

      if (token) {
        try {
          await auth.api.revokeSession({
            body: { token },
            headers,
          });
        } catch {
          return createSessionManagementResult({
            ok: false,
            code: 'SESSION_REVOKE_FAILED',
          });
        }
      }

      try {
        const sessions = await listSanitizedAccountSessions(headers);
        return createSessionManagementResult({
          ok: true,
          code: 'SUCCESS',
          sessions,
        });
      } catch (error) {
        if (error instanceof SessionManagementError) {
          return createSessionManagementResult({
            ok: false,
            code: error.code,
          });
        }

        return createSessionManagementResult({
          ok: false,
          code: 'SESSION_STATE_INVALID',
        });
      }
    },
    async revokeOtherAccountSessions(headers) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return createSessionManagementResult({
          ok: false,
          code: 'AUTHENTICATION_REQUIRED',
        });
      }

      if (!isSessionFreshForSessionManagement(current.session.createdAt)) {
        return createSessionManagementResult({
          ok: false,
          code: 'FRESH_AUTH_REQUIRED',
        });
      }

      try {
        await auth.api.revokeOtherSessions({ headers });
      } catch {
        return createSessionManagementResult({
          ok: false,
          code: 'SESSION_REVOKE_FAILED',
        });
      }

      try {
        const sessions = await listSanitizedAccountSessions(headers);
        return createSessionManagementResult({
          ok: true,
          code: 'SUCCESS',
          sessions,
        });
      } catch (error) {
        if (error instanceof SessionManagementError) {
          return createSessionManagementResult({
            ok: false,
            code: error.code,
          });
        }

        return createSessionManagementResult({
          ok: false,
          code: 'SESSION_STATE_INVALID',
        });
      }
    },
    async revokeAllAccountSessions(headers) {
      const current = await resolveAuthenticatedSession(headers);

      if (!current) {
        return createSessionManagementResult({
          ok: false,
          code: 'AUTHENTICATION_REQUIRED',
        });
      }

      if (!isSessionFreshForSessionManagement(current.session.createdAt)) {
        return createSessionManagementResult({
          ok: false,
          code: 'FRESH_AUTH_REQUIRED',
        });
      }

      try {
        await auth.api.revokeSessions({ headers });
      } catch {
        return createSessionManagementResult({
          ok: false,
          code: 'SESSION_REVOKE_FAILED',
        });
      }

      try {
        await auth.api.signOut({ headers });
      } catch {
        return createSessionManagementResult({
          ok: false,
          code: 'SESSION_REVOKE_FAILED',
        });
      }

      return createSessionManagementResult({
        ok: true,
        code: 'SUCCESS',
        sessions: [],
      });
    },
  };
}

export async function getIdentityService(
  environment: AuthEnvironment,
): Promise<IdentityService> {
  const global = readIdentityServiceGlobal();

  if (!global.__duIdentityServicePromise) {
    global.__duIdentityServicePromise = createIdentityServiceInternal({
      environment,
    });
  }

  return global.__duIdentityServicePromise;
}

export async function createIdentityService(
  options: CreateIdentityServiceOptions,
): Promise<IdentityService> {
  return createIdentityServiceInternal(options);
}

export function resetIdentityServiceForTests(): void {
  readIdentityServiceGlobal().__duIdentityServicePromise = null;
}

export { GENERIC_AUTH_ERROR_MESSAGE };
