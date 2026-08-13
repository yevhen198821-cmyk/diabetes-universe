'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getWebIdentityService } from './get-web-identity-service';
import {
  ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK,
  createInvalidSessionIdMutationState,
  mapSessionManagementResultToMutationOutcome,
  parseRevokeSessionId,
} from './session-management-mutation';
import type { SessionMutationState } from './session-management-state';
import { initialSessionMutationState } from './session-management-state';

async function applySessionMutationOutcome(
  outcome: ReturnType<typeof mapSessionManagementResultToMutationOutcome>,
): Promise<SessionMutationState> {
  if (outcome.action === 'redirect-auth') {
    redirect(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK);
  }

  if (outcome.action === 'redirect-auth-after-revoke-all') {
    redirect('/auth');
  }

  if (outcome.revalidatePath) {
    revalidatePath(outcome.revalidatePath);
  }

  return outcome.state;
}

export async function revokeAccountSessionAction(
  _previousState: SessionMutationState,
  formData: FormData,
): Promise<SessionMutationState> {
  const sessionId = parseRevokeSessionId(formData);

  if (!sessionId) {
    return createInvalidSessionIdMutationState();
  }

  const identityService = await getWebIdentityService();
  const result = await identityService.revokeAccountSession({
    sessionId,
    headers: await headers(),
  });

  return applySessionMutationOutcome(
    mapSessionManagementResultToMutationOutcome(result, {
      revalidateOnSuccess: true,
    }),
  );
}

export async function revokeOtherAccountSessionsAction(
  _previousState: SessionMutationState = initialSessionMutationState,
): Promise<SessionMutationState> {
  void _previousState;
  const identityService = await getWebIdentityService();
  const result = await identityService.revokeOtherAccountSessions(
    await headers(),
  );

  return applySessionMutationOutcome(
    mapSessionManagementResultToMutationOutcome(result, {
      revalidateOnSuccess: true,
    }),
  );
}

export async function revokeAllAccountSessionsAction(
  _previousState: SessionMutationState = initialSessionMutationState,
): Promise<SessionMutationState> {
  void _previousState;
  const identityService = await getWebIdentityService();
  const result = await identityService.revokeAllAccountSessions(
    await headers(),
  );

  return applySessionMutationOutcome(
    mapSessionManagementResultToMutationOutcome(result, {
      revokeAllSuccessRedirect: true,
    }),
  );
}

export async function reauthenticateForSessionsAction(): Promise<never> {
  try {
    const identityService = await getWebIdentityService();
    await identityService.signOutCurrentSession(await headers());
  } finally {
    redirect(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK);
  }
}
