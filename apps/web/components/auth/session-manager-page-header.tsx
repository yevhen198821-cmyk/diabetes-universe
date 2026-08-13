'use client';

import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveSessionManagerLabels } from './session-manager-labels';

export function SessionManagerPageHeader() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveSessionManagerLabels(localization),
    [localization],
  );

  return (
    <header className="space-y-2">
      <a
        className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
        href="/account/security"
      >
        ← Безопасность входа
      </a>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
        {labels.title}
      </h1>
    </header>
  );
}
