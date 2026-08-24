import type { ReactNode } from 'react';

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
    <div className="text-text-primary dark:bg-background relative min-h-screen overflow-hidden bg-[#f7fafd]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_8%_6%,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_94%_4%,rgba(251,146,60,0.15),transparent_32%),radial-gradient(circle_at_74%_16%,rgba(167,139,250,0.12),transparent_30%),radial-gradient(circle_at_24%_20%,rgba(244,114,182,0.09),transparent_26%)] dark:opacity-45"
      />
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
