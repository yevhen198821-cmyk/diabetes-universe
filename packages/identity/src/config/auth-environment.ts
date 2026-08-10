import {
  AUTH_ALLOWED_CALLBACK_PATHS,
  type AuthAllowedCallbackPath,
} from './auth-constants';
import { assertProductionCapableEmailDelivery } from './auth-runtime-guards';

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

export type AuthDatabaseMode = 'postgres' | 'pglite';

export interface AuthEnvironment {
  readonly appName: string;
  readonly baseUrl: string;
  readonly betterAuthSecret: string;
  readonly cookiePrefix: string;
  readonly databaseMode: AuthDatabaseMode;
  readonly databaseUrl?: string;
  readonly emailFrom?: string;
  readonly resendApiKey?: string;
  readonly trustedOrigins: readonly string[];
  readonly webauthnOrigin?: string;
  readonly webauthnRpId?: string;
  readonly webauthnRpName?: string;
}

function readRequiredString(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new AuthConfigurationError(
      `Missing required auth environment: ${name}`,
    );
  }

  return trimmed;
}

function readOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveDatabaseMode(env: NodeJS.ProcessEnv): AuthDatabaseMode {
  const explicitMode = env.AUTH_DATABASE_MODE?.trim();

  if (explicitMode === 'pglite') {
    return 'pglite';
  }

  if (explicitMode === 'postgres') {
    return 'postgres';
  }

  if (env.DATABASE_URL?.trim()) {
    return 'postgres';
  }

  if (env.NODE_ENV === 'test' || env.AUTH_USE_PGLITE === 'true') {
    return 'pglite';
  }

  throw new AuthConfigurationError(
    'Auth database is not configured. Set DATABASE_URL or AUTH_DATABASE_MODE=pglite for local test runs.',
  );
}

function resolveTrustedOrigins(
  baseUrl: string,
  env: NodeJS.ProcessEnv,
): string[] {
  const configured = env.AUTH_TRUSTED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return [baseUrl];
}

export function resolveAuthEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): AuthEnvironment {
  const databaseMode = resolveDatabaseMode(env);
  const baseUrl = readRequiredString('BETTER_AUTH_URL', env.BETTER_AUTH_URL);

  const environment = {
    appName: readOptionalString(env.AUTH_APP_NAME) ?? 'Diabetes Universe',
    baseUrl,
    betterAuthSecret: readRequiredString(
      'BETTER_AUTH_SECRET',
      env.BETTER_AUTH_SECRET,
    ),
    cookiePrefix: readOptionalString(env.AUTH_COOKIE_PREFIX) ?? 'du-auth',
    databaseMode,
    databaseUrl:
      databaseMode === 'postgres'
        ? readRequiredString('DATABASE_URL', env.DATABASE_URL)
        : undefined,
    emailFrom: readOptionalString(env.AUTH_EMAIL_FROM),
    resendApiKey: readOptionalString(env.RESEND_API_KEY),
    trustedOrigins: resolveTrustedOrigins(baseUrl, env),
    webauthnOrigin: readOptionalString(env.AUTH_WEBAUTHN_ORIGIN),
    webauthnRpId: readOptionalString(env.AUTH_WEBAUTHN_RP_ID),
    webauthnRpName:
      readOptionalString(env.AUTH_WEBAUTHN_RP_NAME) ?? 'Diabetes Universe',
  };

  assertProductionCapableEmailDelivery(environment);

  return environment;
}

export function isAuthEnvironmentConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  try {
    resolveAuthEnvironment(env);
    return true;
  } catch {
    return false;
  }
}

export function resolveSafeAuthCallbackPath(
  candidate: string | null | undefined,
  fallback: AuthAllowedCallbackPath = '/account',
): AuthAllowedCallbackPath {
  if (!candidate) {
    return fallback;
  }

  let pathname = candidate;

  try {
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      pathname = new URL(candidate).pathname;
    }
  } catch {
    return fallback;
  }

  if (!pathname.startsWith('/')) {
    return fallback;
  }

  const normalized = pathname.split('?')[0]?.split('#')[0] ?? fallback;

  if (
    AUTH_ALLOWED_CALLBACK_PATHS.includes(normalized as AuthAllowedCallbackPath)
  ) {
    return normalized as AuthAllowedCallbackPath;
  }

  return fallback;
}
