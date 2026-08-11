import {
  GENERIC_AUTH_ERROR_MESSAGE,
  GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
  type AuthRequestResult,
  type AuthenticatedPrincipal,
  type PasskeySummary,
} from '../contracts/auth-contracts';
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

type RequestHeaders = Headers | Record<string, string>;

export interface IdentityService {
  readonly auth: BetterAuthInstance;
  getCurrentPrincipal(
    headers: RequestHeaders,
  ): Promise<AuthenticatedPrincipal | null>;
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
}

export interface CreateIdentityServiceOptions {
  readonly environment: AuthEnvironment;
  readonly emailDelivery?: AuthEmailDelivery;
}

type IdentityServiceGlobal = typeof globalThis & {
  __duIdentityServicePromise?: Promise<IdentityService> | null;
};

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
  const emailDelivery =
    options.emailDelivery ??
    createEmailDelivery(options.environment, process.env);
  const auth = createBetterAuth({
    database,
    emailDelivery,
    environment: options.environment,
  });

  return {
    auth,
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
