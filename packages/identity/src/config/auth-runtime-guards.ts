import type { AuthDatabaseMode, AuthEnvironment } from './auth-environment';
import { AuthConfigurationError } from './auth-environment';

export function isProductionAuthDeployment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === 'production') {
    return true;
  }

  if (env.AUTH_RUNTIME_ENV === 'production') {
    return true;
  }

  return false;
}

export function isPreviewAuthDeployment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL_ENV === 'preview';
}

export function isVercelAuthDeployment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL === '1') {
    return true;
  }

  const vercelEnv = env.VERCEL_ENV?.trim();
  return vercelEnv === 'preview' || vercelEnv === 'production';
}

export function isAuthE2eRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.AUTH_RUNTIME_ENV === 'e2e';
}

export function isExplicitAuthTestRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.AUTH_DATABASE_MODE === 'pglite') {
    return true;
  }

  if (env.AUTH_USE_PGLITE === 'true') {
    return true;
  }

  if (env.NODE_ENV === 'test') {
    return true;
  }

  return false;
}

export function isAuthE2eFixtureEndpointEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.AUTH_E2E_FIXTURES !== 'true') {
    return false;
  }

  if (!isAuthE2eRuntime(env)) {
    return false;
  }

  return isExplicitAuthTestRuntime(env);
}

export function shouldAutoMigrateAuthSchema(
  databaseMode: AuthDatabaseMode,
): boolean {
  return databaseMode === 'pglite';
}

export function isCapturingEmailDeliveryAllowed(
  environment: AuthEnvironment,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (environment.databaseMode === 'pglite') {
    return true;
  }

  return isExplicitAuthTestRuntime(env);
}

export function assertProductionCapableEmailDelivery(
  environment: AuthEnvironment,
): void {
  if (environment.databaseMode !== 'postgres') {
    return;
  }

  if (!environment.resendApiKey?.trim() || !environment.emailFrom?.trim()) {
    throw new AuthConfigurationError(
      'Production auth requires RESEND_API_KEY and AUTH_EMAIL_FROM',
    );
  }
}
