import type { ReactNode } from 'react';

import {
  AppPageBackground,
  appPageShellClassName,
} from '../shared/app-page-background';

export interface DashboardShellProps {
  readonly children?: ReactNode;
  readonly daySummary: ReactNode;
  readonly greeting?: ReactNode;
  readonly header: ReactNode;
  readonly lastGlucose: ReactNode;
  readonly mobileNav?: ReactNode;
  readonly quickActions?: ReactNode;
  readonly recentEvents: ReactNode;
}

export function DashboardShell({
  children,
  daySummary,
  greeting,
  header,
  lastGlucose,
  mobileNav,
  quickActions,
  recentEvents,
}: DashboardShellProps) {
  return (
    <div className={appPageShellClassName}>
      <AppPageBackground />
      {header}
      {greeting}
      <main
        className="relative mx-auto grid max-w-6xl grid-cols-1 gap-3 py-3 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(4.75rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-3.5 sm:py-4 sm:pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.25rem,env(safe-area-inset-left))] lg:gap-4 lg:py-5 lg:pb-10"
        id="main-content"
      >
        {lastGlucose}
        {daySummary}
        {quickActions}
        {recentEvents}
        {children}
      </main>
      {mobileNav}
    </div>
  );
}
