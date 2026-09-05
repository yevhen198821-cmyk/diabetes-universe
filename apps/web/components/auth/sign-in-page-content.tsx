'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveAuthSignInLabels } from './auth-labels';
import { AuthShell } from './auth-shell';
import { SignInForm } from './sign-in-form';

export function SignInPageContent({
  callbackPath,
  isAuthAvailable,
  isPasskeyAvailable,
}: {
  readonly callbackPath: string;
  readonly isAuthAvailable: boolean;
  readonly isPasskeyAvailable: boolean;
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveAuthSignInLabels(localization),
    [localization],
  );

  return (
    <AuthShell description={labels.description} title={labels.title}>
      <SignInForm
        callbackPath={callbackPath}
        isAuthAvailable={isAuthAvailable}
        isPasskeyAvailable={isPasskeyAvailable}
      />
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        {labels.disclaimer}{' '}
        <Link
          className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          {labels.returnToApp}
        </Link>
      </p>
    </AuthShell>
  );
}
