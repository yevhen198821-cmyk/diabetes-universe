import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AccountSessionSummary } from '@diabetes-universe/identity';
import { SessionManagementError } from '@diabetes-universe/identity/server';

import { SessionManager } from '../../../../components/auth/session-manager';
import { ProfileSessionsHeader } from '../../../../components/profile/profile-sessions-header';
import { requireAuthenticatedPrincipal } from '../../../../lib/auth/get-authenticated-principal';
import {
  getWebIdentityService,
  isWebPasskeyConfigured,
} from '../../../../lib/auth/get-web-identity-service';
import { ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK } from '../../../../lib/auth/session-management-mutation';
import { createLocalizedRouteMetadata } from '../../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.security.sessions.title',
    descriptionKey: 'account.security.sessions.description',
  });
}

async function readAccountSessions(): Promise<
  readonly AccountSessionSummary[]
> {
  try {
    const identityService = await getWebIdentityService();
    return [...(await identityService.listAccountSessions(await headers()))];
  } catch (error) {
    if (
      error instanceof SessionManagementError &&
      (error.code === 'AUTHENTICATION_REQUIRED' ||
        error.code === 'SESSION_STATE_INVALID')
    ) {
      redirect(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK);
    }

    redirect(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK);
  }
}

export default async function AccountSecuritySessionsPage() {
  await requireAuthenticatedPrincipal();

  const sessions = await readAccountSessions();

  return (
    <div className="space-y-5">
      <ProfileSessionsHeader />
      <SessionManager
        passkeyManagementEnabled={isWebPasskeyConfigured()}
        sessions={sessions}
      />
    </div>
  );
}
