'use client';

import { Clock, Home, Plus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo, type RefObject } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardMobileNavLabels } from './dashboard-mobile-nav-labels';

export interface DashboardMobileNavProps {
  readonly onQuickAdd: () => void;
  readonly quickAddButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly quickAddDisabled?: boolean;
}

export function DashboardMobileNav({
  onQuickAdd,
  quickAddButtonRef,
  quickAddDisabled = false,
}: DashboardMobileNavProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardMobileNavLabels(localization),
    [localization],
  );

  return (
    <nav
      aria-label={labels.home}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
        <ul className="grid grid-cols-4 items-end px-1 pt-1.5 pb-2">
          <li>
            <Link
              aria-current="page"
              className="focus-visible:outline-interactive-primary flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-teal-300"
              href="/"
            >
              <Home aria-hidden="true" size={22} strokeWidth={2.2} />
              <span className="text-[11px] font-bold">{labels.home}</span>
            </Link>
          </li>
          <li>
            <Link
              className="text-text-secondary focus-visible:outline-interactive-primary flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-teal-300"
              href="/timeline"
            >
              <Clock aria-hidden="true" size={22} strokeWidth={2.2} />
              <span className="text-[11px] font-semibold">
                {labels.timeline}
              </span>
            </Link>
          </li>
          <li className="flex justify-center">
            <button
              aria-label={labels.quickAdd}
              className="focus-visible:outline-interactive-primary -mt-6 grid size-[3.75rem] place-items-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 text-white shadow-[0_16px_40px_rgba(6,182,212,0.38)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={quickAddDisabled}
              onClick={onQuickAdd}
              ref={quickAddButtonRef}
              type="button"
            >
              <Plus aria-hidden="true" size={28} strokeWidth={2.4} />
            </button>
          </li>
          <li>
            <Link
              className="text-text-secondary focus-visible:outline-interactive-primary flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-teal-300"
              href="/account"
            >
              <UserRound aria-hidden="true" size={22} strokeWidth={2.2} />
              <span className="text-[11px] font-semibold">
                {labels.account}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
