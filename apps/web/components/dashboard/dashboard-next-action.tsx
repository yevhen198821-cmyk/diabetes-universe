'use client';

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

  if (viewModel.state === 'empty' && !viewModel.description) {
    return null;
  }

  return (
    <section
      aria-busy={viewModel.isLoading}
      aria-labelledby={titleId}
      className={`relative col-span-full overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_10px_30px_rgba(76,29,149,0.06)] sm:px-5 ${
        isError
          ? 'border-status-danger/40 bg-surface'
          : 'border-violet-200/50 bg-gradient-to-r from-violet-500/[0.08] via-fuchsia-400/[0.06] to-cyan-300/[0.08] dark:border-violet-400/15'
      }`}
    >
      {viewModel.state === 'loading' ? (
        <>
          <span className="sr-only" id={titleId} role="status">
            {viewModel.statusLabel}
          </span>
          <div
            aria-hidden="true"
            className="relative h-10 animate-pulse rounded-xl bg-white/50 motion-reduce:animate-none dark:bg-slate-800"
          />
        </>
      ) : null}

      {viewModel.state === 'ready' ? (
        <div className="relative flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_18px_rgba(139,92,246,0.22)]">
            <Sparkles aria-hidden="true" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
              {viewModel.title}
            </p>
            <h2
              className="text-text-primary truncate text-sm font-bold sm:text-base"
              id={titleId}
            >
              {viewModel.description}
            </h2>
          </div>
          <button
            className="focus-visible:outline-interactive-primary inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(139,92,246,0.22)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={viewModel.actionDisabled}
            onClick={viewModel.onAction}
            ref={actionButtonRef}
            type="button"
          >
            <span>{viewModel.actionLabel}</span>
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      ) : null}

      {viewModel.state === 'empty' || viewModel.state === 'error' ? (
        <div
          aria-live={isError ? 'assertive' : 'polite'}
          className="relative"
          role={isError ? 'alert' : 'status'}
        >
          <h2 className="text-text-primary text-sm font-bold" id={titleId}>
            {viewModel.title}
          </h2>
          {viewModel.description ? (
            <p
              className={`mt-1 text-sm ${
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
