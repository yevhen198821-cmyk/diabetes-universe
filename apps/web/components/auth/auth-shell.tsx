import type { ReactNode } from 'react';

import { ProductBrandLogo } from '../brand/product-brand-logo';

interface AuthShellProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
}

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <ProductBrandLogo priority variant="auth" />
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-300">
              Diabetes Universe
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>
        </header>

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
