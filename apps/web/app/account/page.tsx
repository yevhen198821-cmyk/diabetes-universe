import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';

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
      <div className="mx-auto w-full max-w-2xl space-y-6">
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
      </div>
    </div>
  );
}
