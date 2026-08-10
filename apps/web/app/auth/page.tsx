import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthShell } from '../../components/auth/auth-shell';
import { SignInForm } from '../../components/auth/sign-in-form';
import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';
import { isWebAuthConfigured } from '../../lib/auth/get-web-identity-service';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в Diabetes Universe по email.',
};

interface AuthPageProps {
  readonly searchParams: Promise<{
    readonly callback?: string;
  }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const principal = await getAuthenticatedPrincipal();

  if (principal) {
    redirect('/account');
  }

  const params = await searchParams;
  const callbackPath = params.callback ?? '/account';

  return (
    <AuthShell
      description="Введите email — мы отправим безопасную ссылку для входа."
      title="Вход в аккаунт"
    >
      <SignInForm
        callbackPath={callbackPath}
        isAuthAvailable={isWebAuthConfigured()}
      />
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Продолжая, вы подтверждаете, что это ваш email.{' '}
        <Link
          className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          Вернуться в приложение
        </Link>
      </p>
    </AuthShell>
  );
}
