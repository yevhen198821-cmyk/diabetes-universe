import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';

import { getAuthenticatedPrincipal } from '../../auth/get-authenticated-principal';
import { resolvePrincipalForRequest } from './resolve-medical-api-scope';

export async function peekMedicalApiPrincipal(
  request: Request,
): Promise<AuthenticatedPrincipal | null> {
  const testPrincipal = resolvePrincipalForRequest(request);
  if (testPrincipal !== undefined) {
    return testPrincipal;
  }

  return getAuthenticatedPrincipal();
}
