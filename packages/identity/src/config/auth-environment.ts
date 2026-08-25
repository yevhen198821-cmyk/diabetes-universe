import {
  AUTH_ALLOWED_CALLBACK_PATHS,
  type AuthAllowedCallbackPath,
} from './auth-constants';
import {
  assertProductionCapableEmailDelivery,
  isPreviewAuthDeployment,
} from './auth-runtime-guards';

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

export type AuthDatabaseMode = 'postgres' | 'pglite';

export interface BetterAuthDynamicBaseUrlConfig {
  allowedHosts: string[];
  readonly fallback: string;
  readonly protocol: 'auto' | 'http' | 'https';
}

export type BetterAuthBaseUrlConfig = string | BetterAuthDynamicBaseUrlConfig;

export interface AuthEnvironment {
  readonly appName: string;
  readonly baseUrl: string;
  readonly betterAuthSecret: string;
  readonly cookiePrefix: string;
  readonly databaseMode: AuthDatabaseMode;
  readonly databaseUrl?: string;
  readonly emailFrom?: string;
  readonly passkeyEnabled: boolean;
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

function normalizeDeploymentHost(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes('://')) {
    try {
      return new URL(trimmed).host;
    } catch {
      return undefined;
    }
  }

  return trimmed.split('/')[0]?.split(':')[0] || undefined;
}

function resolvePreviewDeploymentHost(
  env: NodeJS.ProcessEnv,
): string | undefined {
  return (
    normalizeDeploymentHost(env.VERCEL_BRANCH_URL) ??
    normalizeDeploymentHost(env.VERCEL_URL)
  );
}

function resolveAuthBaseUrl(env: NodeJS.ProcessEnv): string {
  const vercelEnv = env.VERCEL_ENV?.trim();
  const deploymentHost = resolvePreviewDeploymentHost(env);

  if (vercelEnv === 'preview' && deploymentHost) {
    return `https://${deploymentHost}`;
  }

  return readRequiredString('BETTER_AUTH_URL', env.BETTER_AUTH_URL);
}

function collectPreviewAllowedHosts(
  baseUrl: string,
  env: NodeJS.ProcessEnv,
): string[] {
  const hosts = new Set<string>();

  for (const candidate of [
    env.VERCEL_BRANCH_URL,
    env.VERCEL_URL,
    baseUrl,
    env.BETTER_AUTH_URL,
  ]) {
    const host = normalizeDeploymentHost(candidate);

    if (host) {
      hosts.add(host);
    }
  }

  return [...hosts];
}

export function resolveBetterAuthBaseUrlConfig(
  environment: AuthEnvironment,
  env: NodeJS.ProcessEnv = process.env,
): BetterAuthBaseUrlConfig {
  if (!isPreviewAuthDeployment(env)) {
    return environment.baseUrl;
  }

  const allowedHosts = collectPreviewAllowedHosts(environment.baseUrl, env);

  if (allowedHosts.length === 0) {
    return environment.baseUrl;
  }

  return {
    allowedHosts: [...allowedHosts],
    fallback: environment.baseUrl,
    protocol: environment.baseUrl.startsWith('http://') ? 'http' : 'https',
  };
}

function resolveTrustedOrigins(
  baseUrl: string,
  env: NodeJS.ProcessEnv,
): string[] {
  const configured = env.AUTH_TRUSTED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set<string>([baseUrl]);

  if (isPreviewAuthDeployment(env)) {
    for (const host of collectPreviewAllowedHosts(baseUrl, env)) {
      origins.add(`https://${host}`);
    }
  }

  if (configured) {
    for (const origin of configured) {
      origins.add(origin);
    }
  }

  return [...origins];
}

function isLocalWebAuthnHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function resolveWebAuthnConfiguration(
  baseUrl: string,
  env: NodeJS.ProcessEnv,
): Pick<
  AuthEnvironment,
  'passkeyEnabled' | 'webauthnOrigin' | 'webauthnRpId' | 'webauthnRpName'
> {
  const origin = readOptionalString(env.AUTH_WEBAUTHN_ORIGIN);
  const rpId = readOptionalString(env.AUTH_WEBAUTHN_RP_ID);
  const rpName =
    readOptionalString(env.AUTH_WEBAUTHN_RP_NAME) ?? 'Diabetes Universe';

  if (!origin && !rpId) {
    return {
      passkeyEnabled: false,
      webauthnRpName: rpName,
    };
  }

  if (!origin || !rpId) {
    throw new AuthConfigurationError(
      'Passkey configuration requires both AUTH_WEBAUTHN_ORIGIN and AUTH_WEBAUTHN_RP_ID.',
    );
  }

  let originUrl: URL;
  let baseUrlObject: URL;

  try {
    originUrl = new URL(origin);
    baseUrlObject = new URL(baseUrl);
  } catch {
    throw new AuthConfigurationError(
      'Passkey origin configuration is invalid.',
    );
  }

  if (
    originUrl.origin !== origin ||
    originUrl.origin !== baseUrlObject.origin
  ) {
    return {
      passkeyEnabled: false,
      webauthnRpName: rpName,
    };
  }

  if (
    originUrl.protocol !== 'https:' &&
    !(
      originUrl.protocol === 'http:' &&
      isLocalWebAuthnHostname(originUrl.hostname)
    )
  ) {
    throw new AuthConfigurationError(
      'Passkeys require HTTPS except for localhost development.',
    );
  }

  if (
    rpId.includes('://') ||
    rpId.includes('/') ||
    rpId.includes(':') ||
    rpId.trim() !== rpId
  ) {
    throw new AuthConfigurationError(
      'AUTH_WEBAUTHN_RP_ID must contain only a relying-party hostname.',
    );
  }

  const hostname = originUrl.hostname.toLowerCase();
  const normalizedRpId = rpId.toLowerCase();

  if (hostname !== normalizedRpId && !hostname.endsWith(`.${normalizedRpId}`)) {
    throw new AuthConfigurationError(
      'AUTH_WEBAUTHN_RP_ID must match the configured WebAuthn origin hostname or its registrable parent domain.',
    );
  }

  return {
    passkeyEnabled: true,
    webauthnOrigin: origin,
    webauthnRpId: normalizedRpId,
    webauthnRpName: rpName,
  };
}

export function resolveAuthEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): AuthEnvironment {
  const databaseMode = resolveDatabaseMode(env);
  const baseUrl = resolveAuthBaseUrl(env);
  const webauthn = resolveWebAuthnConfiguration(baseUrl, env);

  const environment: AuthEnvironment = {
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
    ...webauthn,
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
