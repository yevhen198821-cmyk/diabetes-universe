import { headers } from 'next/headers';

import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';

import { normalizeAuthRequestHeaders } from './normalize-auth-request-headers';
import {
  getWebIdentityService,
  isWebAuthConfigured,
} from './get-web-identity-service';

let authenticatedPrincipalOverride: AuthenticatedPrincipal | null | undefined;

export function setAuthenticatedPrincipalForTests(
  principal: AuthenticatedPrincipal | null | undefined,
): void {
  authenticatedPrincipalOverride = principal;
}

export async function getAuthenticatedPrincipal(): Promise<AuthenticatedPrincipal | null> {
  if (authenticatedPrincipalOverride !== undefined) {
    return authenticatedPrincipalOverride;
  }

  if (!isWebAuthConfigured()) {
    return null;
  }

  try {
    const identityService = await getWebIdentityService();
    return identityService.getCurrentPrincipal(
      normalizeAuthRequestHeaders(await headers()),
    );
  } catch {
    return null;
  }
}

export async function requireAuthenticatedPrincipal(): Promise<AuthenticatedPrincipal> {
  const principal = await getAuthenticatedPrincipal();

  if (!principal) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  return principal;
}
