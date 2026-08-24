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
    <div className="text-text-primary dark:bg-background relative min-h-screen overflow-hidden bg-[#f5f8fc]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_10%_8%,rgba(45,212,191,0.13),transparent_28%),radial-gradient(circle_at_92%_6%,rgba(251,146,60,0.14),transparent_30%),radial-gradient(circle_at_72%_18%,rgba(167,139,250,0.11),transparent_28%),radial-gradient(circle_at_28%_22%,rgba(244,114,182,0.08),transparent_24%)] dark:opacity-40"
      />
      {header}
      {greeting}
      <main
        className="relative mx-auto grid max-w-6xl grid-cols-1 gap-3 py-3 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.25rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-3.5 sm:py-4 sm:pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.25rem,env(safe-area-inset-left))] lg:gap-4 lg:py-5 lg:pb-10"
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
