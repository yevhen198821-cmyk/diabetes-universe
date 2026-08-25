import { randomUUID } from 'node:crypto';

import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';

import {
  AUTH_COOKIE_PREFIX,
  AUTH_FRESH_AUTH_WINDOW_SECONDS,
  AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS,
  AUTH_SESSION_EXPIRES_IN_SECONDS,
  AUTH_SESSION_UPDATE_AGE_SECONDS,
} from '../config/auth-constants';
import type { AuthEnvironment } from '../config/auth-environment';
import { resolveBetterAuthBaseUrlConfig } from '../config/auth-environment';
import {
  isAuthE2eRuntime,
  isVercelAuthDeployment,
} from '../config/auth-runtime-guards';
import { authSchema } from './database/auth-schema';
import type { AuthDatabase } from './database/create-auth-database';
import type { AuthEmailDelivery } from './email/auth-email-delivery';
import {
  isPasskeyFreshSessionPath,
  isSessionFreshForPasskeyMutation,
} from './passkey-freshness';

export interface CreateBetterAuthOptions {
  readonly database: AuthDatabase;
  readonly emailDelivery: AuthEmailDelivery;
  readonly environment: AuthEnvironment;
}

export function createBetterAuth({
  database,
  emailDelivery,
  environment,
}: CreateBetterAuthOptions) {
  const betterAuthBaseUrl = resolveBetterAuthBaseUrlConfig(environment);
  const useSecureCookies =
    typeof betterAuthBaseUrl === 'string'
      ? betterAuthBaseUrl.startsWith('https://')
      : environment.baseUrl.startsWith('https://');
  const passkeyPlugin = environment.passkeyEnabled
    ? passkey({
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
        },
        origin: environment.webauthnOrigin!,
        registration: {
          requireSession: true,
        },
        rpID: environment.webauthnRpId!,
        rpName: environment.webauthnRpName ?? environment.appName,
      })
    : null;

  return betterAuth({
    appName: environment.appName,
    baseURL: betterAuthBaseUrl,
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema: authSchema,
    }),
    secret: environment.betterAuthSecret,
    trustedOrigins: [...environment.trustedOrigins],
    rateLimit: isAuthE2eRuntime() ? { enabled: false } : undefined,
    advanced: {
      cookiePrefix: environment.cookiePrefix || AUTH_COOKIE_PREFIX,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: useSecureCookies,
      },
      trustedProxyHeaders: isVercelAuthDeployment(),
      useSecureCookies,
    },
    session: {
      expiresIn: AUTH_SESSION_EXPIRES_IN_SECONDS,
      freshAge: AUTH_FRESH_AUTH_WINDOW_SECONDS,
      updateAge: AUTH_SESSION_UPDATE_AGE_SECONDS,
    },
    user: {
      additionalFields: {
        accountId: {
          type: 'string',
          required: true,
          input: false,
          returned: true,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              accountId: randomUUID(),
            },
          }),
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!passkeyPlugin || !isPasskeyFreshSessionPath(ctx.path)) {
          return;
        }

        const session = await getSessionFromCtx(ctx);

        if (
          !session?.session ||
          !isSessionFreshForPasskeyMutation(session.session.createdAt)
        ) {
          throw new APIError('FORBIDDEN', {
            message: 'Fresh authentication required.',
          });
        }
      }),
    },
    plugins: [
      magicLink({
        disableSignUp: false,
        expiresIn: AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS,
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          await emailDelivery.sendMagicLinkEmail({ email, url });
        },
      }),
      ...(passkeyPlugin ? [passkeyPlugin] : []),
      nextCookies(),
    ],
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
