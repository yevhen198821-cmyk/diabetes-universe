'use client';

import type { ReactNode } from 'react';

import { DashboardHeader, type DashboardHeaderProps } from './dashboard-header';

export interface DashboardShellProps {
  readonly children?: ReactNode;
  readonly header: DashboardHeaderProps;
}

export function DashboardShell({ children, header }: DashboardShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <DashboardHeader {...header} />
      <main
        className="mx-auto grid max-w-6xl gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:gap-5 sm:px-6 sm:py-8 lg:gap-6 lg:pb-10"
        id="dashboard-content"
      >
        {children}
      </main>
    </div>
  );
}
