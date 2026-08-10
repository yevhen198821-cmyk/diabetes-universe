import { randomUUID } from 'node:crypto';

import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';

import {
  AUTH_COOKIE_PREFIX,
  AUTH_FRESH_AUTH_WINDOW_SECONDS,
  AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS,
  AUTH_SESSION_EXPIRES_IN_SECONDS,
  AUTH_SESSION_UPDATE_AGE_SECONDS,
} from '../config/auth-constants';
import type { AuthEnvironment } from '../config/auth-environment';
import type { AuthEmailDelivery } from './email/auth-email-delivery';
import { authSchema } from './database/auth-schema';
import type { AuthDatabase } from './database/create-auth-database';

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
  const useSecureCookies = environment.baseUrl.startsWith('https://');

  return betterAuth({
    appName: environment.appName,
    baseURL: environment.baseUrl,
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema: authSchema,
    }),
    secret: environment.betterAuthSecret,
    trustedOrigins: [...environment.trustedOrigins],
    advanced: {
      cookiePrefix: environment.cookiePrefix || AUTH_COOKIE_PREFIX,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: useSecureCookies,
      },
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
    plugins: [
      magicLink({
        disableSignUp: false,
        expiresIn: AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS,
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          await emailDelivery.sendMagicLinkEmail({ email, url });
        },
      }),
      nextCookies(),
    ],
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
