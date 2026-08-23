'use client';

import { useMemo } from 'react';

import type { TranslationKey } from '@diabetes-universe/i18n';
import { useLocalization } from '../../lib/platform/react/use-localization';

const skipLinkClassName =
  'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-teal-600 dark:focus:bg-slate-950 dark:focus:text-slate-50 dark:focus:outline-teal-400';

export function SkipLink() {
  const localization = useLocalization();
  const label = useMemo(
    () =>
      localization.translate({
        key: 'common.accessibility.skipLink' as TranslationKey,
      }).value,
    [localization],
  );

  return (
    <a className={skipLinkClassName} href="#main-content">
      {label}
    </a>
  );
}
