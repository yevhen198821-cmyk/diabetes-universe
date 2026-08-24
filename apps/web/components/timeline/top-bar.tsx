'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveTimelineUiLabels } from './timeline-ui-labels';

export function TopBar() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveTimelineUiLabels(localization),
    [localization],
  );

  return (
    <header className="relative z-30 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center py-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:py-4 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))]">
        <Link
          aria-label={labels.topBar.home}
          className="focus-visible:outline-interactive-primary grid size-11 shrink-0 place-items-center rounded-full border border-white/80 bg-white/85 text-[#1e3a5f] shadow-[0_8px_24px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-900/85 dark:text-[#E8EEF9] dark:ring-white/10"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>
      </div>
    </header>
  );
}
