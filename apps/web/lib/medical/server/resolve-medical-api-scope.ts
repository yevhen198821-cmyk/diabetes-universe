import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';
import type { AuthorizationScope } from '@diabetes-universe/medical-service/server';

import { getAuthenticatedPrincipal } from '../../auth/get-authenticated-principal';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import {
  createCorrelationId,
  medicalApiErrorResponse,
} from './medical-api-error';

const TEST_ACCOUNT_HEADER = 'x-test-account-id';

function resolvePrincipalForRequest(
  request: Request,
): AuthenticatedPrincipal | null | undefined {
  if (process.env.NODE_ENV !== 'test') {
    return undefined;
  }

  const testAccountId = request.headers.get(TEST_ACCOUNT_HEADER);
  if (testAccountId === null) {
    return undefined;
  }

  if (testAccountId === 'anonymous' || testAccountId.trim() === '') {
    return null;
  }

  return {
    accountId: testAccountId,
    email: `${testAccountId}@example.com`,
    emailVerified: true,
    displayName: testAccountId,
  };
}

export interface ResolvedMedicalApiScope {
  readonly principal: AuthenticatedPrincipal;
  readonly scope: AuthorizationScope;
}

export async function resolveMedicalApiScope(
  request: Request,
): Promise<
  | { ok: true; value: ResolvedMedicalApiScope }
  | { ok: false; response: Response }
> {
  const correlationId =
    request.headers.get('x-correlation-id')?.trim() || createCorrelationId();
  const testPrincipal = resolvePrincipalForRequest(request);
  const principal =
    testPrincipal !== undefined
      ? testPrincipal
      : await getAuthenticatedPrincipal();

  if (!principal) {
    return {
      ok: false,
      response: medicalApiErrorResponse(
        401,
        'AUTH_REQUIRED',
        'Authentication is required.',
        correlationId,
      ),
    };
  }

  const bundle = await getMedicalServiceBundle();
  const relationship = await bundle.subjectService.findActiveSelfRelationship(
    principal.accountId,
  );

  if (!relationship) {
    await bundle.subjectService.provisionSelfSubject(principal.accountId);
  }

  const activeRelationship =
    (await bundle.subjectService.findActiveSelfRelationship(
      principal.accountId,
    )) ??
    (await bundle.subjectService.provisionSelfSubject(principal.accountId));

  return {
    ok: true,
    value: {
      principal,
      scope: {
        accountId: principal.accountId,
        subjectId: activeRelationship.subjectId,
        correlationId,
      },
    },
  };
}

export function getRequestCorrelationId(request: Request): string {
  return (
    request.headers.get('x-correlation-id')?.trim() || createCorrelationId()
  );
}

export { TEST_ACCOUNT_HEADER };
