import {
  AUTH_UNAVAILABLE_MESSAGE,
  AuthConfigurationError,
  isAuthEnvironmentConfigured,
  resolveAuthEnvironment,
} from '@diabetes-universe/identity';
import { getIdentityService } from '@diabetes-universe/identity/server';

export async function getWebIdentityService() {
  const environment = resolveAuthEnvironment();
  return getIdentityService(environment);
}

export function isWebAuthConfigured(): boolean {
  return isAuthEnvironmentConfigured();
}

export function getWebAuthConfigurationDiagnostic(): string | null {
  try {
    resolveAuthEnvironment();
    return null;
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      return error.message;
    }

    return 'Authentication is not configured.';
  }
}

export function getAuthUnavailableMessage(): string {
  return AUTH_UNAVAILABLE_MESSAGE;
}
