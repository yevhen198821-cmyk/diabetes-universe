'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveAuthErrorLabels } from './auth-labels';
import { AuthShell } from './auth-shell';

export function AuthErrorPageContent() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveAuthErrorLabels(localization),
    [localization],
  );

  return (
    <AuthShell description={labels.description} title={labels.title}>
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>{labels.description}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          href="/auth"
        >
          {labels.backToSignIn}
        </Link>
        <Link
          className="text-center text-sm font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          {labels.continueWithoutSignIn}
        </Link>
      </div>
    </AuthShell>
  );
}
