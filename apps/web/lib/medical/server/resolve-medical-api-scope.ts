import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';
import type { AuthorizationScope } from '@diabetes-universe/medical-service/server';

import { getAuthenticatedPrincipal } from '../../auth/get-authenticated-principal';
import { getMedicalServiceBundle } from './get-medical-service-bundle';
import {
  createCorrelationId,
  medicalApiErrorResponse,
} from './medical-api-error';
import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds';

const TEST_ACCOUNT_HEADER = 'x-test-account-id';
const CLIENT_REQUEST_ID_HEADER = 'x-request-id';

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

function parseOptionalClientRequestId(request: Request): string | undefined {
  const raw = request.headers.get(CLIENT_REQUEST_ID_HEADER);
  if (raw === null) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (
    trimmed.length > MEDICAL_VALIDATION_BOUNDS.MAX_CLIENT_REQUEST_ID_LENGTH ||
    !MEDICAL_VALIDATION_BOUNDS.MAX_CLIENT_REQUEST_ID_PATTERN.test(trimmed)
  ) {
    return undefined;
  }

  return trimmed;
}

export interface ResolvedMedicalApiScope {
  readonly principal: AuthenticatedPrincipal;
  readonly scope: AuthorizationScope;
  readonly clientRequestId?: string;
}

export async function resolveMedicalApiScope(
  request: Request,
): Promise<
  | { ok: true; value: ResolvedMedicalApiScope }
  | { ok: false; response: Response }
> {
  const correlationId = createCorrelationId();
  const clientRequestId = parseOptionalClientRequestId(request);
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

export { TEST_ACCOUNT_HEADER, CLIENT_REQUEST_ID_HEADER };
