import type { Metadata } from 'next';
import Link from 'next/link';

import { GENERIC_AUTH_ERROR_MESSAGE } from '@diabetes-universe/identity';

import { AuthShell } from '../../../components/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Ошибка входа',
  description: 'Не удалось завершить вход.',
};

export default function AuthErrorPage() {
  return (
    <AuthShell
      description={GENERIC_AUTH_ERROR_MESSAGE}
      title="Не удалось войти"
    >
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>
          Ссылка могла истечь или уже была использована. Запросите новую ссылку
          и попробуйте снова.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          href="/auth"
        >
          Вернуться ко входу
        </Link>
        <Link
          className="text-center text-sm font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          Продолжить без входа
        </Link>
      </div>
    </AuthShell>
  );
}
