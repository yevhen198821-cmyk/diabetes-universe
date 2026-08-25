import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { resolveSafeAuthCallbackPath } from '@diabetes-universe/identity';
import {
  isPreviewAuthDeployment,
  probeAuthConfiguration,
} from '@diabetes-universe/identity';

import { AuthShell } from '../../components/auth/auth-shell';
import { SignInForm } from '../../components/auth/sign-in-form';
import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';
import {
  isWebAuthConfigured,
  isWebPasskeyConfigured,
} from '../../lib/auth/get-web-identity-service';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в Diabetes Universe безопасным способом.',
};

interface AuthPageProps {
  readonly searchParams: Promise<{
    readonly callback?: string;
  }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const callbackPath = resolveSafeAuthCallbackPath(params.callback);
  const principal = await getAuthenticatedPrincipal();

  if (principal) {
    redirect(callbackPath);
  }

  const isAuthAvailable = isWebAuthConfigured();

  if (isPreviewAuthDeployment() && !isAuthAvailable) {
    const probe = probeAuthConfiguration();
    console.info(
      '[preview-auth-config]',
      JSON.stringify({
        failureStage: probe.failureStage,
        failureMessage: probe.failureMessage,
        envPresence: probe.envPresence,
      }),
    );
  }

  return (
    <AuthShell
      description="Используйте Passkey или получите одноразовую ссылку на email."
      title="Вход в аккаунт"
    >
      <SignInForm
        callbackPath={callbackPath}
        isAuthAvailable={isAuthAvailable}
        isPasskeyAvailable={isAuthAvailable && isWebPasskeyConfigured()}
      />
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Продолжая, вы подтверждаете, что используете свой способ входа.{' '}
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
