import type { ReactNode } from 'react';

export interface DashboardShellProps {
  readonly children?: ReactNode;
  readonly daySummary: ReactNode;
  readonly header: ReactNode;
  readonly lastGlucose: ReactNode;
  readonly nextAction: ReactNode;
}

export function DashboardShell({
  children,
  daySummary,
  header,
  lastGlucose,
  nextAction,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      {header}
      <main
        className="mx-auto grid max-w-6xl grid-cols-1 gap-4 py-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:grid-cols-2 sm:gap-5 sm:py-8 sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:grid-cols-12 lg:gap-6 lg:pb-10"
        id="dashboard-content"
      >
        {nextAction}
        {lastGlucose}
        {daySummary}
        {children}
      </main>
    </div>
  );
}
