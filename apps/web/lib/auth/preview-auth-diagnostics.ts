import { getSessionCookie } from 'better-auth/cookies';

import {
  AUTH_COOKIE_PREFIX,
  AuthConfigurationError,
  isAuthEnvironmentConfigured,
  probeAuthConfiguration,
  resolveAuthEnvironment,
  resolveBetterAuthBaseUrlConfig,
} from '@diabetes-universe/identity';
import { probeAuthDatabaseHealth } from '@diabetes-universe/identity/server';

import { getAuthenticatedPrincipal } from './get-authenticated-principal';
import {
  getWebAuthConfigurationDiagnostic,
  isWebAuthConfigured,
  isWebPasskeyConfigured,
} from './get-web-identity-service';
import { normalizeAuthRequestHeaders } from './normalize-auth-request-headers';

type EnvPresence = 'MISSING' | 'SET';

export interface PreviewAuthDiagnosticsReport {
  readonly deployment: {
    readonly gitCommitSha: string | null;
    readonly gitRef: string | null;
    readonly vercelDeploymentId: string | null;
    readonly vercelEnv: string | null;
  };
  readonly request: {
    readonly browserHost: string | null;
    readonly forwardedHost: string | null;
    readonly forwardedProto: string | null;
    readonly requestHostHeader: string | null;
    readonly urlHostname: string | null;
  };
  readonly hosts: {
    readonly vercelUrlHost: string | null;
    readonly vercelBranchUrlHost: string | null;
    readonly configuredAuthBaseUrlHost: string | null;
    readonly configuredAuthBaseUrl: string | null;
    readonly betterAuthBaseUrlMode: 'dynamic' | 'static';
    readonly betterAuthFallbackHost: string | null;
    readonly betterAuthAllowedHosts: readonly string[];
    readonly hostMismatchVercelUrlVsBranchUrl: boolean;
    readonly browserHostMatchesVercelUrl: boolean;
    readonly browserHostMatchesBranchUrl: boolean;
    readonly predictedMagicLinkOrigin: string | null;
  };
  readonly authEnvironment: {
    readonly configured: boolean;
    readonly configurationErrorType: string | null;
    readonly configurationErrorMessage: string | null;
    readonly configurationFailureStage: string | null;
    readonly passkeyEnabled: boolean;
    readonly databaseMode: string | null;
    readonly trustedOriginsCount: number | null;
  };
  readonly runtimeEnvPresence: Readonly<Record<string, EnvPresence>>;
  readonly session: {
    readonly sessionCookiePresent: boolean;
    readonly sessionCookieName: string;
    readonly getSessionReturnedPrincipal: boolean;
    readonly accountLayoutWouldRedirectTo: string | null;
  };
  readonly database: {
    readonly connectionAttempted: boolean;
    readonly connectionOk: boolean;
    readonly authSchemaAccessible: boolean;
    readonly errorType: string | null;
    readonly errorMessage: string | null;
  };
  readonly flowHints: {
    readonly likelyFailureCategory: string;
    readonly notes: readonly string[];
  };
}

function envPresence(name: string, env: NodeJS.ProcessEnv): EnvPresence {
  const value = env[name]?.trim();
  return value ? 'SET' : 'MISSING';
}

function normalizeHost(value: string | undefined | null): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('://')) {
    try {
      return new URL(trimmed).host;
    } catch {
      return null;
    }
  }

  return trimmed.split('/')[0]?.split(':')[0] ?? null;
}

function readHostFromBaseUrl(baseUrl: string | null): string | null {
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(baseUrl).host;
  } catch {
    return null;
  }
}

function predictMagicLinkOrigin(input: {
  readonly browserHost: string | null;
  readonly forwardedHost: string | null;
  readonly allowedHosts: readonly string[];
  readonly fallbackHost: string | null;
}): string | null {
  const candidates = [
    input.forwardedHost,
    input.browserHost,
    ...input.allowedHosts,
    input.fallbackHost,
  ];

  for (const candidate of candidates) {
    const host = normalizeHost(candidate);

    if (host) {
      return `https://${host}`;
    }
  }

  return null;
}

function classifyLikelyFailure(report: PreviewAuthDiagnosticsReport): {
  readonly category: string;
  readonly notes: readonly string[];
} {
  const notes: string[] = [];

  if (!report.authEnvironment.configured) {
    return {
      category: 'A_AUTH_UNAVAILABLE',
      notes: [
        'Auth environment failed configuration at runtime.',
        report.authEnvironment.configurationFailureStage
          ? `Failure stage: ${report.authEnvironment.configurationFailureStage}.`
          : 'Failure stage unknown.',
        report.authEnvironment.configurationErrorMessage ??
          'Unknown configuration error.',
      ],
    };
  }

  if (report.hosts.hostMismatchVercelUrlVsBranchUrl) {
    notes.push(
      'VERCEL_URL host differs from VERCEL_BRANCH_URL host; cookies and magic-link URLs may bind to a different hostname than the browser.',
    );
  }

  if (
    report.request.browserHost &&
    report.hosts.vercelBranchUrlHost &&
    report.request.browserHost === report.hosts.vercelBranchUrlHost &&
    report.hosts.vercelUrlHost &&
    report.request.browserHost !== report.hosts.vercelUrlHost &&
    report.hosts.configuredAuthBaseUrlHost === report.hosts.vercelUrlHost
  ) {
    return {
      category: 'F_HOST_ALIAS_VS_DEPLOYMENT_URL',
      notes: [
        ...notes,
        'Browser uses branch alias host while configured auth base URL uses immutable deployment host.',
        'Prefer VERCEL_BRANCH_URL over VERCEL_URL for preview auth base URL resolution.',
      ],
    };
  }

  if (!report.database.connectionOk) {
    return {
      category: 'DATABASE_CONNECTION',
      notes: [
        ...notes,
        report.database.errorMessage ?? 'Auth database connection failed.',
      ],
    };
  }

  if (!report.session.sessionCookiePresent) {
    return {
      category: 'C_OR_UNAUTHENTICATED_NO_COOKIE',
      notes: [
        ...notes,
        'No session cookie on this request; /account will redirect to /auth.',
      ],
    };
  }

  if (
    report.session.sessionCookiePresent &&
    !report.session.getSessionReturnedPrincipal
  ) {
    return {
      category: 'D_SESSION_COOKIE_NOT_READ',
      notes: [
        ...notes,
        'Session cookie present but getSession returned no principal.',
      ],
    };
  }

  if (report.session.getSessionReturnedPrincipal) {
    return {
      category: 'SESSION_OK',
      notes: [...notes, 'Session resolves on this host.'],
    };
  }

  return {
    category: 'H_UNKNOWN',
    notes,
  };
}

export async function buildPreviewAuthDiagnosticsReport(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): Promise<PreviewAuthDiagnosticsReport> {
  const requestHeaders = normalizeAuthRequestHeaders(
    new Headers(request.headers),
  );
  const browserHost =
    normalizeHost(requestHeaders.get('x-forwarded-host')) ??
    normalizeHost(requestHeaders.get('host'));
  const urlHostname = (() => {
    try {
      return new URL(request.url).host;
    } catch {
      return null;
    }
  })();

  const vercelUrlHost = normalizeHost(env.VERCEL_URL);
  const vercelBranchUrlHost = normalizeHost(env.VERCEL_BRANCH_URL);

  const configurationProbe = probeAuthConfiguration(env);

  let configured = configurationProbe.configured;
  let configurationErrorType: string | null = configured
    ? null
    : 'AuthConfigurationError';
  let configurationErrorMessage: string | null =
    configurationProbe.failureMessage;
  let configurationFailureStage: string | null =
    configurationProbe.failureStage;
  let passkeyEnabled = false;
  let databaseMode: string | null = null;
  let trustedOriginsCount: number | null = null;
  let configuredAuthBaseUrl: string | null = null;
  let configuredAuthBaseUrlHost: string | null = null;
  let betterAuthBaseUrlMode: 'dynamic' | 'static' = 'static';
  let betterAuthFallbackHost: string | null = null;
  let betterAuthAllowedHosts: readonly string[] = [];

  try {
    const environment = resolveAuthEnvironment(env);
    configured = true;
    configurationErrorType = null;
    configurationErrorMessage = null;
    configurationFailureStage = null;
    configuredAuthBaseUrl = environment.baseUrl;
    configuredAuthBaseUrlHost = readHostFromBaseUrl(environment.baseUrl);
    passkeyEnabled = environment.passkeyEnabled;
    databaseMode = environment.databaseMode;
    trustedOriginsCount = environment.trustedOrigins.length;

    const betterAuthBaseUrl = resolveBetterAuthBaseUrlConfig(environment, env);

    if (typeof betterAuthBaseUrl === 'string') {
      betterAuthBaseUrlMode = 'static';
      betterAuthFallbackHost = readHostFromBaseUrl(betterAuthBaseUrl);
    } else {
      betterAuthBaseUrlMode = 'dynamic';
      betterAuthAllowedHosts = betterAuthBaseUrl.allowedHosts;
      betterAuthFallbackHost = readHostFromBaseUrl(betterAuthBaseUrl.fallback);
    }
  } catch (error) {
    configured = false;
    configurationErrorType =
      error instanceof AuthConfigurationError
        ? 'AuthConfigurationError'
        : error instanceof Error
          ? error.name
          : 'UnknownError';
    configurationErrorMessage =
      error instanceof AuthConfigurationError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Auth configuration failed.';
    configurationFailureStage ??= configurationProbe.failureStage ?? 'unknown';
    passkeyEnabled = isWebPasskeyConfigured();
  }

  if (!configured) {
    configurationErrorMessage ??= getWebAuthConfigurationDiagnostic();
  }

  const sessionCookieName = `${AUTH_COOKIE_PREFIX}.session_token`;
  const sessionCookiePresent = Boolean(
    getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }),
  );

  let getSessionReturnedPrincipal = false;

  if (isAuthEnvironmentConfigured(env)) {
    try {
      getSessionReturnedPrincipal = Boolean(await getAuthenticatedPrincipal());
    } catch (error) {
      configurationErrorType ??=
        error instanceof Error ? error.name : 'SessionLookupError';
      configurationErrorMessage ??=
        error instanceof Error ? error.message : 'Session lookup failed.';
    }
  }

  let database: PreviewAuthDiagnosticsReport['database'] = {
    connectionAttempted: false,
    connectionOk: false,
    authSchemaAccessible: false,
    errorType: null,
    errorMessage: null,
  };

  if (configured) {
    database = {
      connectionAttempted: true,
      ...(await probeAuthDatabaseHealth(resolveAuthEnvironment(env))),
    };
  }

  const hostMismatchVercelUrlVsBranchUrl = Boolean(
    vercelUrlHost &&
    vercelBranchUrlHost &&
    vercelUrlHost !== vercelBranchUrlHost,
  );

  const predictedMagicLinkOrigin = predictMagicLinkOrigin({
    browserHost,
    forwardedHost: normalizeHost(requestHeaders.get('x-forwarded-host')),
    allowedHosts: betterAuthAllowedHosts,
    fallbackHost: betterAuthFallbackHost ?? configuredAuthBaseUrlHost,
  });

  const report: PreviewAuthDiagnosticsReport = {
    deployment: {
      gitCommitSha: env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
      gitRef: env.VERCEL_GIT_COMMIT_REF?.trim() || null,
      vercelDeploymentId: env.VERCEL_DEPLOYMENT_ID?.trim() || null,
      vercelEnv: env.VERCEL_ENV?.trim() || null,
    },
    request: {
      browserHost,
      forwardedHost: normalizeHost(requestHeaders.get('x-forwarded-host')),
      forwardedProto: requestHeaders.get('x-forwarded-proto'),
      requestHostHeader: normalizeHost(requestHeaders.get('host')),
      urlHostname,
    },
    hosts: {
      vercelUrlHost,
      vercelBranchUrlHost,
      configuredAuthBaseUrlHost,
      configuredAuthBaseUrl,
      betterAuthBaseUrlMode,
      betterAuthFallbackHost,
      betterAuthAllowedHosts,
      hostMismatchVercelUrlVsBranchUrl,
      browserHostMatchesVercelUrl: Boolean(
        browserHost && vercelUrlHost && browserHost === vercelUrlHost,
      ),
      browserHostMatchesBranchUrl: Boolean(
        browserHost &&
        vercelBranchUrlHost &&
        browserHost === vercelBranchUrlHost,
      ),
      predictedMagicLinkOrigin,
    },
    authEnvironment: {
      configured: isAuthEnvironmentConfigured(env),
      configurationErrorType,
      configurationErrorMessage,
      configurationFailureStage,
      passkeyEnabled,
      databaseMode,
      trustedOriginsCount,
    },
    runtimeEnvPresence: {
      ...configurationProbe.envPresence,
      AUTH_TRUSTED_ORIGINS: envPresence('AUTH_TRUSTED_ORIGINS', env),
      AUTH_WEBAUTHN_ORIGIN: envPresence('AUTH_WEBAUTHN_ORIGIN', env),
      AUTH_WEBAUTHN_RP_ID: envPresence('AUTH_WEBAUTHN_RP_ID', env),
      VERCEL_GIT_COMMIT_SHA: envPresence('VERCEL_GIT_COMMIT_SHA', env),
    },
    session: {
      sessionCookiePresent,
      sessionCookieName,
      getSessionReturnedPrincipal,
      accountLayoutWouldRedirectTo: getSessionReturnedPrincipal
        ? null
        : '/auth?callback=/account',
    },
    database,
    flowHints: {
      likelyFailureCategory: 'PENDING',
      notes: [],
    },
  };

  const classification = classifyLikelyFailure(report);

  return {
    ...report,
    flowHints: {
      likelyFailureCategory: classification.category,
      notes: classification.notes,
    },
  };
}

export function isPreviewAuthDiagnosticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL_ENV === 'preview';
}
