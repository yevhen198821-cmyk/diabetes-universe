import type { ReactNode } from 'react';

export interface DashboardShellProps {
  readonly children?: ReactNode;
  readonly daySummary: ReactNode;
  readonly greeting?: ReactNode;
  readonly header: ReactNode;
  readonly lastGlucose: ReactNode;
  readonly mobileNav?: ReactNode;
  readonly nextAction: ReactNode;
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
  nextAction,
  quickActions,
  recentEvents,
}: DashboardShellProps) {
  return (
    <div className="bg-background text-text-primary relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_12%_12%,rgba(45,212,191,0.16),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(251,146,60,0.16),transparent_32%),radial-gradient(circle_at_58%_18%,rgba(167,139,250,0.12),transparent_30%)] dark:opacity-40"
      />
      {header}
      {greeting}
      <main
        className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 py-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-5 sm:py-6 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:gap-6 lg:py-8 lg:pb-12"
        id="main-content"
      >
        {lastGlucose}
        {daySummary}
        {quickActions}
        {nextAction}
        {recentEvents}
        {children}
      </main>
      {mobileNav}
    </div>
  );
}
