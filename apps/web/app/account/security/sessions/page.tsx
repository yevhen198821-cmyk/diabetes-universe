import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AccountSessionSummary } from '@diabetes-universe/identity';
import { SessionManagementError } from '@diabetes-universe/identity/server';

import { SessionManager } from '../../../../components/auth/session-manager';
import { getAuthenticatedPrincipal } from '../../../../lib/auth/get-authenticated-principal';
import {
  getWebIdentityService,
  isWebPasskeyConfigured,
} from '../../../../lib/auth/get-web-identity-service';
import { ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK } from '../../../../lib/auth/session-management-mutation';

export const metadata: Metadata = {
  title: 'Активные сессии',
  description: 'Управление активными сессиями входа в Diabetes Universe.',
};

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
  const principal = await getAuthenticatedPrincipal();

  if (!principal) {
    redirect(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK);
  }

  const sessions = await readAccountSessions();

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <Link
            className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
            href="/account/security"
          >
            ← Безопасность входа
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Безопасность входа
          </h1>
        </header>

        <SessionManager
          passkeyManagementEnabled={isWebPasskeyConfigured()}
          sessions={sessions}
        />
      </main>
    </div>
  );
}
