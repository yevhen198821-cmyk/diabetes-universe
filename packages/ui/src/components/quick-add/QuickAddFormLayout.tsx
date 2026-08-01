import type { FormEventHandler, ReactNode } from 'react';

export interface QuickAddFormLayoutProps {
  readonly children: ReactNode;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
}

export interface QuickAddFormLayoutSectionProps {
  readonly children: ReactNode;
}

function QuickAddFormLayoutRoot({
  children,
  onSubmit,
}: QuickAddFormLayoutProps) {
  return (
    <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function QuickAddFormLayoutBody({ children }: QuickAddFormLayoutSectionProps) {
  return (
    <div className="min-h-0 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
      {children}
    </div>
  );
}

function QuickAddFormLayoutFooter({
  children,
}: QuickAddFormLayoutSectionProps) {
  return (
    <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      {children}
    </div>
  );
}

export const QuickAddFormLayout = Object.assign(QuickAddFormLayoutRoot, {
  Body: QuickAddFormLayoutBody,
  Footer: QuickAddFormLayoutFooter,
});
