import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';
import { signOutCurrentSessionAction } from '../../lib/auth/account-security-actions';

export const metadata: Metadata = {
  title: 'Аккаунт',
  description: 'Управление входом в Diabetes Universe.',
};

export default async function AccountPage() {
  const principal = await getAuthenticatedPrincipal();

  if (!principal) {
    redirect('/auth?callback=/account');
  }

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
            Аккаунт
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Вы вошли
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Локальная история событий остаётся на этом устройстве и не
            привязывается к аккаунту автоматически.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500 dark:text-slate-400">
                Email
              </dt>
              <dd className="mt-1 text-base text-slate-950 dark:text-slate-50">
                {principal.email}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 dark:text-slate-400">
                Статус email
              </dt>
              <dd className="mt-1 text-base text-slate-950 dark:text-slate-50">
                {principal.emailVerified
                  ? 'Подтверждён'
                  : 'Ожидает подтверждения'}
              </dd>
            </div>
          </dl>
        </section>

        <Link
          className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 font-semibold text-slate-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-teal-800 dark:hover:bg-slate-900"
          href="/account/security"
        >
          <span>
            <span className="block">Безопасность входа</span>
            <span className="mt-1 block text-sm font-normal text-slate-500 dark:text-slate-400">
              Passkeys и способы входа
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            href="/"
          >
            Открыть Dashboard
          </Link>
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            href="/timeline"
          >
            Открыть Timeline
          </Link>
        </div>

        <form action={signOutCurrentSessionAction}>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-transparent px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            type="submit"
          >
            Выйти из аккаунта
          </button>
        </form>
      </main>
    </div>
  );
}
