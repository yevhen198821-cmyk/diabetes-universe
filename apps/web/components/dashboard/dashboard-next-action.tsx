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
      className={`bg-surface col-span-full rounded-2xl border p-5 shadow-sm ring-1 sm:p-6 ${
        isError
          ? 'border-status-danger/40 ring-status-danger/10'
          : 'border-interactive-primary/30 ring-interactive-primary/10'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <span className="sr-only" id={titleId} role="status">
            {viewModel.statusLabel}
          </span>
          <div aria-hidden="true" className="space-y-4">
            <div className="bg-surface-subtle h-5 w-36 animate-pulse rounded motion-reduce:animate-none" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="bg-surface-subtle h-7 w-full max-w-md animate-pulse rounded motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-11 w-full animate-pulse motion-reduce:animate-none sm:w-32" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <>
          <p className="text-text-secondary text-sm font-medium">
            {viewModel.title}
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <h2
              className="text-text-primary min-w-0 flex-1 text-xl font-bold"
              id={titleId}
            >
              {viewModel.description}
            </h2>
            <Button
              className="min-h-11 w-full shrink-0 sm:w-auto"
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
          <h2 className="text-text-primary text-lg font-bold" id={titleId}>
            {viewModel.title}
          </h2>
          {viewModel.description ? (
            <p
              className={`mt-2 text-sm ${
                isError ? 'text-status-danger' : 'text-text-secondary'
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
