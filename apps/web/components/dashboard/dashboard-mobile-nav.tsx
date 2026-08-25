'use client';

import { Clock, Home, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardMobileNavLabels } from './dashboard-mobile-nav-labels';
import {
  dashboardMobileNavInnerClassName,
  dashboardMobileNavOuterClassName,
} from './dashboard-mobile-nav-layout';

export interface DashboardMobileNavProps {
  readonly activeTab?: 'home' | 'timeline';
}

export function DashboardMobileNav({
  activeTab = 'home',
}: DashboardMobileNavProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardMobileNavLabels(localization),
    [localization],
  );

  return (
    <nav
      aria-label={labels.home}
      className={dashboardMobileNavOuterClassName}
      id="dashboard-mobile-nav"
    >
      <div className={dashboardMobileNavInnerClassName}>
        <ul className="grid grid-cols-3 items-center px-1 py-1">
          <li>
            <Link
              aria-current={activeTab === 'home' ? 'page' : undefined}
              className={`focus-visible:outline-interactive-primary flex min-h-11 min-w-11 flex-col items-center justify-center gap-0 rounded-2xl px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                activeTab === 'home'
                  ? 'text-teal-600 dark:text-teal-300'
                  : 'text-text-secondary transition hover:text-teal-600 dark:hover:text-teal-300'
              }`}
              href="/"
            >
              <Home aria-hidden="true" size={20} strokeWidth={2.2} />
              <span
                className={`text-[10px] leading-tight ${activeTab === 'home' ? 'font-bold' : 'font-semibold'}`}
              >
                {labels.home}
              </span>
            </Link>
          </li>
          <li>
            <Link
              aria-current={activeTab === 'timeline' ? 'page' : undefined}
              className={`focus-visible:outline-interactive-primary flex min-h-11 min-w-11 flex-col items-center justify-center gap-0 rounded-2xl px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                activeTab === 'timeline'
                  ? 'text-teal-600 dark:text-teal-300'
                  : 'text-text-secondary transition hover:text-teal-600 dark:hover:text-teal-300'
              }`}
              href="/timeline"
            >
              <Clock aria-hidden="true" size={20} strokeWidth={2.2} />
              <span
                className={`text-[10px] leading-tight ${activeTab === 'timeline' ? 'font-bold' : 'font-semibold'}`}
              >
                {labels.timeline}
              </span>
            </Link>
          </li>
          <li>
            <Link
              className="text-text-secondary focus-visible:outline-interactive-primary flex min-h-11 min-w-11 flex-col items-center justify-center gap-0 rounded-2xl px-2.5 py-1 transition hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-teal-300"
              href="/account"
            >
              <UserRound aria-hidden="true" size={20} strokeWidth={2.2} />
              <span className="text-[10px] leading-tight font-semibold">
                {labels.account}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
