import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { PasskeySummary } from '@diabetes-universe/identity';

import { PasskeyManager } from '../../../components/auth/passkey-manager';
import { getAuthenticatedPrincipal } from '../../../lib/auth/get-authenticated-principal';
import {
  getWebIdentityService,
  isWebPasskeyConfigured,
} from '../../../lib/auth/get-web-identity-service';

export const metadata: Metadata = {
  title: 'Безопасность аккаунта',
  description: 'Управление Passkeys для входа в Diabetes Universe.',
};

export default async function AccountSecurityPage() {
  const principal = await getAuthenticatedPrincipal();

  if (!principal) {
    redirect('/auth?callback=/account');
  }

  const passkeyEnabled = isWebPasskeyConfigured();
  let passkeys: PasskeySummary[] = [];

  if (passkeyEnabled) {
    try {
      const identityService = await getWebIdentityService();
      passkeys = [...(await identityService.listPasskeys(await headers()))];
    } catch {
      passkeys = [];
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <Link
            className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
            href="/account"
          >
            ← Аккаунт
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Безопасность входа
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Управляйте способами входа. Медицинские данные не привязываются к
            аккаунту автоматически.
          </p>
        </header>

        {passkeyEnabled ? (
          <PasskeyManager passkeys={passkeys} />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
              Passkeys пока недоступны
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Для этого окружения WebAuthn не настроен. Вход по email продолжает
              работать как резервный способ.
            </p>
          </section>
        )}

        <Link
          className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 font-semibold text-slate-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-teal-800 dark:hover:bg-slate-900"
          href="/account/security/sessions"
        >
          <span>
            <span className="block">Активные сессии</span>
            <span className="mt-1 block text-sm font-normal text-slate-500 dark:text-slate-400">
              Устройства, на которых выполнен вход
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </main>
    </div>
  );
}
