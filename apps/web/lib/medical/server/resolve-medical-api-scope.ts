import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';
import type { AuthorizationScope } from '@diabetes-universe/medical-service/server';

import { getAuthenticatedPrincipal } from '../../auth/get-authenticated-principal';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import type { MedicalApiRequestContext } from './medical-api-request-entry';
import { medicalApiErrorResponse } from './medical-api-error';

const TEST_ACCOUNT_HEADER = 'x-test-account-id';

function resolvePrincipalForRequest(
  request: Request,
): AuthenticatedPrincipal | null | undefined {
  const allowTestAuth =
    process.env.NODE_ENV === 'test' ||
    process.env.MEDICAL_API_ENABLE_TEST_AUTH === '1';

  if (!allowTestAuth) {
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
    avatarUrl: null,
    email: `${testAccountId}@example.com`,
    emailVerified: true,
    displayName: testAccountId,
  };
}

export interface ResolvedMedicalApiScope {
  readonly principal: AuthenticatedPrincipal;
  readonly scope: AuthorizationScope;
  readonly clientRequestId?: string;
}

export async function resolveMedicalApiScope(
  request: Request,
  requestContext: MedicalApiRequestContext,
): Promise<
  | { ok: true; value: ResolvedMedicalApiScope }
  | { ok: false; response: Response }
> {
  const { correlationId, clientRequestId } = requestContext;
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
      ...(clientRequestId ? { clientRequestId } : {}),
    },
  };
}

export { TEST_ACCOUNT_HEADER };
