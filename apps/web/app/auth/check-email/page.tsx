import type { Metadata } from 'next';
import Link from 'next/link';

import { GENERIC_MAGIC_LINK_REQUEST_MESSAGE } from '@diabetes-universe/identity';

import { AuthShell } from '../../../components/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Проверьте почту',
  description: 'Подтвердите вход по ссылке из письма.',
};

interface CheckEmailPageProps {
  readonly searchParams: Promise<{
    readonly email?: string;
  }>;
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams;
  const email = params.email?.trim();

  return (
    <AuthShell
      description={GENERIC_MAGIC_LINK_REQUEST_MESSAGE}
      title="Проверьте почту"
    >
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        {email ? (
          <p>
            Если адрес{' '}
            <span className="font-semibold text-slate-950 dark:text-white">
              {email}
            </span>{' '}
            зарегистрирован, мы отправили ссылку для входа.
          </p>
        ) : (
          <p>Если адрес указан верно, мы отправили ссылку для входа.</p>
        )}
        <p>
          Ссылка действует ограниченное время. Проверьте папку «Спам», если
          письма нет.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          href="/auth"
        >
          Запросить ссылку снова
        </Link>
        <Link
          className="text-center text-sm font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          Вернуться в приложение
        </Link>
      </div>
    </AuthShell>
  );
}
