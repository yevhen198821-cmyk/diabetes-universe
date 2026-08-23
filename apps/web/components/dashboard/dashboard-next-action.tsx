'use client';

import { Button } from '@diabetes-universe/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
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
      className={`relative col-span-full overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_18px_55px_rgba(76,29,149,0.08)] sm:p-6 ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : 'border-violet-200/60 bg-gradient-to-r from-violet-500/[0.10] via-fuchsia-400/[0.08] to-orange-300/[0.12] dark:border-violet-400/15'
      }`}
    >
      {!isError ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full bg-gradient-to-br from-fuchsia-300/25 via-violet-300/20 to-orange-200/25 blur-2xl dark:opacity-20"
          />
          <Sparkles
            aria-hidden="true"
            className="absolute right-5 top-5 text-violet-400/60"
            size={20}
          />
        </>
      ) : null}

      {viewModel.state === 'loading' ? (
        <>
          <span className="sr-only" id={titleId} role="status">
            {viewModel.statusLabel}
          </span>
          <div aria-hidden="true" className="relative space-y-4">
            <div className="bg-surface-subtle h-5 w-36 animate-pulse rounded motion-reduce:animate-none" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="bg-surface-subtle h-7 w-full max-w-md animate-pulse rounded motion-reduce:animate-none" />
              <div className="rounded-control bg-surface-subtle h-11 w-full animate-pulse motion-reduce:animate-none sm:w-32" />
            </div>
          </div>
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)]">
            <Sparkles aria-hidden="true" size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-text-secondary text-sm font-semibold">
              {viewModel.title}
            </p>
            <h2
              className="text-text-primary mt-1 text-xl font-extrabold tracking-tight sm:text-2xl"
              id={titleId}
            >
              {viewModel.description}
            </h2>
          </div>
          <Button
            className="min-h-12 w-full shrink-0 border-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] hover:brightness-105 sm:w-auto"
            disabled={viewModel.actionDisabled}
            onClick={viewModel.onAction}
            ref={actionButtonRef}
            type="button"
          >
            <span>{viewModel.actionLabel}</span>
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="relative"
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
