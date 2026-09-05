'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveAuthCheckEmailLabels } from './auth-labels';
import { AuthShell } from './auth-shell';

export function CheckEmailPageContent({ email }: { readonly email?: string }) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveAuthCheckEmailLabels(localization),
    [localization],
  );

  return (
    <AuthShell description={labels.spamHint} title={labels.title}>
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        {email ? (
          <p>
            {labels.withAddress}{' '}
            <span className="font-semibold text-slate-950 dark:text-white">
              {email}
            </span>
          </p>
        ) : (
          <p>{labels.withoutAddress}</p>
        )}
        <p>{labels.spamHint}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          href="/auth"
        >
          {labels.requestAgain}
        </Link>
        <Link
          className="text-center text-sm font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          href="/"
        >
          {labels.returnToApp}
        </Link>
      </div>
    </AuthShell>
  );
}
