'use client';

import { Button } from '@diabetes-universe/ui';
import { useMemo, type RefObject } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveDashboardNextActionLabels } from './dashboard-next-action-labels';
import {
  createDashboardNextActionViewModel,
  type DashboardNextActionProps,
} from './dashboard-next-action-model';

const titleId = 'dashboard-next-action-title';

export function DashboardNextAction({
  actionButtonRef,
  ...props
}: DashboardNextActionProps & {
  readonly actionButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveDashboardNextActionLabels(localization),
    [localization],
  );
  const viewModel = createDashboardNextActionViewModel(props, labels);
  const isError = viewModel.state === 'error';

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`col-span-full rounded-2xl border bg-white p-5 shadow-sm ring-1 sm:p-6 dark:bg-slate-900 ${
        isError
          ? 'border-rose-200 ring-rose-600/10 dark:border-rose-900/70 dark:ring-rose-400/10'
          : 'border-teal-200 ring-teal-600/10 dark:border-teal-900/70 dark:ring-teal-400/10'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <span className="sr-only" id={titleId} role="status">
            {viewModel.statusLabel}
          </span>
          <div aria-hidden="true" className="space-y-4">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-7 w-full max-w-md animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none sm:w-32 dark:bg-slate-700" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {viewModel.title}
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <h2
              className="min-w-0 flex-1 text-xl font-bold text-slate-950 dark:text-slate-50"
              id={titleId}
            >
              {viewModel.description}
            </h2>
            <Button
              className="min-h-11 w-full shrink-0 sm:w-auto dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 dark:focus-visible:outline-teal-400"
              disabled={viewModel.actionDisabled}
              onClick={viewModel.onAction}
              ref={actionButtonRef}
              type="button"
            >
              {viewModel.actionLabel}
            </Button>
          </div>
        </>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          role={isError ? 'alert' : 'status'}
        >
          <h2
            className="text-lg font-bold text-slate-950 dark:text-slate-50"
            id={titleId}
          >
            {viewModel.title}
          </h2>
          {viewModel.description ? (
            <p
              className={`mt-2 text-sm ${
                isError
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {viewModel.description}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
