import type { ReactNode } from 'react';

export interface DashboardShellProps {
  readonly children?: ReactNode;
  readonly daySummary: ReactNode;
  readonly header: ReactNode;
  readonly lastGlucose: ReactNode;
  readonly nextAction: ReactNode;
  readonly recentEvents: ReactNode;
}

export function DashboardShell({
  children,
  daySummary,
  header,
  lastGlucose,
  nextAction,
  recentEvents,
}: DashboardShellProps) {
  return (
    <div className="bg-background text-text-primary min-h-screen">
      {header}
      <main
        className="mx-auto grid max-w-6xl grid-cols-1 gap-4 py-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:grid-cols-2 sm:gap-5 sm:py-8 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:grid-cols-12 lg:gap-6 lg:pb-10"
        id="main-content"
      >
        {lastGlucose}
        {daySummary}
        {nextAction}
        {recentEvents}
        {children}
      </main>
    </div>
  );
}
